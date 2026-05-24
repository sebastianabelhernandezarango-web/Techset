import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const users = await query(`
    SELECT id, name, email, role, active FROM "User" WHERE active = true ORDER BY name
  `);
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const { name, email, password, userRole } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const exists = await query(`SELECT id FROM "User" WHERE email = $1`, [email]);
  if (exists.length > 0) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id  = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO "User" (id, name, email, "passwordHash", role, active, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, true, $6, $6)
  `, [id, name, email, passwordHash, userRole || "CONSULTOR", now]);

  return NextResponse.json({ id, name, email, role: userRole }, { status: 201 });
}