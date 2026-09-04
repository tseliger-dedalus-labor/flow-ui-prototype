package com.flowprototype.backend.editor;

import com.flowprototype.backend.flow.ComponentRegistryService;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Editor-Endpunkt für das globale Komponentenverzeichnis.
 */
@RestController
@RequestMapping("/api/flow-registry")
public class RegistryController {
    private final ComponentRegistryService registryService;

    /**
     * Erstellt den Controller mit Zugriff auf das Komponentenverzeichnis.
     *
     * @param registryService Dienst für registrierte Komponenten.
     */
    public RegistryController(ComponentRegistryService registryService) {
        this.registryService = registryService;
    }

    /**
     * Liefert alle bekannten Komponenten für die Editorpalette.
     *
     * @return Komponentenbeschreibungen aller Module.
     */
    @GetMapping
    public List<ComponentDescriptor> getRegistry() {
        return registryService.getAll();
    }
}
