package com.flowprototype.backend.flow;

/**
 * Kompakte Übersicht eines gespeicherten Flows für Listenansichten im Editor.
 */
public class FlowSummary {
    private String id;
    private String name;
    private boolean active;

    /** Erstellt eine leere Zusammenfassung für die JSON-Bindung. */
    public FlowSummary() {}

    /**
     * Erstellt eine vollständige Flow-Zusammenfassung.
     *
     * @param id Persistente Flow-ID.
     * @param name Anzeigename des Flows.
     * @param active Kennzeichnet den aktuell aktiven Flow.
     */
    public FlowSummary(String id, String name, boolean active) {
        this.id = id;
        this.name = name;
        this.active = active;
    }

    /** @return Persistente Flow-ID. */
    public String getId() { return id; }
    /** @param id Persistente Flow-ID. */
    public void setId(String id) { this.id = id; }
    /** @return Anzeigename des Flows. */
    public String getName() { return name; }
    /** @param name Anzeigename des Flows. */
    public void setName(String name) { this.name = name; }
    /** @return {@code true}, wenn der Flow zur Laufzeit aktiv ist. */
    public boolean isActive() { return active; }
    /** @param active Neuer Aktivstatus des Flows. */
    public void setActive(boolean active) { this.active = active; }
}
