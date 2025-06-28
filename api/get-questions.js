import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { grado, tema } = req.body;

  if (!grado || !tema) {
    return res.status(400).json({ error: 'Grado y tema son requeridos' });
  }

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
  }
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const text = completion.choices[0].message.content?.trim();

    if (!text) return res.status(500).json({ error: 'Respuesta vacía de OpenAI' });

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (e) {
      console.error("❌ Error al convertir JSON:", e);
      return res.status(500).json({ error: 'Formato JSON inválido desde OpenAI.' });
    }

    if (!Array.isArray(questions)) {
      return res.status(500).json({ error: 'La respuesta no es un arreglo' });
    }

    return res.status(200).json({ questions: { questions } });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: 'Error generando preguntas con OpenAI' });
  }
}
