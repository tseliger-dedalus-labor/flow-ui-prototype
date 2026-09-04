package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Beschreibt einen vollständig serialisierbaren Flow-Graphen.
 *
 * <p>Der Flow enthält eine flache Knotenliste für globale ID-Referenzen und
 * optionale Verschachtelungen über {@link FlowNode#getChildren()} für Layoutstrukturen.
 * Eine optionale {@link FlowSidebar} dockt einen vorhandenen Knoten seitlich an,
 * ohne einen eigenen Ausführungspfad einzuführen.</p>
 */
public class FlowDefinition {
    private String id;
    private String name;
    private String entryNodeId;
    private FlowSidebar sidebar;
    private List<FlowNode> nodes = new ArrayList<>();

    /** Erstellt eine leere Flowdefinition für die JSON-Bindung. */
    public FlowDefinition() {}

    /** @return Persistente oder editorseitig vergebene Flow-ID. */
    public String getId() { return id; }
    /** @param id Persistente oder editorseitig vergebene Flow-ID. */
    public void setId(String id) { this.id = id; }
    /** @return Anzeigename des Flows. */
    public String getName() { return name; }
    /** @param name Anzeigename des Flows. */
    public void setName(String name) { this.name = name; }
    /** @return ID des Einstiegsknotens für die Laufzeitnavigation. */
    public String getEntryNodeId() { return entryNodeId; }
    /** @param entryNodeId ID des Einstiegsknotens für die Laufzeitnavigation. */
    public void setEntryNodeId(String entryNodeId) { this.entryNodeId = entryNodeId; }
    /** @return Optionale Seitenleistenkonfiguration des Flows. */
    public FlowSidebar getSidebar() { return sidebar; }
    /** @param sidebar Optionale Seitenleistenkonfiguration des Flows. */
    public void setSidebar(FlowSidebar sidebar) { this.sidebar = sidebar; }
    /** @return Alle Knoten des Flows, unabhängig von ihrer Layoutverschachtelung. */
    public List<FlowNode> getNodes() { return nodes; }
    /** @param nodes Alle Knoten des Flows, unabhängig von ihrer Layoutverschachtelung. */
    public void setNodes(List<FlowNode> nodes) { this.nodes = nodes; }
}
