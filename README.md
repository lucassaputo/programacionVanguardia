# Code Editor App

Un frontend en Angular para análisis y edición de código con Monaco Editor y panel de hallazgos.

## Características

- ✅ Editor de código con Monaco Editor
- ✅ Resaltado de sintaxis automático
- ✅ Selección de múltiples lenguajes (JavaScript, TypeScript, Python, Java, C#, C++, HTML, CSS, JSON, XML)
- ✅ Análisis de código con detección de errores
- ✅ Panel de hallazgos con severidad, línea y descripción
- ✅ Diseño responsive para diferentes tamaños de pantalla
- ✅ Preparado para integración con backend Java vía API

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── code-editor/          # Componente del editor Monaco
│   │   ├── findings-panel/       # Panel de resultados de análisis
│   │   └── toolbar/              # Barra de herramientas
│   ├── services/
│   │   └── code-analysis.service # Servicio para análisis de código
│   ├── app.component.ts          # Componente principal
│   └── app.module.ts             # Módulo principal
├── assets/                       # Archivos estáticos
├── styles.scss                   # Estilos globales
└── index.html                    # Plantilla principal
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`

## Integración con Backend

El servicio `CodeAnalysisService` está configurado para conectarse a un backend Java en `http://localhost:8080/api`.

### Endpoint de Análisis

```typescript
POST /api/analyze
Content-Type: application/json

{
  "code": "string",
  "language": "string",
  "options": {
    "rules": ["string"],
    "severity": ["error", "warning", "info"]
  }
}
```

### Respuesta Esperada

```typescript
{
  "findings": [
    {
      "id": "string",
      "severity": "error|warning|info",
      "line": number,
      "column": number,
      "message": "string",
      "rule": "string",
      "category": "string"
    }
  ],
  "summary": {
    "total": number,
    "errors": number,
    "warnings": number,
    "info": number
  },
  "metadata": {
    "analyzedAt": "string",
    "processingTime": number,
    "language": "string",
    "linesOfCode": number
  }
}
```

## Diseño Responsive

La aplicación está optimizada para:

- **Desktop (>768px)**: Layout lado a lado con editor y panel de hallazgos
- **Tablet (≤768px)**: Layout vertical con panel de hallazgos abajo
- **Mobile (≤480px)**: Interfaz compacta con elementos adaptados

## Tecnologías Utilizadas

- Angular 17
- Monaco Editor
- TypeScript
- SCSS/Sass
- RxJS

## Desarrollo Futuro

- [ ] Integración real con backend Java
- [ ] Más reglas de análisis por lenguaje
- [ ] Temas personalizados para el editor
- [ ] Exportación de resultados
- [ ] Historial de análisis
