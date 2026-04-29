package com.auditoria.service;

import com.auditoria.dto.RegisterRequestDTO;
import com.auditoria.dto.UserResponseDTO;
import com.auditoria.entity.User;
import com.auditoria.exception.EmailAlreadyExistsException;
import com.auditoria.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponseDTO register(RegisterRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(request.getEmail(), hashedPassword);
        User savedUser = userRepository.save(user);

        return new UserResponseDTO(savedUser.getId(), savedUser.getEmail(), savedUser.getCreatedAt());
    }
}
