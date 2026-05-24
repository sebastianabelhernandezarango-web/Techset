"use client";
import { useState } from "react";


import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function TwoFactorVerifyPage() {
  
  

  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
  e.preventDefault();
  setError("");
  setLoading(true);

  const res = await fetch("/api/auth/2fa/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.replace(/\s/g, "") }),
  });

  const data = await res.json();
  setLoading(false);

  if (!res.ok) {
    setError(data.error || "Código incorrecto");
    setCode("");
    return;
  }

  // El API route ya actualizó la cookie directamente.
  // Usamos replace para que /2fa/verify no quede en el historial.
  window.location.href = "/dashboard";
}

  return (
    <div className="min-h-screen bg-[#060D18] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(74,144,217,0.08) 0%, transparent 60%)" }}>

      <div className="w-full max-w-sm">

        {/* Ícono y título */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 0 40px rgba(74,144,217,0.3)" }}>
            <ShieldCheck style={{ width: 28, height: 28 }} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verificación</h1>
          <p className="text-[#3D6A80] text-sm mt-2">
            Ingresa el código de 6 dígitos de tu app autenticadora.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "#0B1524", border: "1px solid rgba(255,255,255,0.08)" }}>

          <form onSubmit={handleVerify}>
            {/* Input del código — estilo grande y centrado para que sea fácil ingresar */}
            <div className="mb-5">
              <label className="block text-[10px] text-[#3D6A80] mb-2 uppercase tracking-wider font-semibold text-center">
                Código de autenticación
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center text-white text-3xl font-mono rounded-xl py-4 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  letterSpacing: "0.5em",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(74,144,217,0.5)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                autoFocus
              />
              <p className="text-[#2D4A63] text-[10px] text-center mt-2">
                El código cambia cada 30 segundos
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle className="text-red-400 flex-shrink-0" style={{ width: 14, height: 14 }} />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}
            >
              {loading
                ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                : "Verificar e ingresar"
              }
            </button>
          </form>

        </div>

        {/* Nota de ayuda */}
        <p className="text-center text-[#1E3A5F] text-xs mt-5 leading-relaxed">
          ¿Perdiste acceso a tu app autenticadora?<br />
          Contacta al administrador del sistema.
        </p>

      </div>
    </div>
  );
}