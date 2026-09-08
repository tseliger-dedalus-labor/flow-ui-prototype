package com.flowprototype.backend.flow;

/**
 * Versionsgebundene Anfrage an eine laufende Flow-Ausführung.
 */
public record FlowExecutionRequest(long expectedVersion) {}
