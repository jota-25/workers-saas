import { pool } from "../db.js";
import {createWorkerSchema,updateWorkerSchema,idSchema} from "../schemas/worker.schema.js";
import { logActivity } from "../utils/logger.js";
import { generateInviteToken } from "../utils/invite.js";
import { logAudit } from "../utils/audit.js";
import { sendEmail } from "../utils/mailer.js";

/* filtros del CRUD
  filtro de busqueda por nombre

export const getWorkers = async (req, res) => {
  const { name } = req.query;

  let query = "SELECT * FROM workers";
  let values = [];

  if (name) {
    query += " WHERE name ILIKE $1";
    values.push(`%${name}%`);
  }

  const result = await pool.query(query, values);
  res.json(result.rows);
};*/

// paginacion del crud 

/* export const getWorkers = async (req, res) => {
  const { page = 1, limit = 5 } = req.query;

  const offset = (page - 1) * limit;

  const result = await pool.query(
    "SELECT * FROM workers LIMIT $1 OFFSET $2",
    [limit, offset]
  );

  res.json({
    page: Number(page),
    limit: Number(limit),
    data: result.rows
  });
};*/



// version que junta los 2 para no hacerlo por separado
// es la mejor ya que solo se puede exportar un getWorkers por ende es mejor
// ademas para hacerlo por separado tendria que crear otra ruta solo para las paginacion
export const getWorkers = async (req, res, next) => {
  try{
    const { name, page = 1, limit = 5 } = req.query;

    let query = "SELECT * FROM workers WHERE is_active=true";
    let values = [];
    let count = 1;

      if (name) {
        query += ` AND name ILIKE $${count}`;
        values.push(`%${name}%`);
        count++;
      }

   query += ` LIMIT $${count} OFFSET $${count + 1}`;
    values.push(limit, (page - 1) * limit);

    const result = await pool.query(query, values);
    res.json(result.rows);

  
  } catch (error) {
    next(error);
  }
};
// Este es el Crud de CREAR Y ELIMINAR

/*   este es bueno solo que no  validad por ende puede ver errores e incluso bugs o crear workers vacios generando datos basura

export const createWorker = async (req, res) => {
  const { name, email, position } = req.body;

  const result = await pool.query(
    "INSERT INTO workers (name, email, position) VALUES ($1,$2,$3) RETURNING *",
    [name, email, position]
  );

  res.json(result.rows[0]);
};*/
//version mejorada de crear traabajadores
/*export const createWorker = async (req, res) => {
  try {
    const { name, email, position } = req.body;

    if (!name || !email || !position) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    const result = await pool.query(
      "INSERT INTO workers (name, email, position) VALUES ($1,$2,$3) RETURNING *",
      [name, email, position]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
};
// lo mismo para el update
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, position } = req.body;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }
    }

    const result = await pool.query(
      "UPDATE workers SET name=$1, email=$2, position=$3 WHERE id=$4 RETURNING *",
      [name, email, position, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM workers WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Worker no encontrado" });
    }

    res.json({ message: "Worker eliminado", worker: result.rows[0] });
  } catch (error) {
    res.status(400).json({ error: "ID inválido" });
  }
};*/
/* a los de arriba aun so basicos ya que les falta muchas cosas como
 el tipo :typeof name === "string" 
 longitud: name.length >= 3
  el formato : ya sea gmail, telefono, fechas, etc 
  etc*/
  //ahora si el verdadero el anterior solo era para entender ya que esto se suele hacer con librerias
 // como de Zod, Joi, Yup, express-validator      usaremos zod  (para eso se instala con npm y se crea una nueva ruta schemas)
 
 // primero importamos desde schemas para usar como abajo ya que en el worker.schemas ya se dio los parametros




export const createWorker = async (req, res, next) => {
  try {
    const data = createWorkerSchema.parse(req.body);

    const { name, email, position } = data;

    const worker = await pool.query(
      `INSERT INTO workers (name,email,position)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [name, email, position]
    );

    const workerId = worker.rows[0].id;

    // obtener rol worker
    const role = await pool.query(
      "SELECT id FROM roles WHERE name='worker'"
    );

    const roleId = role.rows[0].id;

    // generar token
    const token = generateInviteToken();

    await pool.query(
      `INSERT INTO invitations
      (email,token,role_id,worker_id,expires_at)
      VALUES ($1,$2,$3,$4,NOW()+INTERVAL '2 days')`,
      [email, token, roleId, workerId]
    );

    // Enviar email con el token (en producción, aquí enviarías el email real)
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`; 

    await sendEmail({
      to: email,
      subject: "Invitación a Workers SaaS",
      html: `
        <h2>Bienvenido a Workers SaaS</h2>

        <p>Has sido invitado al sistema.</p>

        <p>
          Haz clic aquí para crear tu cuenta:
        </p>

        <a href="${inviteLink}">
          Crear cuenta
        </a>

        <p>El enlace expira en 2 días.</p>
      `
    });
    
    // Registra QUÉ PASÓ
    await logActivity({
      userId: req.user.id,
      action: "WORKER_CREATED",
      resource: "worker",
      resourceId: workerId,
      ip: req.ip
    });

    // Registra CÓMO CAMBIÓ (antes no existía, después existe)
    await logAudit({
      userId: req.user.id,
      action: "WORKER_CREATED",
      resource: "worker",
      resourceId: workerId,
      before: null,              // no existía antes
      after: worker.rows[0]     // así quedó
    });

    res.json({
      message: "Worker creado. Invitación enviada.",
      worker: worker.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

//update
export const updateWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateWorkerSchema.parse(req.body);
    const { name, email, position } = data;

    const before = await pool.query(
      "SELECT * FROM workers WHERE id=$1",
      [id]
    );

    const result = await pool.query(
      `UPDATE workers
       SET name=$1, email=$2, position=$3, updated_at=NOW()
       WHERE id=$4
       RETURNING *`,
      [name, email, position, id]
    );

    const after = result.rows[0];

    // Registra QUÉ PASÓ
    await logActivity({
      userId: req.user.id,
      action: "WORKER_UPDATED",
      resource: "worker",
      resourceId: id,
      ip: req.ip
    });

    // Registra CÓMO CAMBIÓ 
    await logAudit({
      userId: req.user.id,
      action: "WORKER_UPDATED",
      resource: "worker",
      resourceId: id,
      before: before.rows[0],
      after: after
    });

    res.json(after);

  } catch (error) {
    next(error);
  }
};

// para el delete
export const deleteWorker = async (req, res, next) => {
  try {
    const { id } = idSchema.parse(req.params);

    const result = await pool.query(
      "UPDATE workers SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Worker no encontrado" });
    }

    //  Registra QUÉ PASÓ
    await logActivity({
      userId: req.user.id,
      action: "WORKER_DELETED",
      resource: "worker",
      resourceId: id,
      ip: req.ip
    });

    // Registra CÓMO CAMBIÓ (is_active pasó de true a false)
    await logAudit({
      userId: req.user.id,
      action: "WORKER_DELETED",
      resource: "worker",
      resourceId: id,
      before: { ...result.rows[0], is_active: true },  // como estaba antes
      after: result.rows[0]                             // como quedó (is_active=false)
    });


    res.json({ message: "Worker desactivado", worker: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
