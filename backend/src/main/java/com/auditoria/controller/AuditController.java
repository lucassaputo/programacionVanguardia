package com.auditoria.controller;

import com.auditoria.dto.AuditDetailDTO;
import com.auditoria.dto.AuditMetricsDTO;
import com.auditoria.dto.AuditSummaryDTO;
import com.auditoria.dto.AnalyzeRequestDTO;
import com.auditoria.dto.AnalyzeResponseDTO;
import com.auditoria.entity.User;
import com.auditoria.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audits")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<AnalyzeResponseDTO> analyze(
            @Valid @RequestBody AnalyzeRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.accepted().body(auditService.analyze(request, user));
    }

    @GetMapping
    public ResponseEntity<List<AuditSummaryDTO>> history(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditService.findHistory(user, language, riskLevel, page, size));
    }

    @GetMapping("/metrics")
    public ResponseEntity<AuditMetricsDTO> metrics(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(auditService.findMetrics(user));
    }

    @GetMapping("/{auditId}")
    public ResponseEntity<AuditDetailDTO> detail(
            @PathVariable String auditId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(auditService.findDetail(auditId, user));
    }
}