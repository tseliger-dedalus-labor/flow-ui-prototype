package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.ValidationResult;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Kapselt Laden, Persistieren und Validieren von Flows.
 *
 * <p>Der Dienst bildet die Grenze zwischen HTTP-Endpunktklassen, Validierung und
 * JPA-Persistenz. Zustandsänderungen an Flows laufen zentral hier zusammen, damit
 * Aktivstatus und Fehlermeldungen konsistent bleiben.</p>
 */
@Service
public class FlowService {
    private final FlowRepository repository;
    private final FlowMapper mapper;
    private final FlowValidationService validationService;

    /**
     * Erstellt den Dienst mit Persistenz, Umsetzung und Validierung.
     *
     * @param repository Datenzugriff für Flow-Entities.
     * @param mapper Umsetzer zwischen Entität und Schnittstellenmodell.
     * @param validationService Prüfkomponente für Flow-Invarianten.
     */
    public FlowService(FlowRepository repository, FlowMapper mapper, FlowValidationService validationService) {
        this.repository = repository;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    /**
     * Liefert eine kompakte Übersicht aller gespeicherten Flows.
     *
     * @return Zusammenfassungen mit ID, Name und Aktivstatus.
     */
    public List<FlowSummary> list() {
        return repository.findAll().stream().map(e -> new FlowSummary(e.getId(), e.getName(), e.isActive())).toList();
    }

    /**
     * Lädt einen Flow anhand seiner ID.
     *
     * @param id Persistente Flow-ID.
     * @return Vollständige Definition des Flows.
     */
    public FlowDefinition get(String id) {
        return mapper.toDefinition(repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow nicht gefunden")));
    }

    /**
     * Ermittelt den zur Laufzeit wirksamen Flow.
     *
     * @return Aktiv markierter Flow oder, falls keiner aktiv ist, der erste vorhandene Flow.
     */
    public FlowDefinition getEffective() {
        // Bestehende Aktivmarkierungen bleiben maßgeblich; nur ohne aktiven Flow wird auf einen vorhandenen Datensatz zurückgefallen.
        FlowEntity entity = repository.findFirstByActiveTrueOrderByIdAsc().orElseGet(() -> repository.findAll().stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kein Flow vorhanden")));
        return mapper.toDefinition(entity);
    }

    /**
     * Validiert eine Flowbeschreibung ohne Persistenzänderung.
     *
     * @param definition Zu prüfender Flow.
     * @return Ergebnis der Struktur- und Typprüfung.
     */
    public ValidationResult validate(FlowDefinition definition) {
        return validationService.validate(definition);
    }

    /**
     * Legt einen neuen Flow an.
     *
     * @param definition Zu speichernder Flow.
     * @return Persistierte Definition des Flows.
     */
    public FlowDefinition create(FlowDefinition definition) {
        // Für neue Flows wird nur dann eine ID erzeugt, wenn der Editor noch keine vergeben hat.
        if (definition.getId() == null || definition.getId().isBlank()) {
            definition.setId("flow-" + UUID.randomUUID());
        }
        ValidationResult result = validationService.validate(definition);
        if (!result.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow ungültig: " + result.getIssues().get(0).getMessage());
        }
        // Neue Flows starten bewusst inaktiv, damit die effektive Laufzeitkonfiguration unverändert bleibt.
        FlowEntity entity = mapper.toEntity(definition, false);
        repository.save(entity);
        return mapper.toDefinition(entity);
    }

    /**
     * Aktualisiert einen bestehenden Flow unter Beibehaltung seines Aktivstatus.
     *
     * @param id ID des zu aktualisierenden Flows.
     * @param definition Neuer Flow-Inhalt.
     * @return Persistierte Definition des Flows nach dem Update.
     */
    public FlowDefinition update(String id, FlowDefinition definition) {
        FlowEntity existing = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow nicht gefunden"));
        definition.setId(id);
        ValidationResult result = validationService.validate(definition);
        if (!result.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow ungültig: " + result.getIssues().get(0).getMessage());
        }
        // Der fachliche Aktivstatus wird aus dem bestehenden Datensatz übernommen und nicht implizit durch Nutzlasten des Editors geändert.
        FlowEntity updated = mapper.toEntity(definition, existing.isActive());
        repository.save(updated);
        return mapper.toDefinition(updated);
    }
}
