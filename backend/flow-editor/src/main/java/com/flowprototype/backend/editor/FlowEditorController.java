package com.flowprototype.backend.editor;

import com.flowprototype.backend.flow.FlowService;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.ValidationResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Editorschnittstelle für Listen-, Speicher- und Validierungsoperationen auf Flows.
 *
 * <p>Der Controller stellt dieselbe Flow-Domäne wie die Laufzeit bereit, ergänzt aber
 * schreibende Endpunkte für den Editor.</p>
 */
@RestController
@RequestMapping("/api/flows")
public class FlowEditorController {
    private final FlowService service;

    /**
     * Erstellt den Controller mit Zugriff auf die Flow-Fachlogik.
     *
     * @param service Dienst für die Flow-Verwaltung.
     */
    public FlowEditorController(FlowService service) {
        this.service = service;
    }

    /**
     * Speichert einen neuen Flow.
     *
     * @param definition Vom Editor gelieferte Definition des Flows.
     * @return Persistierte Definition des Flows.
     */
    @PostMapping
    public FlowDefinition create(@RequestBody FlowDefinition definition) {
        return service.create(definition);
    }

    /**
     * Aktualisiert einen bestehenden Flow.
     *
     * @param id Persistente Flow-ID.
     * @param definition Neuer Flow-Inhalt.
     * @return Persistierte Definition des Flows.
     */
    @PutMapping("/{id}")
    public FlowDefinition update(@PathVariable String id, @RequestBody FlowDefinition definition) {
        return service.update(id, definition);
    }

    /**
     * Validiert einen Flow im Editor-Kontext ohne ihn zu speichern.
     *
     * @param id Persistente oder vorgesehene Flow-ID.
     * @param definition Zu prüfende Flowbeschreibung.
     * @return Ergebnis der Flow-Validierung.
     */
    @PostMapping("/{id}/validate")
    public ValidationResult validate(@PathVariable String id, @RequestBody FlowDefinition definition) {
        definition.setId(id);
        return service.validate(definition);
    }
}
