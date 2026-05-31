package com.auditoria.service;

import com.auditoria.dto.AnalyzeResponseDTO;
import com.auditoria.dto.FindingDTO;
import com.auditoria.dto.PythonAnalyzeRequestDTO;
import com.auditoria.entity.Audit;
import com.auditoria.entity.Finding;
import com.auditoria.exception.AuditNotFoundException;
import com.auditoria.exception.PythonServiceException;
import com.auditoria.model.AuditStatus;
import com.auditoria.model.RiskLevel;
import com.auditoria.repository.AuditRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Service
public class AuditAnalysisWorker {

    private final AuditRepository auditRepository;
    private final PythonClientService pythonClientService;
    private final TransactionTemplate transactionTemplate;

    public AuditAnalysisWorker(
            AuditRepository auditRepository,
            PythonClientService pythonClientService,
            TransactionTemplate transactionTemplate) {
        this.auditRepository = auditRepository;
        this.pythonClientService = pythonClientService;
        this.transactionTemplate = transactionTemplate;
    }

    @Async
    public void process(String auditId, String language, String code) {
        transactionTemplate.executeWithoutResult(status -> markProcessing(auditId));

        try {
            AnalyzeResponseDTO response = pythonClientService.analyze(new PythonAnalyzeRequestDTO(auditId, language, code));
            if (response == null) {
                throw new PythonServiceException("El servicio Python respondio sin body.");
            }
            String riskLevel = calculateRiskLevel(response.getFindings());
            transactionTemplate.executeWithoutResult(status -> persistAnalysisResult(auditId, response, riskLevel));
        } catch (PythonServiceException ex) {
            transactionTemplate.executeWithoutResult(status -> markAuditFailed(auditId, ex.getMessage(), code));
        }
    }

    private void markProcessing(String auditId) {
        Audit audit = findAudit(auditId);
        audit.setStatus(AuditStatus.PROCESSING.value());
    }

    private void persistAnalysisResult(String auditId, AnalyzeResponseDTO response, String riskLevel) {
        Audit audit = findAudit(auditId);
        audit.setStatus(response.getStatus());
        audit.setRiskLevel(riskLevel);
        audit.setPedagogicalExplanation(response.getPedagogicalExplanation());
        audit.setRefactoredCode(response.getRefactoredCode());
        addFindings(audit, response.getFindings());
    }

    private void markAuditFailed(String auditId, String message, String originalCode) {
        Audit audit = findAudit(auditId);
        audit.setStatus(AuditStatus.FAILED.value());
        audit.setRiskLevel(RiskLevel.UNKNOWN.value());
        audit.setPedagogicalExplanation(message);
        audit.setRefactoredCode(originalCode);
    }

    private Audit findAudit(String auditId) {
        return auditRepository.findByAuditId(auditId)
                .orElseThrow(() -> new AuditNotFoundException(auditId));
    }

    private void addFindings(Audit audit, List<FindingDTO> findings) {
        if (findings == null) {
            return;
        }

        for (FindingDTO finding : findings) {
            audit.addFinding(new Finding(
                    finding.getType(),
                    finding.getSeverity(),
                    finding.getTitle(),
                    finding.getDescription(),
                    finding.getLine(),
                    finding.getSuggestion()));
        }
    }

    private String calculateRiskLevel(List<FindingDTO> findings) {
        if (findings == null || findings.isEmpty()) {
            return RiskLevel.LOW.value();
        }

        if (findings.stream().anyMatch(finding -> "critical".equalsIgnoreCase(finding.getSeverity()))) {
            return RiskLevel.CRITICAL.value();
        }

        if (findings.stream().anyMatch(finding -> "warning".equalsIgnoreCase(finding.getSeverity()))) {
            return RiskLevel.MEDIUM.value();
        }

        return RiskLevel.LOW.value();
    }
}
