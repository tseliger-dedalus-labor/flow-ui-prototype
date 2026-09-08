package com.flowprototype.backend.flow.model;

/**
 * Lokale Nachbildung des ix.serv-Typs {@code PrtType}.
 *
 * <p>Das Prototyp-Backend spiegelt die Namen absichtlich 1:1, ohne eine direkte
 * Abhängigkeit auf ix.serv einzuführen.</p>
 */
public enum PrtType {
    PRTTYPE_NONE,
    PRTTYPE_ORDER,
    PRTTYPE_REPORT,
    PRTTYPE_DOCUMENT,
    PRTTYPE_TRAFU
}
