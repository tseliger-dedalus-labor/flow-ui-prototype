package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Repräsentiert einen einzelnen Knoten innerhalb eines Flows.
 *
 * <p>Ein Knoten verweist auf eine registrierte Komponente, kann Eingaben aus
 * statischen Werten oder Kontext binden und definiert optionale Kindknoten für
 * Layoutcontainer sowie Transitionen für den Navigationsfluss.</p>
 */
public class FlowNode {
    private String id;
    private String componentId;
    private Map<String, InputBinding> inputBindings = new HashMap<>();
    private List<FlowNode> children = new ArrayList<>();
    private List<FlowTransition> transitions = new ArrayList<>();
    private List<String> requiredPermissions = new ArrayList<>();

    /** Erstellt einen leeren Knoten für die JSON-Bindung. */
    public FlowNode() {}

    /** @return Technische Knoten-ID. */
    public String getId() { return id; }
    /** @param id Technische Knoten-ID. */
    public void setId(String id) { this.id = id; }
    /** @return Komponenten-ID aus dem globalen Komponentenverzeichnis. */
    public String getComponentId() { return componentId; }
    /** @param componentId Komponenten-ID aus dem globalen Komponentenverzeichnis. */
    public void setComponentId(String componentId) { this.componentId = componentId; }
    /** @return Konfigurierte Eingabezuordnungen nach Eingabenamen. */
    public Map<String, InputBinding> getInputBindings() { return inputBindings; }
    /** @param inputBindings Konfigurierte Eingabezuordnungen nach Eingabenamen. */
    public void setInputBindings(Map<String, InputBinding> inputBindings) { this.inputBindings = inputBindings; }
    /** @return Layout-Kindknoten für Container-Komponenten. */
    public List<FlowNode> getChildren() { return children; }
    /** @param children Layout-Kindknoten für Containerkomponenten. */
    public void setChildren(List<FlowNode> children) { this.children = children; }
    /** @return Mögliche Folgezustände des Knotens. */
    public List<FlowTransition> getTransitions() { return transitions; }
    /** @param transitions Mögliche Folgezustände des Knotens. */
    public void setTransitions(List<FlowTransition> transitions) { this.transitions = transitions; }
    /** @return Benötigte Berechtigungen für die Darstellung des Knotens. */
    public List<String> getRequiredPermissions() { return requiredPermissions; }
    /** @param requiredPermissions Benötigte Berechtigungen für die Darstellung des Knotens. */
    public void setRequiredPermissions(List<String> requiredPermissions) { this.requiredPermissions = requiredPermissions; }
}
