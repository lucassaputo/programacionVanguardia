package com.auditoria.service;

import java.math.BigDecimal;

public record AnalysisCostEstimate(long estimatedTokens, BigDecimal estimatedCostUsd) {
}
