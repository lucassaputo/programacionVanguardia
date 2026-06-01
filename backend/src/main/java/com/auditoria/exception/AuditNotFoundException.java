package com.auditoria.exception;

public class AuditNotFoundException extends RuntimeException {

    public AuditNotFoundException(String auditId) {
        super("Auditoria no encontrada: " + auditId);
    }
}
