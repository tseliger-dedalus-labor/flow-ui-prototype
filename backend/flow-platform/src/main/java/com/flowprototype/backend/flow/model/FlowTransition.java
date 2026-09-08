package com.flowprototype.backend.flow.model;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

/**
 * Beschreibt einen gerichteten Übergang zwischen zwei Flow-Knoten.
 *
 * <p>Der Übergang reagiert auf eine benannte Ausgabe des Quellknotens und kann
 * dabei über {@code $event.*}- oder {@code $context.*}-Ausdrücke neue Kontextwerte
 * für den Zielknoten ableiten.</p>
 */
public class FlowTransition {
    private String onOutput;
    private String targetNodeId;
    private String resolverId;
    private Map<String, String> contextMapping = new HashMap<>();
    private Map<PrtType, IxtDisplayType> prtTypeDisplayTypes = new EnumMap<>(PrtType.class);

    /** Erstellt eine leere Transition für die JSON-Bindung. */
    public FlowTransition() {}

    /** @return Name der auslösenden Ausgabe am Quellknoten. */
    public String getOnOutput() { return onOutput; }
    /** @param onOutput Name der auslösenden Ausgabe am Quellknoten. */
    public void setOnOutput(String onOutput) { this.onOutput = onOutput; }
    /** @return ID des Zielknotens. */
    public String getTargetNodeId() { return targetNodeId; }
    /** @param targetNodeId ID des Zielknotens. */
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
    /** @return Optionaler fachlicher Resolver für die Anreicherung des Outputs. */
    public String getResolverId() { return resolverId; }
    /** @param resolverId ID eines durch ein Fachmodul registrierten Resolvers. */
    public void setResolverId(String resolverId) { this.resolverId = resolverId; }
    /** @return Mapping neuer Kontextschlüssel auf Ausdrücke aus Event oder bestehendem Kontext. */
    public Map<String, String> getContextMapping() { return contextMapping; }
    /** @param contextMapping Mapping neuer Kontextschlüssel auf Ausdrücke aus Event oder bestehendem Kontext. */
    public void setContextMapping(Map<String, String> contextMapping) { this.contextMapping = contextMapping; }
    /** @return Optionale dynamische DisplayType-Ziele je Record-Typ. */
    public Map<PrtType, IxtDisplayType> getPrtTypeDisplayTypes() { return prtTypeDisplayTypes; }
    /** @param prtTypeDisplayTypes Dynamische DisplayType-Ziele je Record-Typ. */
    public void setPrtTypeDisplayTypes(Map<PrtType, IxtDisplayType> prtTypeDisplayTypes) {
        this.prtTypeDisplayTypes = prtTypeDisplayTypes;
    }
}
