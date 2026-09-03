package com.flowprototype.backend.flow.model;

public class InputBinding {
    private BindingSource source;
    private Object staticValue;
    private String contextKey;

    public InputBinding() {}

    public BindingSource getSource() { return source; }
    public void setSource(BindingSource source) { this.source = source; }
    public Object getStaticValue() { return staticValue; }
    public void setStaticValue(Object staticValue) { this.staticValue = staticValue; }
    public String getContextKey() { return contextKey; }
    public void setContextKey(String contextKey) { this.contextKey = contextKey; }
}
