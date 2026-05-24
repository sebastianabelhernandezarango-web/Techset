"use client";
import { Sidebar } from "../components/layout/SideBar";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Wrench, CheckCircle2, Clock,
  Search, DollarSign, CalendarClock, CheckCheck,
} from "lucide-react";

const TYPE_STYLES: Record<string, string> = {
  PREVENTIVO: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  CORRECTIVO: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
};

const STATUS_STYLES: Record<string, string> = {
  PENDIENTE:  "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  EN_PROCESO: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  COMPLETADO: "bg-green-500/15 text-green-400 border border-green-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE:  "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
};

interface Maintenance {
  id: string;
  asset_name: string;
  asset_serial: string;
  tech_name: string;
  type: string;
  status: string;
  description: string;
  cost?: number;
  date: string;
  nextDate?: string;
}

export default function MantenimientosPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as { role?: string })?.role ?? "";
  const canEdit = currentRole === "ADMIN" || currentRole === "TECNICO";

  const [records, setRecords]     = useState<Maintenance[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterType, setFilterType]     = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  async function fetchRecords() {
    setLoading(true);
    const res  = await fetch("/api/maintenance");
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchRecords(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRecords();
  }

  const filtered = records.filter(r => {
    const matchSearch = r.asset_name.toLowerCase().includes(search.toLowerCase()) ||
                        r.asset_serial.toLowerCase().includes(search.toLowerCase()) ||
                        r.tech_name.toLowerCase().includes(search.toLowerCase());
    const matchType   = filterType   === "ALL" || r.type   === filterType;
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);
  const counts = {
    total:      records.length,
    pendiente:  records.filter(r => r.status === "PENDIENTE").length,
    en_proceso: records.filter(r => r.status === "EN_PROCESO").length,
    completado: records.filter(r => r.status === "COMPLETADO").length,
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 p-8 flex-1 min-h-screen bg-[#0A1628]">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Mantenimientos</h1>
            <p className="text-[#8DA3B8] text-sm mt-0.5">{counts.total} registros en total</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#162436] border border-[#243447] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-400">{counts.pendiente}</p>
              <p className="text-xs text-[#8DA3B8]">Pendientes</p>
            </div>
          </div>
          <div className="bg-[#162436] border border-[#243447] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">{counts.en_proceso}</p>
              <p className="text-xs text-[#8DA3B8]">En proceso</p>
            </div>
          </div>
          <div className="bg-[#162436] border border-[#243447] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">{counts.completado}</p>
              <p className="text-xs text-[#8DA3B8]">Completados</p>
            </div>
          </div>
          <div className="bg-[#162436] border border-[#243447] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400">
                ${totalCost.toLocaleString("es-CO")}
              </p>
              <p className="text-xs text-[#8DA3B8]">Costo total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar activo, serial o técnico..."
              className="w-full bg-[#162436] border border-[#243447] text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568]"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#162436] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]"
          >
            <option value="ALL">Todos los tipos</option>
            <option value="PREVENTIVO">Preventivo</option>
            <option value="CORRECTIVO">Correctivo</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#162436] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-[#8DA3B8] py-20">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#8DA3B8] py-20">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay mantenimientos que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="bg-[#162436] border border-[#243447] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#243447] bg-[#0F1E2E]/40">
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Activo</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Tipo</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Descripción</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Técnico</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Fecha</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Costo</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Estado</th>
                  {canEdit && (
                    <th className="text-right text-xs text-[#8DA3B8] font-medium px-5 py-3">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-[#243447] last:border-0 hover:bg-[#1A2D40] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-white text-sm font-medium">{record.asset_name}</p>
                      <p className="text-[#4A5568] text-xs font-mono">#{record.asset_serial}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${TYPE_STYLES[record.type]}`}>
                        {record.type === "PREVENTIVO" ? "Preventivo" : "Correctivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="text-[#8DA3B8] text-sm truncate" title={record.description}>
                        {record.description}
                      </p>
                      {record.nextDate && (
                        <p className="text-yellow-500/70 text-xs flex items-center gap-1 mt-0.5">
                          <CalendarClock className="w-3 h-3" />
                          Próximo: {new Date(record.nextDate).toLocaleDateString("es-CO")}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#8DA3B8] text-sm">{record.tech_name}</td>
                    <td className="px-5 py-3 text-[#8DA3B8] text-sm whitespace-nowrap">
                      {new Date(record.date).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {record.cost
                        ? <span className="text-emerald-400">${record.cost.toLocaleString("es-CO")}</span>
                        : <span className="text-[#4A5568]">—</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_STYLES[record.status ?? "PENDIENTE"]}`}>
                        {STATUS_LABELS[record.status ?? "PENDIENTE"]}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {record.status !== "EN_PROCESO" && record.status !== "COMPLETADO" && (
                            <button
                              onClick={() => updateStatus(record.id, "EN_PROCESO")}
                              className="text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors whitespace-nowrap"
                              title="Marcar en proceso"
                            >
                              En proceso
                            </button>
                          )}
                          {record.status !== "COMPLETADO" && (
                            <button
                              onClick={() => updateStatus(record.id, "COMPLETADO")}
                              className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-400 hover:bg-green-500/30 transition-colors whitespace-nowrap"
                              title="Marcar como completado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MaintenanceForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [assets, setAssets]   = useState<{ id: string; name: string; serial: string }[]>([]);
  const [users, setUsers]     = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    assetId: "", techId: "", type: "PREVENTIVO", status: "PENDIENTE",
    description: "", cost: "", date: "", nextDate: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/assets").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
    ]).then(([a, u]) => {
      setAssets(Array.isArray(a) ? a : []);
      // Only show technicians and admins as assignable techs
      setUsers(Array.isArray(u) ? u.filter((x: { role?: string }) => x.role !== "CONSULTOR") : []);
    });
  }, []);

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
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      onSaved();
    } else {
      const err = await res.json();
      setError(err.error || "Error al guardar");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#162436] border border-[#243447] rounded-2xl w-full max-w-lg my-auto shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b border-[#243447]">
          <div>
            <h2 className="text-white font-semibold">Registrar Mantenimiento</h2>
            <p className="text-[#8DA3B8] text-xs mt-0.5">Completa los datos del mantenimiento</p>
          </div>
          <button onClick={onClose} className="text-[#8DA3B8] hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Activo *</label>
            <select name="assetId" value={form.assetId} onChange={handleChange} required
              className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]">
              <option value="">Selecciona un activo</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.serial}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Técnico asignado *</label>
              <select name="techId" value={form.techId} onChange={handleChange} required
                className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]">
                <option value="">Selecciona técnico</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Tipo *</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]">
                <option value="PREVENTIVO">Preventivo</option>
                <option value="CORRECTIVO">Correctivo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Estado inicial</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]">
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="COMPLETADO">Completado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Descripción *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
              placeholder="Describe el mantenimiento a realizar o realizado..."
              className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] resize-none placeholder:text-[#4A5568]" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Fecha</label>
              <input name="date" type="date" value={form.date} onChange={handleChange}
                className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]" />
            </div>
            <div>
              <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Próximo</label>
              <input name="nextDate" type="date" value={form.nextDate} onChange={handleChange}
                className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]" />
            </div>
            <div>
              <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Costo ($)</label>
              <input name="cost" type="number" value={form.cost} onChange={handleChange}
                placeholder="0"
                className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568]" />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#243447] hover:bg-[#2E4158] text-white rounded-lg py-2 text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#4A90D9] hover:bg-[#5AA0E9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60">
              {loading ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}