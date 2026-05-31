package com.auditoria.dto;

import java.util.List;
import java.math.BigDecimal;

public class AnalyzeResponseDTO {

    private String auditId;
    private String status;
    private String riskLevel;
    private List<FindingDTO> findings;
    private String pedagogicalExplanation;
    private String refactoredCode;
    private Long estimatedTokens;
    private BigDecimal estimatedCostUsd;

    public AnalyzeResponseDTO() {}

    public String getAuditId() {
        return auditId;
    }

    public void setAuditId(String auditId) {
        this.auditId = auditId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public List<FindingDTO> getFindings() {
        return findings;
    }

    public void setFindings(List<FindingDTO> findings) {
        this.findings = findings;
    }

    public String getPedagogicalExplanation() {
        return pedagogicalExplanation;
    }

    public void setPedagogicalExplanation(String pedagogicalExplanation) {
        this.pedagogicalExplanation = pedagogicalExplanation;
    }

    public String getRefactoredCode() {
        return refactoredCode;
    }

    public void setRefactoredCode(String refactoredCode) {
        this.refactoredCode = refactoredCode;
    }

    public Long getEstimatedTokens() {
        return estimatedTokens;
    }

    public void setEstimatedTokens(Long estimatedTokens) {
        this.estimatedTokens = estimatedTokens;
    }

    public BigDecimal getEstimatedCostUsd() {
        return estimatedCostUsd;
    }

    public void setEstimatedCostUsd(BigDecimal estimatedCostUsd) {
        this.estimatedCostUsd = estimatedCostUsd;
    }
}
