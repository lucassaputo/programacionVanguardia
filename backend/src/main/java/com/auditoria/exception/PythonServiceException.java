package com.auditoria.exception;

public class PythonServiceException extends RuntimeException {

    public PythonServiceException(String message, Throwable cause) {
        super(message, cause);
    }

    public PythonServiceException(String message) {
        super(message);
    }
}
