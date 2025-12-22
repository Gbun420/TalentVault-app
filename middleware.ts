import { NextResponse, NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/ssr";
import { env } from "./src/lib/env";

const jobseekerPrefixes = ["/jobseeker"];
const employerPrefixes = ["/employer"];
const adminPrefixes = ["/admin"];
type Role = "jobseeker" | "employer" | "admin";

const isProtected = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Skip static and public assets
  if (path.startsWith("/_next") || path.startsWith("/api/webhooks") || path.includes(".")) {
    return res;
  }

  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: env.supabaseUrl || "",
      supabaseKey: env.supabaseAnonKey || "",
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const redirectTo = encodeURIComponent(path);

  const requireRole = async (allowed: Role[]) => {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/login?redirectTo=${redirectTo}`, req.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .is("deleted_at", null)
      .maybeSingle();
    const role = profile?.role as Role | undefined;
    if (!role || !allowed.includes(role)) {
      const fallback = role === "jobseeker"
        ? "/jobseeker"
        : role === "employer"
        ? "/employer"
        : "/auth/login";
      return NextResponse.redirect(new URL(fallback, req.url));
    }
    return res;
  };

  if (isProtected(path, adminPrefixes)) {
    return requireRole(["admin"]);
  }
  if (isProtected(path, employerPrefixes)) {
    return requireRole(["employer", "admin"]);
  }
  if (isProtected(path, jobseekerPrefixes)) {
    return requireRole(["jobseeker", "admin"]);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
