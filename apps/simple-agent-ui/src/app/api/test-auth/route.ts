import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  console.log("🧪 TEST AUTH: Testing authentication");
  
  try {
    const { userId, getToken } = await auth();
    
    console.log("🧪 TEST AUTH: User ID:", userId);
    console.log("🧪 TEST AUTH: GetToken function:", typeof getToken);
    
    if (!userId) {
      return Response.json({ 
        authenticated: false, 
        error: "No user ID found",
        headers: {
          authorization: req.headers.get("authorization") ? "Present" : "Not present",
          cookie: req.headers.get("cookie") ? "Present" : "Not present"
        }
      });
    }
    
    const token = await getToken();
    console.log("🧪 TEST AUTH: Token obtained:", !!token);
    
    return Response.json({ 
      authenticated: true, 
      userId,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 50) + "..." : null
    });
    
  } catch (error) {
    console.error("🧪 TEST AUTH: Error:", error);
    return Response.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
