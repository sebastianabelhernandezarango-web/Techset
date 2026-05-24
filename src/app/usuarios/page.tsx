"use client";
import { Sidebar } from "../components/layout/SideBar";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, User, Shield, Wrench, Eye, Pencil, Ban, CheckCircle2, Search } from "lucide-react";

const ROLE_STYLES: Record<string, string> = {
  ADMIN:     "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  TECNICO:   "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  CONSULTOR: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

const ROLE_ICONS: Record<string, any> = {
  ADMIN:     Shield,
  TECNICO:   Wrench,
  CONSULTOR: Eye,
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN:     "Administrador",
  TECNICO:   "Técnico",
  CONSULTOR: "Consultor",
};

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role as string;
  const isAdmin = currentRole === "ADMIN";

  const [users, setUsers]           = useState<UserData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editUser, setEditUser]     = useState<UserData | null>(null);
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  async function fetchUsers() {
    setLoading(true);
    const res  = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(user: UserData) {
    if (!isAdmin) return;
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    fetchUsers();
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    total:     users.length,
    activos:   users.filter(u => u.active).length,
    admin:     users.filter(u => u.role === "ADMIN").length,
    tecnico:   users.filter(u => u.role === "TECNICO").length,
    consultor: users.filter(u => u.role === "CONSULTOR").length,
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-60 p-8 flex-1 min-h-screen bg-[#0A1628]">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Usuarios</h1>
            <p className="text-[#8DA3B8] text-sm mt-0.5">{counts.activos} activos de {counts.total} registrados</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditUser(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#4A90D9] hover:bg-[#5AA0E9] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Administradores", count: counts.admin,     color: "text-purple-400", bg: "bg-purple-500/10", icon: Shield },
            { label: "Técnicos",        count: counts.tecnico,   color: "text-blue-400",   bg: "bg-blue-500/10",   icon: Wrench },
            { label: "Consultores",     count: counts.consultor, color: "text-gray-400",   bg: "bg-gray-500/10",   icon: Eye },
            { label: "Activos",         count: counts.activos,   color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle2 },
          ].map(({ label, count, color, bg, icon: Icon }) => (
            <div key={label} className="bg-[#162436] border border-[#243447] rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${color}`}>{count}</p>
                <p className="text-xs text-[#8DA3B8]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full bg-[#162436] border border-[#243447] text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568]"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="bg-[#162436] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9]"
          >
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="TECNICO">Técnico</option>
            <option value="CONSULTOR">Consultor</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-[#8DA3B8] py-20">Cargando...</div>
        ) : (
          <div className="bg-[#162436] border border-[#243447] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#243447] bg-[#0F1E2E]/40">
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Usuario</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Email</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Rol</th>
                  <th className="text-left text-xs text-[#8DA3B8] font-medium px-5 py-3">Estado</th>
                  {isAdmin && (
                    <th className="text-right text-xs text-[#8DA3B8] font-medium px-5 py-3">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="text-center text-[#8DA3B8] py-10 text-sm">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : filtered.map((user) => {
                  const RoleIcon = ROLE_ICONS[user.role] || User;
                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-[#243447] last:border-0 hover:bg-[#1A2D40] transition-colors ${
                        !user.active ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#4A90D9]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#4A90D9] text-xs font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white text-sm font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#8DA3B8] text-sm">{user.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${ROLE_STYLES[user.role]}`}>
                          <RoleIcon className="w-3 h-3" />
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          user.active
                            ? "bg-green-500/15 text-green-400 border border-green-500/30"
                            : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}>
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditUser(user); setShowForm(true); }}
                              className="p-1.5 rounded-lg text-[#8DA3B8] hover:text-white hover:bg-[#243447] transition-colors"
                              title="Editar usuario"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(user)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.active
                                  ? "text-[#8DA3B8] hover:text-red-400 hover:bg-red-500/10"
                                  : "text-[#8DA3B8] hover:text-green-400 hover:bg-green-500/10"
                              }`}
                              title={user.active ? "Desactivar usuario" : "Activar usuario"}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <UserForm
            currentRole={currentRole}
            editUser={editUser}
            onClose={() => { setShowForm(false); setEditUser(null); }}
            onSaved={() => { setShowForm(false); setEditUser(null); fetchUsers(); }}
          />
        )}
      </div>
    </div>
  );
}

function UserForm({
  currentRole,
  editUser,
  onClose,
  onSaved,
}: {
  currentRole: string;
  editUser: UserData | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editUser;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    name:     editUser?.name  ?? "",
    email:    editUser?.email ?? "",
    password: "",
    userRole: editUser?.role  ?? "CONSULTOR",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res: Response;
    if (isEdit) {
      res = await fetch(`/api/users/${editUser!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, userRole: form.userRole }),
      });
    } else {
      res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setLoading(false);
    if (res.ok) {
      onSaved();
    } else {
      const err = await res.json();
      setError(err.error || "Error al guardar");
    }
  }

  // Solo ADMIN puede asignar el rol ADMIN
  const availableRoles = currentRole === "ADMIN"
    ? ["CONSULTOR", "TECNICO", "ADMIN"]
    : ["CONSULTOR", "TECNICO"];

  const roleMeta: Record<string, { label: string; desc: string; icon: any }> = {
    CONSULTOR: { label: "Consultor",     desc: "Solo lectura — puede ver activos y reportes",           icon: Eye    },
    TECNICO:   { label: "Técnico",       desc: "Puede registrar y editar activos y mantenimientos",     icon: Wrench },
    ADMIN:     { label: "Administrador", desc: "Acceso total — gestiona usuarios y configuración",      icon: Shield },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#162436] border border-[#243447] rounded-2xl w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b border-[#243447]">
          <div>
            <h2 className="text-white font-semibold">{isEdit ? "Editar Usuario" : "Nuevo Usuario"}</h2>
            <p className="text-[#8DA3B8] text-xs mt-0.5">
              {isEdit ? "Actualiza nombre o rol del usuario" : "Crea una cuenta nueva en el sistema"}
            </p>
          </div>
          <button onClick={onClose} className="text-[#8DA3B8] hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Nombre completo *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ej. Juan Pérez"
              className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568] transition-colors"
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="correo@empresa.com"
                  className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8DA3B8] mb-1.5 font-medium">Contraseña *</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 8 caracteres recomendado"
                  className="w-full bg-[#0F1E2E] border border-[#243447] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#4A90D9] placeholder:text-[#4A5568] transition-colors"
                />
              </div>
            </>
          )}

          {/* Role selector — visual radio cards */}
          <div>
            <label className="block text-xs text-[#8DA3B8] mb-2 font-medium">Rol del usuario *</label>
            <div className="space-y-2">
              {availableRoles.map(role => {
                const meta = roleMeta[role];
                const Icon = meta.icon;
                const selected = form.userRole === role;
                return (
                  <label
                    key={role}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selected
                        ? "border-[#4A90D9] bg-[#4A90D9]/10"
                        : "border-[#243447] hover:border-[#2E4158]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="userRole"
                      value={role}
                      checked={selected}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div className={`p-1.5 rounded-md mt-0.5 ${selected ? "bg-[#4A90D9]/20" : "bg-[#243447]"}`}>
                      <Icon className={`w-3.5 h-3.5 ${selected ? "text-[#4A90D9]" : "text-[#8DA3B8]"}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${selected ? "text-white" : "text-[#8DA3B8]"}`}>
                        {meta.label}
                      </p>
                      <p className="text-xs text-[#4A5568] mt-0.5">{meta.desc}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-4 h-4 text-[#4A90D9] mt-0.5 shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#243447] hover:bg-[#2E4158] text-white rounded-lg py-2 text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#4A90D9] hover:bg-[#5AA0E9] text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}