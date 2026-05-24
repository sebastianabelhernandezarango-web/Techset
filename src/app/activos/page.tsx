"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Plus, Search, Monitor, Smartphone, Network, Printer, Box,
  LayoutGrid, List, X, ChevronDown, SlidersHorizontal,
  User, Building2, Calendar, Hash, Tag, FileText,
  Wrench, CheckCircle, Clock, Shield, AlertTriangle,
  PowerOff, Loader2, CalendarPlus,
} from "lucide-react";
import { Sidebar } from "../components/layout/SideBar";

const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  OPERATIVO:         { dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Operativo" },
  EN_MANTENIMIENTO:  { dot: "bg-amber-400",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",     label: "En mantenimiento" },
  FUERA_DE_SERVICIO: { dot: "bg-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/20",           label: "Fuera de servicio" },
  DADO_DE_BAJA:      { dot: "bg-slate-400",   badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",     label: "Dado de baja" },
};

const MAINT_STYLES: Record<string, string> = {
  PREVENTIVO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CORRECTIVO: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CATEGORY_ICONS: Record<string, any> = {
  monitor: Monitor, smartphone: Smartphone, network: Network, printer: Printer, box: Box,
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", TECNICO: "Técnico", CONSULTOR: "Consultor",
};

interface Asset {
  id: string; name: string; serial: string; brand: string; model: string;
  status: string; category_name: string; category_icon: string;
  purchaseDate: string; warrantyDate?: string; notes?: string;
  assigned_to?: string; department?: string;
}

interface AssetDetail extends Asset {
  assignment?: {
    area: string; startDate: string; endDate?: string; notes?: string;
    user_name: string; user_email: string; user_role: string;
  };
  maintenance: {
    id: string; type: string; description: string; cost: number;
    date: string; nextDate?: string; tech_name?: string; status?: string;
  }[];
}

function Dropdown({ value, onChange, options, placeholder, icon: Icon }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string; icon: any;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(74,144,217,0.4)" : "rgba(255,255,255,0.07)"}`,
          minWidth: 170,
        }}>
        <Icon className="text-[#2D4A63] flex-shrink-0" style={{ width: 13, height: 13 }} />
        <span className="flex-1 text-left text-xs" style={{ color: selected ? "white" : "#2D4A63" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`text-[#2D4A63] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
          style={{ width: 13, height: 13 }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-full rounded-xl overflow-hidden z-50 py-1"
          style={{ background: "#0D1E30", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-all"
              style={{
                color: opt.value === value ? "#4A90D9" : "#8DA3B8",
                background: opt.value === value ? "rgba(74,144,217,0.1)" : "transparent",
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = "transparent"; }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ActivosPage() {
  const [assets, setAssets]       = useState<Asset[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [view, setView]           = useState<"grid" | "table">("grid");
  const [selected, setSelected]   = useState<AssetDetail | null>(null);
  const [detailLoading, setDL]    = useState(false);

  async function fetchAssets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/assets?${params}`);
    const data = await res.json();
    setAssets(data);
    setLoading(false);
  }

  async function fetchDetail(id: string) {
    setDL(true);
    const res  = await fetch(`/api/assets?id=${id}`);
    const data = await res.json();
    setSelected(data);
    setDL(false);
  }

  useEffect(() => { fetchAssets(); }, [search, statusFilter]);

  const counts = {
    total:     assets.length,
    operativo: assets.filter(a => a.status === "OPERATIVO").length,
    mant:      assets.filter(a => a.status === "EN_MANTENIMIENTO").length,
    fuera:     assets.filter(a => a.status === "FUERA_DE_SERVICIO").length,
  };

  const statusOptions = [
    { value: "",                  label: "Todos los estados" },
    { value: "OPERATIVO",         label: "Operativo" },
    { value: "EN_MANTENIMIENTO",  label: "En mantenimiento" },
    { value: "FUERA_DE_SERVICIO", label: "Fuera de servicio" },
    { value: "DADO_DE_BAJA",      label: "Dado de baja" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 flex-1 min-h-screen bg-[#080E18]"
        style={{ backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(74,144,217,0.04) 0%, transparent 60%)" }}>
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Inventario de Activos</h1>
              <p className="text-[#3D6A80] text-sm mt-1">{counts.total} activos registrados en el sistema</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}>
              <Plus style={{ width: 15, height: 15 }} />
              Nuevo activo
            </button>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            {[
              { label: "Operativos",        value: counts.operativo, color: "#10b981" },
              { label: "En mantenimiento",  value: counts.mant,      color: "#f59e0b" },
              { label: "Fuera de servicio", value: counts.fuera,     color: "#ef4444" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs font-medium" style={{ color: s.color }}>{s.value} {s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-6 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2D4A63]" style={{ width: 14, height: 14 }} />
              <input type="text" placeholder="Buscar por nombre, serial o marca..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-white rounded-xl pl-9 pr-9 py-2.5 text-xs outline-none transition-all placeholder:text-[#2D4A63]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                onFocus={e => (e.target.style.borderColor = "rgba(74,144,217,0.4)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")} />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D4A63] hover:text-white">
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            <Dropdown value={statusFilter} onChange={setStatus}
              options={statusOptions} placeholder="Todos los estados" icon={SlidersHorizontal} />
            <div className="flex rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
              <button onClick={() => setView("grid")} className="px-3 py-2.5 transition-all"
                style={{ background: view === "grid" ? "rgba(74,144,217,0.15)" : "transparent", color: view === "grid" ? "#4A90D9" : "#2D4A63" }}>
                <LayoutGrid style={{ width: 15, height: 15 }} />
              </button>
              <button onClick={() => setView("table")} className="px-3 py-2.5 transition-all"
                style={{ background: view === "table" ? "rgba(74,144,217,0.15)" : "transparent", color: view === "table" ? "#4A90D9" : "#2D4A63" }}>
                <List style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#4A90D9]/30 border-t-[#4A90D9] animate-spin" />
              <p className="text-[#3D6A80] text-sm">Cargando activos...</p>
            </div>
          ) : view === "grid" ? (
            <GridView assets={assets} onSelect={fetchDetail} />
          ) : (
            <TableView assets={assets} onSelect={fetchDetail} />
          )}
        </div>
      </div>

      {(selected || detailLoading) && (
        <DetailPanel
          asset={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            fetchAssets();
            if (selected) fetchDetail(selected.id);
          }}
        />
      )}

      {showForm && (
        <AssetForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchAssets(); }} />
      )}
    </div>
  );
}

function GridView({ assets, onSelect }: { assets: Asset[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {assets.map(asset => {
        const Icon = CATEGORY_ICONS[asset.category_icon] || Box;
        const s    = STATUS_STYLES[asset.status] || STATUS_STYLES.OPERATIVO;
        return (
          <div key={asset.id} onClick={() => onSelect(asset.id)}
            className="rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(74,144,217,0.25)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(74,144,217,0.1)", border: "1px solid rgba(74,144,217,0.15)" }}>
                <Icon className="text-[#4A90D9]" style={{ width: 16, height: 16 }} />
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold ${s.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </div>
            </div>
            <h3 className="font-semibold text-white text-sm mb-1 truncate">{asset.name}</h3>
            <p className="text-[#3D6A80] text-xs mb-1">{asset.brand} · {asset.model}</p>
            <p className="font-mono text-[10px] text-[#2D4A63]">S/N: {asset.serial}</p>
            {asset.assigned_to && (
              <p className="text-[10px] text-[#3D6A80] mt-1 truncate">
                <span className="text-[#2D4A63]">→ </span>{asset.assigned_to}
              </p>
            )}
            <div className="mt-4 pt-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[#3D6A80] text-[10px] font-medium uppercase tracking-wider">{asset.category_name}</span>
              {asset.department && <span className="text-[#2D4A63] text-[10px]">{asset.department}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ assets, onSelect }: { assets: Asset[]; onSelect: (id: string) => void }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#2D4A63]"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span>Activo</span><span>Categoría</span><span>Marca / Modelo</span>
        <span>Responsable</span><span>Departamento</span><span>Estado</span>
      </div>
      {assets.map((asset, i) => {
        const Icon = CATEGORY_ICONS[asset.category_icon] || Box;
        const s    = STATUS_STYLES[asset.status] || STATUS_STYLES.OPERATIVO;
        return (
          <div key={asset.id} onClick={() => onSelect(asset.id)}
            className="grid items-center px-5 py-3.5 cursor-pointer transition-all duration-150"
            style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", borderBottom: i < assets.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,144,217,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(74,144,217,0.08)" }}>
                <Icon className="text-[#4A90D9]" style={{ width: 13, height: 13 }} />
              </div>
              <div>
                <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                <p className="font-mono text-[10px] text-[#2D4A63]">{asset.serial}</p>
              </div>
            </div>
            <span className="text-[#3D6A80] text-xs">{asset.category_name}</span>
            <span className="text-[#3D6A80] text-xs truncate">{asset.brand} {asset.model}</span>
            <span className="text-[#3D6A80] text-xs truncate">{asset.assigned_to || <span className="text-[#2D4A63]">—</span>}</span>
            <span className="text-[#3D6A80] text-xs truncate">{asset.department || <span className="text-[#2D4A63]">—</span>}</span>
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold ${s.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Panel de Detalle ──────────────────────────────────────────────────────────
function DetailPanel({ asset, loading, onClose, onRefresh }: {
  asset: AssetDetail | null; loading: boolean;
  onClose: () => void; onRefresh: () => void;
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const canEdit = role === "ADMIN" || role === "TECNICO";

  const [showMaintForm, setShowMaintForm] = useState(false);
  const [confirmBaja, setConfirmBaja]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const Icon = asset ? (CATEGORY_ICONS[asset.category_icon] || Box) : Box;
  const s    = asset ? (STATUS_STYLES[asset.status] || STATUS_STYLES.OPERATIVO) : STATUS_STYLES.OPERATIVO;

  async function changeStatus(newStatus: string) {
    if (!asset) return;
    setUpdatingStatus(true);
    await fetch(`/api/assets?id=${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdatingStatus(false);
    setConfirmBaja(false);
    onRefresh();
  }

  const isDadoDeBaja = asset?.status === "DADO_DE_BAJA";

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-[460px] z-50 flex flex-col overflow-hidden"
        style={{ background: "#0B1524", borderLeft: "1px solid rgba(255,255,255,0.08)", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)" }}>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#4A90D9]/30 border-t-[#4A90D9] animate-spin" />
          </div>
        ) : asset ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 flex items-start justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(74,144,217,0.1)", border: "1px solid rgba(74,144,217,0.2)" }}>
                  <Icon className="text-[#4A90D9]" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-tight">{asset.name}</h2>
                  <p className="text-[#3D6A80] text-xs mt-0.5">{asset.category_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold ${s.badge}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#3D6A80] hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Acciones ── */}
              {canEdit && !isDadoDeBaja && (
                <section>
                  <p className="text-[10px] text-[#2D4A63] font-bold uppercase tracking-widest mb-3">Acciones</p>
                  <div className="space-y-2">

                    {/* Programar mantenimiento */}
                    <button
                      onClick={() => setShowMaintForm(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                      style={{ background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.2)" }}>
                      <CalendarPlus className="text-[#4A90D9] flex-shrink-0" style={{ width: 15, height: 15 }} />
                      <div>
                        <p className="text-[#4A90D9] text-xs font-semibold">Programar mantenimiento</p>
                        <p className="text-[#3D6A80] text-[10px]">Registrar un mantenimiento preventivo o correctivo</p>
                      </div>
                    </button>

                    {/* Cambio de estado rápido */}
                    {asset.status !== "FUERA_DE_SERVICIO" && asset.status !== "OPERATIVO" && (
                      <button
                        onClick={() => changeStatus("OPERATIVO")}
                        disabled={updatingStatus}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                        style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        {updatingStatus ? <Loader2 className="text-emerald-400 animate-spin flex-shrink-0" style={{ width: 15, height: 15 }} />
                          : <CheckCircle className="text-emerald-400 flex-shrink-0" style={{ width: 15, height: 15 }} />}
                        <div>
                          <p className="text-emerald-400 text-xs font-semibold">Marcar como operativo</p>
                          <p className="text-[#3D6A80] text-[10px]">El activo está funcionando correctamente</p>
                        </div>
                      </button>
                    )}

                    {asset.status !== "FUERA_DE_SERVICIO" && (
                      <button
                        onClick={() => changeStatus("FUERA_DE_SERVICIO")}
                        disabled={updatingStatus}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        {updatingStatus ? <Loader2 className="text-red-400 animate-spin flex-shrink-0" style={{ width: 15, height: 15 }} />
                          : <PowerOff className="text-red-400 flex-shrink-0" style={{ width: 15, height: 15 }} />}
                        <div>
                          <p className="text-red-400 text-xs font-semibold">Marcar fuera de servicio</p>
                          <p className="text-[#3D6A80] text-[10px]">El activo no está disponible temporalmente</p>
                        </div>
                      </button>
                    )}

                    {/* Dar de baja */}
                    {!confirmBaja ? (
                      <button
                        onClick={() => setConfirmBaja(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90"
                        style={{ background: "rgba(100,116,139,0.06)", border: "1px solid rgba(100,116,139,0.15)" }}>
                        <AlertTriangle className="text-slate-400 flex-shrink-0" style={{ width: 15, height: 15 }} />
                        <div>
                          <p className="text-slate-400 text-xs font-semibold">Dar de baja</p>
                          <p className="text-[#3D6A80] text-[10px]">Retirar el activo del inventario activo (irreversible)</p>
                        </div>
                      </button>
                    ) : (
                      <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <p className="text-red-400 text-xs font-semibold mb-1">¿Confirmar baja?</p>
                        <p className="text-[#3D6A80] text-[10px] mb-3">Esta acción es irreversible. El activo quedará como "Dado de baja".</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmBaja(false)}
                            className="flex-1 py-1.5 rounded-lg text-xs text-[#3D6A80] hover:text-white transition-colors"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            Cancelar
                          </button>
                          <button onClick={() => changeStatus("DADO_DE_BAJA")} disabled={updatingStatus}
                            className="flex-1 py-1.5 rounded-lg text-xs text-white font-semibold transition-all hover:opacity-90"
                            style={{ background: "rgba(239,68,68,0.7)" }}>
                            {updatingStatus ? "..." : "Sí, dar de baja"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {isDadoDeBaja && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)" }}>
                  <AlertTriangle className="text-slate-400 flex-shrink-0" style={{ width: 14, height: 14 }} />
                  <p className="text-slate-400 text-xs">Este activo ha sido dado de baja y no puede ser modificado.</p>
                </div>
              )}

              {/* Info técnica */}
              <section>
                <p className="text-[10px] text-[#2D4A63] font-bold uppercase tracking-widest mb-3">Información técnica</p>
                <div className="space-y-2.5">
                  {[
                    { icon: Tag,      label: "Marca / Modelo", value: `${asset.brand} · ${asset.model}` },
                    { icon: Hash,     label: "Serial",         value: asset.serial, mono: true },
                    { icon: Calendar, label: "Fecha de compra", value: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                    { icon: Shield,   label: "Garantía hasta",  value: asset.warrantyDate ? new Date(asset.warrantyDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "Sin garantía registrada" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-3 py-2.5 px-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <f.icon className="text-[#3D6A80] flex-shrink-0 mt-0.5" style={{ width: 13, height: 13 }} />
                      <div>
                        <p className="text-[#2D4A63] text-[10px] mb-0.5">{f.label}</p>
                        <p className={`text-white text-xs ${f.mono ? "font-mono" : "font-medium"}`}>{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Asignación */}
              <section>
                <p className="text-[10px] text-[#2D4A63] font-bold uppercase tracking-widest mb-3">Asignación actual</p>
                {asset.assignment ? (
                  <div className="rounded-xl p-4 space-y-3"
                    style={{ background: "rgba(74,144,217,0.06)", border: "1px solid rgba(74,144,217,0.15)" }}>
                    {[
                      { icon: User,      label: "Responsable",  value: asset.assignment.user_name },
                      { icon: Building2, label: "Departamento", value: asset.assignment.area || "—" },
                      { icon: Tag,       label: "Rol",          value: ROLE_LABELS[asset.assignment.user_role] || asset.assignment.user_role },
                      { icon: Calendar,  label: "Desde",        value: new Date(asset.assignment.startDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) },
                    ].map(f => (
                      <div key={f.label} className="flex items-center gap-3">
                        <f.icon className="text-[#4A90D9] flex-shrink-0" style={{ width: 13, height: 13 }} />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[#3D6A80] text-xs w-24 flex-shrink-0">{f.label}</span>
                          <span className="text-white text-xs font-medium">{f.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-4 px-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <User className="text-[#2D4A63]" style={{ width: 16, height: 16 }} />
                    <p className="text-[#2D4A63] text-xs">Sin asignación activa</p>
                  </div>
                )}
              </section>

              {/* Notas */}
              {asset.notes && (
                <section>
                  <p className="text-[10px] text-[#2D4A63] font-bold uppercase tracking-widest mb-3">Notas</p>
                  <div className="flex items-start gap-3 py-3 px-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <FileText className="text-[#3D6A80] flex-shrink-0 mt-0.5" style={{ width: 13, height: 13 }} />
                    <p className="text-[#8DA3B8] text-xs leading-relaxed">{asset.notes}</p>
                  </div>
                </section>
              )}

              {/* Historial de mantenimientos */}
              <section>
                <p className="text-[10px] text-[#2D4A63] font-bold uppercase tracking-widest mb-3">
                  Historial de mantenimientos
                  {asset.maintenance.length > 0 && (
                    <span className="ml-2 text-[#4A90D9]">({asset.maintenance.length})</span>
                  )}
                </p>
                {asset.maintenance.length === 0 ? (
                  <div className="flex items-center gap-3 py-4 px-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <CheckCircle className="text-[#2D4A63]" style={{ width: 16, height: 16 }} />
                    <p className="text-[#2D4A63] text-xs">Sin mantenimientos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {asset.maintenance.map(m => {
                      const ms = MAINT_STYLES[m.type] || MAINT_STYLES.CORRECTIVO;
                      return (
                        <div key={m.id} className="rounded-xl p-3.5"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${ms}`}>
                              <Wrench style={{ width: 9, height: 9 }} />
                              {m.type === "PREVENTIVO" ? "Preventivo" : "Correctivo"}
                            </div>
                            <span className="text-[#2D4A63] text-[10px]">
                              {new Date(m.date).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-white text-xs mb-2 leading-relaxed">{m.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <User className="text-[#2D4A63]" style={{ width: 10, height: 10 }} />
                              <span className="text-[#3D6A80] text-[10px]">{m.tech_name || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.cost > 0 && (
                                <span className="text-emerald-400 text-[10px] font-medium">
                                  ${m.cost.toLocaleString("es-CO")}
                                </span>
                              )}
                              {m.nextDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="text-amber-400/70" style={{ width: 10, height: 10 }} />
                                  <span className="text-amber-400/70 text-[10px]">
                                    Próx: {new Date(m.nextDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>

      {/* Form de mantenimiento desde el panel */}
      {showMaintForm && asset && (
        <MaintenanceForm
          assetId={asset.id}
          assetName={asset.name}
          onClose={() => setShowMaintForm(false)}
          onSaved={() => { setShowMaintForm(false); onRefresh(); }}
        />
      )}
    </>
  );
}

// ── Formulario de mantenimiento ───────────────────────────────────────────────
function MaintenanceForm({ assetId, assetName, onClose, onSaved }: {
  assetId: string; assetName: string;
  onClose: () => void; onSaved: () => void;
}) {
  const { data: session } = useSession();
  const role    = (session?.user as any)?.role as string;
  const userId  = (session?.user as any)?.id as string;
  const isAdmin = role === "ADMIN";

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [form, setForm] = useState({
    techId:      isAdmin ? "" : userId,
    type:        "PREVENTIVO",
    status:      "PENDIENTE",
    description: "",
    cost:        "",
    date:        new Date().toISOString().split("T")[0],
    nextDate:    "",
  });

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users")
        .then(r => r.json())
        .then(users => setTechnicians(
          Array.isArray(users) ? users.filter((u: any) => u.role === "TECNICO") : []
        ));
    }
  }, [isAdmin]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assetId }),
    });
    setLoading(false);
    if (res.ok) {
      onSaved();
    } else {
      const err = await res.json();
      setError(err.error || "Error al guardar");
    }
  }

  const inputClass = "w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] transition-colors";

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0B1524", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.7)" }}>

        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-white font-bold text-base">Programar mantenimiento</h2>
            <p className="text-[#3D6A80] text-xs mt-0.5">Activo: <span className="text-[#4A90D9]">{assetName}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3D6A80] hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Técnico */}
          <div>
            <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Técnico asignado *</label>
            {isAdmin ? (
              <select name="techId" value={form.techId} onChange={handleChange} required className={inputClass}>
                <option value="">Selecciona un técnico</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <User className="text-[#3D6A80]" style={{ width: 13, height: 13 }} />
                <span className="text-white text-sm">{(session?.user as any)?.name}</span>
                <span className="text-[#3D6A80] text-xs ml-auto">Tú</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Tipo *</label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                <option value="PREVENTIVO">Preventivo</option>
                <option value="CORRECTIVO">Correctivo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Estado inicial</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Descripción *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
              placeholder="Describe el mantenimiento a realizar..."
              className={`${inputClass} resize-none placeholder:text-[#2D4A63]`} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Fecha</label>
              <input name="date" type="date" value={form.date} onChange={handleChange}
                className={inputClass} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Próximo</label>
              <input name="nextDate" type="date" value={form.nextDate} onChange={handleChange}
                className={inputClass} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Costo ($)</label>
              <input name="cost" type="number" value={form.cost} onChange={handleChange}
                placeholder="0" className={`${inputClass} placeholder:text-[#2D4A63]`} />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#3D6A80] hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}>
              {loading ? <Loader2 className="animate-spin mx-auto" style={{ width: 16, height: 16 }} /> : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Formulario nuevo activo ───────────────────────────────────────────────────
function AssetForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [form, setForm] = useState({
    name: "", serial: "", brand: "", model: "",
    purchaseDate: "", warrantyDate: "", categoryId: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(setCategories);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) onSaved();
    else { const err = await res.json(); alert(err.error || "Error al guardar"); }
  }

  const inputClass = "w-full text-white rounded-xl px-3 py-2.5 text-xs outline-none transition-all placeholder:text-[#2D4A63]";
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" };
  const focusIn  = (e: any) => (e.target.style.borderColor = "rgba(74,144,217,0.5)");
  const focusOut = (e: any) => (e.target.style.borderColor = "rgba(255,255,255,0.08)");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0B1524", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-white font-bold text-base">Registrar nuevo activo</h2>
            <p className="text-[#3D6A80] text-xs mt-0.5">Completa la información del equipo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3D6A80] hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Nombre", name: "name",   required: true },
              { label: "Serial", name: "serial", required: true },
              { label: "Marca",  name: "brand",  required: true },
              { label: "Modelo", name: "model",  required: true },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">{f.label} *</label>
                <input name={f.name} value={(form as any)[f.name]} onChange={handleChange} required={f.required}
                  className={inputClass} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
              </div>
            ))}
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Fecha de compra *</label>
              <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} required
                className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div>
              <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Garantía hasta</label>
              <input name="warrantyDate" type="date" value={form.warrantyDate} onChange={handleChange}
                className={inputClass} style={{ ...inputStyle, colorScheme: "dark" }} onFocus={focusIn} onBlur={focusOut} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Categoría *</label>
            <div className="relative">
              <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                className={`${inputClass} appearance-none pr-8 cursor-pointer`} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="">Selecciona una categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3D6A80] pointer-events-none" style={{ width: 13, height: 13 }} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#3D6A80] mb-1.5 uppercase tracking-wider font-semibold">Notas</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className={`${inputClass} resize-none`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#3D6A80] hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}>
              {loading ? "Guardando..." : "Guardar activo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}