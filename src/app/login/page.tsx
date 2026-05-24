"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Code2, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError("Email o contraseña incorrectos.");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-[#0A1628]">

      {/* ── PANEL IZQUIERDO ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-10 bg-gradient-to-br from-[#0D1F35] to-[#0A1628] border-r border-[#1E3A5F]/40 relative overflow-hidden">

        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#4A90D9]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#4A90D9]/8 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A90D9] flex items-center justify-center shadow-lg shadow-[#4A90D9]/30">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SoftNova</p>
            <p className="text-[#4A90D9] text-xs leading-none mt-0.5">Development & Software</p>
          </div>
        </div>

        {/* Centro */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#4A90D9]/10 border border-[#4A90D9]/20 rounded-full px-3 py-1.5 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A90D9] animate-pulse" />
            <span className="text-[#4A90D9] text-xs font-medium">Sistema de Gestión Interna</span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Gestiona tus<br />
            <span className="text-[#4A90D9]">activos tecnológicos</span><br />
            con precisión
          </h1>
          <p className="text-[#5B7A9A] text-sm leading-relaxed mb-7">
            Plataforma centralizada para el control, seguimiento y mantenimiento
            de todos los activos tecnológicos de SoftNova.
          </p>

          {/* SVG Ilustración */}
          <svg viewBox="0 0 420 260" xmlns="http://www.w3.org/2000/svg" className="w-full rounded-xl">
            <defs>
              <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F2A45" />
                <stop offset="100%" stopColor="#0A1E33" />
              </linearGradient>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A90D9" />
                <stop offset="100%" stopColor="#5AA0E9" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>

            {/* Fondo tarjeta */}
            <rect x="0" y="0" width="420" height="260" rx="14" fill="url(#cardGrad)" stroke="#1E3A5F" strokeWidth="1" />

            {/* Header */}
            <rect x="0" y="0" width="420" height="40" rx="14" fill="#0D2640" />
            <rect x="0" y="26" width="420" height="14" fill="#0D2640" />
            <circle cx="28" cy="20" r="5" fill="#4A90D9" opacity="0.9" />
            <rect x="42" y="16" width="70" height="7" rx="3.5" fill="#1E3A5F" />
            <rect x="330" y="16" width="50" height="7" rx="3.5" fill="#1E3A5F" />
            <rect x="388" y="13" width="22" height="13" rx="6.5" fill="#4A90D9" opacity="0.25" />

            {/* KPI cards */}
            {[
              { x: 12, color: "#4A90D9", w: 26 },
              { x: 114, color: "#10B981", w: 20 },
              { x: 216, color: "#F59E0B", w: 16 },
              { x: 318, color: "#EF4444", w: 12 },
            ].map((k, i) => (
              <g key={i}>
                <rect x={k.x} y="50" width="90" height="48" rx="8" fill="#0F2A45" stroke="#1E3A5F" strokeWidth="1" />
                <rect x={k.x + 8} y="58" width="42" height="5" rx="2.5" fill="#1E3A5F" />
                <rect x={k.x + 8} y="69" width={k.w} height="10" rx="3" fill={k.color} opacity="0.9" />
                <rect x={k.x + 8} y="84" width="52" height="4" rx="2" fill={k.color} opacity="0.2" />
              </g>
            ))}

            {/* Gráfica barras */}
            <rect x="12" y="108" width="190" height="140" rx="8" fill="#0F2A45" stroke="#1E3A5F" strokeWidth="1" />
            <rect x="22" y="117" width="55" height="5" rx="2.5" fill="#1E3A5F" />
            {[
              { x: 28,  h: 35, c: "#4A90D9", d: "3s"   },
              { x: 55,  h: 55, c: "#4A90D9", d: "3.5s"  },
              { x: 82,  h: 70, c: "#4A90D9", d: "2.8s"  },
              { x: 109, h: 60, c: "#4A90D9", d: "3.2s"  },
              { x: 136, h: 80, c: "#10B981", d: "2.5s"  },
              { x: 163, h: 65, c: "#10B981", d: "3.8s"  },
            ].map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={238 - b.h} width="18" height={b.h} rx="4" fill={b.c} opacity="0.8">
                  <animate attributeName="height" values={`${b.h * 0.5};${b.h};${b.h * 0.5}`} dur={b.d} repeatCount="indefinite" />
                  <animate attributeName="y" values={`${238 - b.h * 0.5};${238 - b.h};${238 - b.h * 0.5}`} dur={b.d} repeatCount="indefinite" />
                </rect>
              </g>
            ))}

            {/* Lista activos */}
            <rect x="210" y="108" width="200" height="140" rx="8" fill="#0F2A45" stroke="#1E3A5F" strokeWidth="1" />
            <rect x="220" y="117" width="55" height="5" rx="2.5" fill="#1E3A5F" />
            {[
              { color: "#10B981" },
              { color: "#F59E0B" },
              { color: "#4A90D9" },
              { color: "#EF4444" },
            ].map((row, i) => (
              <g key={i}>
                <circle cx="226" cy={140 + i * 26} r="5" fill="#4A90D9" opacity="0.7" />
                <rect x="238" y={136 + i * 26} width={55 + i * 5} height="5" rx="2.5" fill="#1E3A5F" />
                <rect x="238" y={144 + i * 26} width={35 + i * 3} height="3" rx="1.5" fill="#0A1E33" stroke="#1E3A5F" strokeWidth="0.5" />
                <rect x={355 - i} y={135 + i * 26} width="42" height="9" rx="4.5" fill={row.color} opacity="0.2" />
                <rect x={357 - i} y={137 + i * 26} width={10 + i * 3} height="5" rx="2.5" fill={row.color} opacity="0.6" />
              </g>
            ))}

            {/* Barra de progreso animada */}
            <rect x="12" y="253" width="396" height="3" rx="1.5" fill="#1E3A5F" />
            <rect x="12" y="253" width="0" height="3" rx="1.5" fill="url(#blueGrad)">
              <animate attributeName="width" values="0;280;0" dur="4s" repeatCount="indefinite" />
            </rect>

            {/* Pulso animado */}
            <circle cx="395" cy="85" r="4" fill="#4A90D9" opacity="0">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="395" cy="85" r="4" fill="none" stroke="#4A90D9" strokeWidth="2" opacity="0">
              <animate attributeName="opacity" values="0;0.5;0" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[#2E4A6A] text-xs">
            © 2025 SoftNova Development & Software. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO — FORMULARIO ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#4A90D9] flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-bold">SoftNova</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
            <p className="text-[#5B7A9A] text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8DA3B8] mb-2">Correo corporativo</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tucorreo@softnova.com"
                className="w-full bg-[#0D1F35] border border-[#1E3A5F] text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9]/30 transition-all placeholder:text-[#2E4A6A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8DA3B8] mb-2">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••••"
                className="w-full bg-[#0D1F35] border border-[#1E3A5F] text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-[#4A90D9] focus:ring-1 focus:ring-[#4A90D9]/30 transition-all placeholder:text-[#2E4A6A]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#4A90D9] hover:bg-[#5AA0E9] text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#4A90D9]/20 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando...</> : "Iniciar sesión"}
            </button>
          </form>

          {/* Soporte */}
          <div className="mt-6 p-4 bg-[#0D1F35] border border-[#1E3A5F]/60 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#4A90D9]" />
              </div>
              <div>
                <p className="text-[#8DA3B8] text-xs font-medium mb-0.5">¿Problemas para ingresar?</p>
                <p className="text-[#5B7A9A] text-xs leading-relaxed">
                  Contacta al área de TI para recuperar tu contraseña:
                </p>
                <a href="mailto:soporte@softnova.com" className="text-[#4A90D9] text-xs font-medium hover:underline mt-1 inline-block">
                  soporte@softnova.com
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-[#2E4A6A] text-xs mt-5">
            © 2025 SoftNova · Uso exclusivo interno
          </p>
        </div>
      </div>

    </div>
  );
}