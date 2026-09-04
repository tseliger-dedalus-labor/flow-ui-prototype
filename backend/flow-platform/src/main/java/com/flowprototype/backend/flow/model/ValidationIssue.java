package com.flowprototype.backend.flow.model;

public class ValidationIssue {
    private String path;
    private String message;

    public ValidationIssue() {}

    public ValidationIssue(String path, String message) {
        this.path = path;
        this.message = message;
    }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
