// public/app.js actualizado con mejor manejo de errores

let preguntas = [];
let respuestasUsuario = [];
let preguntaActual = 0;

const resultado = document.getElementById("resultado");
const botonVolver = document.querySelector(".back-btn");

async function generarPreguntas() {
  const grado = document.getElementById("grado").value.trim();
  const tema = document.getElementById("tema").value.trim();

  if (!grado || !tema) return alert("Completa ambos campos.");

  resultado.innerHTML = '<p class="loading">Generando preguntas...</p>';

  try {
    const res = await fetch("/api/get-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado, tema })
    });

    const text = await res.text();

    if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
    if (!text) throw new Error("Respuesta vacía del servidor");

    const data = JSON.parse(text);
    if (!data.questions || !data.questions.questions) throw new Error("Respuesta inválida del servidor");

    const todas = data.questions.questions;
    const unicas = [...new Map(todas.map(q => [q.question, q])).values()];
    preguntas = unicas.slice(0, 20);

    respuestasUsuario = [];
    preguntaActual = 0;

    mostrarPregunta();
  } catch (error) {
    console.error("Error en generarPreguntas:", error);
    resultado.innerHTML = `<p class="error">❌ ${error.message}</p>`;
  }
}

function mostrarPregunta() {
  const q = preguntas[preguntaActual];
  resultado.innerHTML = `
    <h2>Pregunta ${preguntaActual + 1} de ${preguntas.length}</h2>
    <p class="question-text">${q.question}</p>
    <ul class="options">
      ${q.options.map((opt, i) => `<li><button class="option-btn" onclick="guardarRespuesta(${i})">${String.fromCharCode(65 + i)}. ${opt}</button></li>`).join("")}
    </ul>
  `;
}

function guardarRespuesta(indice) {
  respuestasUsuario.push(indice);
  preguntaActual++;

  if (preguntaActual < preguntas.length) {
    mostrarPregunta();
  } else {
    mostrarResultado();
  }
}

function mostrarResultado() {
  let correctas = 0;
  preguntas.forEach((p, i) => {
    if (respuestasUsuario[i] === p.correctIndex) correctas++;
  });

  resultado.innerHTML = `
    <h2>Juego finalizado ✅</h2>
    <p>Obtuviste <strong>${correctas} / ${preguntas.length}</strong> respuestas correctas.</p>
    <button class="solucionario-btn" onclick="verSolucionario()">📘 Ver Solucionario</button>
  `;
  botonVolver.style.display = "inline-block";
}

function verSolucionario() {
  resultado.innerHTML = `<h2>📘 Solucionario Completo</h2>`;
  preguntas.forEach((p, i) => {
    const esCorrecta = respuestasUsuario[i] === p.correctIndex;
    const color = esCorrecta ? "#4caf50" : "#f44336";
    resultado.innerHTML += `
      <div style="border: 1px solid ${color}; padding: 10px; border-radius: 8px; margin-bottom: 15px; background-color: #f9f9f9">
        <p><strong>Pregunta ${i + 1}:</strong> ${p.question}</p>
        <ul>
          ${p.options.map((opt, idx) => `<li${idx === p.correctIndex ? ' style="font-weight:bold;color:#4caf50;"' : ''}>${String.fromCharCode(65 + idx)}. ${opt}</li>`).join("")}
        </ul>
        <p><strong>Tu respuesta:</strong> ${String.fromCharCode(65 + respuestasUsuario[i])} (${esCorrecta ? 'Correcta' : 'Incorrecta'})</p>
        <p><strong>Explicación detallada:</strong> ${p.solution}</p>
      </div>
    `;
  });
  botonVolver.style.display = "inline-block";
}

function volverInicio() {
  document.getElementById("grado").value = "";
  document.getElementById("tema").value = "";
  resultado.innerHTML = "";
  botonVolver.style.display = "none";
  preguntas = [];
  respuestasUsuario = [];
  preguntaActual = 0;
}

window.generarPreguntas = generarPreguntas;
window.volverInicio = volverInicio;
window.verSolucionario = verSolucionario;
