package com.auditoria.dto;

public class PythonAnalyzeRequestDTO {

    private String auditId;
    private String language;
    private String code;

    public PythonAnalyzeRequestDTO(String auditId, String language, String code) {
        this.auditId = auditId;
        this.language = language;
        this.code = code;
    }

    public String getAuditId() {
        return auditId;
    }

    public String getLanguage() {
        return language;
    }

    public String getCode() {
        return code;
    }
}
