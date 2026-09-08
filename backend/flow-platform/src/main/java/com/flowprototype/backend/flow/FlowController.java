package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.Tool;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Stellt Laufzeit-Endpunkte für die Ausführung gespeicherter Flows bereit.
 *
 * <p>Im Unterschied zum Editor liefert dieser Controller nur lesende
 * Betriebsansichten eines bereits persistierten Flows.</p>
 */
@RestController
@RequestMapping("/api/flows")
public class FlowController {
    private final FlowService service;
    private final FlowExecutionService executionService;

    /**
     * Erstellt den Controller mit Zugriff auf die Flow-Fachdienste.
     *
     * @param service Dienst für Laden und Auswahl von Flows.
     */
    public FlowController(FlowService service, FlowExecutionService executionService) {
        this.service = service;
        this.executionService = executionService;
    }

    /**
     * Liefert die verfügbaren Flows, optional eingeschränkt auf ein Tool.
     *
     * @param tool Tool, dessen Flows aufgelistet werden sollen.
     * @return Passende Flow-Zusammenfassungen.
     */
    @GetMapping
    public List<FlowSummary> list(@RequestParam(required = false) Tool tool) {
        return service.list(tool);
    }

    /**
     * Lädt einen konkreten Flow über seine ID.
     *
     * @param id Persistente Flow-ID.
     * @return Vollständige Definition des Flows.
     */
    @GetMapping("/{id}")
    public FlowDefinition get(@PathVariable String id) {
        return service.get(id);
    }

    /**
     * Liefert den aktuell wirksamen Flow für die Laufzeit.
     *
     * @return Aktiver Flow oder Rückfall auf den ersten vorhandenen Flow.
     */
    @GetMapping("/effective")
    public FlowDefinition effective() {
        return service.getEffective();
    }

    @PostMapping("/{id}/executions")
    public FlowExecutionView startExecution(@PathVariable String id) {
        return executionService.start(id);
    }

    @GetMapping("/executions/{executionId}")
    public FlowExecutionView getExecution(@PathVariable String executionId) {
        return executionService.get(executionId);
    }

    @PostMapping("/executions/{executionId}/outputs")
    public FlowExecutionView transition(
        @PathVariable String executionId,
        @RequestBody FlowOutputRequest request
    ) {
        return executionService.transition(executionId, request);
    }

    @PostMapping("/executions/{executionId}/back")
    public FlowExecutionView back(
        @PathVariable String executionId,
        @RequestBody FlowExecutionRequest request
    ) {
        return executionService.back(executionId, request);
    }

}
