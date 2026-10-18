import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";
import { readAdminSession, safeNextPath } from "@/lib/auth/session";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  const session = await readAdminSession(supabase);
  const pathname = request.nextUrl.pathname;
  const publicPage = ["/login", "/401", "/403"].includes(pathname);
  let destination: URL | undefined;
  if (session.status === "unauthenticated" && !publicPage) {
    destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname + request.nextUrl.search);
  } else if (
    session.status === "forbidden" &&
    pathname !== "/403" &&
    pathname !== "/401"
  ) {
    destination = new URL("/403", request.url);
  } else if (session.status === "authenticated" && pathname === "/login") {
    destination = new URL(
      safeNextPath(request.nextUrl.searchParams.get("next")),
      request.url,
    );
  }

  if (destination) {
    const redirect = NextResponse.redirect(destination);
    // Keep refreshed/deleted auth cookies even when redirecting.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response.headers.forEach((value, name) => {
      if (name !== "set-cookie" && !name.startsWith("x-middleware-"))
        redirect.headers.set(name, value);
    });
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
