import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { setupTestDB, cleanTestDB, closeTestDB, testPool } from "../db.test.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

beforeAll(async () => await setupTestDB());
beforeEach(async () => await cleanTestDB());
afterAll(async () => await closeTestDB());

// Helper — crea usuario y devuelve su accessToken
const loginAsAdmin = async () => {
  const hashed = await bcrypt.hash("123456", 10);
  const role = await testPool.query(
    "SELECT id, level FROM roles WHERE name = 'super_admin'"
  );

  const user = await testPool.query(
    `INSERT INTO users (email, nickname, password, role_id, is_verified, is_active)
     VALUES ($1, $2, $3, $4, true, true) RETURNING *`,
    ["admin@test.com", "admin", hashed, role.rows[0].id]
  );

  //  Generamos el token directamente sin pasar por el login
  const token = jwt.sign(
    { id: user.rows[0].id, roleId: role.rows[0].id, level: role.rows[0].level },
    process.env.JWT_SECRET || "test_secret_for_ci",
    { expiresIn: "15m" }
  );

  return token;
};

// ================================
describe("GET /workers", () => {
// ================================

  it("retorna lista de workers para usuario autenticado", async () => {
    const token = await loginAsAdmin();

    const res = await request(app)
      .get("/workers")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("retorna 401 sin token", async () => {
    const res = await request(app).get("/workers");
    expect(res.status).toBe(401);
  });

});

// ================================
describe("POST /workers", () => {
// ================================

  it("crea un worker con datos válidos", async () => {
    const token = await loginAsAdmin();

    const res = await request(app)
      .post("/workers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Juan López",
        email: "juan@test.com",
        position: "Supervisor"
      });

    expect(res.status).toBe(200);
    expect(res.body.worker).toHaveProperty("id");
    expect(res.body.worker.name).toBe("Juan López");
  });

  it("retorna error con datos incompletos", async () => {
    const token = await loginAsAdmin();

    const res = await request(app)
      .post("/workers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Juan" }); // sin email ni position

    expect(res.status).toBe(400);
  });

  it("retorna error con email inválido", async () => {
    const token = await loginAsAdmin();

    const res = await request(app)
      .post("/workers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Juan López",
        email: "no-es-un-email",
        position: "Supervisor"
      });

    expect(res.status).toBe(400);
  });

});