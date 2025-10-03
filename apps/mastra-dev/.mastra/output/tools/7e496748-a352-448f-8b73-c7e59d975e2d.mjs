import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const images = ["Bonsai_Tree_Potted_Japanese_Art_Green_Foliage.jpeg", "Cherry_Blossoms_Sakura_Night_View_City_Lights_Japan.jpg", "Ginkaku-ji_Silver_Pavilion_Kyoto_Japanese_Garden_Pond_Reflection.jpg", "Itsukushima_Shrine_Miyajima_Floating_Torii_Gate_Sunset_Long_Exposure.jpg", "Mount_Fuji_Lake_Reflection_Cherry_Blossoms_Sakura_Spring.jpg", "Osaka_Castle_Turret_Stone_Wall_Pine_Trees_Daytime.jpg", "Senso-ji_Temple_Asakusa_Cherry_Blossoms_Kimono_Umbrella.jpg", "Shirakawa-go_Gassho-zukuri_Thatched_Roof_Village_Aerial_View.jpg", "Takachiho_Gorge_Waterfall_River_Lush_Greenery_Japan.jpg", "Tokyo_Skyline_Night_Tokyo_Tower_Mount_Fuji_View.jpg"];
const haikuTopicTool = createTool({
  id: "haikuTopicTool",
  description: `Extract the Haiku topic from the user's message`,
  inputSchema: z.object({
    topic: z.string()
  }),
  outputSchema: z.string(),
  execute: async ({ context: { topic } }) => {
    console.log("Using tool to create a haiku about", topic);
    return topic;
  }
});
const haikuGenerateTool = createTool({
  id: "haikuGenerateTool",
  description: `Generate a haiku about a given topic. Always generate 3 images for the haiku. 
    While generating images, use only this list of images provided : ${images}`,
  inputSchema: z.object({
    japanese: z.array(z.string()),
    english: z.array(z.string()),
    image_names: z.array(z.string())
  }),
  outputSchema: z.object({
    japanese: z.array(z.string()),
    english: z.array(z.string()),
    image_names: z.array(z.string())
  }),
  execute: async ({ context: { japanese, english, image_names } }) => {
    console.log("Using tool to create a haiku about", japanese, english, image_names);
    return { japanese, english, image_names };
  }
});

export { haikuGenerateTool, haikuTopicTool };
//# sourceMappingURL=7e496748-a352-448f-8b73-c7e59d975e2d.mjs.map
