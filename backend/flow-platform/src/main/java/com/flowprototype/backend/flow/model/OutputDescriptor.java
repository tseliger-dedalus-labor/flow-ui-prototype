package com.flowprototype.backend.flow.model;

import java.util.HashMap;
import java.util.Map;

public class OutputDescriptor {
    private String name;
    private Map<String, SemanticType> payload = new HashMap<>();

    public OutputDescriptor() {}

    public OutputDescriptor(String name, Map<String, SemanticType> payload) {
        this.name = name;
        if (payload != null) {
            this.payload = payload;
        }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Map<String, SemanticType> getPayload() { return payload; }
    public void setPayload(Map<String, SemanticType> payload) { this.payload = payload; }
}
