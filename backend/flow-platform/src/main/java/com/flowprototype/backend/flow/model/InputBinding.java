package com.flowprototype.backend.flow.model;

/**
 * Bindet eine Komponenteneingabe an einen statischen Wert oder einen Kontextschlüssel.
 */
public class InputBinding {
    private BindingSource source;
    private Object staticValue;
    private String contextKey;

    /** Erstellt eine leere Zuordnung für die JSON-Bindung. */
    public InputBinding() {}

    /** @return Herkunft des Eingabewerts. */
    public BindingSource getSource() { return source; }
    /** @param source Herkunft des Eingabewerts. */
    public void setSource(BindingSource source) { this.source = source; }
    /** @return Statischer Wert für {@link BindingSource#STATIC}. */
    public Object getStaticValue() { return staticValue; }
    /** @param staticValue Statischer Wert für {@link BindingSource#STATIC}. */
    public void setStaticValue(Object staticValue) { this.staticValue = staticValue; }
    /** @return Kontextschlüssel für {@link BindingSource#CONTEXT}. */
    public String getContextKey() { return contextKey; }
    /** @param contextKey Kontextschlüssel für {@link BindingSource#CONTEXT}. */
    public void setContextKey(String contextKey) { this.contextKey = contextKey; }
}
