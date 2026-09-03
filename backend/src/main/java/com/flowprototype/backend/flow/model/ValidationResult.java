package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private boolean valid;
    private List<ValidationIssue> issues = new ArrayList<>();

    public ValidationResult() {}

    public ValidationResult(List<ValidationIssue> issues) {
        this.issues = issues;
        this.valid = issues.isEmpty();
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
    public List<ValidationIssue> getIssues() { return issues; }
    public void setIssues(List<ValidationIssue> issues) { this.issues = issues; }
}
