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

      {activeStep === 'analysis' && (
        <section className="view-shell analysis-view">
          <ViewHeader
            title="Nuevo analisis"
            description="Carga codigo, elige lenguaje y ejecuta la auditoria."
            meta={`${lineCount} linea${lineCount === 1 ? '' : 's'}`}
          />
          <div className="editor-pane editor-pane-full">
            <div className="toolbar">
              <div className="toolbar-group">
                <label htmlFor="language-select">Lenguaje</label>
                <select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {languageOptions.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <span className="status">{status}</span>
              <div className="toolbar-actions">
                <button className="ghost-button" type="button" onClick={handleRestoreExample} title="Restaurar ejemplo">
                  <RotateCcw size={16} /> Ejemplo
                </button>
                <button className="ghost-button" type="button" onClick={handleClearCode} title="Limpiar editor">
                  <Trash2 size={16} /> Limpiar
                </button>
                {analysis && (
                  <button className="secondary-button" type="button" onClick={() => setActiveStep('results')}>
                    Resultados
                  </button>
                )}
              </div>
              {isAnalyzing ? (
                <button className="secondary-button analyze-button" type="button" onClick={handleCancelAnalysis}>
                  <Square size={16} /> Cancelar
                </button>
              ) : (
                <button className="primary-button analyze-button" type="button" onClick={handleAnalyze} disabled={!isAuthenticated}>
                  <Play size={16} /> Analizar
                </button>
              )}
            </div>
            <div className="editor-frame">
              <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                options={editorOptions}
                loading={<div className="editor-loading">Preparando editor...</div>}
                onChange={(value) => setCode(value || '')}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;
                  monaco.editor.setModelMarkers(editor.getModel(), 'audit', markers);
                }}
                path={`audit.${language}`}
              />
            </div>
          </div>
        </section>
      )}

      {activeStep === 'metrics' && (
        <section className="view-shell metrics-view">
          <ViewHeader
            title="Resumen del proyecto"
            description="Observa volumen, riesgo y distribucion por lenguaje."
            meta={`${metrics?.totalAudits || 0} auditorias`}
          />
          <MetricsPanel metrics={metrics} />
        </section>
      )}

      {activeStep === 'history' && (
        <section className="view-shell history-view">
          <ViewHeader
            title="Auditorias guardadas"
            description="Consulta auditorias anteriores y recupera sus resultados."
            meta={`${history.length} visibles`}
          />
          <HistoryPanel
            history={history}
            filters={historyFilters}
            query={historyQuery}
            historyError={historyError}
            page={historyPage}
            pageSize={historyPageSize}
            onQueryChange={setHistoryQuery}
            onPageChange={setHistoryPage}
            onFilterChange={handleFilterChange}
            onOpenAudit={handleOpenAudit}
          />
        </section>
      )}

      {activeStep === 'history' && (
        <section className="view-shell history-view">
          <ViewHeader
            title="Auditorias guardadas"
            description="Consulta auditorias anteriores y recupera sus resultados."
            meta={`${history.length} visibles`}
          />
          <HistoryPanel
            history={history}
            filters={historyFilters}
            query={historyQuery}
            historyError={historyError}
            page={historyPage}
            pageSize={historyPageSize}
            onQueryChange={setHistoryQuery}
            onPageChange={setHistoryPage}
            onFilterChange={handleFilterChange}
            onOpenAudit={handleOpenAudit}
          />
        </section>
      )}

{activeStep === 'results' && (
<section className="view-shell results-view">
<ViewHeader
title="Resultado de auditoria"
description="Revisa riesgo, hallazgos y recomendaciones accionables."
meta={analysis?.status ? statusLabel(analysis.status) : status}
/>
<FindingsPanel
analysis={analysis}
findingCount={findingCount}
analysisError={analysisError}
language={language}
status={status}
onGoToEditor={handleGoToEditor}
onStartNewAnalysis={() => setActiveStep('analysis')}
/>
</section>
)}
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

function MetricsPanel({ metrics }) {
  const riskSummary = metrics?.byRiskLevel || {};
  const languageSummary = metrics?.byLanguage || {};
  const totalAudits = metrics?.totalAudits || 0;
  const totalFindings = metrics?.totalFindings || 0;
  const criticalCount = riskSummary.critical || 0;
  const riskRows = Object.entries(riskSummary).filter(([, count]) => count > 0);
  const languageRows = Object.entries(languageSummary).filter(([, count]) => count > 0);
  const findingRate = totalAudits > 0 ? Math.round((totalFindings / totalAudits) * 100) : 0;

  return (
    <section className="metrics-pane">
      <header>
        <h2><BarChart3 size={16} /> Metricas</h2>
      </header>
      <div className="metric-grid">
        <div>
          <strong>{totalAudits}</strong>
          <span>Auditorias</span>
        </div>
        <div>
          <strong>{totalFindings}</strong>
          <span>Hallazgos</span>
        </div>
        <div>
          <strong>{criticalCount}</strong>
          <span>Criticas</span>
        </div>
      </div>

      <div className="metrics-layout">
        <section className="metrics-card">
          <h3>Distribucion por riesgo</h3>
          {riskRows.length === 0 ? (
            <p className="metrics-empty">Todavia no hay datos de riesgo.</p>
          ) : (
            riskRows.map(([risk, count]) => (
              <MetricBar key={risk} label={risk} value={count} max={Math.max(...riskRows.map(([, itemCount]) => itemCount), 1)} className={riskClass(risk)} />
            ))
          )}
        </section>

        <section className="metrics-card">
          <h3>Distribucion por lenguaje</h3>
          {languageRows.length === 0 ? (
            <p className="metrics-empty">Todavia no hay datos por lenguaje.</p>
          ) : (
            languageRows.map(([itemLanguage, count]) => (
              <MetricBar key={itemLanguage} label={itemLanguage} value={count} max={Math.max(...languageRows.map(([, itemCount]) => itemCount), 1)} />
            ))
          )}
        </section>

        <section className="metrics-card metrics-card-highlight">
          <h3>Lectura rapida</h3>
          <strong>{findingRate}%</strong>
          <p>Promedio relativo de hallazgos por auditoria registrada.</p>
        </section>
      </div>
    </section>
  );
}

function MetricBar({ label, value, max, className = '' }) {
  const width = max > 0 ? Math.max((value / max) * 100, 6) : 0;

  return (
    <div className="metric-bar-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="metric-bar-track">
        <span className={className} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function HistoryPanel({ history, filters, query, historyError, page, pageSize, onQueryChange, onPageChange, onFilterChange, onOpenAudit }) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleHistory = normalizedQuery
    ? history.filter((audit) => [
      audit.language,
      audit.riskLevel,
      audit.status,
      audit.createdAt,
      String(audit.findingsCount ?? ''),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
    : history;

  return (
    <section className="history-pane">
      <header>
        <h2><History size={16} /> Historial</h2>
        <span>{visibleHistory.length}</span>
      </header>

      <div className="history-search">
        <Search size={16} />
        <input
          type="search"
          placeholder="Buscar por lenguaje, riesgo o estado"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="history-filters">
        <select value={filters.language} onChange={(event) => onFilterChange({ ...filters, language: event.target.value })}>
          {languageOptions.map((option) => (
            <option key={option.value || 'all-languages'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filters.riskLevel} onChange={(event) => onFilterChange({ ...filters, riskLevel: event.target.value })}>
          {riskOptions.map((option) => (
            <option key={option.value || 'all-risks'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {historyError && <p className="history-error">{historyError}</p>}

      {visibleHistory.length === 0 && !historyError && (
        <div className="history-empty">Todavia no hay auditorias guardadas.</div>
      )}

      <div className="history-list">
      {visibleHistory.map((audit) => (
        <button className="history-item" key={audit.auditId} type="button" onClick={() => onOpenAudit(audit.auditId)}>
          <div>
            <strong>{audit.language}</strong>
            <span>{new Date(audit.createdAt).toLocaleString()}</span>
          </div>
          <small className={`status-chip ${statusClass(audit.status)}`}>{statusLabel(audit.status)}</small>
          <small className={`risk-chip ${riskClass(audit.riskLevel)}`}>{audit.riskLevel}</small>
          <small>{audit.status === 'success' ? `${audit.findingsCount} hallazgo${audit.findingsCount === 1 ? '' : 's'}` : statusLabel(audit.status)}</small>
          <ChevronRight size={15} />
        </button>
      ))}
      </div>

      <div className="pagination-controls">
        <button type="button" onClick={() => onPageChange(Math.max(page - 1, 0))} disabled={page === 0}>
          Anterior
        </button>
        <span>Pagina {page + 1}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={history.length < pageSize}>
          Siguiente
        </button>
      </div>
    </section>
  );
}

function HistoryPanel({ history, filters, query, historyError, page, pageSize, onQueryChange, onPageChange, onFilterChange, onOpenAudit }) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleHistory = normalizedQuery
    ? history.filter((audit) => [
      audit.language,
      audit.riskLevel,
      audit.status,
      audit.createdAt,
      String(audit.findingsCount ?? ''),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)))
    : history;

  return (
    <section className="history-pane">
      <header>
        <h2><History size={16} /> Historial</h2>
        <span>{visibleHistory.length}</span>
      </header>

      <div className="history-search">
        <Search size={16} />
        <input
          type="search"
          placeholder="Buscar por lenguaje, riesgo o estado"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="history-filters">
        <select value={filters.language} onChange={(event) => onFilterChange({ ...filters, language: event.target.value })}>
          {languageOptions.map((option) => (
            <option key={option.value || 'all-languages'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filters.riskLevel} onChange={(event) => onFilterChange({ ...filters, riskLevel: event.target.value })}>
          {riskOptions.map((option) => (
            <option key={option.value || 'all-risks'} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {historyError && <p className="history-error">{historyError}</p>}

      {visibleHistory.length === 0 && !historyError && (
        <div className="history-empty">Todavia no hay auditorias guardadas.</div>
      )}

      <div className="history-list">
      {visibleHistory.map((audit) => (
        <button className="history-item" key={audit.auditId} type="button" onClick={() => onOpenAudit(audit.auditId)}>
          <div>
            <strong>{audit.language}</strong>
            <span>{new Date(audit.createdAt).toLocaleString()}</span>
          </div>
          <small className={`status-chip ${statusClass(audit.status)}`}>{statusLabel(audit.status)}</small>
          <small className={`risk-chip ${riskClass(audit.riskLevel)}`}>{audit.riskLevel}</small>
          <small>{audit.status === 'success' ? `${audit.findingsCount} hallazgo${audit.findingsCount === 1 ? '' : 's'}` : statusLabel(audit.status)}</small>
          <ChevronRight size={15} />
        </button>
      ))}
      </div>

      <div className="pagination-controls">
        <button type="button" onClick={() => onPageChange(Math.max(page - 1, 0))} disabled={page === 0}>
          Anterior
        </button>
        <span>Pagina {page + 1}</span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={history.length < pageSize}>
          Siguiente
        </button>
      </div>
    </section>
  );
}

function FindingsPanel({ analysis, findingCount, analysisError, language, status, onGoToEditor, onStartNewAnalysis }) {
const riskLevel = analysis?.riskLevel || 'sin datos';
const hasFindings = Boolean(analysis?.findings?.length);
const showCleanResult = analysis && analysis.findings?.length === 0 && analysis.status !== 'failed';

return (
<section className="findings-pane">
<header>
<h2><FileWarning size={16} /> Hallazgos</h2>
<span>{findingCount} hallazgo{findingCount === 1 ? '' : 's'}</span>
</header>

<div className="results-summary">
<div className={`summary-card ${riskClass(riskLevel)}`}>
<span>Riesgo general</span>
<strong>{riskLevel}</strong>
</div>
<div className="summary-card">
<span>Hallazgos</span>
<strong>{findingCount}</strong>
</div>
<div className="summary-card">
<span>Estado</span>
<strong>{analysis?.status ? statusLabel(analysis.status) : status}</strong>
</div>
<div className="summary-card">
<span>Lenguaje</span>
<strong>{analysis?.language || language}</strong>
</div>
</div>

{analysis?.status && !terminalStatuses.has(analysis.status) && (
<div className="processing-banner">
{statusLabel(analysis.status)}
</div>
)}

{analysisError && <p className="history-error">{analysisError}</p>}

{!analysis && (
<div className="empty-state empty-state-action">
<CheckCircle2 size={24} />
<p>Todavia no ejecutaste un analisis. Carga codigo y presiona Analizar.</p>
<button className="primary-button" type="button" onClick={onStartNewAnalysis}>
Nuevo analisis
</button>
</div>
)}

{showCleanResult && (
<div className="empty-state clean-result">
<CheckCircle2 size={28} />
<p>No se detectaron hallazgos en este analisis.</p>
<button className="secondary-button" type="button" onClick={onStartNewAnalysis}>
Analizar otro codigo
</button>
</div>
)}

{analysis && analysis.findings?.length === 0 && analysis.status === 'failed' && (
<div className="empty-state empty-state-action">
{analysis.status === 'failed' ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
<p>{analysis.pedagogicalExplanation || 'No se detectaron hallazgos.'}</p>
<button className="secondary-button" type="button" onClick={onStartNewAnalysis}>
Volver al editor
</button>
</div>
)}

{analysis?.findings?.map((finding, index) => (
<article className={`finding ${severityClass(finding.severity)}`} key={`${finding.title}-${index}`}>
<div className="finding-header">
<div>
<strong>{finding.title || 'Hallazgo'}</strong>
<small>{Number.isInteger(finding.line) ? `Linea ${finding.line}` : 'Sin linea'} - {finding.type}</small>
</div>
<span>{finding.severity || 'suggestion'}</span>
</div>
<p>{finding.description}</p>
{finding.suggestion && (
<div className="suggestion">
<strong>Recomendacion</strong>
<span>{finding.suggestion}</span>
</div>
)}
<div className="finding-actions">
<button className="secondary-button" type="button" onClick={() => onGoToEditor(finding.line)}>
Ver en editor
</button>
</div>
</article>
))}

{analysis?.pedagogicalExplanation && hasFindings && (
<section className="analysis-block explanation-block">
<h3>Explicacion pedagogica</h3>
<p>{analysis.pedagogicalExplanation}</p>
</section>
)}

{analysis?.refactoredCode && (
<section className="analysis-block refactor-block">
<h3>Codigo sugerido</h3>
<pre>{analysis.refactoredCode}</pre>
<button className="secondary-button" type="button" onClick={onStartNewAnalysis}>
Volver al editor
</button>
</section>
)}

{analysis?.estimatedTokens && (
<section className="analysis-block cost-block">
<h3>Estimacion IA</h3>
<p>{analysis.estimatedTokens} tokens estimados - USD {Number(analysis.estimatedCostUsd || 0).toFixed(6)}</p>
</section>
)}
</section>
);
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