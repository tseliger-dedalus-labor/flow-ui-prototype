package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;

import java.util.List;

/**
 * Liefert die im jeweiligen Modul verfügbaren Flow-Komponenten.
 *
 * <p>Jedes Fachmodul kapselt seine Komponentenbeschreibung selbst, sodass
 * {@link ComponentRegistryService} nur noch alle Provider einsammeln und
 * zusammenführen muss.</p>
 */
public interface ComponentDescriptorProvider {
    /**
     * Gibt alle Komponentenbeschreibungen des Moduls zurück.
     *
     * @return Unveränderliche oder neu erzeugte Liste mit registrierbaren Komponenten.
     */
    List<ComponentDescriptor> descriptors();
}
