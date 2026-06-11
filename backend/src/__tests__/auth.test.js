import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { setupTestDB, cleanTestDB, closeTestDB, testPool } from "../config/database.js.test.js";
import bcrypt from "bcrypt";
import {redis} from "../lib/redis.js"
//  Antes de todos los tests — crear tablas
beforeAll(async () => {
  await setupTestDB();
});

//  Antes de cada test — limpiar datos
beforeEach(async () => {
  await cleanTestDB();
});

// Antes de cada test - limpiar cache(redis)
beforeEach(async () => {
  /*console.log("Limpiando Redis...");*/ // solo para ver si funciona el redis 
  if (redis) {
    await redis.flushall();
  }
});


//  Después de todos los tests — cerrar conexión
afterAll(async () => {
  await closeTestDB();
});


// Helper — crea un usuario de prueba directamente en la DB
const createTestUser = async ({
  email = "test@test.com",
  password = "123456",
  verified = true,
  active = true
} = {}) => {
  const hashed = await bcrypt.hash(password, 10);
  const role = await testPool.query(
    "SELECT id FROM roles WHERE name = 'super_admin'"
  );

  const result = await testPool.query(
    `INSERT INTO users (email, nickname, password, role_id, is_verified, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [email, "testuser", hashed, role.rows[0].id, verified, active]
  );

  return result.rows[0];
};

// ================================
describe("POST /auth/login", () => {
// ================================

  it("retorna tokens con credenciales correctas", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/auth/login")
      .send({ login: "test@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("retorna 401 con contraseña incorrecta", async () => {
    await createTestUser();

    const res = await request(app)
      .post("/auth/login")
      .send({ login: "test@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Credenciales inválidas");
  });

  it("retorna 401 con email que no existe", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ login: "noexiste@test.com", password: "123456" });

    expect(res.status).toBe(401);
  });

  it("retorna 403 si el usuario no está verificado", async () => {
    await createTestUser({ verified: false });

    const res = await request(app)
      .post("/auth/login")
      .send({ login: "test@test.com", password: "123456" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Verifica tu email primero");

  });

  it("retorna 403 si el usuario está desactivado", async () => {
    await createTestUser({ active: false });

    const res = await request(app)
      .post("/auth/login")
      .send({ login: "test@test.com", password: "123456" });

    expect(res.status).toBe(403);


  });

  it("retorna 400 si faltan campos", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ login: "test@test.com" }); // sin password

    expect(res.status).toBe(400);
  });

});

// ================================
describe("GET /test", () => {
// ================================

  it("retorna ok: true", async () => {
    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

});