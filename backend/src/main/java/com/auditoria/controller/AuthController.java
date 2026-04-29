package com.auditoria.controller;

import com.auditoria.dto.RegisterRequestDTO;
import com.auditoria.dto.UserResponseDTO;
import com.auditoria.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        UserResponseDTO response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
