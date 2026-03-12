import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { resetPasswordRequest } from "../services/auth.service";

export default function ResetPassword() {
  const navigate = useNavigate();

  // ✅ useSearchParams lee los parámetros de la URL
  // /reset-password?token=xxxxx → token = "xxxxx"
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm]           = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess]     = useState(false);

  // ✅ Si no hay token en la URL, mostramos error inmediatamente
  useEffect(() => {
    if (!token) {
      setServerError("El enlace es inválido o ha expirado. Solicita uno nuevo.");
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setServerError("");
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.newPassword)
      newErrors.newPassword = "La contraseña es requerida";
    else if (form.newPassword.length < 6)
      newErrors.newPassword = "Mínimo 6 caracteres";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirma tu contraseña";
    else if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPasswordRequest(token, form.newPassword);
      setSuccess(true);
      // ✅ Redirigimos al login después de 3 segundos
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const status = error.response?.status;
      if (status === 400) {
        setServerError("El enlace ha expirado o ya fue usado. Solicita uno nuevo.");
      } else {
        setServerError("Error al cambiar la contraseña. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workers SaaS</h1>
          <p className="text-gray-500 text-sm mt-1">Nueva contraseña</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* ✅ Pantalla de éxito */}
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Contraseña actualizada
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Tu contraseña fue cambiada correctamente. Redirigiendo al login...
              </p>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-[shrink_3s_linear_forwards]" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <p className="text-sm text-gray-500">
                Elige una nueva contraseña segura para tu cuenta.
              </p>

              <Input
                label="Nueva contraseña"
                name="newPassword"
                type="password"
                placeholder="••••••••"
                value={form.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                disabled={!token}
              />

              <Input
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                disabled={!token}
              />

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{serverError}</p>
                  {!token && (
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:underline mt-1 block"
                    >
                      Solicitar nuevo enlace →
                    </Link>
                  )}
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                disabled={!token}
              >
                Cambiar contraseña
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
