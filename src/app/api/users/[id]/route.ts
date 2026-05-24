import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

  const { id } = params;
  const body = await req.json();
  const { name, userRole, active } = body;

  const now = new Date().toISOString();

  // Build update dynamically based on what was sent
  const updates: string[] = [];
  const values: unknown[]     = [];
  let i = 1;

  if (name !== undefined)     { updates.push(`name = $${i++}`);             values.push(name); }
  if (userRole !== undefined) { updates.push(`role = $${i++}`);             values.push(userRole); }
  if (active !== undefined)   { updates.push(`active = $${i++}`);           values.push(active); }
  updates.push(`"updatedAt" = $${i++}`);
  values.push(now);

  if (updates.length === 1) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  values.push(id);
  await query(
    `UPDATE "User" SET ${updates.join(", ")} WHERE id = $${i}`,
    values
  );

  const updated = await query(
    `SELECT id, name, email, role, active FROM "User" WHERE id = $1`,
    [id]
  );

  return NextResponse.json(updated[0]);
}