package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Bündelt das Ergebnis einer Flow-Validierung.
 */
public class ValidationResult {
    private boolean valid;
    private List<ValidationIssue> issues = new ArrayList<>();

    /** Erstellt ein leeres Validierungsergebnis für die JSON-Bindung. */
    public ValidationResult() {}

    /**
     * Erstellt ein Validierungsergebnis direkt aus einer Fehlerliste.
     *
     * @param issues Gefundene Validierungsprobleme.
     */
    public ValidationResult(List<ValidationIssue> issues) {
        this.issues = issues;
        this.valid = issues.isEmpty();
    }

    /** @return {@code true}, wenn keine Validierungsprobleme vorliegen. */
    public boolean isValid() { return valid; }
    /** @param valid Kennzeichnet die Gültigkeit des Flows. */
    public void setValid(boolean valid) { this.valid = valid; }
    /** @return Gefundene Validierungsprobleme. */
    public List<ValidationIssue> getIssues() { return issues; }
    /** @param issues Gefundene Validierungsprobleme. */
    public void setIssues(List<ValidationIssue> issues) {
        this.issues = issues;
        this.valid = issues == null || issues.isEmpty();
    }
}
