window.onload = function () {

  const textarea = document.getElementById("codigo");
  const boton = document.getElementById("btnAnalizar");
  const resultado = document.getElementById("resultado");
  const historial = document.getElementById("historial");

  const editor = CodeMirror.fromTextArea(textarea, {
    lineNumbers: true,
    mode: "javascript"
  });

  boton.onclick = function () {

    const tipo = Math.random();
    const item = document.createElement("li");

    if (tipo < 0.33) {
      resultado.innerText = "Error crítico: posible vulnerabilidad";
      resultado.style.backgroundColor = "#ffdddd";
      resultado.style.color = "#a70000";
    } 
    else if (tipo < 0.66) {
      resultado.innerText = "Warning: se puede mejorar el código";
      resultado.style.backgroundColor = "#fff3cd";
      resultado.style.color = "#856404";
    } 
    else {
      resultado.innerText = "Todo correcto ✔️";
      resultado.style.backgroundColor = "#d4edda";
      resultado.style.color = "#155724";
    }

    item.innerText = resultado.innerText;
    historial.appendChild(item);

  };

};