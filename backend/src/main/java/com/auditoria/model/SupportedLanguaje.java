package com.auditoria.model;

import java.util.Arrays;

public enum SupportedLanguage {
    JAVA("java"),
    PYTHON("python"),
    JAVASCRIPT("javascript"),
    JSON("json");

    private final String value;

    SupportedLanguage(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static String normalize(String rawLanguage) {
        if (rawLanguage == null) {
            throw new IllegalArgumentException("El lenguaje es obligatorio");
        }

        String normalized = rawLanguage.trim().toLowerCase();
        return Arrays.stream(values())
                .filter(language -> language.value.equals(normalized))
                .findFirst()
                .map(SupportedLanguage::value)
                .orElseThrow(() -> new IllegalArgumentException("Lenguaje no soportado: " + rawLanguage));
    }
}