import contextvars
import logging
from functools import lru_cache
from typing import Any, Dict, List, Literal

from langchain_chroma import Chroma
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings

logger = logging.getLogger(__name__)

persist_dir = "./chroma_db"
_sources_var: contextvars.ContextVar[List[Dict[str, Any]]] = contextvars.ContextVar(
    "sources",
    default=[],
)


def _require_api_key() -> None:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")


@lru_cache(maxsize=1)
def get_llm() -> ChatOpenAI:
    _require_api_key()
    return ChatOpenAI(model="gpt-4o-mini", temperature=0.5)


def get_embeddings() -> OpenAIEmbeddings:
    _require_api_key()
    return OpenAIEmbeddings(model="text-embedding-3-small")


def _reset_sources() -> contextvars.Token:
    return _sources_var.set([])


def _append_source(item: Dict[str, Any]) -> None:
    sources = list(_sources_var.get())
    sources.append(item)
    _sources_var.set(sources)


def _get_sources() -> List[Dict[str, Any]]:
    return list(_sources_var.get())


@tool
def doc_retriever(query: str) -> str:
    """Search knowledge base for relevant documents."""
    try:
        embedding = get_embeddings()
        vectorstore = Chroma(
            collection_name="UI_Policies",
            persist_directory=persist_dir,
            embedding_function=embedding,
        )
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 20, "lambda_mult": 0.5},
        )
        response = retriever.invoke(query)
    except Exception as exc:
        logger.exception("Document retrieval failed")
        return f"Knowledge base unavailable: {exc}"

    if not response:
        return "No relevant documents found."

    for doc in response:
        _append_source(
            {
                "content": doc.page_content[:300],
                "document": doc.metadata.get("document_name", "Unknown"),
                "page": doc.metadata.get("page_no", "Unknown"),
                "date": doc.metadata.get("date", ""),
                "source": doc.metadata.get("source", ""),
            }
        )

    formatted = "\n\n---\n\n".join(
        (
            f"[Source {i + 1}] Document: {doc.metadata.get('document_name', 'Unknown')} "
            f"(Page {doc.metadata.get('page_no', '?')})\n\nContent:\n{doc.page_content}"
        )
        for i, doc in enumerate(response)
    )
    return formatted


sys_prompt = SystemMessage(
    content=(
        "You are a helpful and friendly assistant that provides information about "
        "University of Ibadan and its policies. Your name is UI GUIDE. "
        "Your response should always be friendly. You have access to a document "
        "retrieval tool.\n\n"
        "DO NOT retrieve documents for these (answer directly in a warm, friendly way):\n"
        "- Greetings: 'Hello', 'Hi', 'How are you', etc.\n"
        "- Questions about your capabilities: 'What can you help with?', 'What do you do?'\n"
        "- Simple math or general knowledge: 'What is 2+2?'\n"
        "- Casual conversation: 'Thank you', 'Goodbye'\n\n"
        "DO retrieve documents for:\n"
        "- Questions asking for specific information about University of Ibadan\n"
        "- Requests for facts, definitions, or explanations about UI policies\n"
        "- Any question where citing sources would improve the answer\n\n"
        "IMPORTANT - When you use retrieved documents:\n"
        "1. Cite sources using format: (Source X: Document Name, Page Y)\n"
        "2. Limit citations to the 1-3 most relevant sources\n"
        "3. Only cite the sources you actually used in your answer\n"
        "4. If documents do not contain the answer, say so clearly\n"
        "5. Do not answer questions outside the scope of University of Ibadan "
        "except for casual greetings\n\n"
        "When providing citations in your response, use this format: "
        "'According to [Document Name] (Page X)...' "
        "or 'This information is based on [Document Name], page Y.'"
    )
)


def assistant(state: MessagesState):
    tools = [doc_retriever]
    llm_with_tool = get_llm().bind_tools(tools)
    msg = [sys_prompt] + state["messages"]
    response = llm_with_tool.invoke(msg)
    return {"messages": [response]}


def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    last_msg = state["messages"][-1]
    if last_msg.tool_calls:
        return "tools"
    return "__end__"


@lru_cache(maxsize=1)
def get_agent():
    tools = [doc_retriever]
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_node("tools", ToolNode(tools))

    builder.add_edge(START, "assistant")
    builder.add_conditional_edges(
        "assistant",
        should_continue,
        {"tools": "tools", "__end__": END},
    )
    builder.add_edge("tools", "assistant")

    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


def query_agent(user_input: str, thread_id: str = "default_session") -> Dict[str, Any]:
    token = _reset_sources()
    try:
        result = get_agent().invoke(
            {"messages": [HumanMessage(content=user_input)]},
            config={"configurable": {"thread_id": thread_id}},
        )

        used_retriever = False
        final_answer = None

        for message in result["messages"]:
            if isinstance(message, AIMessage) and message.tool_calls:
                used_retriever = True
            elif isinstance(message, AIMessage) and not message.tool_calls and message.content:
                final_answer = message.content

        return {
            "answer": final_answer or "No response generated",
            "used_retriever": used_retriever,
            "thread_id": thread_id,
            "sources": _get_sources() if used_retriever else [],
        }
    finally:
        _sources_var.reset(token)


def get_available_documents() -> List[str]:
    try:
        embedding = get_embeddings()
        vectorstore = Chroma(
            collection_name="UI_Policies",
            persist_directory=persist_dir,
            embedding_function=embedding,
        )

        all_docs = vectorstore.get()
        if not all_docs or "metadatas" not in all_docs:
            return []

        documents = set()
        for metadata in all_docs["metadatas"]:
            if metadata and "document_name" in metadata:
                documents.add(metadata["document_name"])

        return list(documents)
    except Exception as exc:
        logger.warning("Error getting documents: %s", exc)
        return []


def test_vector_store() -> Dict[str, Any]:
    try:
        documents = get_available_documents()
        embedding = get_embeddings()
        vectorstore = Chroma(
            collection_name="UI_Policies",
            persist_directory=persist_dir,
            embedding_function=embedding,
        )

        sample_query = "University of Ibadan"
        retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
        results = retriever.invoke(sample_query)

        return {
            "status": "connected",
            "documents_count": len(documents),
            "sample_documents": documents[:5],
            "sample_query_results": len(results) if results else 0,
            "message": f"Vector store is working with {len(documents)} documents",
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": str(exc),
            "documents_count": 0,
        }
