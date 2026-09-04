package com.flowprototype.backend.flow.model;

/**
 * Konfiguriert eine optionale Seitenleiste innerhalb eines Flows.
 *
 * <p>Die Seitenleiste zeigt keinen separaten Datensatz, sondern rendert einen bereits
 * vorhandenen Knoten seitlich angedockt. Breite und Position steuern damit nur
 * die Darstellung desselben Inhalts in der Oberflächenanwendung.</p>
 */
public class FlowSidebar {
    private String nodeId;
    private SidebarPosition position = SidebarPosition.LEFT;
    private Integer width = 280;
    private String ariaLabel;

    /** Erstellt eine leere Seitenleistenkonfiguration für die JSON-Bindung. */
    public FlowSidebar() {}

    /** @return ID des Knotens, der in der Seitenleiste angezeigt wird. */
    public String getNodeId() { return nodeId; }
    /** @param nodeId ID des Knotens, der in der Seitenleiste angezeigt wird. */
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }
    /** @return Andockposition der Seitenleiste. */
    public SidebarPosition getPosition() { return position; }
    /** @param position Andockposition der Seitenleiste. */
    public void setPosition(SidebarPosition position) { this.position = position; }
    /** @return Gewünschte Breite der Seitenleiste in Pixeln. */
    public Integer getWidth() { return width; }
    /** @param width Gewünschte Breite der Seitenleiste in Pixeln. */
    public void setWidth(Integer width) { this.width = width; }
    /** @return ARIA-Label für assistive Technologien. */
    public String getAriaLabel() { return ariaLabel; }
    /** @param ariaLabel ARIA-Label für assistive Technologien. */
    public void setAriaLabel(String ariaLabel) { this.ariaLabel = ariaLabel; }
}
