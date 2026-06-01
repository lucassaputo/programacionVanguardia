package com.auditoria.service;

import com.auditoria.dto.AnalyzeResponseDTO;
import com.auditoria.dto.PythonAnalyzeRequestDTO;
import com.auditoria.exception.PythonServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PythonClientService {

    private final RestTemplate restTemplate;
    private final String analyzeUrl;
    private final int maxAttempts;
    private final int circuitBreakerFailureThreshold;
    private final Duration circuitBreakerOpenDuration;
    private final AtomicInteger consecutiveFailures = new AtomicInteger();
    private volatile Instant circuitOpenedAt;

    public PythonClientService(
            RestTemplate restTemplate,
            @Value("${python.ai-service.url}") String pythonBaseUrl,
            @Value("${python.ai-service.max-attempts:2}") int maxAttempts,
            @Value("${python.ai-service.circuit-breaker.failure-threshold:3}") int circuitBreakerFailureThreshold,
            @Value("${python.ai-service.circuit-breaker.open-duration-seconds:30}") long circuitBreakerOpenSeconds) {
        this.restTemplate = restTemplate;
        this.analyzeUrl = pythonBaseUrl.replaceAll("/+$", "") + "/analyze";
        this.maxAttempts = Math.max(1, maxAttempts);
        this.circuitBreakerFailureThreshold = Math.max(1, circuitBreakerFailureThreshold);
        this.circuitBreakerOpenDuration = Duration.ofSeconds(Math.max(1, circuitBreakerOpenSeconds));
    }

    public AnalyzeResponseDTO analyze(PythonAnalyzeRequestDTO request) {
        if (isCircuitOpen()) {
            throw new PythonServiceException("El servicio Python de analisis no esta disponible temporalmente.");
        }

        PythonServiceException lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                AnalyzeResponseDTO response = restTemplate.postForObject(analyzeUrl, request, AnalyzeResponseDTO.class);
                if (response == null) {
                    throw new PythonServiceException("El servicio Python respondio sin body.");
                }
                consecutiveFailures.set(0);
                circuitOpenedAt = null;
                return response;
            } catch (ResourceAccessException ex) {
                lastException = new PythonServiceException("No se pudo conectar con el servicio Python de analisis.", ex);
            } catch (RestClientResponseException ex) {
                PythonServiceException serviceException = new PythonServiceException(
                        "El servicio Python respondio con error HTTP " + ex.getStatusCode().value() + ".",
                        ex);
                if (!isRetryable(ex.getStatusCode())) {
                    recordFailure();
                    throw serviceException;
                }
                lastException = serviceException;
            } catch (RestClientException ex) {
                lastException = new PythonServiceException("Respuesta invalida del servicio Python de analisis.", ex);
            }
        }

        recordFailure();
        throw lastException != null
                ? lastException
                : new PythonServiceException("No se pudo completar el analisis con el servicio Python.");
    }

    private boolean isRetryable(HttpStatusCode statusCode) {
        return statusCode.is5xxServerError();
    }

    private boolean isCircuitOpen() {
        Instant openedAt = circuitOpenedAt;
        if (openedAt == null) {
            return false;
        }

        if (Instant.now().isAfter(openedAt.plus(circuitBreakerOpenDuration))) {
            circuitOpenedAt = null;
            consecutiveFailures.set(0);
            return false;
        }

        return true;
    }

    private void recordFailure() {
        if (consecutiveFailures.incrementAndGet() >= circuitBreakerFailureThreshold) {
            circuitOpenedAt = Instant.now();
        }
    }
}
