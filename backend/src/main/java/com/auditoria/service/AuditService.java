package com.auditoria.service;

import com.auditoria.dto.AuditDetailDTO;
import com.auditoria.dto.AuditMetricsDTO;
import com.auditoria.dto.AuditSummaryDTO;
import com.auditoria.dto.AnalyzeRequestDTO;
import com.auditoria.dto.AnalyzeResponseDTO;
import com.auditoria.dto.FindingDTO;
import com.auditoria.entity.Audit;
import com.auditoria.entity.Finding;
import com.auditoria.entity.User;
import com.auditoria.exception.AnalysisBudgetExceededException;
import com.auditoria.exception.AuditNotFoundException;
import com.auditoria.exception.UnsupportedLanguageException;
import com.auditoria.model.AuditStatus;
import com.auditoria.model.RiskLevel;
import com.auditoria.model.SupportedLanguage;
import com.auditoria.repository.AuditRepository;
import com.auditoria.repository.FindingRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditRepository auditRepository;
    private final FindingRepository findingRepository;
    private final AuditAnalysisWorker auditAnalysisWorker;
    private final TransactionTemplate transactionTemplate;
    private final AnalysisCostEstimator costEstimator;
    private final RateLimiterService rateLimiterService;

    public AuditService(
            AuditRepository auditRepository,
            FindingRepository findingRepository,
            AuditAnalysisWorker auditAnalysisWorker,
            TransactionTemplate transactionTemplate,
            AnalysisCostEstimator costEstimator,
            RateLimiterService rateLimiterService) {
        this.auditRepository = auditRepository;
        this.findingRepository = findingRepository;
        this.auditAnalysisWorker = auditAnalysisWorker;
        this.transactionTemplate = transactionTemplate;
        this.costEstimator = costEstimator;
        this.rateLimiterService = rateLimiterService;
    }

    public AnalyzeResponseDTO analyze(AnalyzeRequestDTO request, User user) {
        String normalizedLanguage = normalizeLanguage(request.getLanguage());
        rateLimiterService.checkAllowed(user.getId());
        AnalysisCostEstimate estimate = costEstimator.estimate(request.getCode());
        if (costEstimator.exceedsBudget(estimate)) {
            throw new AnalysisBudgetExceededException(
                    "El codigo supera el presupuesto estimado de " + costEstimator.maxEstimatedTokens() + " tokens.");
        }

        String auditId = UUID.randomUUID().toString();

        transactionTemplate.executeWithoutResult(status ->
                auditRepository.save(new Audit(
                        auditId,
                        normalizedLanguage,
                        request.getCode(),
                        user,
                        estimate.estimatedTokens(),
                        estimate.estimatedCostUsd())));

        auditAnalysisWorker.process(auditId, normalizedLanguage, request.getCode());

        AnalyzeResponseDTO response = new AnalyzeResponseDTO();
        response.setAuditId(auditId);
        response.setStatus(AuditStatus.PENDING.value());
        response.setRiskLevel(RiskLevel.UNKNOWN.value());
        response.setFindings(List.of());
        response.setPedagogicalExplanation("La auditoria fue creada y esta en cola de procesamiento.");
        response.setRefactoredCode(request.getCode());
        response.setEstimatedTokens(estimate.estimatedTokens());
        response.setEstimatedCostUsd(estimate.estimatedCostUsd());
        return response;
    }

    @Transactional(readOnly = true)
    public List<AuditSummaryDTO> findHistory(User user, String language, String riskLevel) {
        return findHistory(user, language, riskLevel, 0, 50);
    }

    @Transactional(readOnly = true)
    public List<AuditSummaryDTO> findHistory(User user, String language, String riskLevel, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        return auditRepository.findSummaries(
                user,
                normalizeFilter(language),
                normalizeFilter(riskLevel),
                pageable);
    }

    @Transactional(readOnly = true)
    public AuditMetricsDTO findMetrics(User user) {
        long totalAudits = auditRepository.countByUser(user);
        long totalFindings = findingRepository.countByAuditUser(user);
        Map<String, Long> byRiskLevel = toCountMap(auditRepository.countByRiskLevel(user));
        Map<String, Long> byLanguage = toCountMap(auditRepository.countByLanguage(user));

        return new AuditMetricsDTO(totalAudits, totalFindings, byRiskLevel, byLanguage);
    }

    @Transactional(readOnly = true)
    public AuditDetailDTO findDetail(String auditId, User user) {
        Audit audit = auditRepository.findByAuditIdAndUser(auditId, user)
                .orElseThrow(() -> new AuditNotFoundException(auditId));

        return new AuditDetailDTO(
                audit.getAuditId(),
                audit.getLanguage(),
                audit.getCode(),
                audit.getStatus(),
                audit.getRiskLevel(),
                toFindingDTOs(audit.getFindings()),
                audit.getPedagogicalExplanation(),
                audit.getRefactoredCode(),
                audit.getEstimatedTokens(),
                audit.getEstimatedCostUsd(),
                audit.getCreatedAt());
    }

    private String normalizeFilter(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeLanguage(String language) {
        try {
            return SupportedLanguage.normalize(language);
        } catch (IllegalArgumentException ex) {
            throw new UnsupportedLanguageException(ex.getMessage());
        }
    }

    private Map<String, Long> toCountMap(List<Object[]> rows) {
        return rows.stream()
                .filter(row -> row[0] != null)
                .collect(Collectors.toMap(
                        row -> Objects.toString(row[0]),
                        row -> (Long) row[1]));
    }

    private List<FindingDTO> toFindingDTOs(List<Finding> findings) {
        return findings.stream()
                .sorted(Comparator.comparing(Finding::getLine, Comparator.nullsLast(Integer::compareTo)))
                .map(this::toFindingDTO)
                .toList();
    }

    private FindingDTO toFindingDTO(Finding finding) {
        FindingDTO dto = new FindingDTO();
        dto.setType(finding.getType());
        dto.setSeverity(finding.getSeverity());
        dto.setTitle(finding.getTitle());
        dto.setDescription(finding.getDescription());
        dto.setLine(finding.getLine());
        dto.setSuggestion(finding.getSuggestion());
        return dto;
    }
}
