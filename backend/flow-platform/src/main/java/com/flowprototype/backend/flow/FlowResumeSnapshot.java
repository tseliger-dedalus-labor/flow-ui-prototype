package com.flowprototype.backend.flow;

import java.util.Map;

/** Ein einzelner Rücksprungpunkt in einem portablen Flow-Zustand. */
public record FlowResumeSnapshot(String nodeId, Map<String, Object> context) {}
