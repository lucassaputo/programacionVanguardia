const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Servir archivos estáticos del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'editor.html'));
});

// API REST para análisis de código
app.post('/api/analyze', async (req, res) => {
    try {
        const { code, language } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({
                success: false,
                error: 'Código y lenguaje son requeridos'
            });
        }

        // Analizar el código según el lenguaje
        const analysis = analyzeCode(code, language);
        
        res.json({
            success: true,
            errors: analysis.errors,
            warnings: analysis.warnings,
            info: analysis.info,
            metrics: analysis.metrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en análisis:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Endpoint para obtener lenguajes soportados
app.get('/api/languages', (req, res) => {
    res.json({
        success: true,
        languages: [
            { value: 'javascript', label: 'JavaScript', extensions: ['.js', '.jsx'] },
            { value: 'python', label: 'Python', extensions: ['.py'] },
            { value: 'java', label: 'Java', extensions: ['.java'] },
            { value: 'cpp', label: 'C++', extensions: ['.cpp', '.cc', '.cxx'] },
            { value: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
            { value: 'css', label: 'CSS', extensions: ['.css'] },
            { value: 'json', label: 'JSON', extensions: ['.json'] }
        ]
    });
});

// Función de análisis de código
function analyzeCode(code, language) {
    const errors = [];
    const warnings = [];
    const info = [];
    const lines = code.split('\n');
    
    // Métricas básicas
    const metrics = {
        totalLines: lines.length,
        codeLines: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
        commentLines: lines.filter(line => line.trim().startsWith('//')).length,
        emptyLines: lines.filter(line => !line.trim()).length,
        complexity: calculateComplexity(code, language)
    };

    // Análisis específico por lenguaje
    switch (language) {
        case 'javascript':
            analyzeJavaScript(code, lines, errors, warnings, info);
            break;
        case 'python':
            analyzePython(code, lines, errors, warnings, info);
            break;
        case 'java':
            analyzeJava(code, lines, errors, warnings, info);
            break;
        case 'cpp':
            analyzeCpp(code, lines, errors, warnings, info);
            break;
        case 'html':
            analyzeHtml(code, lines, errors, warnings, info);
            break;
        case 'css':
            analyzeCss(code, lines, errors, warnings, info);
            break;
        case 'json':
            analyzeJson(code, lines, errors, warnings, info);
            break;
    }

    return { errors, warnings, info, metrics };
}

// Análisis JavaScript
function analyzeJavaScript(code, lines, errors, warnings, info) {
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('//')) return;

        // Variables no declaradas
        if (trimmedLine.includes('=') && !trimmedLine.includes('let ') && !trimmedLine.includes('const ') && !trimmedLine.includes('var ')) {
            const match = trimmedLine.match(/(\w+)\s*=/);
            if (match && !trimmedLine.includes('function') && !trimmedLine.includes('=>') && !trimmedLine.includes('class ')) {
                warnings.push({
                    severity: 'warning',
                    line: lineNumber,
                    column: trimmedLine.indexOf(match[0]) + 1,
                    message: 'Variable sin declaración (let/const/var)',
                    code: trimmedLine,
                    type: 'undeclared-variable'
                });
            }
        }

        // Punto y coma faltante
        if (shouldHaveSemicolon(trimmedLine) && !trimmedLine.endsWith(';')) {
            warnings.push({
                severity: 'warning',
                line: lineNumber,
                column: trimmedLine.length,
                message: 'Falta punto y coma al final de la línea',
                code: trimmedLine,
                type: 'missing-semicolon'
            });
        }

        // Paréntesis desbalanceados
        const openParens = (trimmedLine.match(/\(/g) || []).length;
        const closeParens = (trimmedLine.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: 1,
                message: 'Paréntesis desbalanceados',
                code: trimmedLine,
                type: 'unbalanced-parentheses'
            });
        }

        // Llaves desbalanceadas
        const openBraces = (trimmedLine.match(/{/g) || []).length;
        const closeBraces = (trimmedLine.match(/}/g) || []).length;
        if (openBraces !== closeBraces && !trimmedLine.includes('if') && !trimmedLine.includes('for') && !trimmedLine.includes('while')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: 1,
                message: 'Llaves desbalanceadas',
                code: trimmedLine,
                type: 'unbalanced-braces'
            });
        }
    });

    // Análisis global del código
    const functionCount = (code.match(/function\s+\w+/g) || []).length;
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    
    if (functionCount > 0) {
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: `Se encontraron ${functionCount} función(es) en el código`,
            type: 'function-count'
        });
    }
    
    if (classCount > 0) {
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: `Se encontraron ${classCount} clase(s) en el código`,
            type: 'class-count'
        });
    }
}

// Análisis Python
function analyzePython(code, lines, errors, warnings, info) {
    let indentLevel = 0;
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        // Verificar indentación
        const currentIndent = line.length - line.trimStart().length;
        if (index > 0) {
            const prevLine = lines[index - 1];
            const prevTrimmed = prevLine.trim();
            
            if (prevTrimmed.endsWith(':') && currentIndent <= indentLevel) {
                errors.push({
                    severity: 'error',
                    line: lineNumber,
                    column: 1,
                    message: 'Error de indentación: se esperaba mayor indentación después de dos puntos',
                    code: trimmedLine,
                    type: 'indentation-error'
                });
            }
        }
        indentLevel = currentIndent;

        // Dos puntos faltantes
        if (shouldHaveColon(trimmedLine) && !trimmedLine.endsWith(':')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: trimmedLine.length,
                message: 'Faltan dos puntos (:) al final',
                code: trimmedLine,
                type: 'missing-colon'
            });
        }
    });

    // Análisis global
    const functionCount = (code.match(/def\s+\w+/g) || []).length;
    const classCount = (code.match(/class\s+\w+/g) || []).length;
    
    if (functionCount > 0) {
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: `Se encontraron ${functionCount} función(es) en el código`,
            type: 'function-count'
        });
    }
}

// Análisis Java
function analyzeJava(code, lines, errors, warnings, info) {
    let inClass = false;
    let hasMain = false;
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('//')) return;

        // Clases
        if (trimmedLine.includes('class ') && !trimmedLine.includes('{')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: 1,
                message: 'Falta llave de apertura { después de la declaración de clase',
                code: trimmedLine,
                type: 'missing-class-brace'
            });
        }
        
        if (trimmedLine.includes('class ')) {
            inClass = true;
        }

        // Método main
        if (trimmedLine.includes('public static void main')) {
            hasMain = true;
        }

        // Métodos sin tipo de retorno
        if ((trimmedLine.includes('public ') || trimmedLine.includes('private ') || trimmedLine.includes('protected ')) && 
            trimmedLine.includes('(')) {
            if (!trimmedLine.includes('void') && !trimmedLine.match(/\b(int|String|boolean|double|float|long|char|byte|short)\b/)) {
                warnings.push({
                    severity: 'warning',
                    line: lineNumber,
                    column: 1,
                    message: 'Método sin tipo de retorno especificado',
                    code: trimmedLine,
                    type: 'missing-return-type'
                });
            }
        }
    });

    if (inClass && !hasMain) {
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: 'Clase sin método main (no es ejecutable)',
            type: 'no-main-method'
        });
    }
}

// Análisis C++
function analyzeCpp(code, lines, errors, warnings, info) {
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('//')) return;

        // Directivas include
        if (trimmedLine.includes('include') && !trimmedLine.startsWith('#')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: 1,
                message: 'Directiva include debe comenzar con #',
                code: trimmedLine,
                type: 'invalid-include'
            });
        }

        // Punto y coma faltante
        if (needsSemicolonCpp(trimmedLine) && !trimmedLine.endsWith(';') && !trimmedLine.endsWith('{')) {
            errors.push({
                severity: 'error',
                line: lineNumber,
                column: trimmedLine.length,
                message: 'Falta punto y coma al final',
                code: trimmedLine,
                type: 'missing-semicolon'
            });
        }
    });

    // Análisis global
    const includeCount = (code.match(/#include/g) || []).length;
    if (includeCount > 0) {
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: `Se encontraron ${includeCount} directiva(s) include`,
            type: 'include-count'
        });
    }
}

// Análisis HTML
function analyzeHtml(code, lines, errors, warnings, info) {
    const openTags = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine) return;

        // Encontrar etiquetas
        const tags = trimmedLine.match(/<[^>]+>/g) || [];
        
        tags.forEach(tag => {
            if (tag.startsWith('</')) {
                // Etiqueta de cierre
                const tagName = tag.match(/<\/(\w+)/)[1];
                const lastOpenIndex = openTags.lastIndexOf(tagName);
                if (lastOpenIndex === -1) {
                    errors.push({
                        severity: 'error',
                        line: lineNumber,
                        column: trimmedLine.indexOf(tag) + 1,
                        message: `Etiqueta de cierre </${tagName}> sin apertura correspondiente`,
                        code: trimmedLine,
                        type: 'unmatched-closing-tag'
                    });
                } else {
                    openTags.splice(lastOpenIndex, 1);
                }
            } else if (!tag.endsWith('/>')) {
                // Etiqueta de apertura
                const tagName = tag.match(/<(\w+)/)[1];
                if (!['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
                    openTags.push(tagName);
                }
            }
        });
    });

    // Etiquetas sin cerrar
    openTags.forEach(tagName => {
        warnings.push({
            severity: 'warning',
            line: lines.length,
            column: 1,
            message: `Etiqueta <${tagName}> no fue cerrada`,
            type: 'unclosed-tag'
        });
    });
}

// Análisis CSS
function analyzeCss(code, lines, errors, warnings, info) {
    let inRule = false;
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        if (!trimmedLine || trimmedLine.startsWith('/*')) return;

        if (trimmedLine.includes('{')) {
            inRule = true;
        } else if (trimmedLine.includes('}')) {
            inRule = false;
        } else if (inRule) {
            // Propiedades CSS
            if (!trimmedLine.includes(':')) {
                errors.push({
                    severity: 'error',
                    line: lineNumber,
                    column: 1,
                    message: 'Propiedad CSS sin dos puntos (:)',
                    code: trimmedLine,
                    type: 'invalid-property'
                });
            } else if (!trimmedLine.endsWith(';')) {
                warnings.push({
                    severity: 'warning',
                    line: lineNumber,
                    column: trimmedLine.length,
                    message: 'Falta punto y coma (;) al final de la propiedad',
                    code: trimmedLine,
                    type: 'missing-semicolon'
                });
            }
        }
    });
}

// Análisis JSON
function analyzeJson(code, lines, errors, warnings, info) {
    try {
        JSON.parse(code);
        info.push({
            severity: 'info',
            line: 1,
            column: 1,
            message: 'JSON válido',
            type: 'valid-json'
        });
    } catch (e) {
        const match = e.message.match(/line (\d+)/i);
        const lineNumber = match ? parseInt(match[1]) : 1;
        const line = lines[lineNumber - 1] || '';
        
        errors.push({
            severity: 'error',
            line: lineNumber,
            column: 1,
            message: 'Error de sintaxis JSON: ' + e.message,
            code: line,
            type: 'json-syntax-error'
        });
    }
}

// Funciones auxiliares
function shouldHaveSemicolon(line) {
    return line.includes('console.log') || 
           line.includes('return') || 
           line.match(/^\w+\s*=.*$/) ||
           line.includes('break') ||
           line.includes('continue');
}

function shouldHaveColon(line) {
    return line.includes('if ') || 
           line.includes('for ') || 
           line.includes('while ') || 
           line.includes('def ') || 
           line.includes('class ') ||
           line.includes('elif ') ||
           line.includes('else:');
}

function needsSemicolonCpp(line) {
    return line.includes('cout') || 
           line.includes('cin') || 
           line.includes('return') ||
           line.match(/^\w+\s+\w+\s*=.*$/);
}

function calculateComplexity(code, language) {
    let complexity = 1; // Base complexity
    
    // Contar estructuras de control
    complexity += (code.match(/if\s*\(.*\)/g) || []).length;
    complexity += (code.match(/for\s*\(.*\)/g) || []).length;
    complexity += (code.match(/while\s*\(.*\)/g) || []).length;
    complexity += (code.match(/switch\s*\(.*\)/g) || []).length;
    complexity += (code.match(/case\s+.*:/g) || []).length;
    
    // Contar operadores lógicos
    complexity += (code.match(/&&|\|\|/g) || []).length;
    
    return complexity;
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Editor disponible en http://localhost:${PORT}/editor.html`);
    console.log(`🔍 API disponible en http://localhost:${PORT}/api/analyze`);
});

module.exports = app;
