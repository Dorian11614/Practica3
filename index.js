import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: "dpg-d2qbab2dbo4c73bv670g-a.oregon-postgres.render.com",
  database: "basededatos_9ymq",
  user: "basededatos_9ymq_user",
  password: "JSYNNiI228jUn7467aDGAsshguudnEiu",
  port: 5432,
  ssl: { rejectUnauthorized: false }, 
});

app.get("/api/saludo", (_req, res) => {
  res.json({
    ok: true,
    mensaje: "Hola, bienvenido a mi API PRACTICA #3",
    fecha: new Date().toISOString(),
  });
});

app.get("/api/usuarios", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_usuario, nombre, correo, password, fecha_reg FROM usuarios ORDER BY id_usuario ASC;"
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error SELECT usuarios:", err);
    res.status(500).json({ ok: false, error: "Error consultando usuarios" });
  }
});

app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password)
       VALUES ($1, $2, $3)
       RETURNING id_usuario, nombre, correo, password, fecha_reg;`,
      [nombre, correo, password]
    );
    res.status(201).json({ ok: true, usuario: rows[0] });
  } catch (err) {
    console.error("Error INSERT usuario:", err);
    if (err.code === "23505") {
      return res.status(409).json({ ok: false, error: "correo_duplicado" });
    }
    res.status(500).json({ ok: false, error: "Error creando usuario" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "not_found" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
