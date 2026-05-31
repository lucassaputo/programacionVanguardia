package com.auditoria.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class AuditSummaryDTO {

    private String auditId;
    private String language;
    private String status;
    private String riskLevel;
    private long findingsCount;
    private Long estimatedTokens;
    private BigDecimal estimatedCostUsd;
    private LocalDateTime createdAt;

    public AuditSummaryDTO() {}

    public AuditSummaryDTO(String auditId, String language, String status, String riskLevel, long findingsCount, Long estimatedTokens, BigDecimal estimatedCostUsd, LocalDateTime createdAt) {
        this.auditId = auditId;
        this.language = language;
        this.status = status;
        this.riskLevel = riskLevel;
        this.findingsCount = findingsCount;
        this.estimatedTokens = estimatedTokens;
        this.estimatedCostUsd = estimatedCostUsd;
        this.createdAt = createdAt;
    }

    public String getAuditId() { return auditId; }

    public String getLanguage() { return language; }

    public String getStatus() { return status; }

    public String getRiskLevel() { return riskLevel; }

    public long getFindingsCount() { return findingsCount; }

    public Long getEstimatedTokens() { return estimatedTokens; }

    public BigDecimal getEstimatedCostUsd() { return estimatedCostUsd; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
