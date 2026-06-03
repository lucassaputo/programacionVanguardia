package com.auditoria.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "audits",
        indexes = {
                @Index(name = "idx_audits_user_created_at", columnList = "user_id, created_at"),
                @Index(name = "idx_audits_user_language_risk_created_at", columnList = "user_id, language, risk_level, created_at"),
                @Index(name = "idx_audits_audit_id", columnList = "audit_id")
        })
public class Audit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "audit_id", nullable = false, unique = true, length = 36)
    private String auditId;

    @Column(nullable = false, length = 60)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "risk_level", nullable = false, length = 30)
    private String riskLevel;

    @Column(name = "pedagogical_explanation", columnDefinition = "TEXT")
    private String pedagogicalExplanation;

    @Column(name = "refactored_code", columnDefinition = "TEXT")
    private String refactoredCode;

    @Column(name = "estimated_tokens")
    private Long estimatedTokens;

    @Column(name = "estimated_cost_usd", precision = 12, scale = 8)
    private BigDecimal estimatedCostUsd;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Finding> findings = new ArrayList<>();

    public Audit() {}

    public Audit(String auditId, String language, String code, User user, Long estimatedTokens, BigDecimal estimatedCostUsd) {
        this.auditId = auditId;
        this.language = language;
        this.code = code;
        this.user = user;
        this.status = "pending";
        this.riskLevel = "unknown";
        this.estimatedTokens = estimatedTokens;
        this.estimatedCostUsd = estimatedCostUsd;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getAuditId() { return auditId; }

    public String getLanguage() { return language; }

    public String getCode() { return code; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    public String getRiskLevel() { return riskLevel; }

    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public String getPedagogicalExplanation() { return pedagogicalExplanation; }

    public void setPedagogicalExplanation(String pedagogicalExplanation) {
        this.pedagogicalExplanation = pedagogicalExplanation;
    }

    public String getRefactoredCode() { return refactoredCode; }

    public void setRefactoredCode(String refactoredCode) { this.refactoredCode = refactoredCode; }

    public Long getEstimatedTokens() { return estimatedTokens; }

    public BigDecimal getEstimatedCostUsd() { return estimatedCostUsd; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public User getUser() { return user; }

    public List<Finding> getFindings() { return findings; }

    public void addFinding(Finding finding) {
        findings.add(finding);
        finding.setAudit(this);
    }
}