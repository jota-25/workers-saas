import express from "express";
import cors from "cors"; // Para permitir peticiones desde el frontend
import { pool } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import workersRoutes from "./routes/workers.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import dotenv from "dotenv";
import logsRoutes from "./routes/logs.routes.js";
import usersRoutes from "./routes/users.routes.js";
import seccionRoutes from "./routes/sessions.routes.js";


dotenv.config();

const app = express();

// Configuración de CORS para permitir peticiones desde el frontend y va antes de cualquier cosa
app.use(cors({
  origin: ["http://localhost:5173", // URL del frontend en desarrollo
    "http://localhost",       // Docker
    "http://localhost:80",     // Docker alternativo 
    "https://github.com/jota-25/workers-saas/tree/main"       // ← producción (Vercel)
  ],     

  credentials: true                  // permite enviar cookies/headers de auth
}));

app.use(express.json());

// Middlewares globales
app.use(express.json());

// Rutas simples /(genreales  pruebas ,etc)
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.get("/test", (req, res) => {
  res.json({ ok: true });
});

// Rutas de módulos
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/workers", workersRoutes);

app.use("/logs", logsRoutes);
app.use("/users", usersRoutes);
app.use("/sessions", seccionRoutes);

 // Middleware de manejo de errores (SIEMPRE AL FINAL DE LAS RUTAS)
app.use(errorHandler);

// Test DB
app.get("/test-db", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows);
});

// Arrancar servidor (SIEMPRE AL FINAL)
app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});

