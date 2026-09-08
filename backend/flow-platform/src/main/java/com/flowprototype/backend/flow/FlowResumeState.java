package com.flowprototype.backend.flow;

import java.util.List;
import java.util.Map;

/**
 * Portabler, signierter Zustand, aus dem eine neue Flow-Ausführung aufgebaut werden kann.
 */
public record FlowResumeState(
    int schemaVersion,
    String flowId,
    long flowVersion,
    String currentNodeId,
    Map<String, Object> context,
    List<FlowResumeSnapshot> history,
    long executionVersion,
    String path,
    Map<String, Object> viewScopes
) {
    public static final int CURRENT_SCHEMA_VERSION = 1;
}
