package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;

import java.util.Map;

/**
 * Vollständige, renderbare Sicht einer serverseitigen Flow-Ausführung.
 */
public record FlowExecutionView(
    String executionId,
    String resumeToken,
    String flowId,
    long version,
    FlowDefinition definition,
    String currentNodeId,
    Map<String, Object> context,
    Map<String, Map<String, Object>> resolvedInputsByNode,
    boolean canGoBack,
    Map<String, Object> viewScopes
) {}
