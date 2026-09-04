package com.flowprototype.backend.flow.model;

/**
 * Beschreibt fachliche Typen für Eingaben, Ausgaben und Kontextwerte.
 */
public enum SemanticType {
    /** Generischer Textwert ohne stärkere fachliche Semantik. */
    STRING,
    /** Betriebsmodus eines Oberflächenbausteins, z. B. normal oder orders. */
    MODE,
    /** Identifikator einer Station. */
    WARD_ID,
    /** Identifikator eines Patienten. */
    PATIENT_ID,
    /** Identifikator eines Patientenfalls. */
    CASE_ID,
    /** Identifikator eines fachlichen Datensatzes. */
    RECORD_ID
}
