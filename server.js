// server.js corregido y optimizado (20 preguntas numéricas con validación)
import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/api/get-questions', async (req, res) => {
  const { grado, tema } = req.body;

  if (!grado || !tema) {
    return res.status(400).json({ error: 'Grado y tema son requeridos' });
  }

  try {
    const prompt = `
Eres un profesor de física. Crea 20 preguntas numéricas de opción múltiple para estudiantes de ${grado}, sobre el tema "${tema}".
Cada pregunta debe ser un problema con números reales. Incluye 4 opciones (A-D), indicando cuál es correcta (por índice), y una solución con el procedimiento paso a paso y fórmula usada.
Devuelve las preguntas en formato JSON con esta estructura:
[
  {
    "question": "Un coche acelera desde el reposo a 4 m/s² durante 3 segundos. ¿Qué velocidad final alcanza?",
    "options": ["8 m/s", "10 m/s", "12 m/s", "15 m/s"],
    "correctIndex": 2,
    "solution": "Usamos v = a·t → v = 4 m/s² × 3 s = 12 m/s."
  },
  ...
]
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const responseText = completion.choices[0].message.content?.trim();

    console.log("Texto recibido de OpenAI:\n", responseText);

    if (!responseText) {
      return res.status(500).json({ error: 'Respuesta vacía de OpenAI' });
    }

    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ No se pudo convertir a JSON:", e.message);
      return res.status(500).json({ error: 'La respuesta de OpenAI no es un JSON válido.' });
    }

    if (!Array.isArray(questions)) {
      return res.status(500).json({ error: 'El JSON no es una lista de preguntas' });
    }

    res.json({ questions: { questions } });
  } catch (err) {
    console.error("Error general:", err);
    res.status(500).json({ error: 'Error generando preguntas con OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
