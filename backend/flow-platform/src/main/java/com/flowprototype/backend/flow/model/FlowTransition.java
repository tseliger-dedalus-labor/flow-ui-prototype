package com.flowprototype.backend.flow.model;

import java.util.HashMap;
import java.util.Map;

public class FlowTransition {
    private String onOutput;
    private String targetNodeId;
    private Map<String, String> contextMapping = new HashMap<>();

    public FlowTransition() {}

    public String getOnOutput() { return onOutput; }
    public void setOnOutput(String onOutput) { this.onOutput = onOutput; }
    public String getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
    public Map<String, String> getContextMapping() { return contextMapping; }
    public void setContextMapping(Map<String, String> contextMapping) { this.contextMapping = contextMapping; }
}
