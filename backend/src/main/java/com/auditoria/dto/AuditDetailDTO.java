package com.auditoria.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

public class AuditDetailDTO {

    private String auditId;
    private String language;
    private String code;
    private String status;
    private String riskLevel;
    private List<FindingDTO> findings;
    private String pedagogicalExplanation;
    private String refactoredCode;
    private Long estimatedTokens;
    private BigDecimal estimatedCostUsd;
    private LocalDateTime createdAt;

    public AuditDetailDTO() {}

    public AuditDetailDTO(
            String auditId,
            String language,
            String code,
            String status,
            String riskLevel,
            List<FindingDTO> findings,
            String pedagogicalExplanation,
            String refactoredCode,
            Long estimatedTokens,
            BigDecimal estimatedCostUsd,
            LocalDateTime createdAt) {
        this.auditId = auditId;
        this.language = language;
        this.code = code;
        this.status = status;
        this.riskLevel = riskLevel;
        this.findings = findings;
        this.pedagogicalExplanation = pedagogicalExplanation;
        this.refactoredCode = refactoredCode;
        this.estimatedTokens = estimatedTokens;
        this.estimatedCostUsd = estimatedCostUsd;
        this.createdAt = createdAt;
    }

    public String getAuditId() { return auditId; }

    public String getLanguage() { return language; }

    public String getCode() { return code; }

    public String getStatus() { return status; }

    public String getRiskLevel() { return riskLevel; }

    public List<FindingDTO> getFindings() { return findings; }

    public String getPedagogicalExplanation() { return pedagogicalExplanation; }

    public String getRefactoredCode() { return refactoredCode; }

    public Long getEstimatedTokens() { return estimatedTokens; }

    public BigDecimal getEstimatedCostUsd() { return estimatedCostUsd; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
