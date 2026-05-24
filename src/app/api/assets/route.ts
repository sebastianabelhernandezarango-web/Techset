import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const search     = searchParams.get("search");
  const id         = searchParams.get("id"); // Para traer detalle de un activo específico

  // Si se pide un activo específico, devolvemos su detalle completo
  if (id) {
    const [asset, assignments, maintenance] = await Promise.all([
      query(`
        SELECT a.*, c.name as category_name, c.icon as category_icon
        FROM "Asset" a
        JOIN "Category" c ON a."categoryId" = c.id
        WHERE a.id = $1
      `, [id]),

      // Asignación activa (sin endDate o endDate en el futuro)
      query(`
        SELECT 
          asn.*,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role
        FROM "Assignment" asn
        JOIN "User" u ON asn."userId" = u.id
        WHERE asn."assetId" = $1
          AND (asn."endDate" IS NULL OR asn."endDate" > NOW())
        ORDER BY asn."startDate" DESC
        LIMIT 1
      `, [id]),

      // Últimos 5 mantenimientos
      query(`
        SELECT 
          m.*,
          u.name as tech_name
        FROM "MaintenanceRecord" m
        LEFT JOIN "User" u ON m."techId" = u.id
        WHERE m."assetId" = $1
        ORDER BY m.date DESC
        LIMIT 5
      `, [id]),
    ]);

    if (!asset[0]) return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });

    return NextResponse.json({
      ...asset[0],
      assignment: assignments[0] || null,
      maintenance,
    });
  }

  // Listado general con asignación activa incluida
  let sql = `
    SELECT 
      a.*,
      c.name  as category_name,
      c.icon  as category_icon,
      u.name  as assigned_to,
      asn.area as department
    FROM "Asset" a
    JOIN "Category" c ON a."categoryId" = c.id
    LEFT JOIN "Assignment" asn ON asn."assetId" = a.id
      AND (asn."endDate" IS NULL OR asn."endDate" > NOW())
    LEFT JOIN "User" u ON asn."userId" = u.id
    WHERE 1=1
  `;

  const params: unknown[] = [];
  let i = 1;

  if (status) { sql += ` AND a.status = $${i++}`; params.push(status); }
  if (categoryId) { sql += ` AND a."categoryId" = $${i++}`; params.push(categoryId); }
  if (search) {
    sql += ` AND (a.name ILIKE $${i} OR a.serial ILIKE $${i} OR a.brand ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }

  sql += ` ORDER BY a."createdAt" DESC`;

  const assets = await query(sql, params);
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  if (role === "CONSULTOR") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { name, serial, brand, model, purchaseDate, warrantyDate, categoryId, notes } = body;

  if (!name || !serial || !brand || !model || !purchaseDate || !categoryId) {
    return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 });
  }

  const exists = await query(`SELECT id FROM "Asset" WHERE serial = $1`, [serial]);
  if (exists.length > 0) return NextResponse.json({ error: "Serial ya registrado" }, { status: 409 });

  const id  = crypto.randomUUID();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO "Asset" (id, name, serial, brand, model, "purchaseDate", "warrantyDate", status, notes, "categoryId", "createdAt", "updatedAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,'OPERATIVO',$8,$9,$10,$10)
  `, [id, name, serial, brand, model, purchaseDate, warrantyDate || null, notes || null, categoryId, now]);

  const asset = await query(`SELECT * FROM "Asset" WHERE id = $1`, [id]);
  return NextResponse.json(asset[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const role = (session.user as { role: string }).role;
  if (role === "CONSULTOR") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const { status } = await req.json();
  const validStatuses = ["OPERATIVO", "EN_MANTENIMIENTO", "FUERA_DE_SERVICIO", "DADO_DE_BAJA"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await query(`UPDATE "Asset" SET status = $1, "updatedAt" = $2 WHERE id = $3`, [status, now, id]);
  const asset = await query(`SELECT * FROM "Asset" WHERE id = $1`, [id]);
  return NextResponse.json(asset[0]);
}