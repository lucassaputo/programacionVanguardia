<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor de Código con Monaco</title>
    <link rel="stylesheet" href="editor-styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Editor de Código</h1>
            <div class="controls">
                <select id="languageSelect">
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                </select>
                <button id="analyzeBtn">Analizar Código</button>
                <button id="clearErrorsBtn">Limpiar Errores</button>
            </div>
        </header>

        <main class="main-content">
            <div class="editor-section">
                <div class="editor-container">
                    <div id="monacoEditor"></div>
                </div>
            </div>

            <aside class="findings-panel">
                <div class="panel-header">
                    <h3>🔍 Hallazgos</h3>
                    <span id="errorCount" class="error-count">0 errores</span>
                </div>
                <div class="panel-content">
                    <div id="errorsList" class="errors-list">
                        <div class="empty-state">
                            <p>No se detectaron errores</p>
                            <small>Escribe código y haz clic en "Analizar Código"</small>
                        </div>
                    </div>
                </div>
            </aside>
        </main>

        <footer class="footer">
            <div class="status-bar">
                <span id="lineInfo">Línea 1, Columna 1</span>
                <span id="languageInfo">JavaScript</span>
                <span id="statusInfo">Listo</span>
            </div>
        </footer>
    </div>

    <script src="https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js"></script>
    <script src="editor-script.js"></script>
</body>
</html>
