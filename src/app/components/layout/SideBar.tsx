"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Monitor,
  Wrench,
  Users,
  LogOut,
  Cpu,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard, desc: "Resumen general" },
  { href: "/activos",        label: "Activos",         icon: Monitor,         desc: "Inventario" },
  { href: "/mantenimientos", label: "Mantenimientos",  icon: Wrench,          desc: "Historial" },
  { href: "/usuarios",       label: "Usuarios",        icon: Users,           desc: "Equipo" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN:     "Administrador",
  TECNICO:   "Técnico",
  CONSULTOR: "Consultor",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:     "bg-violet-500",
  TECNICO:   "bg-blue-500",
  CONSULTOR: "bg-slate-500",
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <aside className="w-60 min-h-screen bg-[#070F1A] flex flex-col fixed left-0 top-0 z-40" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 0 20px rgba(74,144,217,0.35)" }}>
            <Cpu className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide leading-none">TechAsset</p>
            <p className="text-[#3D6A94] text-[10px] leading-none mt-1 font-medium tracking-widest uppercase">Manager</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[#2D4A63] text-[9px] font-bold tracking-widest uppercase">Navegación</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative"
              style={active ? {
                background: "linear-gradient(135deg, rgba(74,144,217,0.15) 0%, rgba(37,99,235,0.08) 100%)",
                border: "1px solid rgba(74,144,217,0.2)",
              } : {
                border: "1px solid transparent",
              }}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#4A90D9]" />
              )}

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                active
                  ? "bg-[#4A90D9]/20"
                  : "bg-white/[0.03] group-hover:bg-white/[0.07]"
              }`}>
                <Icon className={`flex-shrink-0 transition-colors duration-200 ${
                  active ? "text-[#4A90D9]" : "text-[#4A6080] group-hover:text-[#7A9DB8]"
                }`} style={{ width: 15, height: 15 }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium leading-none transition-colors duration-200 ${
                  active ? "text-[#4A90D9]" : "text-[#5A7A94] group-hover:text-[#8AABB8]"
                }`} style={{ fontSize: 13 }}>{label}</p>
                <p className="text-[#2D4A63] text-[10px] leading-none mt-1 group-hover:text-[#3D6A80] transition-colors">{desc}</p>
              </div>

              {active && <ChevronRight className="w-3 h-3 text-[#4A90D9]/50 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3" style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* User card */}
      <div className="px-3 pb-3">
        <div className="rounded-xl px-3 py-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
            style={{ background: "linear-gradient(135deg, #4A90D9, #2563eb)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate leading-none">{user?.name || "Usuario"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${ROLE_COLORS[user?.role] || "bg-slate-500"}`} />
              <p className="text-[#3D6A80] text-[10px] leading-none">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#3D5A70] hover:text-red-400 transition-all duration-200 group"
          style={{ border: "1px solid transparent" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)", e.currentTarget.style.borderColor = "rgba(239,68,68,0.12)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.borderColor = "transparent")}
        >
          <LogOut style={{ width: 14, height: 14 }} className="flex-shrink-0" />
          <span style={{ fontSize: 12 }} className="font-medium">Cerrar sesión</span>
        </button>
      </div>

    </aside>
  );
}