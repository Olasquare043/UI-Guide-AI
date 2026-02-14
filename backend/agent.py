import contextvars
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Literal

from langchain_chroma import Chroma
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

try:
    from langchain_groq import ChatGroq
except ImportError:  # pragma: no cover - optional dependency
    ChatGroq = None
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings

logger = logging.getLogger(__name__)

persist_dir = str(Path(__file__).resolve().parent / "chroma_db")
RETRIEVAL_K = 4
RETRIEVAL_FETCH_K = 20
_sources_var: contextvars.ContextVar[List[Dict[str, Any]]] = contextvars.ContextVar(
    "sources",
    default=[],
)


def _select_llm_provider() -> str:
    settings = get_settings()
    provider = (settings.llm_provider or "auto").lower()
    if provider == "auto":
        return "groq" if settings.groq_api_key else "openai"
    return provider


def _require_llm_key(provider: str) -> None:
    settings = get_settings()
    if provider == "groq" and not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")
    if provider == "openai" and not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")


def _require_embeddings_key() -> None:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for embeddings")


@lru_cache(maxsize=1)
def get_llm() -> ChatOpenAI:
    settings = get_settings()
    provider = _select_llm_provider()
    _require_llm_key(provider)

    if provider == "groq":
        if ChatGroq is None:
            raise RuntimeError("langchain-groq is not installed")
        return ChatGroq(model=settings.groq_model, temperature=0.5)

    if provider != "openai":
        raise RuntimeError(f"Unsupported LLM provider: {provider}")

    return ChatOpenAI(model="gpt-4o-mini", temperature=0.5)


def get_embeddings() -> OpenAIEmbeddings:
    _require_embeddings_key()
    return OpenAIEmbeddings(model="text-embedding-3-small")


@lru_cache(maxsize=1)
def get_vectorstore() -> Chroma:
    embedding = get_embeddings()
    return Chroma(
        collection_name="UI_Policies",
        persist_directory=persist_dir,
        embedding_function=embedding,
    )


def _reset_sources() -> contextvars.Token:
    return _sources_var.set([])


def _append_source(item: Dict[str, Any]) -> None:
    sources = list(_sources_var.get())
    sources.append(item)
    _sources_var.set(sources)


def _get_sources() -> List[Dict[str, Any]]:
    return list(_sources_var.get())


def _retrieve_documents(query: str):
    retriever = get_vectorstore().as_retriever(
        search_type="mmr",
        search_kwargs={"k": RETRIEVAL_K, "fetch_k": RETRIEVAL_FETCH_K, "lambda_mult": 0.5},
    )
    return retriever.invoke(query)


def _collect_sources(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    try:
        response = _retrieve_documents(query)
    except Exception as exc:
        logger.exception("Document retrieval failed")
        return []

    if not response:
        return []

    sources = [
        {
            "content": doc.page_content[:300],
            "document": doc.metadata.get("document_name", "Unknown"),
            "page": str(doc.metadata.get("page_no", "Unknown")),
            "date": doc.metadata.get("date", ""),
            "source": doc.metadata.get("source", ""),
        }
        for doc in response
    ]
    return sources[:limit]


@tool
def doc_retriever(query: str) -> str:
    """Search knowledge base for relevant documents."""
    try:
        response = _retrieve_documents(query)
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
                "page": str(doc.metadata.get("page_no", "Unknown")),
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

        sources = _get_sources() if used_retriever else []
        if used_retriever and not sources:
            sources = _collect_sources(user_input)
        sources = sources[:5] if used_retriever else []

        return {
            "answer": final_answer or "No response generated",
            "used_retriever": used_retriever,
            "thread_id": thread_id,
            "sources": sources,
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
