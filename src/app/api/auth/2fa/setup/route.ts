import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Primero verificamos si ya existe un secreto guardado para este usuario.
  // Si ya hay uno, lo reutilizamos en lugar de generar uno nuevo.
  // Esto evita que el StrictMode de React (que monta componentes dos veces
  // en desarrollo) genere un secreto diferente al que se mostró en el QR.
  const existing = await query(
    `SELECT "twoFactorSecret", "twoFactorEnabled" FROM "User" WHERE id = $1`,
    [userId]
  );

  const user = existing[0];

  // Si ya tiene 2FA habilitado, no tiene sentido volver a hacer el setup.
  if (user?.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA ya está activado" }, { status: 400 });
  }

  // Reutilizamos el secreto existente o generamos uno nuevo si no hay ninguno.
  const secret = user?.twoFactorSecret || authenticator.generateSecret();

  // Solo guardamos en la DB si no había secreto previo.
  if (!user?.twoFactorSecret) {
    await query(
      `UPDATE "User" SET "twoFactorSecret" = $1 WHERE id = $2`,
      [secret, userId]
    );
  }

  const otpauthUrl = authenticator.keyuri(
    session.user!.email!,
    "TechAsset Manager",
    secret
  );

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ qrCode: qrCodeDataUrl, secret });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { code } = await req.json();

  const rows = await query(
    `SELECT "twoFactorSecret" FROM "User" WHERE id = $1`,
    [userId]
  );

  const secret = rows[0]?.twoFactorSecret;
  if (!secret) return NextResponse.json({ error: "Secreto no encontrado" }, { status: 400 });

  const isValid = authenticator.verify({ token: code, secret });

  if (!isValid) {
    return NextResponse.json({ error: "Código incorrecto, intenta de nuevo" }, { status: 400 });
  }

  // Activamos el 2FA definitivamente en la DB.
  await query(
    `UPDATE "User" SET "twoFactorEnabled" = true WHERE id = $1`,
    [userId]
  );

  return NextResponse.json({ success: true });
}