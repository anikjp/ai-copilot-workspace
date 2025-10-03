import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import { z } from "zod";
import { text } from "stream/consumers";
const images = ["Bonsai_Tree_Potted_Japanese_Art_Green_Foliage.jpeg", "Cherry_Blossoms_Sakura_Night_View_City_Lights_Japan.jpg", "Ginkaku-ji_Silver_Pavilion_Kyoto_Japanese_Garden_Pond_Reflection.jpg", "Itsukushima_Shrine_Miyajima_Floating_Torii_Gate_Sunset_Long_Exposure.jpg", "Mount_Fuji_Lake_Reflection_Cherry_Blossoms_Sakura_Spring.jpg", "Osaka_Castle_Turret_Stone_Wall_Pine_Trees_Daytime.jpg", "Senso-ji_Temple_Asakusa_Cherry_Blossoms_Kimono_Umbrella.jpg", "Shirakawa-go_Gassho-zukuri_Thatched_Roof_Village_Aerial_View.jpg", "Takachiho_Gorge_Waterfall_River_Lush_Greenery_Japan.jpg", "Tokyo_Skyline_Night_Tokyo_Tower_Mount_Fuji_View.jpg"]
// Define the handler for the weather tool
const getHaiku = async (topic: string) => {
  // Replace with an actual API call to a weather service
  const haikuFormat = { japanese: ["仮の句よ", "まっさらながら", "花を呼ぶ"], english: ["A placeholder verse—", "even in a blank canvas,", "it beckons flowers."], image_names: ["image1.jpg", "image2.jpg", "image3.jpg"] }
  const LLM = openai("chatgpt-4o-latest")
  const response = await generateText({
    model: LLM,
    prompt: `Create a haiku about ${topic}. The format should strictly be like like this:
    ${haikuFormat}
    `,
  })
  console.log(response)
  // completions.create({
  //   model: "gpt-4o",
  //   messages: [{ role: "user", content: `Create a haiku about ${topic}` }],
  // });
  console.log(`Fetching haiku for ${topic}...`);
  // Example data structure
  return { japanese: ["仮の句よ", "まっさらながら", "花を呼ぶ"], english: ["A placeholder verse—", "even in a blank canvas,", "it beckons flowers."], image_names: ["image1.jpg", "image2.jpg", "image3.jpg"] };
};

// Define a tool for retrieving weather information
export const haikuTopicTool = createTool({
  id: "haikuTopicTool",
  description: `Extract the Haiku topic from the user's message`,
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.string(),
  execute: async ({ context: { topic } }) => {
    console.log("Using tool to create a haiku about", topic);
    return topic;
  },
});

// z.object({
//   japanese: z.array(z.string()),
//   english: z.array(z.string()),
//   image_names: z.array(z.string()),
// }),

export const haikuGenerateTool = createTool({
  id: "haikuGenerateTool",
  description: `Generate a haiku about a given topic. Always generate 3 images for the haiku. 
    While generating images, use only this list of images provided : ${images}`,
  inputSchema: z.object({
    japanese: z.array(z.string()),
    english: z.array(z.string()),
    image_names: z.array(z.string()),
  }),
  outputSchema: z.object({
    japanese: z.array(z.string()),
    english: z.array(z.string()),
    image_names: z.array(z.string()),
  }),
  execute: async ({ context: { japanese, english, image_names } }) => {
    console.log("Using tool to create a haiku about", japanese, english, image_names);
    return { japanese, english, image_names };
  },
});