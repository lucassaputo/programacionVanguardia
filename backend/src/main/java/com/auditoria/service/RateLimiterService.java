package com.auditoria.service;

import com.auditoria.exception.RateLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    private final int maxRequests;
    private final long windowSeconds;
    private final Clock clock;
    private final Map<Long, Deque<Instant>> requestsByUser = new ConcurrentHashMap<>();

    public RateLimiterService(
            @Value("${analysis.rate-limit.max-requests:10}") int maxRequests,
            @Value("${analysis.rate-limit.window-seconds:60}") long windowSeconds) {
        this.maxRequests = Math.max(1, maxRequests);
        this.windowSeconds = Math.max(1, windowSeconds);
        this.clock = Clock.systemUTC();
    }

    public void checkAllowed(Long userId) {
        Instant now = Instant.now(clock);
        Instant cutoff = now.minusSeconds(windowSeconds);
        Deque<Instant> requests = requestsByUser.computeIfAbsent(userId, ignored -> new ArrayDeque<>());

        synchronized (requests) {
            while (!requests.isEmpty() && requests.peekFirst().isBefore(cutoff)) {
                requests.removeFirst();
            }

            if (requests.size() >= maxRequests) {
                throw new RateLimitExceededException(
                        "Limite de auditorias alcanzado. Intenta nuevamente en unos segundos.");
            }

            requests.addLast(now);
        }
    }
}
