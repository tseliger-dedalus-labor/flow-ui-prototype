package com.flowprototype.backend.flow.model;

/**
 * Verknüpft die aus ixserv bekannten Tool-IDs mit den zugehörigen Frontend-Modulen.
 */
public enum Tool {
    AppointmentTool("appointments"),
    WebclientTool("patient-workflow");

    private final String module;

    Tool(String module) {
        this.module = module;
    }

    /** @return Name des Frontend-Moduls, das dieses Tool bereitstellt. */
    public String getModule() {
        return module;
    }
}
