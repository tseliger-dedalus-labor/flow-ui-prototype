package com.flowprototype.backend.flow.model;

/**
 * Beschreibt ein einzelnes Problem, das bei der Flow-Validierung gefunden wurde.
 */
public class ValidationIssue {
    private String path;
    private String message;

    /** Erstellt ein leeres Validierungsproblem für die JSON-Bindung. */
    public ValidationIssue() {}

    /**
     * Erstellt ein Validierungsproblem mit Pfad und Meldung.
     *
     * @param path Technischer Pfad innerhalb der Flowbeschreibung.
     * @param message Fachliche Fehlermeldung.
     */
    public ValidationIssue(String path, String message) {
        this.path = path;
        this.message = message;
    }

    /** @return Technischer Pfad des Problems. */
    public String getPath() { return path; }
    /** @param path Technischer Pfad des Problems. */
    public void setPath(String path) { this.path = path; }
    /** @return Fachliche Fehlermeldung. */
    public String getMessage() { return message; }
    /** @param message Fachliche Fehlermeldung. */
    public void setMessage(String message) { this.message = message; }
}
