let editor;
let currentErrors = [];

// Inicializar Monaco Editor
require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    // Configurar el editor
    editor = monaco.editor.create(document.getElementById('monacoEditor'), {
        value: `// Bienvenido al Editor de Código
// Escribe tu código aquí y haz clic en "Analizar Código"

function ejemplo() {
    let mensaje = "Hola Mundo";
    console.log(mensaje);
    
    // Error intencional para demostración
    let variable_no_definida = x + 1;
    
    return mensaje;
}

ejemplo();`,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        bracketPairColorization: { enabled: true },
        guides: {
            indentation: true,
            bracketPairs: true
        }
    });

    // Event listeners
    setupEventListeners();
    
    // Actualizar información de posición del cursor
    editor.onDidChangeCursorPosition(updateCursorPosition);
    
    // Analizar código automáticamente al cambiar
    editor.onDidChangeModelContent(debounce(analyzeCode, 1000));
});

function setupEventListeners() {
    // Selector de lenguaje
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const language = e.target.value;
        monaco.editor.setModelLanguage(editor.getModel(), language);
        document.getElementById('languageInfo').textContent = e.target.options[e.target.selectedIndex].text;
        analyzeCode();
    });

    // Botón de analizar
    document.getElementById('analyzeBtn').addEventListener('click', analyzeCode);

    // Botón de limpiar errores
    document.getElementById('clearErrorsBtn').addEventListener('click', clearErrors);
}

function updateCursorPosition(e) {
    const position = e.position;
    document.getElementById('lineInfo').textContent = `Línea ${position.lineNumber}, Columna ${position.column}`;
}

function analyzeCode() {
    const code = editor.getValue();
    const language = document.getElementById('languageSelect').value;
    
    // Limpiar errores anteriores
    clearErrors();
    
    // Detectar errores según el lenguaje
    const errors = detectErrors(code, language);
    
    // Mostrar errores en el editor
    showErrorsInEditor(errors);
    
    // Mostrar errores en el panel
    showErrorsInPanel(errors);
    
    // Actualizar contador
    updateErrorCount(errors.length);
    
    // Actualizar estado
    document.getElementById('statusInfo').textContent = errors.length > 0 ? `${errors.length} errores detectados` : 'Análisis completado';
}

function detectErrors(code, language) {
    const errors = [];
    const lines = code.split('\n');
    
    // Análisis básico de sintaxis
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('//')) return;
        
        // Detección de errores comunes
        switch (language) {
            case 'javascript':
                detectJavaScriptErrors(trimmedLine, lineNumber, errors);
                break;
            case 'python':
                detectPythonErrors(trimmedLine, lineNumber, errors);
                break;
            case 'java':
                detectJavaErrors(trimmedLine, lineNumber, errors);
                break;
            case 'cpp':
                detectCppErrors(trimmedLine, lineNumber, errors);
                break;
            case 'html':
                detectHtmlErrors(trimmedLine, lineNumber, errors);
                break;
            case 'css':
                detectCssErrors(trimmedLine, lineNumber, errors);
                break;
            case 'json':
                detectJsonErrors(code, errors);
                return; // JSON se analiza de forma diferente
        }
    });
    
    // Validación JSON específica
    if (language === 'json') {
        try {
            JSON.parse(code);
        } catch (e) {
            const match = e.message.match(/line (\d+)/i);
            const lineNumber = match ? parseInt(match[1]) : 1;
            errors.push({
                severity: 'error',
                line: lineNumber,
                message: 'Error de sintaxis JSON: ' + e.message,
                code: line
            });
        }
    }
    
    return errors;
}

function detectJavaScriptErrors(line, lineNumber, errors) {
    // Detectar variables no definidas
    if (line.includes('=') && !line.includes('let ') && !line.includes('const ') && !line.includes('var ')) {
        if (line.match(/(\w+)\s*=/) && !line.includes('function') && !line.includes('=>')) {
            errors.push({
                severity: 'warning',
                line: lineNumber,
                message: 'Variable sin declaración (let/const/var)',
                code: line
            });
        }
    }
    
    // Detectar punto y coma faltante
    if (line.endsWith('}') || line.includes('console.log') || line.includes('return')) {
        if (!line.endsWith(';') && !line.endsWith('}') && !line.includes('if') && !line.includes('for') && !line.includes('while')) {
            errors.push({
                severity: 'warning',
                line: lineNumber,
                message: 'Falta punto y coma al final de la línea',
                code: line
            });
        }
    }
    
    // Detectar paréntesis sin cerrar
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        errors.push({
            severity: 'error',
            line: lineNumber,
            message: 'Paréntesis desbalanceados',
            code: line
        });
    }
}

function detectPythonErrors(line, lineNumber, errors) {
    // Detectar indentación incorrecta (simplificado)
    if (line.length > 0 && !line.startsWith(' ') && !line.startsWith('\t') && lineNumber > 1) {
        if (line.includes(':') || line.includes('if ') || line.includes('for ') || line.includes('while ') || line.includes('def ')) {
            errors.push({
                severity: 'warning',
                line: lineNumber,
                message: 'Posible error de indentación en Python',
                code: line
            });
        }
    }
    
    // Detectar dos puntos faltantes
    if ((line.includes('if ') || line.includes('for ') || line.includes('while ') || line.includes('def ') || line.includes('class ')) && !line.endsWith(':')) {
        errors.push({
            severity: 'error',
            line: lineNumber,
            message: 'Faltan dos puntos (:) al final',
            code: line
        });
    }
}

function detectJavaErrors(line, lineNumber, errors) {
    // Detectar clase sin llave de cierre
    if (line.includes('class ') && !line.includes('{')) {
        errors.push({
            severity: 'error',
            line: lineNumber,
            message: 'Falta llave de apertura { después de la declaración de clase',
            code: line
        });
    }
    
    // Detectar método sin tipo de retorno
    if (line.includes('public ') || line.includes('private ') || line.includes('protected ')) {
        if (line.includes('(') && !line.includes('void') && !line.includes('int') && !line.includes('String') && !line.includes('boolean') && !line.includes('double') && !line.includes('float') && !line.includes('long') && !line.includes('char')) {
            errors.push({
                severity: 'warning',
                line: lineNumber,
                message: 'Método sin tipo de retorno especificado',
                code: line
            });
        }
    }
}

function detectCppErrors(line, lineNumber, errors) {
    // Detectar include sin #
    if (line.includes('include') && !line.startsWith('#')) {
        errors.push({
            severity: 'error',
            line: lineNumber,
            message: 'Directiva include debe comenzar con #',
            code: line
        });
    }
    
    // Detectar punto y coma faltante
    if (line.includes('cout') || line.includes('cin') || line.includes('return')) {
        if (!line.endsWith(';')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                message: 'Falta punto y coma al final',
                code: line
            });
        }
    }
}

function detectHtmlErrors(line, lineNumber, errors) {
    // Detectar etiquetas no cerradas
    const openTags = line.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = line.match(/<\/(\w+)>/g) || [];
    
    openTags.forEach(tag => {
        const tagName = tag.match(/<(\w+)/)[1];
        if (!line.includes(`</${tagName}>`) && !tag.endsWith('/>')) {
            errors.push({
                severity: 'warning',
                line: lineNumber,
                message: `Etiqueta <${tagName}> posiblemente no cerrada`,
                code: line
            });
        }
    });
}

function detectCssErrors(line, lineNumber, errors) {
    // Detectar propiedades sin dos puntos
    if (line.includes('{') || line.includes('}')) return;
    
    if (line.trim() && !line.includes(':') && !line.includes('@')) {
        errors.push({
            severity: 'warning',
            line: lineNumber,
            message: 'Propiedad CSS sin dos puntos (:)',
            code: line
        });
    }
    
    // Detectar falta de punto y coma
    if (line.includes(':') && !line.endsWith(';') && !line.endsWith('}')) {
        errors.push({
            severity: 'warning',
            line: lineNumber,
            message: 'Falta punto y coma (;) al final de la propiedad',
            code: line
        });
    }
}

function detectJsonErrors(code, errors) {
    try {
        JSON.parse(code);
    } catch (e) {
        const match = e.message.match(/line (\d+)/i);
        const lineNumber = match ? parseInt(match[1]) : 1;
        const lines = code.split('\n');
        const line = lines[lineNumber - 1] || '';
        
        errors.push({
            severity: 'error',
            line: lineNumber,
            message: 'Error de sintaxis JSON: ' + e.message,
            code: line
        });
    }
}

function showErrorsInEditor(errors) {
    // Limpiar marcadores anteriores
    monaco.editor.setModelMarkers(editor.getModel(), 'owner', []);
    
    // Crear marcadores para cada error
    const markers = errors.map(error => ({
        severity: error.severity === 'error' ? monaco.MarkerSeverity.Error : 
                  error.severity === 'warning' ? monaco.MarkerSeverity.Warning : 
                  monaco.MarkerSeverity.Info,
        message: error.message,
        startLineNumber: error.line,
        startColumn: 1,
        endLineNumber: error.line,
        endColumn: 1000
    }));
    
    monaco.editor.setModelMarkers(editor.getModel(), 'owner', markers);
}

function showErrorsInPanel(errors) {
    const errorsList = document.getElementById('errorsList');
    
    if (errors.length === 0) {
        errorsList.innerHTML = `
            <div class="empty-state">
                <p>No se detectaron errores</p>
                <small>Escribe código y haz clic en "Analizar Código"</small>
            </div>
        `;
        return;
    }
    
    errorsList.innerHTML = errors.map(error => `
        <div class="error-item ${error.severity}" onclick="goToLine(${error.line})">
            <div class="error-header">
                <span class="error-severity ${error.severity}">${error.severity}</span>
                <span class="error-line">Línea ${error.line}</span>
            </div>
            <div class="error-message">${error.message}</div>
            ${error.code ? `<div class="error-code">${escapeHtml(error.code.trim())}</div>` : ''}
        </div>
    `).join('');
}

function goToLine(lineNumber) {
    editor.setPosition({ lineNumber: lineNumber, column: 1 });
    editor.revealLineInCenter(lineNumber);
    editor.focus();
}

function clearErrors() {
    currentErrors = [];
    monaco.editor.setModelMarkers(editor.getModel(), 'owner', []);
    showErrorsInPanel([]);
    updateErrorCount(0);
    document.getElementById('statusInfo').textContent = 'Listo';
}

function updateErrorCount(count) {
    const errorCount = document.getElementById('errorCount');
    if (count === 0) {
        errorCount.textContent = '0 errores';
        errorCount.style.color = '#858585';
    } else {
        errorCount.textContent = `${count} error${count === 1 ? '' : 'es'}`;
        errorCount.style.color = '#f85149';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Hacer la función goToLine global para que pueda ser llamada desde el HTML
window.goToLine = goToLine;
