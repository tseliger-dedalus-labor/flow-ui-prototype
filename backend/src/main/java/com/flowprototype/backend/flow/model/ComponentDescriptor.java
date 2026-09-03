package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

public class ComponentDescriptor {
    private String id;
    private String title;
    private boolean container;
    private List<InputDescriptor> inputs = new ArrayList<>();
    private List<OutputDescriptor> outputs = new ArrayList<>();

    public ComponentDescriptor() {}

    public ComponentDescriptor(String id, String title, boolean container, List<InputDescriptor> inputs, List<OutputDescriptor> outputs) {
        this.id = id;
        this.title = title;
        this.container = container;
        if (inputs != null) {
            this.inputs = inputs;
        }
        if (outputs != null) {
            this.outputs = outputs;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isContainer() { return container; }
    public void setContainer(boolean container) { this.container = container; }
    public List<InputDescriptor> getInputs() { return inputs; }
    public void setInputs(List<InputDescriptor> inputs) { this.inputs = inputs; }
    public List<OutputDescriptor> getOutputs() { return outputs; }
    public void setOutputs(List<OutputDescriptor> outputs) { this.outputs = outputs; }
}
