package com.flowprototype.backend.flow;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.persistence.FlowEntity;
import org.springframework.stereotype.Component;

@Component
public class FlowMapper {
    private final ObjectMapper objectMapper;

    public FlowMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public FlowDefinition toDefinition(FlowEntity entity) {
        try {
            FlowDefinition definition = objectMapper.readValue(entity.getDefinitionJson(), FlowDefinition.class);
            definition.setId(entity.getId());
            definition.setName(entity.getName());
            return definition;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Flow-Definition konnte nicht gelesen werden", e);
        }
    }

    public FlowEntity toEntity(FlowDefinition definition, boolean active) {
        FlowEntity entity = new FlowEntity();
        entity.setId(definition.getId());
        entity.setName(definition.getName());
        entity.setActive(active);
        try {
            FlowDefinition payload = new FlowDefinition();
            payload.setEntryNodeId(definition.getEntryNodeId());
            payload.setNodes(definition.getNodes());
            entity.setDefinitionJson(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Flow-Definition konnte nicht gespeichert werden", e);
        }
        return entity;
    }
}
