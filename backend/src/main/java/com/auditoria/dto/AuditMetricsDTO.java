package com.auditoria.dto;

import java.util.Map;

public class AuditMetricsDTO {

    private long totalAudits;
    private long totalFindings;
    private Map<String, Long> byRiskLevel;
    private Map<String, Long> byLanguage;

    public AuditMetricsDTO() {}

    public AuditMetricsDTO(long totalAudits, long totalFindings, Map<String, Long> byRiskLevel, Map<String, Long> byLanguage) {
        this.totalAudits = totalAudits;
        this.totalFindings = totalFindings;
        this.byRiskLevel = byRiskLevel;
        this.byLanguage = byLanguage;
    }

    public long getTotalAudits() { return totalAudits; }

    public long getTotalFindings() { return totalFindings; }

    public Map<String, Long> getByRiskLevel() { return byRiskLevel; }

    public Map<String, Long> getByLanguage() { return byLanguage; }
}
