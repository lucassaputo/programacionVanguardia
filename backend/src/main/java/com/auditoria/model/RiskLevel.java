package com.auditoria.model;

public enum RiskLevel {
    UNKNOWN("unknown"),
    LOW("low"),
    MEDIUM("medium"),
    CRITICAL("critical");

    private final String value;

    RiskLevel(String value) {
        this.value = value;
SupportedLanguaj    }

    public String value() {
        return value;
    }
}