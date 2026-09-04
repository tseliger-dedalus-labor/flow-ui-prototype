package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Erstellt den Controller mit Zugriff auf die Flow-Fachdienste.
     *
     * @param service Dienst für Laden und Auswahl von Flows.
     */
    public FlowController(FlowService service) {
        this.service = service;
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

}
