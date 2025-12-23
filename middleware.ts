import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env"; // Corrected import
import { AppRole, roleHome } from "@/lib/auth-constants"; // Import AppRole and roleHome

const jobseekerPrefixes = ["/jobseeker"];
const employerPrefixes = ["/employer"];
const adminPrefixes = ["/admin"];

const isProtected = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Add CSP headers to allow Next.js inline scripts and external resources
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://r2cdn.perplexity.ai; style-src 'self' 'unsafe-inline' https://r2cdn.perplexity.ai; img-src 'self' data: https:; font-src 'self' data: https://r2cdn.perplexity.ai; connect-src 'self' https://*.supabase.co https://vercel.live https://r2cdn.perplexity.ai;"
  );

  // Skip static and public assets
  if (path.startsWith("/_next") || path.startsWith("/api/webhooks") || path.includes(".")) {
    return res;
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL, // Corrected env var
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Corrected env var
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value))
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const redirectTo = encodeURIComponent(path);

  const requireRole = async (allowed: AppRole[]) => { // Using AppRole type
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/login?redirectTo=${redirectTo}`, req.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .is("deleted_at", null)
      .maybeSingle();
    const role = profile?.role as AppRole | undefined; // Using AppRole type

    if (!role || !allowed.includes(role)) {
      // Redirect to the user's actual role homepage if they try to access a forbidden route
      // This also prevents infinite redirects if they are already on their own role's page.
      const userHome = role ? roleHome[role] : "/auth/login";
      if (path !== userHome) { // Prevent redirecting to current page
         return NextResponse.redirect(new URL(userHome, req.url));
      } else {
        // If they are on their own homepage but something went wrong (e.g. no session),
        // or tried to access a protected page where their role is not allowed and there is no userHome
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }
    return res;
  };

  if (isProtected(path, adminPrefixes)) {
    return requireRole(["admin"]);
  }
  if (isProtected(path, employerPrefixes)) {
    return requireRole(["employer"]); // Removed 'admin'
  }
  if (isProtected(path, jobseekerPrefixes)) {
    return requireRole(["jobseeker"]); // Removed 'admin'
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
