package com.flowprototype.backend.flow;

/** Nicht vertraulicher Routing-Kopf eines verschlüsselten Flow-Links. */
public record FlowResumeTokenHeader(int schemaVersion, String flowId, String path) {}
