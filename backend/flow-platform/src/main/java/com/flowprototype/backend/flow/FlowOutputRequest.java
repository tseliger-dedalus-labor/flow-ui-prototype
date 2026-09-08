package com.flowprototype.backend.flow;

import java.util.HashMap;
import java.util.Map;

/**
 * Von einem Widget emittierter Output für eine laufende Flow-Ausführung.
 */
public record FlowOutputRequest(
    long expectedVersion,
    String sourceNodeId,
    String outputName,
    Map<String, Object> payload
) {
    public FlowOutputRequest {
        payload = payload == null ? Map.of() : Map.copyOf(new HashMap<>(payload));
    }
}
