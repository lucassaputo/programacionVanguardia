package com.auditoria.repository;

import com.auditoria.entity.Audit;
import com.auditoria.entity.User;
import com.auditoria.dto.AuditSummaryDTO;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditRepository extends JpaRepository<Audit, Long> {

    Optional<Audit> findByAuditId(String auditId);

    @EntityGraph(attributePaths = "findings")
    Optional<Audit> findByAuditIdAndUser(String auditId, User user);

    @Query("""
            select new com.auditoria.dto.AuditSummaryDTO(
                a.auditId,
                a.language,
                a.status,
                a.riskLevel,
                count(f),
                a.estimatedTokens,
                a.estimatedCostUsd,
                a.createdAt
            )
            from Audit a
            left join a.findings f
            where a.user = :user
              and (:language is null or lower(a.language) = lower(:language))
              and (:riskLevel is null or lower(a.riskLevel) = lower(:riskLevel))
            group by a.id, a.auditId, a.language, a.status, a.riskLevel, a.estimatedTokens, a.estimatedCostUsd, a.createdAt
            order by a.createdAt desc
            """)
    List<AuditSummaryDTO> findSummaries(User user, String language, String riskLevel, Pageable pageable);

    long countByUser(User user);

    @Query("select a.riskLevel, count(a) from Audit a where a.user = :user group by a.riskLevel")
    List<Object[]> countByRiskLevel(User user);

    @Query("select a.language, count(a) from Audit a where a.user = :user group by a.language")
    List<Object[]> countByLanguage(User user);
}