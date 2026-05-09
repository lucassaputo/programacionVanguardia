package com.auditoria.dto;

import jakarta.validation.constraints.*; // Usamos el asterisco para importar todas las validaciones

public class RegisterRequestDTO {

    // 1. Agregamos el nombre de usuario (suele ser necesario para un registro)
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 20, message = "El usuario debe tener entre 4 y 20 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    private String email;

    @NotBlank(message = "La password es obligatoria")
    @Size(min = 8, message = "La password debe tener al menos 8 caracteres")
    // 2. Agregamos un patrón (Regex) para que la contraseña tenga al menos un número
    @Pattern(regexp = ".*[0-9].*", message = "La contraseña debe contener al menos un número")
    private String password;

    // Constructor vacío obligatorio para Java Beans
    public RegisterRequestDTO() {}

    // Getters y Setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}