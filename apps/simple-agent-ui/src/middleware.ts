import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/stock-agent(.*)',
  '/stock-agent-reference(.*)',
  '/api/copilotkit(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  console.log("🔧 MIDDLEWARE: Processing request for:", req.nextUrl.pathname);
  
  if (isProtectedRoute(req)) {
    console.log("🔧 MIDDLEWARE: Protected route detected, checking auth");
    await auth.protect();
    console.log("🔧 MIDDLEWARE: Auth check completed");
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
