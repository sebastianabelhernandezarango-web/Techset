import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Listar mantenimientos
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("assetId");

  let sql = `
    SELECT 
      m.*,
      a.name as asset_name,
      a.serial as asset_serial,
      u.name as tech_name
    FROM "MaintenanceRecord" m
    JOIN "Asset" a ON m."assetId" = a.id
    JOIN "User" u ON m."techId" = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (assetId) {
    sql += ` AND m."assetId" = $1`;
    params.push(assetId);
  }

  sql += ` ORDER BY m.date DESC`;

  const records = await query(sql, params);
  return NextResponse.json(records);
}

// POST - Crear mantenimiento
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  if (role === "CONSULTOR") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { assetId, techId, type, description, cost, date, nextDate } = body;

  if (!assetId || !techId || !type || !description) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const id  = crypto.randomUUID();
  const now = new Date().toISOString();

  const status = body.status || "PENDIENTE";

  await query(`
    INSERT INTO "MaintenanceRecord" (id, "assetId", "techId", type, status, description, cost, date, "nextDate", "createdAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    id, assetId, techId, type, status, description,
    cost ? parseFloat(cost) : null,
    date || now,
    nextDate || null,
    now,
  ]);

  // Actualizar estado del activo a EN_MANTENIMIENTO
  await query(`
    UPDATE "Asset" SET status = 'EN_MANTENIMIENTO', "updatedAt" = $1 WHERE id = $2
  `, [now, assetId]);

  const record = await query(`
    SELECT m.*, a.name as asset_name, a.serial as asset_serial, u.name as tech_name
    FROM "MaintenanceRecord" m
    JOIN "Asset" a ON m."assetId" = a.id
    JOIN "User" u ON m."techId" = u.id
    WHERE m.id = $1
  `, [id]);

  return NextResponse.json(record[0], { status: 201 });
}