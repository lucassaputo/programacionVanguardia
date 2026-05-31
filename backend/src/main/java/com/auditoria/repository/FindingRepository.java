package com.auditoria.repository;

import com.auditoria.entity.Finding;
import com.auditoria.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FindingRepository extends JpaRepository<Finding, Long> {

    @Query("select count(f) from Finding f where f.audit.user = :user")
    long countByAuditUser(User user);
}