package com.flowprototype.backend.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * JPA-Zugriff auf persistierte Flows.
 */
public interface FlowRepository extends JpaRepository<FlowEntity, String> {
    /**
     * Sucht den aktuell aktiven Flow in stabiler Reihenfolge.
     *
     * @return Erste aktive Flow-Entität nach ID sortiert.
     */
    Optional<FlowEntity> findFirstByActiveTrueOrderByIdAsc();
}
