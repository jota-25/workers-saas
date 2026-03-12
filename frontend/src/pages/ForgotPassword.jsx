import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { forgotPasswordRequest } from "../services/auth.service";

export default function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false); // ← controla si mostrar el mensaje de éxito

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPasswordRequest(email);
      // ✅ Siempre mostramos éxito aunque el email no exista
      // Esto es por seguridad — no revelar si el email está registrado
      setSent(true);
    } catch {
      setError("Error al procesar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workers SaaS</h1>
          <p className="text-gray-500 text-sm mt-1">Recupera tu contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* ✅ Si ya se envió mostramos mensaje de confirmación */}
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Revisa tu correo
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Si ese email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              {/* ✅ Mientras no hay email real, el link aparece en los logs del backend */}
              <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2 mb-6">
                ⚠️ Por ahora el link aparece en los logs del backend (consola de Render)
              </p>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                ← Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <p className="text-sm text-gray-500">
                Escribe tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <Input
                label="Email"
                type="email"
                placeholder="juan@empresa.com"
                value={email}
                onChange={(e) => {
                  setError("");
                  setEmail(e.target.value);
                }}
                error={error}
              />

              <Button type="submit" loading={loading}>
                Enviar enlace
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}