import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { query } from "@/lib/db";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/2fa") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  // twoFactorEnabled lo leemos de DB (fuente de verdad permanente)
  const rows = await query(
    `SELECT "twoFactorEnabled" FROM "User" WHERE id = $1`,
    [token.id as string]
  );

  const user = rows[0];
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  if (!user.twoFactorEnabled) {
    return NextResponse.redirect(new URL("/2fa/setup", req.url));
  }

  // twoFactorVerified lo leemos del TOKEN (refleja solo esta sesión activa)
  const twoFactorVerified = token.twoFactorVerified as boolean ?? false;

  if (!twoFactorVerified) {
    return NextResponse.redirect(new URL("/2fa/verify", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};