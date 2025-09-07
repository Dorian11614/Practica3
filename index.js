import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const PORT = process.env.PORT || 3000;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: "dpg-d2qbab2dbo4c73bv670g-a.oregon-postgres.render.com",
        database: "basededatos_9ymq",
        user: "basededatos_9ymq_user",
        password: "JSYNNiI228jUn7467aDGAsshguudnEiu",
        port: 5432,
        ssl: { rejectUnauthorized: false },
      }
);

const app = express();
app.use(cors());
app.use(express.json());

async function db(queryText, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(queryText, params);
    return result;
  } finally {
    client.release();
  }
}

app.get("/api/saludo", (_req, res) => {
  res.json({
    ok: true,
    mensaje: "Hola, bienvenido a mi API PRACTICA #3",
    fecha: new Date().toISOString(),
  });
});

app.get("/api/usuarios", async (_req, res, next) => {
  try {
    const { rows } = await db(
      `SELECT id_usuario, nombre, correo, password, fecha_reg
       FROM usuarios
       ORDER BY id_usuario ASC;`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error SELECT usuarios:", err);
    next({ status: 500, payload: { ok: false, error: "Error consultando usuarios" } });
  }
});

app.post("/api/usuarios", async (req, res, next) => {
  try {
    const { nombre, correo, password } = req.body;
    const { rows } = await db(
      `INSERT INTO usuarios (nombre, correo, password)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, correo, password, fecha_reg;`,
      [nombre, correo, password]
    );
    res.status(201).json({ ok: true, usuario: rows[0] });
  } catch (err) {
    console.error("Error INSERT usuario:", err);
    if (err.code === "23505") {
      return next({ status: 409, payload: { ok: false, error: "correo_duplicado" } });
    }
    next({ status: 500, payload: { ok: false, error: "Error creando usuario" } });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "not_found" });
});

app.use((err, _req, res, _next) => {
  const status = err?.status || 500;
  const payload = err?.payload || { ok: false, error: "internal_error" };
  res.status(status).json(payload);
});

const server = app.listen(PORT, () => {
  console.log(Servidor corriendo en http://localhost:${PORT});
});

function shutdown(signal) {
  console.log(\nRecibido ${signal}. Cerrando servidor...);
  server.close(async () => {
    try {
      await pool.end();
      console.log("Pool de Postgres cerrado. ¡Listo!");
      process.exit(0);
    } catch (e) {
      console.error("Error al cerrar pool:", e);
      process.exit(1);
    }
  });
}

["SIGINT", "SIGTERM"].forEach(sig => process.on(sig, () => shutdown(sig)));
