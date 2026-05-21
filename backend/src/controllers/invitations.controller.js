import { pool } from "../db.js";
import { generateInviteToken } from "../utils/invite.js";
import { sendEmail } from "../utils/mailer.js";

// ================================
// LISTAR INVITACIONES
// ================================
export const getInvitations = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.email,
        i.expires_at,
        i.used,
        i.created_at,
        r.name AS role,
        w.name AS worker_name
      FROM invitations i
      LEFT JOIN roles r ON r.id = i.role_id
      LEFT JOIN workers w ON w.id = i.worker_id
      ORDER BY i.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// ================================
// REENVIAR INVITACIÓN
// ================================
export const resendInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Verificar que existe y no está usada
    const existing = await pool.query(
      `SELECT * FROM invitations WHERE id = $1 AND used = false`,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Invitación no encontrada o ya usada" });
    }

    // ✅ Generar nuevo token y extender expiración 2 días más
    const newToken = generateInviteToken();
    const newExpiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE invitations
       SET token = $1, expires_at = $2
       WHERE id = $3`,
      [newToken, newExpiry, id]
    );

    // En producción aquí enviarías el email
    //console.log(       `Invite reenviado: ${process.env.FRONTEND_URL || "http://localhost:5173"}/invite/${newToken}`    );

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${newToken}`;

    await sendEmail({
      to: existing.rows[0].email,
      subject: "Invitación reenviada",
      html: `
        <h2>Nueva invitación</h2>

        <p>Tu invitación fue reenviada.</p>

        <a href="${inviteLink}">
          Aceptar invitación
        </a>

        <p>El enlace expira en 2 días.</p>
      `
    });
    res.json({ message: "Invitación reenviada" });

  } catch (error) {
    next(error);
  }
};

// ================================
// CANCELAR INVITACIÓN
// ================================
export const cancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM invitations
       WHERE id = $1 AND used = false
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Invitación no encontrada o ya usada" });
    }

    res.json({ message: "Invitación cancelada" });

  } catch (error) {
    next(error);
  }
};