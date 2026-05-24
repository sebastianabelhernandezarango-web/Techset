import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // El frontend envía el período como timestamps ISO.
  // Si no se envía nada, usamos los últimos 12 meses por defecto.
  const hasta  = searchParams.get("hasta")  ? new Date(searchParams.get("hasta")!)  : new Date();
  const desde  = searchParams.get("desde")  ? new Date(searchParams.get("desde")!)  : new Date(new Date().setFullYear(new Date().getFullYear() - 1));

  const desdeISO = desde.toISOString();
  const hastaISO = hasta.toISOString();

  // Primer día del mes dentro del período para KPIs mensuales
  const firstDayYear = new Date(desde.getFullYear(), desde.getMonth(), 1).toISOString();

  const [
    totalRes, byStatusRes, byCategoryRes,
    alertsRes, maintMonthRes, maintTypeRes,
    activosPorMesRes, maintCostRes, topAssetsRes,
    maintPorMesRes,
  ] = await Promise.all([

    // Total activos registrados hasta el fin del período
    query(`
      SELECT COUNT(*) as total FROM "Asset"
      WHERE status != 'DADO_DE_BAJA'
        AND "createdAt" <= $1
    `, [hastaISO]),

    // Por estado — activos existentes hasta el fin del período
    query(`
      SELECT status, COUNT(*) as count FROM "Asset"
      WHERE "createdAt" <= $1
      GROUP BY status
    `, [hastaISO]),

    // Por categoría — activos en el período
    query(`
      SELECT c.name, c.icon, COUNT(a.id) as count
      FROM "Category" c
      LEFT JOIN "Asset" a ON a."categoryId" = c.id
        AND a."createdAt" <= $1
      GROUP BY c.name, c.icon
      ORDER BY count DESC
    `, [hastaISO]),

    // Alertas próximos 7 días desde HOY (siempre relevante)
    query(`
      SELECT m.*, a.name as asset_name, a.serial as asset_serial
      FROM "MaintenanceRecord" m
      JOIN "Asset" a ON m."assetId" = a.id
      WHERE m."nextDate" IS NOT NULL
        AND m."nextDate" BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY m."nextDate" ASC LIMIT 5
    `),

    // Mantenimientos dentro del período
    query(`
      SELECT COUNT(*) as total FROM "MaintenanceRecord"
      WHERE "createdAt" BETWEEN $1 AND $2
    `, [desdeISO, hastaISO]),

    // Mantenimientos por tipo dentro del período
    query(`
      SELECT type, COUNT(*) as count FROM "MaintenanceRecord"
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY type
    `, [desdeISO, hastaISO]),

    // Activos registrados por mes dentro del período
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YY') as mes,
        DATE_TRUNC('month', "createdAt") as fecha,
        COUNT(*) as count
      FROM "Asset"
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY fecha ASC
    `, [desdeISO, hastaISO]),

    // Costos de mantenimiento dentro del período
    query(`
      SELECT
        COALESCE(SUM(cost), 0) as total_period,
        COALESCE(SUM(CASE WHEN "createdAt" >= $3 THEN cost ELSE 0 END), 0) as total_month
      FROM "MaintenanceRecord"
      WHERE "createdAt" BETWEEN $1 AND $2
    `, [desdeISO, hastaISO, firstDayYear]),

    // Top activos con más mantenimientos en el período
    query(`
      SELECT a.name, a.serial, COUNT(m.id) as total_mant
      FROM "Asset" a
      LEFT JOIN "MaintenanceRecord" m ON m."assetId" = a.id
        AND m."createdAt" BETWEEN $1 AND $2
      WHERE a."createdAt" <= $2
      GROUP BY a.id, a.name, a.serial
      ORDER BY total_mant DESC LIMIT 5
    `, [desdeISO, hastaISO]),

    // Mantenimientos por mes dentro del período (para gráfica de línea)
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YY') as mes,
        DATE_TRUNC('month', "createdAt") as fecha,
        COUNT(*) as count,
        COALESCE(SUM(cost), 0) as costo
      FROM "MaintenanceRecord"
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY fecha ASC
    `, [desdeISO, hastaISO]),
  ]);

  const byStatus = Object.fromEntries(
    byStatusRes.map((r: { status: string; count: string }) => [r.status, parseInt(r.count)])
  );

  return NextResponse.json({
    total:          parseInt(totalRes[0].total),
    byStatus,
    byCategory:     byCategoryRes,
    alerts:         alertsRes,
    maintThisMonth: parseInt(maintMonthRes[0].total),
    maintByType:    maintTypeRes,
    activosPorMes:  activosPorMesRes,
    maintPorMes:    maintPorMesRes,
    costos:         maintCostRes[0],
    topAssets:      topAssetsRes,
    periodo: { desde: desdeISO, hasta: hastaISO },
  });
}