package com.flowprototype.backend.flow.model;

/**
 * Beschreibt, woher ein Eingabewert eines Knotens stammt.
 */
public enum BindingSource {
    /** Der Wert ist statisch im Flow hinterlegt. */
    STATIC,
    /** Der Wert wird aus dem zur Laufzeit aufgebauten Flow-Kontext gelesen. */
    CONTEXT
}
