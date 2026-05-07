package com.auditoria.dto;

import java.time.LocalDateTime;

public class LoginResponseDTO {

    private String token;
    private String email;
    private LocalDateTime expiresAt;

    public LoginResponseDTO(String token, String email, LocalDateTime expiresAt) {
        this.token = token;
        this.email = email;
        this.expiresAt = expiresAt;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
}
