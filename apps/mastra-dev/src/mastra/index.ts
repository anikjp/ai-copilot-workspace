import { Mastra } from "@mastra/core/mastra";
import { haikuAgent } from "./agents";

// const LOG_LEVEL = process.env.LOG_LEVEL as LogLevel || "info";
 
// Define your runtime context type
type HaikuRuntimeContext = {
  "user-id": string;
  "api-key": string;
  // ...
};
 
export const mastra = new Mastra({
  agents: { 
    haikuAgent
  }
});