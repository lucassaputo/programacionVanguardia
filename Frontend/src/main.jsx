</div>
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
@@ -604,6 +623,126 @@ function buildMarkers(findings) {
}));
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