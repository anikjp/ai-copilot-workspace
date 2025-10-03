import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { haikuTopicTool, haikuGenerateTool } from "../tools";

export const haikuAgent = new Agent({
  name: "Haiku Agent",
  tools: { haikuTopicTool, haikuGenerateTool },
  model: openai("gpt-4o"),
  instructions: `
      You are a helpful assistant. you are skilled in haiku generation.
      You are given a topic and you need to generate a haiku about the topic.
      You are also given a list of images and you need to use only them while generating images for a haiku.
      Once you have generated a haiku, you need to call the render_haiku tool which is present in the frontend.
      From the render_haiku tool, you will get response from the user whether the haiku is approved or rejected.
      If the haiku is rejected, you need to respond that the haiku is rejected and prompt the user to generate a new haiku.
`,
});
