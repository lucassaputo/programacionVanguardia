package com.auditoria.model;

public enum AuditStatus {
    PENDING("pending"),
    PROCESSING("processing"),
    SUCCESS("success"),
    FAILED("failed");

    private final String value;

    AuditStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}