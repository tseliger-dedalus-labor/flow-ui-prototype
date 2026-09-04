package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Beschreibt eine einzelne Eingabe einer Komponente.
 */
public class InputDescriptor {
    private String name;
    private SemanticType semanticType;
    private boolean required;
    private List<String> allowedValues = new ArrayList<>();

    /** Erstellt einen leeren Eingabedeskriptor für die JSON-Bindung. */
    public InputDescriptor() {}

    /**
     * Erstellt eine vollständige Eingabebeschreibung.
     *
     * @param name Technischer Name der Eingabe.
     * @param semanticType Erwarteter semantischer Typ.
     * @param required Kennzeichnet Pflichtinputs.
     * @param allowedValues Optional erlaubte Literalwerte, z. B. für {@link SemanticType#MODE}.
     */
    public InputDescriptor(String name, SemanticType semanticType, boolean required, List<String> allowedValues) {
        this.name = name;
        this.semanticType = semanticType;
        this.required = required;
        if (allowedValues != null) {
            this.allowedValues = allowedValues;
        }
    }

    /** @return Technischer Name der Eingabe. */
    public String getName() { return name; }
    /** @param name Technischer Name der Eingabe. */
    public void setName(String name) { this.name = name; }
    /** @return Erwarteter semantischer Typ der Eingabe. */
    public SemanticType getSemanticType() { return semanticType; }
    /** @param semanticType Erwarteter semantischer Typ der Eingabe. */
    public void setSemanticType(SemanticType semanticType) { this.semanticType = semanticType; }
    /** @return {@code true}, wenn die Eingabe gebunden sein muss. */
    public boolean isRequired() { return required; }
    /** @param required Kennzeichnet Pflichtinputs. */
    public void setRequired(boolean required) { this.required = required; }
    /** @return Optional erlaubte Literalwerte für statische Zuordnungen. */
    public List<String> getAllowedValues() { return allowedValues; }
    /** @param allowedValues Optional erlaubte Literalwerte für statische Zuordnungen. */
    public void setAllowedValues(List<String> allowedValues) { this.allowedValues = allowedValues; }
}
