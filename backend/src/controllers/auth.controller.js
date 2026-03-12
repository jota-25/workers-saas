import bcrypt from "bcrypt";
import { pool } from "../db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { hashToken } from "../utils/hash.js";


export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validar
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // validar correo
    const emailToken = crypto.randomBytes(32).toString("hex");


    // encriptar password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ver cuántos usuarios existen
    const count = await pool.query("SELECT COUNT(*) FROM users");

    // si es el primero -> admin, si no -> user
    const role = count.rows[0].count == 0 ? "admin" : "user";

    // guardar en DB
    const result = await pool.query(
    "INSERT INTO users (name, email, password, role, email_verification_token) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [name, email, hashedPassword, role, emailToken]
    );

    console.log(
      `Link de verificación: http://localhost:3000/auth/verify-email?token=${emailToken}`
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al registrar" });
  }
};

export const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    const result = await pool.query(
      `
      SELECT u.*, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE (u.email = $1 OR u.nickname = $1)
      AND u.is_active = true
      `,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Verifica tu email primero" });
    }

    

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    if (!user.is_active) {
      return res.status(403).json({
        message: "Account disabled"
      });
    }
    if (user.force_password_change) {
      return res.status(403).json({
        message: "Password change required",
        forcePasswordChange: true
      });
    }
   const accessToken = jwt.sign(
      { 
        id: user.id,
        roleId: user.role_id,
        level: user.level
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
   const refreshToken = jwt.sign(
    { id: user.id },
      process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
    );
    
    const ip = req.ip;
    const userAgent = req.headers["user-agent"] || "unknown";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const hashedToken = hashToken(refreshToken);

    await pool.query(
      `INSERT INTO sessions (user_id, refresh_token, ip, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)`,
      [user.id, hashedToken, ip, userAgent, expiresAt]
    );

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al login" });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // ✅ Hasheamos el token recibido para comparar con la DB
    const hashedToken = hashToken(refreshToken);

    const session = await pool.query(
      `SELECT * FROM sessions 
       WHERE refresh_token = $1 
       AND expires_at > NOW()`,
      [hashedToken]
    );

    if (session.rowCount === 0) {
      return res.status(401).json({ message: "Sesión inválida o expirada" });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    
    const newAccessToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: payload.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    
    // (en vez de borrar e insertar, actualizamos — así conservamos ip, user_agent, created_at)

    const hashedNewToken = hashToken(newRefreshToken);
    await pool.query(
      `UPDATE sessions
       SET refresh_token = $1,
           expires_at = $2,
           last_used_at = NOW()
       WHERE id = $3`,
      [hashedNewToken, expiresAt, session.rows[0].id]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
};


export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    const result = await pool.query(
      "UPDATE users SET is_verified=true, email_verification_token=NULL WHERE email_verification_token=$1 RETURNING *",
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Token inválido" });
    }

    res.json({ message: "Email verificado correctamente" });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.json({ message: "Si existe, se enviará un correo" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await pool.query(
      "UPDATE users SET reset_password_token=$1, reset_password_expires=$2 WHERE email=$3",
      [token, expires, email]
    );

    console.log(
      `Reset link: http://localhost:3000/auth/reset-password?token=${token}`
    );

    res.json({ message: "Revisa tu correo" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE reset_password_token=$1 AND reset_password_expires > NOW()",
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password=$1, reset_password_token=NULL, reset_password_expires=NULL WHERE id=$2",
      [hashed, result.rows[0].id]
    );

    res.json({ message: "Contraseña actualizada" });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (req, res, next) => {
  try {

    const { token, password, nickname } = req.body;

    const invite = await pool.query(
      `SELECT * FROM invitations
       WHERE token=$1
       AND expires_at > NOW()`,
      [token]
    );

    if (invite.rowCount === 0)
      return res.status(400).json({ message: "Invitación inválida" });

    const data = invite.rows[0];

    const hashed = await bcrypt.hash(password, 10);

    const user = await pool.query(
      `INSERT INTO users
      (email,password,nickname,role_id)
      VALUES ($1,$2,$3,$4)
      RETURNING id`,
      [data.email, hashed, nickname, data.role_id]
    );

    const userId = user.rows[0].id;

    await pool.query(
      `UPDATE workers
       SET user_id=$1
       WHERE id=$2`,
      [userId, data.worker_id]
    );

    await pool.query(
      `UPDATE invitations SET used = true WHERE id=$1`,
      [data.id]
    );

    res.json({ message: "Cuenta creada correctamente" });

  } catch (error) {
    next(error);
  }
};

export const getInvite = async (req, res, next) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT email FROM invitations
       WHERE token = $1
       AND expires_at > NOW()
       AND used = false`,
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Invitación inválida o expirada" });
    }

    //  Solo devolvemos el email — no el token ni datos sensibles
    res.json({ email: result.rows[0].email });

  } catch (error) {
    next(error);
  }
};



// logout: recibe el refresh token, lo borra de la DB (o marca como expirado) y listo. Así se invalida esa sesión específica (útil para logout desde múltiples dispositivos)

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  // Hasheamos para encontrar la sesión correcta
   const hashedToken = hashToken(refreshToken);
  try {
    await pool.query(
      "DELETE FROM sessions WHERE refresh_token = $1",
      [hashedToken]
    );

    res.json({ message: "Sesión cerrada" });
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar sesión" });
  }
};