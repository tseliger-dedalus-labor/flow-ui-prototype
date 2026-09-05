package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Beschreibt einen vollständig serialisierbaren Flow-Graphen.
 *
 * <p>Der Flow enthält eine flache Knotenliste für globale ID-Referenzen und
 * optionale Verschachtelungen über {@link FlowNode#getChildren()} für Layoutstrukturen.
 * Knoten können jeweils eine eigene {@link FlowSidebar} definieren. Die optionale
 * Sidebar auf Flow-Ebene bleibt als Fallback für bestehende Definitionen erhalten.</p>
 */
public class FlowDefinition {
    private String id;
    private String name;
    private Tool tool;
    private String entryNodeId;
    private FlowSidebar sidebar;
    private SidebarMode sidebarMode = SidebarMode.SINGLE;
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
    /** @return Tool, in dem der Flow angeboten und ausgeführt wird. */
    public Tool getTool() { return tool; }
    /** @param tool Tool, in dem der Flow angeboten und ausgeführt wird. */
    public void setTool(Tool tool) { this.tool = tool; }
    /** @return ID des Einstiegsknotens für die Laufzeitnavigation. */
    public String getEntryNodeId() { return entryNodeId; }
    /** @param entryNodeId ID des Einstiegsknotens für die Laufzeitnavigation. */
    public void setEntryNodeId(String entryNodeId) { this.entryNodeId = entryNodeId; }
    /** @return Optionale Standard-Seitenleiste für Knoten ohne eigene Konfiguration. */
    public FlowSidebar getSidebar() { return sidebar; }
    /** @param sidebar Optionale Standard-Seitenleiste für Knoten ohne eigene Konfiguration. */
    public void setSidebar(FlowSidebar sidebar) { this.sidebar = sidebar; }
    /** @return Darstellungsmodus für die konfigurierten Sidebars. */
    public SidebarMode getSidebarMode() { return sidebarMode; }
    /** @param sidebarMode Darstellungsmodus für die konfigurierten Sidebars. */
    public void setSidebarMode(SidebarMode sidebarMode) { this.sidebarMode = sidebarMode; }
    /** @return Alle Knoten des Flows, unabhängig von ihrer Layoutverschachtelung. */
    public List<FlowNode> getNodes() { return nodes; }
    /** @param nodes Alle Knoten des Flows, unabhängig von ihrer Layoutverschachtelung. */
    public void setNodes(List<FlowNode> nodes) { this.nodes = nodes; }
}
