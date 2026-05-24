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

  const role = (session.user as any).role;
  if (role === "CONSULTOR") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { id } = params;
  const { status } = await req.json();

  const validStatuses = ["PENDIENTE", "EN_PROCESO", "COMPLETADO"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const now = new Date().toISOString();

  await query(
    `UPDATE "MaintenanceRecord" SET status = $1 WHERE id = $2`,
    [status, id]
  );

  // When completed, restore the asset status to OPERATIVO
  if (status === "COMPLETADO") {
    const records = await query(
      `SELECT "assetId" FROM "MaintenanceRecord" WHERE id = $1`,
      [id]
    );
    if (records.length > 0) {
      await query(
        `UPDATE "Asset" SET status = 'OPERATIVO', "updatedAt" = $1 WHERE id = $2`,
        [now, records[0].assetId]
      );
    }
  }

  const updated = await query(
    `SELECT m.*, a.name as asset_name, a.serial as asset_serial, u.name as tech_name
     FROM "MaintenanceRecord" m
     JOIN "Asset" a ON m."assetId" = a.id
     JOIN "User" u ON m."techId" = u.id
     WHERE m.id = $1`,
    [id]
  );

  return NextResponse.json(updated[0]);
}