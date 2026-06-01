import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Editor from '@monaco-editor/react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileWarning,
  History,
  LogIn,
  LogOut,
  Play,
  RotateCcw,
  Search,
  Square,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { analyzeCode, getAuditDetail, getAuditHistory, getAuditMetrics, loginUser, registerUser } from './api';
import './styles.css';

const initialCode = `public class Demo {
    public void buscarUsuario(int userId) {
        String sql = "SELECT * FROM users WHERE id=" + userId;
        System.out.println(sql);
    }
}`;

const languageOptions = [
  { value: '', label: 'Todos' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
];

const riskOptions = [
  { value: '', label: 'Todos' },
  { value: 'critical', label: 'Critico' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Bajo' },
];

const terminalStatuses = new Set(['success', 'failed']);
const historyPageSize = 8;

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auditToken') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('auditEmail') || '');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(initialCode);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyFilters, setHistoryFilters] = useState({ language: '', riskLevel: '' });
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [status, setStatus] = useState('Listo');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [activeStep, setActiveStep] = useState('analysis');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const analysisControllerRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const isAuthenticated = Boolean(token);
  const findingCount = analysis?.findings?.length || 0;
  const lineCount = code.split('\n').length;

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'audit', markers);
  }, [markers]);

  useEffect(() => {
    if (!token) {
      setHistory([]);
      return;
    }

    const controller = new AbortController();
    loadDashboard(token, historyFilters, controller.signal, historyPage);

    return () => controller.abort();
  }, [token, historyFilters, historyPage]);

  useEffect(() => {
    const expiresAt = localStorage.getItem('auditTokenExpiresAt');
    if (!token || !expiresAt) {
      return;
    }

    const msUntilExpiration = new Date(expiresAt).getTime() - Date.now();
    if (msUntilExpiration <= 0) {
      handleLogout();
      setAuthError('Sesion expirada. Inicia sesion nuevamente.');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleLogout();
      setAuthError('Sesion expirada. Inicia sesion nuevamente.');
    }, msUntilExpiration);

    return () => window.clearTimeout(timeoutId);
  }, [token]);

  useEffect(() => () => stopAnalysisTracking(), []);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setIsSubmittingAuth(true);

    try {
      if (authMode === 'register') {
        await registerUser(authForm);
      }

      const loginResponse = await loginUser(authForm);
      if (!loginResponse.token) {
        throw new Error('No se recibio un token de sesion.');
      }

      localStorage.setItem('auditToken', loginResponse.token);
      localStorage.setItem('auditEmail', loginResponse.email);
      if (loginResponse.expiresAt) {
        localStorage.setItem('auditTokenExpiresAt', loginResponse.expiresAt);
      }
      setToken(loginResponse.token);
      setEmail(loginResponse.email);
      setAuthMessage('');
      setAuthForm({ email: '', password: '' });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('auditToken');
    localStorage.removeItem('auditEmail');
    localStorage.removeItem('auditTokenExpiresAt');
    stopAnalysisTracking();
    setToken('');
    setEmail('');
    setAnalysis(null);
    setHistory([]);
    setMetrics(null);
    setHistoryError('');
    setMarkers([]);
    setStatus('Listo');
    setAnalysisError('');
  }

  function handleUnauthorized(error) {
    if (error.status === 401 || error.message.toLowerCase().includes('token')) {
      handleLogout();
      setAuthError('Sesion expirada. Inicia sesion nuevamente.');
      return true;
    }
    return false;
  }

  async function loadHistory(activeToken = token, filters = historyFilters, page = historyPage) {
    if (!activeToken) {
      return;
    }

    try {
      setHistoryError('');
      const response = await getAuditHistory(activeToken, filters, { page, size: historyPageSize });
      setHistory(Array.isArray(response) ? response : []);
    } catch (error) {
      setHistoryError(error.message);
      handleUnauthorized(error);
    }
  }

  function handleAuthModeChange(nextMode) {
    setAuthMode(nextMode);
    setAuthError('');
    setAuthMessage('');
  }

  async function loadMetrics(activeToken = token) {
    if (!activeToken) {
      return;
    }

    try {
      setMetrics(await getAuditMetrics(activeToken));
    } catch (error) {
      handleUnauthorized(error);
    }
  }

  async function loadDashboard(activeToken = token, filters = historyFilters, signal, page = historyPage) {
    if (!activeToken) {
      return;
    }

    try {
      setHistoryError('');
      const [historyResponse, metricsResponse] = await Promise.all([
        getAuditHistory(activeToken, filters, { signal, page, size: historyPageSize }),
        getAuditMetrics(activeToken, { signal }),
      ]);
      setHistory(Array.isArray(historyResponse) ? historyResponse : []);
      setMetrics(metricsResponse);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setHistoryError(error.message);
      handleUnauthorized(error);
    }
  }

  async function handleOpenAudit(auditId, options = {}) {
    if (!token) {
      return;
    }

    setStatus('Cargando auditoria...');
    try {
      const detail = await getAuditDetail({ token, auditId, signal: options.signal });
      setLanguage(detail.language || 'java');
      setCode(detail.code || '');
      setAnalysis(detail);
      setMarkers(buildMarkers(detail.findings || []));
      setStatus(statusLabel(detail.status));
      setActiveStep('results');
    } catch (error) {
      handleUnauthorized(error);
      setAnalysis({ status: 'failed', findings: [], pedagogicalExplanation: error.message, refactoredCode: '' });
      setStatus('Error');
    }
  }

  async function handleAnalyze() {
    stopAnalysisTracking();
    setAnalysis(null);
    setMarkers([]);
    setAnalysisError('');

    if (!token) {
      setStatus('Inicia sesion para analizar');
      return;
    }

    if (!code.trim()) {
      setStatus('El codigo no puede estar vacio');
      return;
    }

    setIsAnalyzing(true);
    setStatus('Creando auditoria...');

    try {
      const controller = new AbortController();
      analysisControllerRef.current = controller;
      const response = await analyzeCode({ token, language, code, signal: controller.signal });
      setAnalysis(response);
      setStatus(statusLabel(response.status));
      setActiveStep('results');
      await loadDashboard(token, historyFilters, undefined, historyPage);
      pollAudit(response.auditId, controller.signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        setStatus('Analisis cancelado');
        return;
      }
      handleUnauthorized(error);
      setAnalysisError(error.message);
      setAnalysis({ status: 'failed', findings: [], pedagogicalExplanation: error.message, refactoredCode: '' });
      setStatus('Error');
      setIsAnalyzing(false);
    }
  }

  async function pollAudit(auditId, signal) {
    if (!auditId || !token || signal?.aborted) {
      setIsAnalyzing(false);
      return;
    }

    try {
      const detail = await getAuditDetail({ token, auditId, signal });
      setAnalysis(detail);
      setMarkers(buildMarkers(detail.findings || []));
      setStatus(statusLabel(detail.status));

      if (terminalStatuses.has(detail.status)) {
        setIsAnalyzing(false);
        await loadDashboard(token, historyFilters, undefined, historyPage);
        return;
      }

      pollTimeoutRef.current = window.setTimeout(() => pollAudit(auditId, signal), 1500);
    } catch (error) {
      if (error.name === 'AbortError') {
        setStatus('Seguimiento cancelado');
        setIsAnalyzing(false);
        return;
      }
      handleUnauthorized(error);
      setAnalysisError(error.message);
      setStatus('Error consultando auditoria');
      setIsAnalyzing(false);
    }
  }

  function stopAnalysisTracking() {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (analysisControllerRef.current) {
      analysisControllerRef.current.abort();
      analysisControllerRef.current = null;
    }
  }

  function handleCancelAnalysis() {
    stopAnalysisTracking();
    setIsAnalyzing(false);
    setStatus('Seguimiento cancelado');
  }

  function handleFilterChange(nextFilters) {
    setHistoryPage(0);
    setHistoryFilters(nextFilters);
  }

  function handleClearCode() {
    setCode('');
    setMarkers([]);
    setAnalysis(null);
    setAnalysisError('');
    setStatus('Listo');
  }

  function handleRestoreExample() {
    setCode(initialCode);
    setLanguage('java');
    setMarkers([]);
    setAnalysis(null);
    setAnalysisError('');
    setStatus('Ejemplo restaurado');
  }

  function handleGoToEditor(line) {
    setActiveStep('analysis');
    window.setTimeout(() => {
      if (!editorRef.current || !Number.isInteger(line) || line <= 0) {
        editorRef.current?.focus();
        return;
      }

      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }, 0);
  }

  const editorOptions = useMemo(() => ({
    minimap: { enabled: true },
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
  }), []);

  if (!isAuthenticated) {
    const isRegisterMode = authMode === 'register';

    return (
      <main className="auth-screen">
        <section className="auth-hero">
          <div className="brand auth-brand">
            <div className="brand-mark">
              <Code2 size={22} />
            </div>
            <div>
              <h1>Auditoria de Codigo</h1>
              <span>Seguridad, calidad e historial de revisiones</span>
            </div>
          </div>

          <div className="auth-message">
            <Sparkles size={20} />
            <div>
              <strong>Revision clara antes de llegar al codigo</strong>
              <p>Analiza vulnerabilidades, guarda auditorias y vuelve sobre los hallazgos sin perder contexto.</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <h2>{isRegisterMode ? 'Crear cuenta' : 'Iniciar sesion'}</h2>
              <p>{isRegisterMode ? 'Registra un usuario y entra al panel.' : 'Ingresa para continuar con tus auditorias.'}</p>
            </div>
            {isRegisterMode ? <UserPlus size={22} /> : <LogIn size={22} />}
          </div>

          <form className="auth-stack" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                type="email"
                placeholder="email@dominio.com"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                placeholder="Contrasena"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                minLength={8}
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={isSubmittingAuth}>
              {isSubmittingAuth ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="auth-switch">
            <span>{isRegisterMode ? 'Ya tenes una cuenta?' : 'No tenes cuenta?'}</span>
            <button type="button" onClick={() => handleAuthModeChange(isRegisterMode ? 'login' : 'register')}>
              {isRegisterMode ? 'Iniciar sesion' : 'Crear cuenta'}
            </button>
          </div>

          {authError && <p className="auth-error">{authError}</p>}
          {authMessage && <p className="auth-success">{authMessage}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Code2 size={22} />
          </div>
          <div>
            <h1>Auditoria de Codigo</h1>
            <span>Revision asistida de seguridad y buenas practicas</span>
          </div>
        </div>

        <div className="session">
          {isAuthenticated ? (
            <>
              <span className="session-pill">
                <ShieldCheck size={16} />
                {email}
              </span>
              <button className="icon-button" type="button" onClick={handleLogout} title="Cerrar sesion">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <span>Sin sesion</span>
          )}
        </div>
      </section>

      <section className="flow-nav" aria-label="Flujo de auditoria">
        {[
          { id: 'analysis', label: 'Nuevo analisis', description: 'Carga y ejecuta codigo' },
          { id: 'results', label: 'Resultados', description: `${findingCount} hallazgo${findingCount === 1 ? '' : 's'}` },
          { id: 'history', label: 'Historial', description: `${history.length} auditoria${history.length === 1 ? '' : 's'}` },
          { id: 'metrics', label: 'Metricas', description: `${metrics?.totalAudits || 0} totales` },
        ].map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={activeStep === step.id ? 'active' : ''}
            onClick={() => setActiveStep(step.id)}
          >
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
            <small>{step.description}</small>
          </button>
        ))}
      </section>
    </main>
  );
}

function ViewHeader({ title, description, meta }) {
  return (
    <header className="view-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {meta && <span>{meta}</span>}
    </header>
  );
}

function buildMarkers(findings) {
  return findings
    .filter((finding) => Number.isInteger(finding.line) && finding.line > 0)
    .map((finding) => ({
      severity: finding.severity === 'critical' ? 8 : finding.severity === 'warning' ? 4 : 2,
      message: [finding.title, finding.description, finding.suggestion].filter(Boolean).join(' - '),
      startLineNumber: finding.line,
      startColumn: 1,
      endLineNumber: finding.line,
      endColumn: 1000,
    }));
}

function statusLabel(status) {
  if (status === 'pending') return 'Auditoria en cola';
  if (status === 'processing') return 'Analisis en progreso';
  if (status === 'success') return 'Analisis completado';
  if (status === 'failed') return 'Analisis fallido';
  return 'Listo';
}

function severityClass(severity) {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'suggestion';
}

function riskClass(riskLevel) {
  if (riskLevel === 'critical') return 'critical';
  if (riskLevel === 'high') return 'critical';
  if (riskLevel === 'medium') return 'warning';
  return 'suggestion';
}

function statusClass(status) {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'failed';
  if (status === 'processing' || status === 'pending') return 'processing';
  return 'neutral';
}

createRoot(document.getElementById('root')).render(<App />);