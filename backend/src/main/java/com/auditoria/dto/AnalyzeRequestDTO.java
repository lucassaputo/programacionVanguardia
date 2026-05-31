package com.auditoria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AnalyzeRequestDTO {

    @NotBlank(message = "El lenguaje es obligatorio")
    @Size(max = 60, message = "El lenguaje no puede superar los 60 caracteres")
    private String language;

    @NotBlank(message = "El codigo es obligatorio")
    @Size(max = 20000, message = "El codigo no puede superar los 20000 caracteres")
    private String code;

    public AnalyzeRequestDTO() {}

    public AnalyzeRequestDTO(String language, String code) {
        this.language = language;
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
