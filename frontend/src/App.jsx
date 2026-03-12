import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import Sessions from "./pages/Sessions";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";


// ✅ Componente que protege rutas — si no hay sesión, redirige al login
const PrivateRoute = ({ children, minLevel = 0 }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Cargando...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // ✅ Si la ruta requiere un nivel mínimo de permisos
  if (user.level < minLevel) return <Navigate to="/dashboard" />;

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />

      {/* Rutas protegidas */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      <Route path="/workers" element={
        <PrivateRoute minLevel={50}>
          <Workers />
        </PrivateRoute>
      } />

      <Route path="/users" element={
        <PrivateRoute minLevel={50}>
          <Users />
        </PrivateRoute>
      } />

      <Route path="/logs" element={
        <PrivateRoute minLevel={90}>
          <Logs />
        </PrivateRoute>
      } />

      <Route path="/sessions" element={
        <PrivateRoute>
          <Sessions />
        </PrivateRoute>
      } />

      {/* Redirige la raíz al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}
