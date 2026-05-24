"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Monitor, Wrench, AlertCircle, CheckCircle,
  TrendingUp, DollarSign, Activity, Clock,
  ChevronLeft, ChevronRight, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import { Sidebar } from "../components/layout/SideBar";

const PIE_COLORS = ["#4A90D9", "#10B981", "#F59E0B", "#EF4444"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0F2A45] border border-[#1E3A5F] rounded-lg px-3 py-2 text-xs">
      <p className="text-[#8DA3B8] mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === "Costo" ? `$${Math.round(p.value).toLocaleString("es-CO")}` : p.value}
        </p>
      ))}
    </div>
  );
};

// Genera períodos fiscales anuales: 1 ene → 31 dic de cada año
function generarPeriodos() {
  const anioActual = new Date().getFullYear();
  const periodos   = [];
  // Generamos desde el año actual hasta 4 años atrás
  for (let i = 0; i < 5; i++) {
    const anio = anioActual - i;
    const desde = new Date(anio, 0, 1);           // 1 enero
    const hasta = new Date(anio, 11, 31, 23, 59, 59); // 31 diciembre
    periodos.push({
      label: `Año ${anio}`,
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
    });
  }
  return periodos;
}

export default function DashboardPage() {
  const periodos  = generarPeriodos();
  const [periodoIdx, setPeriodoIdx] = useState(0); // 0 = más reciente
  const [data, setData]     = useState<{
    total?: number;
    byStatus?: Record<string, number>;
    byCategory?: { name: string; icon: string; count: number }[];
    maintByType?: { type: string; count: number }[];
    topAssets?: { name: string; serial: string; total_mant: number }[];
    alerts?: { id: string; asset_name: string; asset_serial: string; nextDate: string }[];
    activosPorMes?: { mes: string; count: string }[];
    maintPorMes?: { mes: string; count: string; costo: string }[];
    costos?: { total_period: string; total_month: string };
    maintThisMonth?: number;
    periodo?: { desde: string; hasta: string };
  }>({});
  const [loading, setLoading] = useState(true);

  const periodo = periodos[periodoIdx];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      desde: periodo.desde,
      hasta: periodo.hasta,
    });
    const res  = await fetch(`/api/dashboard?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [periodo.desde, periodo.hasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canPrev = periodoIdx < periodos.length - 1;
  const canNext = periodoIdx > 0;

  if (loading && !data) return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 flex-1 p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 text-[#4A90D9] animate-pulse mx-auto mb-3" />
          <p className="text-[#8DA3B8] text-sm">Cargando dashboard...</p>
        </div>
      </div>
    </div>
  );

  const operativos    = data?.byStatus?.["OPERATIVO"]         || 0;
  const enMant        = data?.byStatus?.["EN_MANTENIMIENTO"]  || 0;
  const fueraServicio = data?.byStatus?.["FUERA_DE_SERVICIO"] || 0;
  const dadoBaja      = data?.byStatus?.["DADO_DE_BAJA"]      || 0;
  const totalConBaja  = operativos + enMant + fueraServicio + dadoBaja;

  const preventivos = parseInt(data?.maintByType?.find((t: { type: string; count: string }) => t.type === "PREVENTIVO")?.count || "0");
  const correctivos = parseInt(data?.maintByType?.find((t: { type: string; count: string }) => t.type === "CORRECTIVO")?.count ?? "0");

  const pieData = [
    { name: "Operativo",         value: operativos    },
    { name: "En mantenimiento",  value: enMant        },
    { name: "Fuera de servicio", value: fueraServicio },
    { name: "Dado de baja",      value: dadoBaja      },
  ].filter(d => d.value > 0);

  const barData = data?.activosPorMes?.map((m: { mes: string; count: string }) => ({
    mes: m.mes, Activos: parseInt(m.count),
  })) || [];

  const lineData = data?.maintPorMes?.map((m: { mes: string; count: string; costo: string }) => ({
    mes: m.mes,
    Mantenimientos: parseInt(m.count),
    Costo: parseInt(m.costo),
  })) || [];

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 flex-1 min-h-screen bg-[#080E18]"
        style={{ backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(74,144,217,0.04) 0%, transparent 60%)" }}>
        <div className={`p-8 transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
              <p className="text-[#3D6A80] text-sm mt-0.5">
                Análisis general · {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Selector de período */}
              <div className="flex items-center gap-2 rounded-xl px-1 py-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => canPrev && setPeriodoIdx(i => i + 1)}
                  disabled={!canPrev}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ color: canPrev ? "#4A90D9" : "#2D4A63" }}
                  onMouseEnter={e => canPrev && (e.currentTarget.style.background = "rgba(74,144,217,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <ChevronLeft style={{ width: 15, height: 15 }} />
                </button>

                <div className="flex items-center gap-2 px-2">
                  <Calendar className="text-[#4A90D9]" style={{ width: 13, height: 13 }} />
                  <span className="text-white text-xs font-medium whitespace-nowrap">{periodo.label}</span>
                </div>

                <button
                  onClick={() => canNext && setPeriodoIdx(i => i - 1)}
                  disabled={!canNext}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ color: canNext ? "#4A90D9" : "#2D4A63" }}
                  onMouseEnter={e => canNext && (e.currentTarget.style.background = "rgba(74,144,217,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <ChevronRight style={{ width: 15, height: 15 }} />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-medium">Sistema operativo</span>
              </div>
            </div>
          </div>

          {/* KPIs fila 1 */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: "Total activos activos", value: data?.total || 0,         sub: `${dadoBaja} dados de baja`,                                               icon: Monitor,       color: "text-[#4A90D9]",  bg: "bg-[#4A90D9]/10",  border: "border-[#4A90D9]/20" },
              { label: "Operativos",            value: operativos,                sub: totalConBaja > 0 ? `${Math.round((operativos/totalConBaja)*100)}% del total` : "0%", icon: CheckCircle,   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "En mantenimiento",      value: enMant,                    sub: `${fueraServicio} fuera de servicio`,                                       icon: Wrench,        color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
              { label: "Mantenimientos período",value: data?.maintThisMonth || 0, sub: `${preventivos} prev · ${correctivos} corr`,                               icon: Activity,      color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
            ].map(kpi => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className={`rounded-xl p-5 border ${kpi.border}`}
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[#3D6A80] text-xs font-medium leading-tight">{kpi.label}</p>
                    <div className={`p-2 rounded-lg ${kpi.bg}`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{kpi.value}</p>
                  <p className="text-xs text-[#2D4A63]">{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* KPIs fila 2 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-5 border border-emerald-500/20" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#3D6A80] text-xs font-medium">Costo total del período</p>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                ${parseFloat(data?.costos?.total_period ?? "0").toLocaleString("es-CO")}
              </p>
              <p className="text-xs text-[#2D4A63]">en mantenimientos del período</p>
            </div>

            <div className="rounded-xl p-5 border border-amber-500/20" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#3D6A80] text-xs font-medium">Alertas próximos 7 días</p>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{data?.alerts?.length || 0}</p>
              <p className="text-xs text-[#2D4A63]">mantenimientos por vencer</p>
            </div>

            <div className="rounded-xl p-5 border border-[#4A90D9]/20" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#3D6A80] text-xs font-medium">Tasa de disponibilidad</p>
                <div className="p-2 rounded-lg bg-[#4A90D9]/10">
                  <TrendingUp className="w-4 h-4 text-[#4A90D9]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {totalConBaja > 0 ? Math.round((operativos / totalConBaja) * 100) : 0}%
              </p>
              <p className="text-xs text-[#2D4A63]">{operativos} de {totalConBaja} activos operativos</p>
            </div>
          </div>

          {/* Gráficas fila 1 */}
          <div className="grid grid-cols-3 gap-5 mb-5">

            {/* Activos registrados por mes */}
            <div className="col-span-2 rounded-xl p-5 border border-[#1E3A5F]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white text-sm font-semibold mb-0.5">Activos registrados por mes</h3>
              <p className="text-[#3D6A80] text-xs mb-5">{periodo.label}</p>
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[#2D4A63] text-xs">Sin datos en este período</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: "#3D6A80", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#3D6A80", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(74,144,217,0.05)" }} />
                    <Bar dataKey="Activos" fill="#4A90D9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart estado */}
            <div className="rounded-xl p-5 border border-[#1E3A5F]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white text-sm font-semibold mb-0.5">Estado de activos</h3>
              <p className="text-[#3D6A80] text-xs mb-3">Distribución en el período</p>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[#2D4A63] text-xs">Sin datos</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                        paddingAngle={3} dataKey="value">
                        {pieData.map((_: unknown, i: number) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {pieData.map((d: { name: string; value: number }, i: number) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                          <span className="text-[#3D6A80] text-xs">{d.name}</span>
                        </div>
                        <span className="text-white text-xs font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gráfica de mantenimientos por mes */}
          <div className="rounded-xl p-5 border border-[#1E3A5F] mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <h3 className="text-white text-sm font-semibold mb-0.5">Mantenimientos por mes</h3>
            <p className="text-[#3D6A80] text-xs mb-5">{periodo.label}</p>
            {lineData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[#2D4A63] text-xs">Sin mantenimientos en este período</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fill: "#3D6A80", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{ fill: "#3D6A80", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#3D6A80", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#3D6A80" }} />
                  <Line yAxisId="left"  type="monotone" dataKey="Mantenimientos" stroke="#4A90D9" strokeWidth={2} dot={{ fill: "#4A90D9", r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Costo"          stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Fila tablas */}
          <div className="grid grid-cols-3 gap-5">

            {/* Por categoría */}
            <div className="rounded-xl p-5 border border-[#1E3A5F]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white text-sm font-semibold mb-0.5">Por categoría</h3>
              <p className="text-[#3D6A80] text-xs mb-5">Distribución de inventario</p>
              <div className="space-y-3">
                {data?.byCategory?.map((cat: { name: string; icon: string; count: number }) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#3D6A80]">{cat.name}</span>
                      <span className="text-white font-medium">{cat.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full bg-[#4A90D9] rounded-full transition-all"
                        style={{ width: totalConBaja > 0 ? `${(cat.count / totalConBaja) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top activos */}
            <div className="rounded-xl p-5 border border-[#1E3A5F]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white text-sm font-semibold mb-0.5">Activos más intervenidos</h3>
              <p className="text-[#3D6A80] text-xs mb-5">Por número de mantenimientos</p>
              <div className="space-y-3">
                {data?.topAssets?.length === 0 ? (
                  <p className="text-[#2D4A63] text-xs text-center py-4">Sin datos aún</p>
                ) : data?.topAssets?.map((a: { name: string; serial: string; total_mant: number }, i: number) => (
                  <div key={a.serial} className="flex items-center gap-3">
                    <span className="text-[#2D4A63] text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{a.name}</p>
                      <p className="text-[#2D4A63] text-xs font-mono">{a.serial}</p>
                    </div>
                    <span className="text-[#4A90D9] text-xs font-bold">{a.total_mant}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos mantenimientos */}
            <div className="rounded-xl p-5 border border-[#1E3A5F]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-white text-sm font-semibold mb-0.5">Próximos mantenimientos</h3>
              <p className="text-[#3D6A80] text-xs mb-5">Alertas en los próximos 7 días</p>
              <div className="space-y-3">
                {data?.alerts?.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                    <p className="text-[#2D4A63] text-xs">Sin alertas pendientes</p>
                  </div>
                ) : data?.alerts?.map((a: { id: string; asset_name: string; asset_serial: string; nextDate: string }) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-xs font-medium">{a.asset_name}</p>
                      <p className="text-[#3D6A80] text-xs font-mono">{a.asset_serial}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-amber-400/70" />
                        <p className="text-amber-400/70 text-xs">
                          {new Date(a.nextDate).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}