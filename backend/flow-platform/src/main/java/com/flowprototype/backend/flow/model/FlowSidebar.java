package com.flowprototype.backend.flow.model;

public class FlowSidebar {
    private String nodeId;
    private SidebarPosition position = SidebarPosition.LEFT;
    private Integer width = 280;
    private String ariaLabel;

    public FlowSidebar() {}

    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }
    public SidebarPosition getPosition() { return position; }
    public void setPosition(SidebarPosition position) { this.position = position; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public String getAriaLabel() { return ariaLabel; }
    public void setAriaLabel(String ariaLabel) { this.ariaLabel = ariaLabel; }
}
