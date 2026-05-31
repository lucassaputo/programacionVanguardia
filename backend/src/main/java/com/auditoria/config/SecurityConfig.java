package com.auditoria.config;

import com.auditoria.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
@@ -15,6 +17,12 @@
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableWebSecurity
@@ -23,29 +31,50 @@ public class SecurityConfig {
private final JwtAuthenticationFilter jwtAuthFilter;
private final UserDetailsService userDetailsService;
private final PasswordEncoder passwordEncoder;
    private final List<String> allowedOriginPatterns;
    private final boolean h2ConsoleEnabled;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            @Value("${app.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*}") List<String> allowedOriginPatterns,
            @Value("${spring.h2.console.enabled:false}") boolean h2ConsoleEnabled) {
this.jwtAuthFilter = jwtAuthFilter;
this.userDetailsService = userDetailsService;
this.passwordEncoder = passwordEncoder;
        this.allowedOriginPatterns = allowedOriginPatterns;
        this.h2ConsoleEnabled = h2ConsoleEnabled;
}

@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
http
.csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
.sessionManagement(session ->
session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("""
                            {"timestamp":"%s","status":401,"error":"Unauthorized","message":"Token JWT ausente o invalido."}
                            """.formatted(LocalDateTime.now()));
                }))
.authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/health").permitAll()
.requestMatchers("/h2-console/**").permitAll()
.anyRequest().authenticated()
)
.authenticationProvider(authenticationProvider())
.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        if (h2ConsoleEnabled) {
            http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));
        }

return http.build();
}

@@ -62,4 +91,16 @@ public AuthenticationManager authenticationManager(AuthenticationConfiguration c
return config.getAuthenticationManager();
}

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}