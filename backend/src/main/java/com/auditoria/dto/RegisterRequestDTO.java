package com.auditoria.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequestDTO {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato valido")
    private String email;

    @NotBlank(message = "La password es obligatoria")
    @Size(min = 8, message = "La password debe tener al menos 8 caracteres")
    private String password;

    public RegisterRequestDTO() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
