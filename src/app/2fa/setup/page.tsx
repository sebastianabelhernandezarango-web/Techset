"use client";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { ShieldCheck, Smartphone, Copy, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function TwoFactorSetupPage() {
  const [qrCode, setQrCode]   = useState<string>("");
  const [secret, setSecret]   = useState<string>("");
  const [code, setCode]       = useState<string>("");
  const [step, setStep]       = useState<"loading" | "scan" | "confirm" | "done">("loading");
  const [error, setError]     = useState<string>("");
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(false);

  // useRef evita que en desarrollo (StrictMode monta dos veces)
  // se llame al endpoint dos veces y se sobreescriba el secreto.
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/auth/2fa/setup")
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("scan");
      })
      .catch(() => setError("Error al generar el código QR. Recarga la página."));
  }, []);

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res  = await fetch("/api/auth/2fa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.replace(/\s/g, "") }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Código incorrecto");
      return;
    }

    // El setup fue exitoso. En lugar de intentar actualizar el token
    // en el cliente (lo cual es poco confiable), cerramos la sesión
    // y mandamos al usuario al login. Al volver a ingresar, NextAuth
    // creará un token nuevo que ya refleja twoFactorEnabled = true,
    // y el middleware lo llevará a /2fa/verify correctamente.
    setStep("done");
    setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-[#060D18] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(74,144,217,0.08) 0%, transparent 60%)" }}>

      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 0 40px rgba(74,144,217,0.3)" }}>
            <ShieldCheck style={{ width: 28, height: 28 }} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Configura la verificación</h1>
          <p className="text-[#3D6A80] text-sm mt-2">
            Para proteger tu cuenta necesitas configurar la autenticación de dos pasos.
          </p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#0B1524", border: "1px solid rgba(255,255,255,0.08)" }}>

          {step === "loading" && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="text-[#4A90D9] animate-spin" style={{ width: 32, height: 32 }} />
              <p className="text-[#3D6A80] text-sm">Generando tu código QR...</p>
            </div>
          )}

          {step === "scan" && (
            <>
              <div className="flex items-start gap-3 p-3 rounded-xl mb-5"
                style={{ background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.15)" }}>
                <Smartphone className="text-[#4A90D9] flex-shrink-0 mt-0.5" style={{ width: 16, height: 16 }} />
                <p className="text-[#7AAED4] text-xs leading-relaxed">
                  Abre <strong className="text-white">Google Authenticator</strong> o <strong className="text-white">Authy</strong> en tu teléfono, toca el botón <strong className="text-white">+</strong> y escanea el código QR.
                </p>
              </div>

              {qrCode && (
                <div className="flex justify-center mb-5">
                  <div className="p-3 rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCode} alt="Código QR para 2FA" width={180} height={180} />
                  </div>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[#3D6A80] text-xs mb-2">¿No puedes escanear? Ingresa esta clave manualmente:</p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <code className="text-[#4A90D9] text-xs flex-1 tracking-widest font-mono break-all">{secret}</code>
                  <button onClick={copySecret} className="flex-shrink-0 text-[#3D6A80] hover:text-white transition-colors">
                    {copied
                      ? <CheckCircle style={{ width: 15, height: 15 }} className="text-emerald-400" />
                      : <Copy style={{ width: 15, height: 15 }} />
                    }
                  </button>
                </div>
              </div>

              <button onClick={() => setStep("confirm")}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}>
                Ya escanée el código →
              </button>
            </>
          )}

          {step === "confirm" && (
            <form onSubmit={handleConfirm}>
              <div className="text-center mb-6">
                <p className="text-white font-medium">Verifica que todo funciona</p>
                <p className="text-[#3D6A80] text-sm mt-1">
                  Ingresa el código de 6 dígitos que muestra tu app para confirmar la configuración.
                </p>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-white text-2xl font-mono tracking-[0.5em] rounded-xl py-4 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(74,144,217,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="text-red-400 flex-shrink-0" style={{ width: 14, height: 14 }} />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep("scan")}
                  className="flex-1 py-2.5 rounded-xl text-sm text-[#3D6A80] hover:text-white transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  ← Volver
                </button>
                <button type="submit" disabled={loading || code.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #4A90D9 0%, #2563eb 100%)", boxShadow: "0 4px 15px rgba(74,144,217,0.3)" }}>
                  {loading ? <Loader2 className="animate-spin mx-auto" style={{ width: 16, height: 16 }} /> : "Confirmar"}
                </button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <CheckCircle className="text-emerald-400" style={{ width: 32, height: 32 }} />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">¡Verificación activada!</p>
                <p className="text-[#3D6A80] text-sm mt-1">Tu cuenta ya está protegida. Iniciando sesión de nuevo...</p>
              </div>
              <Loader2 className="text-[#4A90D9] animate-spin" style={{ width: 20, height: 20 }} />
            </div>
          )}

        </div>

        <div className="flex justify-center gap-4 mt-6">
          {["Escanear", "Confirmar", "Listo"].map((label, i) => {
            const currentStep = step === "scan" ? 0 : step === "confirm" ? 1 : step === "done" ? 2 : -1;
            const active = i === currentStep;
            const done   = i < currentStep;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full transition-all ${done ? "bg-emerald-400" : active ? "bg-[#4A90D9]" : "bg-[#1E3A5F]"}`} />
                <span className={`text-[10px] transition-colors ${active ? "text-[#4A90D9]" : done ? "text-emerald-400" : "text-[#1E3A5F]"}`}>{label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}