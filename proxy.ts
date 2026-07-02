import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const unlocked = request.cookies.get(COOKIE_NAME)?.value === "1";
  const isUnlockRoute = pathname === "/unlock";

  if (!unlocked && !isUnlockRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/unlock";
    return NextResponse.redirect(url);
  }
  if (unlocked && isUnlockRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Gate everything except Next internals and public image assets (anchored extension
  // match, per the Next.js docs pattern), so logo/background load on the unlock screen too.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
