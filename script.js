function analizar() {
  const resultado = document.getElementById("resultado");

  // Simulación de respuesta
  const tipo = Math.random();

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
   //Preparado para backend!!!
  // Acá después se reemplaza esta simulación por un fetch al backend
}