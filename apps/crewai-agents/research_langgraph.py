"""
This is the main entry point for the AI.
It defines the workflow graph and the entry point for the agent.
"""
# pylint: disable=line-too-long, unused-import
import json
import os
from typing import cast
from pydantic import BaseModel, Field
from tavily import TavilyClient
from ag_ui.encoder import EventEncoder  # Encodes events to Server-Sent Events format
# from main import StateDeltaEvent
from langchain_core.messages import AIMessage, ToolMessage
from langgraph.graph import StateGraph, END
import aiohttp
import html2text
from copilotkit.langgraph import copilotkit_emit_state
from langchain_core.runnables import RunnableConfig
from researchState import AgentState
from langchain_openai import ChatOpenAI
from typing import List, cast, Literal, Dict, Any
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage, HumanMessage
from langchain.tools import tool
from langgraph.types import Command
from copilotkit.langgraph import copilotkit_customize_config
import asyncio 

from dotenv import load_dotenv

load_dotenv()
_RESOURCE_CACHE = {}

MAX_CHARS_PER_RESOURCE_CONTENT = 4000
MAX_RESOURCES_IN_PROMPT = 5
MAX_REPORT_CHARS = 6000
MAX_MESSAGES_FOR_MODEL = 12
MAX_CHARS_PER_MESSAGE = 1200

def _truncate_text(text: str, max_chars: int) -> str:
    if not isinstance(text, str):
        return text
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "…"

def _prepare_resources_for_prompt(resources_state: list) -> list:
    prepared = []
    for resource in resources_state[:MAX_RESOURCES_IN_PROMPT]:
        item = {
            "url": resource.get("url", ""),
            "title": resource.get("title", ""),
            "description": _truncate_text(resource.get("description", ""), 300),
        }
        content = resource.get("content", "")
        if content:
            item["content"] = _truncate_text(content, MAX_CHARS_PER_RESOURCE_CONTENT)
        prepared.append(item)
    return prepared

def _prune_messages(messages: list) -> list:
    # Keep only the most recent messages and trim overly long contents
    if not messages:
        return []
    recent = list(messages[-MAX_MESSAGES_FOR_MODEL:])
    pruned = []
    for m in recent:
        if isinstance(m, (SystemMessage, HumanMessage, AIMessage, ToolMessage)):
            content = getattr(m, "content", "")
            truncated_content = _truncate_text(content, MAX_CHARS_PER_MESSAGE)
            # Recreate message with truncated content preserving type and attributes
            if isinstance(m, SystemMessage):
                pruned.append(SystemMessage(content=truncated_content))
            elif isinstance(m, HumanMessage):
                pruned.append(HumanMessage(content=truncated_content))
            elif isinstance(m, ToolMessage):
                pruned.append(ToolMessage(tool_call_id=m.tool_call_id, content=truncated_content))
            elif isinstance(m, AIMessage):
                pruned.append(AIMessage(content=truncated_content, tool_calls=m.tool_calls))
        else:
            pruned.append(m)
    return pruned

def _condense_tavily_results(search_results: list, per_query_limit: int = 5, snippet_chars: int = 300) -> list:
    condensed = []
    for result in search_results:
        if isinstance(result, dict):
            items = []
            for entry in (result.get("results") or [])[:per_query_limit]:
                items.append({
                    "title": entry.get("title"),
                    "url": entry.get("url"),
                    "snippet": _truncate_text(entry.get("content", ""), snippet_chars),
                })
            condensed.append({"results": items})
        else:
            condensed.append({"error": str(result)})
    return condensed

class StateDeltaEvent(BaseModel):
    """
    Custom AG-UI protocol event for partial state updates using JSON Patch.
    
    This event allows for efficient updates to the frontend state by sending
    only the changes (deltas) that need to be applied, following the JSON Patch
    standard (RFC 6902). This approach reduces bandwidth and improves real-time
    feedback to the user.
    
    Attributes:
        type (str): Event type identifier, fixed as "STATE_DELTA"
        message_id (str): Unique identifier for the message this event belongs to
        delta (list): List of JSON Patch operations to apply to the frontend state
    """
    type: str = "STATE_DELTA"
    message_id: str
    delta: list  # List of JSON Patch operations (RFC 6902)
    
 

def get_resource(url: str):
    """
    Get a resource from the cache.
    """
    return _RESOURCE_CACHE.get(url, "")


_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3" # pylint: disable=line-too-long

async def _download_resource(url: str):
    """
    Download a resource from the internet asynchronously.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url,
                headers={"User-Agent": _USER_AGENT},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                response.raise_for_status()
                html_content = await response.text()
                markdown_content = html2text.html2text(html_content)
                _RESOURCE_CACHE[url] = markdown_content
                return markdown_content
    except Exception as e: # pylint: disable=broad-except
        _RESOURCE_CACHE[url] = "ERROR"
        return f"Error downloading resource: {e}"

async def download_node(state: AgentState, config: RunnableConfig):
    """
    Download resources from the internet.
    """
    print("here")
    state["resources"] = state.get("resources", [])
    state["logs"] = state.get("logs", [])
    resources_to_download = []

    logs_offset = len(state["logs"])

    # Find resources that are not downloaded
    for resource in state["resources"]:
        if not get_resource(resource["url"]):
            resources_to_download.append(resource)
            state["logs"].append({
                "message": f"Downloading {resource['url']}",
                "done": False
            })

    # Emit the state to let the UI update
    await copilotkit_emit_state(config, state)

    # Download the resources
    for i, resource in enumerate(resources_to_download):
        await _download_resource(resource["url"])
        state["logs"][logs_offset + i]["done"] = True

        # update UI
        await copilotkit_emit_state(config, state)

    return state





@tool
def Search(queries: List[str]): # pylint: disable=invalid-name,unused-argument
    """A list of one or more search queries to find good resources to support the research."""

@tool
def WriteReport(report: str): # pylint: disable=invalid-name,unused-argument
    """Write the research report."""

@tool
def WriteResearchQuestion(research_question: str): # pylint: disable=invalid-name,unused-argument
    """Write the research question."""

@tool
def DeleteResources(urls: List[str]): # pylint: disable=invalid-name,unused-argument
    """Delete the URLs from the resources."""


async def chat_node(state: AgentState, config: RunnableConfig) -> \
    Command[Literal["search_node", "chat_node", "delete_node", "__end__"]]:
    """
    Chat Node
    """

    config = copilotkit_customize_config(
        config,
        emit_intermediate_state=[{
            "state_key": "report",
            "tool": "WriteReport",
            "tool_argument": "report",
        }, {
            "state_key": "research_question",
            "tool": "WriteResearchQuestion",
            "tool_argument": "research_question",
        }],
    )

    state["resources"] = state.get("resources", [])
    research_question = state.get("research_question", "")
    report = _truncate_text(state.get("report", ""), MAX_REPORT_CHARS)

    resources = []
    for resource in state["resources"]:
        content = get_resource(resource["url"])
        if content == "ERROR":
            continue
        resources.append({
            **resource,
            "content": content
        })
    # Trim resource content and count for prompt safety
    resources_for_prompt = _prepare_resources_for_prompt(resources)
    model = ChatOpenAI(temperature=0, model="gpt-4o-mini")
    # Prepare the kwargs for the ainvoke method
    ainvoke_kwargs = {}
    if model.__class__.__name__ in ["ChatOpenAI"]:
        ainvoke_kwargs["parallel_tool_calls"] = False

    # Prune conversation messages before sending to the model
    input_messages = _prune_messages(state["messages"])

    response = await model.bind_tools(
        [
            Search,
            WriteReport,
            WriteResearchQuestion,
            DeleteResources,
        ],
        **ainvoke_kwargs  # Pass the kwargs conditionally
    ).ainvoke([
        SystemMessage(
            content=f"""
            You are a research assistant. You help the user with writing a research report.
            Do not recite the resources, instead use them to answer the user's question.
            You should use the search tool to get resources before answering the user's question.
            If you finished writing the report, ask the user proactively for next steps, changes etc, make it engaging.
            To write the report, you should use the WriteReport tool. Never EVER respond with the report, only use the tool.
            If a research question is provided, YOU MUST NOT ASK FOR IT AGAIN.

            This is the research question:
            {research_question}

            This is the research report:
            {_truncate_text(report, MAX_REPORT_CHARS)}

            Here are the resources that you have available:
            {resources_for_prompt}
            """
        ),
        *input_messages,
    ], config)

    ai_message = cast(AIMessage, response)

    if ai_message.tool_calls:
        if ai_message.tool_calls[0]["name"] == "WriteReport":
            report = ai_message.tool_calls[0]["args"].get("report", "")
            # config.get("configurable").get("emit_event")(
            #     StateDeltaEvent(
            #         message_id=config.get("configurable").get("message_id"),
            #         delta=[
            #             {
            #                 "op": "replace",
            #                 "path": "/report",
            #                 "value": report
            #             }
            #         ]
            #     )
            # )
            return Command(
                goto="chat_node",
                update={
                    "report": report,
                    "messages": [ai_message, ToolMessage(
                    tool_call_id=ai_message.tool_calls[0]["id"],
                    content="Report written."
                    )]
                }
            )
        if ai_message.tool_calls[0]["name"] == "WriteResearchQuestion":
            return Command(
                goto="chat_node",
                update={
                    "research_question": ai_message.tool_calls[0]["args"]["research_question"],
                    "messages": [ai_message, ToolMessage(
                        tool_call_id=ai_message.tool_calls[0]["id"],
                        content="Research question written."
                    )]
                }
            )
       
    goto = "__end__"
    if ai_message.tool_calls and ai_message.tool_calls[0]["name"] == "Search":
        goto = "search_node"
    elif ai_message.tool_calls and ai_message.tool_calls[0]["name"] == "DeleteResources":
        goto = "delete_node"


    return Command(
        goto=goto,
        update={
            "messages": response
        }
    )


"""
The search node is responsible for searching the internet for information.
"""


class ResourceInput(BaseModel):
    """A resource with a short description"""
    url: str = Field(description="The URL of the resource")
    title: str = Field(description="The title of the resource")
    description: str = Field(description="A short description of the resource")

@tool
def ExtractResources(resources: List[ResourceInput]): # pylint: disable=invalid-name,unused-argument
    """Extract the 3-5 most relevant resources from a search result."""

# Initialize Tavily API key
tavily_api_key = os.getenv("TAVILY_API_KEY")
tavily_client = TavilyClient(api_key=tavily_api_key)

# Async version of Tavily search that runs the synchronous client in a thread pool
async def async_tavily_search(query: str) -> Dict[str, Any]:
    """Asynchronous wrapper for Tavily search API"""
    loop = asyncio.get_event_loop()
    try:
        # Run the synchronous tavily_client.search in a thread pool
        return await loop.run_in_executor(
            None, 
            lambda: tavily_client.search(
                query=query,
                search_depth="advanced",
                include_answer=True,
                max_results=10
            )
        )
    except Exception as e:
        raise Exception(f"Tavily search failed: {str(e)}")

async def search_node(state: AgentState, config: RunnableConfig):
    """
    The search node is responsible for searching the internet for resources.
    """

    ai_message = cast(AIMessage, state["messages"][-1])

    state["resources"] = state.get("resources", [])
    state["logs"] = state.get("logs", [])
    queries = ai_message.tool_calls[0]["args"]["queries"]

    for query in queries:
        state["logs"].append({
            "message": f"Search for {query}",
            "done": False
        })
        # config.get("configurable").get("emit_event")(
        #     StateDeltaEvent(
        #         message_id=config.get("configurable").get("message_id"),
        #         delta=[
        #             {
        #                 "op": "replace",
        #                 "path": "/logs",
        #                 "value": state["logs"]
        #             }
        #         ]
        #     )
        # )
        
        

    await copilotkit_emit_state(config, state)

    search_results = []

    # Use asyncio.gather to run multiple searches in parallel
    tasks = [async_tavily_search(query) for query in queries]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            # Handle exceptions
            search_results.append({"error": str(result)})
        else:
            search_results.append(result)
        
        state["logs"][i]["done"] = True
        await copilotkit_emit_state(config, state)
        await asyncio.sleep(0)
        # config.get("configurable").get("emit_event")(
        #     StateDeltaEvent(
        #         message_id=config.get("configurable").get("message_id"),
        #         delta=[
        #             {
        #                 "op": "replace",
        #                 "path": "/logs",
        #                 "value": state["logs"]
        #             }
        #         ]
        #     )
        # )
    
    config = copilotkit_customize_config(
        config,
        emit_intermediate_state=[{
            "state_key": "resources",
            "tool": "ExtractResources",
            "tool_argument": "resources",
        }],
    )

    model = ChatOpenAI(temperature=0, model="gpt-4o-mini")
    ainvoke_kwargs = {}
    if model.__class__.__name__ in ["ChatOpenAI"]:
        ainvoke_kwargs["parallel_tool_calls"] = False

    # figure out which resources to use
    # Condense search results to avoid blowing the context window
    condensed = _condense_tavily_results(search_results)
    pruned_messages = _prune_messages(state["messages"])

    response = await model.bind_tools(
        [ExtractResources],
        tool_choice="ExtractResources",
        **ainvoke_kwargs
    ).ainvoke([
        SystemMessage(
            content="""
            You need to extract the 3-5 most relevant resources from the following search results.
            """
        ),
        *pruned_messages,
        ToolMessage(
        tool_call_id=ai_message.tool_calls[0]["id"],
        content=f"Performed search. Top results: {condensed}"
    )
    ], config)

    state["logs"] = []
    await copilotkit_emit_state(config, state)

    ai_message_response = cast(AIMessage, response)
    resources = ai_message_response.tool_calls[0]["args"]["resources"]

    state["resources"].extend(resources)

    # config.get("configurable").get("emit_event")(
    #     StateDeltaEvent(
    #         message_id=config.get("configurable").get("message_id"),
    #         delta=[
    #             {
    #                 "op": "replace",
    #                 "path": "/resources",
    #                 "value": state["resources"]
    #             }
    #         ]
    #     )
    # )
    # Add a lightweight tool message that only includes titles and URLs
    lightweight_resources = [{"title": r.get("title"), "url": r.get("url")} for r in resources]
    state["messages"].append(ToolMessage(
        tool_call_id=ai_message.tool_calls[0]["id"],
        content=f"Added resources: {lightweight_resources}"
    ))

    # yield state
    return state


async def delete_node(state: AgentState, config: RunnableConfig): # pylint: disable=unused-argument
    """
    Delete Node
    """
    return state

async def perform_delete_node(state: AgentState, config: RunnableConfig): # pylint: disable=unused-argument
    """
    Perform Delete Node
    """
    print("[DEBUG] state from perform_delete_node",state["messages"])
    ai_message = cast(AIMessage, state["messages"][-2])
    tool_message = cast(ToolMessage, state["messages"][-1])
    if tool_message.content == "YES":
        if ai_message.tool_calls:
            urls = ai_message.tool_calls[0]["args"]["urls"]
        else:
            parsed_tool_call = json.loads(ai_message.additional_kwargs["function_call"]["arguments"])
            urls = parsed_tool_call["urls"]

        state["resources"] = [
            resource for resource in state["resources"] if resource["url"] not in urls
        ]

    return state

def get_emit_event(config):
    return config.get("emit_event")


# async def agent_graph():
workflow = StateGraph(AgentState)
workflow.add_node("download", download_node)
workflow.add_node("chat_node", chat_node)
workflow.add_node("search_node", search_node)
workflow.add_node("delete_node", delete_node)
workflow.add_node("perform_delete_node", perform_delete_node)

workflow.set_entry_point("download")
workflow.add_edge("download", "chat_node")
workflow.add_edge("delete_node", "perform_delete_node")
workflow.add_edge("perform_delete_node", "chat_node")
workflow.add_edge("search_node", "download")

compile_kwargs = {"interrupt_after": ["delete_node"]}
from langgraph.checkpoint.memory import MemorySaver
# memory = MemorySaver()
# compile_kwargs["checkpointer"] = memory
graph = workflow.compile(checkpointer=MemorySaver())
    # return graph