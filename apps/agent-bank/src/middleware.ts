import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/(auth)(.*)', // All routes in the (auth) route group (includes settings)
]);

const isApiRoute = createRouteMatcher([
  '/api/copilotkit(.*)', // All CopilotKit API routes
]);

export default clerkMiddleware(async (auth, req) => {
  console.log("🔧 MIDDLEWARE: Processing request for:", req.nextUrl.pathname);
  
  // Handle API routes separately - just protect them, don't redirect
  if (isApiRoute(req)) {
    console.log("🔧 MIDDLEWARE: API route detected, protecting auth");
    await auth.protect();
    console.log("🔧 MIDDLEWARE: API auth check completed");
    return;
  }
  
  if (isProtectedRoute(req)) {
    console.log("🔧 MIDDLEWARE: Protected route detected, checking auth");
    
    // Get auth data first
    const { userId, sessionClaims } = await auth();
    
    // If no user, protect will handle the redirect
    if (!userId) {
      await auth.protect();
      return;
    }
    
    console.log("🔧 MIDDLEWARE: Auth check completed");
    
    // Check if user has organization membership for protected routes (except organization page)
    const isOrganizationPage = req.nextUrl.pathname.startsWith('/organization');
    
    if (!isOrganizationPage) {
      console.log("🔧 MIDDLEWARE: Checking B2B organization membership");
      
      // B2B Model: Every user must be part of exactly one company organization
      if (!sessionClaims?.org_id) {
        console.log("🔧 MIDDLEWARE: No company workspace membership, redirecting to organization page");
        const organizationUrl = new URL('/organization', req.url);
        return Response.redirect(organizationUrl);
      }
      
      console.log("🔧 MIDDLEWARE: Company workspace membership verified:", sessionClaims.org_id);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
