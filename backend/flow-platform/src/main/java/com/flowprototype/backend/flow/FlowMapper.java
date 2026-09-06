package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.persistence.FlowEntity;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Konvertiert zwischen persistierter Flow-Entität und Schnittstellenmodell.
 *
 * <p>Die relationale Tabelle hält ID, Name und Aktivstatus in eigenen Spalten,
 * während die restliche Graphstruktur als JSON-CLOB abgelegt wird. So bleiben
 * einfache Abfragen effizient und die verschachtelte Flow-Definition dennoch
 * ohne aufwendiges relationales Schema speicherbar.</p>
 */
@Component
public class FlowMapper {
    private final ObjectMapper objectMapper;

    /**
     * Erstellt den Umsetzer mit dem zentralen JSON-Objektabbildner des Moduls.
     *
     * @param objectMapper Objektabbildner für Serialisierung und Deserialisierung.
     */
    public FlowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Baut aus einer Datenbankentität wieder eine vollständige Definition des Flows.
     *
     * @param entity Persistierte Flow-Entität.
     * @return Deserialisierte Flowbeschreibung inklusive relationaler Metadaten.
     */
    public FlowDefinition toDefinition(FlowEntity entity) {
        try {
            FlowDefinition definition = objectMapper.readValue(entity.getDefinitionJson(), FlowDefinition.class);
            // ID und Anzeigename bleiben relational gespiegelt, damit sie ohne JSON-Parsen verfügbar sind.
            definition.setId(entity.getId());
            definition.setName(entity.getName());
            return definition;
        } catch (JacksonException e) {
            throw new IllegalStateException("Flow-Definition konnte nicht gelesen werden", e);
        }
    }

    /**
     * Wandelt ein Schnittstellenmodell in das persistierte Tabellenformat um.
     *
     * @param definition Zu speichernde Flowbeschreibung.
     * @param active Aktivstatus der Entität.
     * @return Persistierbare Entität mit JSON-Nutzlast.
     */
    public FlowEntity toEntity(FlowDefinition definition, boolean active) {
        FlowEntity entity = new FlowEntity();
        entity.setId(definition.getId());
        entity.setName(definition.getName());
        entity.setActive(active);
        try {
            FlowDefinition payload = new FlowDefinition();
            // Relationale Metadaten werden absichtlich nicht doppelt in der JSON-Nutzlast gespeichert.
            payload.setTool(definition.getTool());
            payload.setEntryNodeId(definition.getEntryNodeId());
            payload.setSidebar(definition.getSidebar());
            payload.setSidebarMode(definition.getSidebarMode());
            payload.setNodes(definition.getNodes());
            entity.setDefinitionJson(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload));
        } catch (JacksonException e) {
            throw new IllegalStateException("Flow-Definition konnte nicht gespeichert werden", e);
        }
        return entity;
    }
}
