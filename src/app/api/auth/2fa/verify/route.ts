import { NextRequest, NextResponse } from "next/server";
import { getToken, encode } from "next-auth/jwt";
import { query } from "@/lib/db";
import { authenticator } from "otplib";

export async function POST(req: NextRequest) {
  const currentToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (!currentToken) return NextResponse.json({ error: "Token no encontrado" }, { status: 401 });

  const userId = currentToken.id as string;
  const { code } = await req.json();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const rows = await query(
    `SELECT "twoFactorSecret", "twoFactorEnabled" FROM "User" WHERE id = $1`,
    [userId]
  );

  const user = rows[0];
  if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA no configurado" }, { status: 400 });
  }

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!isValid) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
  }

  const newTokenString = await encode({
    token: { ...currentToken, twoFactorVerified: true },
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, newTokenString, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction,
  });

  return response;
}
