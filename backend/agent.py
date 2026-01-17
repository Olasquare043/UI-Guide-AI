import os
from dotenv import load_dotenv
from langgraph.graph import START, END, StateGraph, MessagesState
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from typing import Literal
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma

# Load environment variables
load_dotenv()

# Configuration
persist_dir = "./chroma_db"
llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.3)

# Tool definition with citation support
@tool
def doc_retriever(query: str) -> str:
    """Search knowledge base for relevant documents.

    Use this tool when needed to answer any information about University of Ibadan.
    Do not use the tool for general knowledge questions or normal greetings.

    args:
        query: question to search for
    returns: 
        the fetched documents with source metadata
    """
    embedding = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = Chroma(
        collection_name="UI_Policies", 
        persist_directory=persist_dir, 
        embedding_function=embedding
    )
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 20, "lambda_mult": 0.5}
    )
    response = retriever.invoke(query)

    if not response:
        return "No relevant documents found."
    
    # Format with source information for citations
    formatted = "\n\n---\n\n".join(
        f"[Source {i+1}] Document: {doc.metadata.get('document_name', 'Unknown')} (Page {doc.metadata.get('page_no', '?')})\n\nContent:\n{doc.page_content}"
        for i, doc in enumerate(response)
    )
    return formatted

# System prompt
sys_prompt = SystemMessage(content="""You are a helpful assistant that provides information about University of Ibadan and its policies.
Your name is **UI GUIDE** (Implies guidance and Assistance),
You have access to a document retrieval tool.

DO NOT retrieve documents for these (answer directly in a warm, friendly way):
- Greetings: "Hello", "Hi", "How are you", etc.
- Questions about your capabilities: "What can you help with?", "What do you do?"
- Simple math or general knowledge: "What is 2+2?"
- Casual conversation: "Thank you", "Goodbye"

DO retrieve documents for:
- Questions asking for specific information about University of Ibadan
- Requests for facts, definitions, or explanations about UI policies
- Any question where citing sources would improve the answer

IMPORTANT - When you use retrieved documents:
1. Cite sources using format: (Source X: Document Name, Page Y)
2. Limit citations to the 1-3 most relevant sources
3. Only cite the sources you actually used in your answer
4. If documents don't contain the answer, say so clearly
5. Do not answer questions outside the scope of University of Ibadan except for casual greetings
""")

# Build the assistant node
def assistant(state: MessagesState):
    """Assistant node: Decide to make a tool call or answer directly"""
    tools = [doc_retriever]
    llm_with_tool = llm.bind_tools(tools)
    msg = [sys_prompt] + state['messages']
    response = llm_with_tool.invoke(msg)
    return {"messages": [response]}

# Define the router node
def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    """Determine whether to call tool or finish"""
    last_msg = state["messages"][-1]
    if last_msg.tool_calls:
        return "tools"
    return "__end__"

# Build and compile the graph
def create_agent():
    """Create and return the compiled agent"""
    tools = [doc_retriever]
    builder = StateGraph(MessagesState)
    builder.add_node("assistant", assistant)
    builder.add_node("tools", ToolNode(tools))
    
    builder.add_edge(START, "assistant")
    builder.add_conditional_edges("assistant", should_continue, {"tools": "tools", "__end__": END})
    builder.add_edge("tools", "assistant")
    
    # Compile agent with memory
    memory = MemorySaver()
    agent = builder.compile(checkpointer=memory)
    return agent

# Initialize agent once
agent = create_agent()

# Query function for API use
def query_agent(user_input: str, thread_id: str = "default_session"):
    """Query the agent and return structured response"""
    result = agent.invoke(
        {"messages": [HumanMessage(content=user_input)]},
        config={"configurable": {"thread_id": thread_id}}
    )

    # Analyze the message flow
    used_retriever = False
    final_answer = None

    for message in result['messages']:
        if isinstance(message, AIMessage) and message.tool_calls:
            used_retriever = True
        elif isinstance(message, AIMessage) and not message.tool_calls and message.content:
            final_answer = message.content

    return {
        "answer": final_answer or "No response generated",
        "used_retriever": used_retriever,
        "thread_id": thread_id
    }