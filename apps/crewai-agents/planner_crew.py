"""
A simple agentic chat flow.
"""

from crewai.flow.flow import Flow, start
from litellm import completion
from copilotkit.crewai import copilotkit_stream, CopilotKitState, copilotkit_emit_tool_call

class PlannerFlow(Flow[CopilotKitState]):

    @start()
    async def chat(self):
        system_prompt = "You are a helpful assistant who helps with planning a project. When asked to add a task, you need to detail it by seggregating it into smaller tasks. Also when prioritizing the tasks, you itselft should be the one to do the prioritization. When asked to complete or uncomplete a task, you need to do it yourself. The Id of the task is accessible to you from the CopilotReadables. Use it efficiently. When asked to add a project, you need to generate a project and create relevant tasks for it as well."

        # 1. Run the model and stream the response
        #    Note: In order to stream the response, wrap the completion call in
        #    copilotkit_stream and set stream=True.
        response = await copilotkit_stream(
            completion(

                # 1.1 Specify the model to use
                model="openai/gpt-4o",
                messages=[
                    {
                        "role": "system", 
                        "content": system_prompt
                    },
                    *self.state.messages
                ],

                # 1.2 Bind the available tools to the model
                tools=[
                    *self.state.copilotkit.actions,
                ],

                # 1.3 Disable parallel tool calls to avoid race conditions,
                #     enable this for faster performance if you want to manage
                #     the complexity of running tool calls in parallel.
                parallel_tool_calls=False,
                stream=True
            )
        )

        message = response.choices[0].message

        # 2. Append the message to the messages in state
        self.state.messages.append(message)

