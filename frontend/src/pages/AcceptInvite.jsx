import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { acceptInviteRequest } from "../services/auth.service";
import api from "../lib/axios";

export default function AcceptInvite() {
  const navigate = useNavigate();

  // ✅ useParams lee el token de la URL
  // /invite/xxxxx → token = "xxxxx"
  const { token } = useParams();

  const [invite, setInvite]     = useState(null);  // datos de la invitación
  const [checking, setChecking] = useState(true);  // verificando el token
  const [tokenError, setTokenError] = useState(""); // token inválido/expirado

  const [form, setForm]           = useState({ nickname: "", password: "", confirmPassword: "" });
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess]     = useState(false);

  // ================================
  // Verificar que el token es válido
  // ================================
  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}`);
        setInvite(res.data);
      } catch (error) {
        const status = error.response?.status;
        if (status === 400 || status === 404) {
          setTokenError("Esta invitación es inválida o ha expirado.");
        } else {
          setTokenError("Error al verificar la invitación.");
        }
      } finally {
        setChecking(false);
      }
    };

    checkToken();
  }, [token]);

  // ================================
  // Manejo del formulario
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setServerError("");
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.nickname.trim())
      newErrors.nickname = "El nickname es requerido";
    else if (form.nickname.length < 3)
      newErrors.nickname = "Mínimo 3 caracteres";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.nickname))
      newErrors.nickname = "Solo letras, números y guión bajo";

    if (!form.password)
      newErrors.password = "La contraseña es requerida";
    else if (form.password.length < 6)
      newErrors.password = "Mínimo 6 caracteres";

    if (!form.confirmPassword)
      newErrors.confirmPassword = "Confirma tu contraseña";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================================
  // Submit
  // ================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await acceptInviteRequest(token, form.password, form.nickname);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 400) {
        setTokenError("Esta invitación ya fue usada o ha expirado.");
      } else if (message?.includes("nickname")) {
        setErrors(prev => ({ ...prev, nickname: "Este nickname ya está en uso" }));
      } else {
        setServerError(message || "Error al crear la cuenta. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // Render
  // ================================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workers SaaS</h1>
          <p className="text-gray-500 text-sm mt-1">Activa tu cuenta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* Verificando token */}
          {checking && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">Verificando invitación...</p>
            </div>
          )}

          {/* Token inválido */}
          {!checking && tokenError && (
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Invitación inválida
              </h2>
              <p className="text-sm text-gray-500 mb-6">{tokenError}</p>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                ← Ir al login
              </Link>
            </div>
          )}

          {/* Éxito */}
          {!checking && success && (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Cuenta creada!
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Tu cuenta fue activada correctamente. Redirigiendo al login...
              </p>
            </div>
          )}

          {/* Formulario */}
          {!checking && !tokenError && !success && invite && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Info de la invitación */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-sm text-blue-700">
                  Invitación para{" "}
                  <span className="font-semibold">{invite.email}</span>
                </p>
              </div>

              <Input
                label="Nickname"
                name="nickname"
                placeholder="juan123"
                value={form.nickname}
                onChange={handleChange}
                error={errors.nickname}
              />

              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
              />

              <Input
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{serverError}</p>
                </div>
              )}

              <Button type="submit" loading={loading}>
                Activar cuenta
              </Button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}