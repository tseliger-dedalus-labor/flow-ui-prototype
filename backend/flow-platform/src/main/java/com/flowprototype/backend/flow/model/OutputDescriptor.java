package com.flowprototype.backend.flow.model;

import java.util.HashMap;
import java.util.Map;

/**
 * Beschreibt eine von einer Komponente emittierte Ausgabe.
 */
public class OutputDescriptor {
    private String name;
    private Map<String, SemanticType> payload = new HashMap<>();

    /** Erstellt einen leeren Ausgabedeskriptor für die JSON-Bindung. */
    public OutputDescriptor() {}

    /**
     * Erstellt eine vollständige Ausgabebeschreibung.
     *
     * @param name Technischer Name der Ausgabe.
     * @param payload Typisierte Ereignisnutzlast der Ausgabe.
     */
    public OutputDescriptor(String name, Map<String, SemanticType> payload) {
        this.name = name;
        if (payload != null) {
            this.payload = payload;
        }
    }

    /** @return Technischer Name der Ausgabe. */
    public String getName() { return name; }
    /** @param name Technischer Name der Ausgabe. */
    public void setName(String name) { this.name = name; }
    /** @return Typisierte Ereignisnutzlast der Ausgabe. */
    public Map<String, SemanticType> getPayload() { return payload; }
    /** @param payload Typisierte Ereignisnutzlast der Ausgabe. */
    public void setPayload(Map<String, SemanticType> payload) { this.payload = payload; }
}
