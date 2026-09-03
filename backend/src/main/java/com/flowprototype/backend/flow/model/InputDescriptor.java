package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

public class InputDescriptor {
    private String name;
    private SemanticType semanticType;
    private boolean required;
    private List<String> allowedValues = new ArrayList<>();

    public InputDescriptor() {}

    public InputDescriptor(String name, SemanticType semanticType, boolean required, List<String> allowedValues) {
        this.name = name;
        this.semanticType = semanticType;
        this.required = required;
        if (allowedValues != null) {
            this.allowedValues = allowedValues;
        }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public SemanticType getSemanticType() { return semanticType; }
    public void setSemanticType(SemanticType semanticType) { this.semanticType = semanticType; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public List<String> getAllowedValues() { return allowedValues; }
    public void setAllowedValues(List<String> allowedValues) { this.allowedValues = allowedValues; }
}
