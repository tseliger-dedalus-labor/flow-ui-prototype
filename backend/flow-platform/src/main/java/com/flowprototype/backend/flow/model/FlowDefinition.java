package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

public class FlowDefinition {
    private String id;
    private String name;
    private String entryNodeId;
    private List<FlowNode> nodes = new ArrayList<>();

    public FlowDefinition() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEntryNodeId() { return entryNodeId; }
    public void setEntryNodeId(String entryNodeId) { this.entryNodeId = entryNodeId; }
    public List<FlowNode> getNodes() { return nodes; }
    public void setNodes(List<FlowNode> nodes) { this.nodes = nodes; }
}
