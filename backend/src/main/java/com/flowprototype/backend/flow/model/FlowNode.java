package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FlowNode {
    private String id;
    private String componentId;
    private Map<String, InputBinding> inputBindings = new HashMap<>();
    private List<FlowNode> children = new ArrayList<>();
    private List<FlowTransition> transitions = new ArrayList<>();

    public FlowNode() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getComponentId() { return componentId; }
    public void setComponentId(String componentId) { this.componentId = componentId; }
    public Map<String, InputBinding> getInputBindings() { return inputBindings; }
    public void setInputBindings(Map<String, InputBinding> inputBindings) { this.inputBindings = inputBindings; }
    public List<FlowNode> getChildren() { return children; }
    public void setChildren(List<FlowNode> children) { this.children = children; }
    public List<FlowTransition> getTransitions() { return transitions; }
    public void setTransitions(List<FlowTransition> transitions) { this.transitions = transitions; }
}
