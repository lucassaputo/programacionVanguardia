package com.auditoria.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class AnalysisCostEstimator {

    private final long maxEstimatedTokens;
    private final BigDecimal estimatedUsdPerMillionTokens;

    public AnalysisCostEstimator(
            @Value("${analysis.cost.max-estimated-tokens:6000}") long maxEstimatedTokens,
            @Value("${analysis.cost.estimated-usd-per-million-tokens:0.15}") BigDecimal estimatedUsdPerMillionTokens) {
        this.maxEstimatedTokens = maxEstimatedTokens;
        this.estimatedUsdPerMillionTokens = estimatedUsdPerMillionTokens;
    }

    public AnalysisCostEstimate estimate(String code) {
        long characters = code == null ? 0 : code.length();
        long estimatedTokens = Math.max(1, (long) Math.ceil(characters / 4.0));
        BigDecimal estimatedCost = BigDecimal.valueOf(estimatedTokens)
                .multiply(estimatedUsdPerMillionTokens)
                .divide(BigDecimal.valueOf(1_000_000), 8, RoundingMode.HALF_UP);

        return new AnalysisCostEstimate(estimatedTokens, estimatedCost);
    }

    public boolean exceedsBudget(AnalysisCostEstimate estimate) {
        return estimate.estimatedTokens() > maxEstimatedTokens;
    }

    public long maxEstimatedTokens() {
        return maxEstimatedTokens;
    }
}
