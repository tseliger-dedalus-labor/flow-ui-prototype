package com.flowprototype.backend.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlowRepository extends JpaRepository<FlowEntity, String> {
    Optional<FlowEntity> findFirstByActiveTrueOrderByIdAsc();
}
