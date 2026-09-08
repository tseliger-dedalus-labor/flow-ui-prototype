package com.flowprototype.backend.flow;

/** Übergibt einen portablen Flow-Link zum Wiederaufbau einer neuen Ausführung. */
public record FlowResumeRequest(String token) {}
