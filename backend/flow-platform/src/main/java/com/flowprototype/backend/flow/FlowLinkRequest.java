package com.flowprototype.backend.flow;

import java.util.Map;

/** Ergänzt den autoritativen Flow-Zustand um teilbaren, komponentenspezifischen View-Zustand. */
public record FlowLinkRequest(String path, Map<String, Object> viewScopes) {}
