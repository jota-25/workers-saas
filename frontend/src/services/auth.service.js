import api from "../lib/axios";

//  Todas las llamadas a la API relacionadas con auth en un solo lugar
// Las páginas no saben nada de axios — solo llaman a estas funciones

export const loginRequest = async (login, password) => {
  const res = await api.post("/auth/login", { login, password });
  return res.data; // { accessToken, refreshToken }
};

export const logoutRequest = async (refreshToken) => {
  const res = await api.post("/auth/logout", { refreshToken });
  return res.data;
};

export const forgotPasswordRequest = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPasswordRequest = async (token, newPassword) => {
  const res = await api.post("/auth/reset-password", { token, newPassword });
  return res.data;
};