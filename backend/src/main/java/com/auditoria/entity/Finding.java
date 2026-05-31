package com.auditoria.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "findings",
        indexes = {
                @Index(name = "idx_findings_audit_id", columnList = "audit_id"),
                @Index(name = "idx_findings_audit_severity", columnList = "audit_id, severity")
        })
public class Finding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 30)
    private String severity;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "line_number")
    private Integer line;

    @Column(columnDefinition = "TEXT")
    private String suggestion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "audit_id", nullable = false)
    private Audit audit;

    public Finding() {}

    public Finding(String type, String severity, String title, String description, Integer line, String suggestion) {
        this.type = type;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.line = line;
        this.suggestion = suggestion;
    }

    public Long getId() { return id; }

    public String getType() { return type; }

    public String getSeverity() { return severity; }

    public String getTitle() { return title; }

    public String getDescription() { return description; }

    public Integer getLine() { return line; }

    public String getSuggestion() { return suggestion; }

    public Audit getAudit() { return audit; }

    public void setAudit(Audit audit) { this.audit = audit; }
}