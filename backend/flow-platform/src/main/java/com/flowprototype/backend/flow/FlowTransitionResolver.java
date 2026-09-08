package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.SemanticType;

import java.util.Map;

/**
 * Fachmodul-Erweiterung für serverseitig angereicherte Flow-Transitionen.
 */
public interface FlowTransitionResolver {
    String id();

    Map<String, SemanticType> inputTypes();

    Map<String, SemanticType> outputTypes();

    Map<String, Object> resolve(Map<String, Object> output, Map<String, Object> context);
}
