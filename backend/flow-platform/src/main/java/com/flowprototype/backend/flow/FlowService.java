package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.ValidationResult;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FlowService {
    private final FlowRepository repository;
    private final FlowMapper mapper;
    private final FlowValidationService validationService;

    public FlowService(FlowRepository repository, FlowMapper mapper, FlowValidationService validationService) {
        this.repository = repository;
        this.mapper = mapper;
        this.validationService = validationService;
    }

    public List<FlowSummary> list() {
        return repository.findAll().stream().map(e -> new FlowSummary(e.getId(), e.getName(), e.isActive())).toList();
    }

    public FlowDefinition get(String id) {
        return mapper.toDefinition(repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow nicht gefunden")));
    }

    public FlowDefinition getEffective() {
        FlowEntity entity = repository.findFirstByActiveTrueOrderByIdAsc().orElseGet(() -> repository.findAll().stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kein Flow vorhanden")));
        return mapper.toDefinition(entity);
    }

    public ValidationResult validate(FlowDefinition definition) {
        return validationService.validate(definition);
    }

    public FlowDefinition create(FlowDefinition definition) {
        if (definition.getId() == null || definition.getId().isBlank()) {
            definition.setId("flow-" + UUID.randomUUID());
        }
        ValidationResult result = validationService.validate(definition);
        if (!result.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow ungültig: " + result.getIssues().get(0).getMessage());
        }
        FlowEntity entity = mapper.toEntity(definition, false);
        repository.save(entity);
        return mapper.toDefinition(entity);
    }

    public FlowDefinition update(String id, FlowDefinition definition) {
        FlowEntity existing = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow nicht gefunden"));
        definition.setId(id);
        ValidationResult result = validationService.validate(definition);
        if (!result.isValid()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow ungültig: " + result.getIssues().get(0).getMessage());
        }
        FlowEntity updated = mapper.toEntity(definition, existing.isActive());
        repository.save(updated);
        return mapper.toDefinition(updated);
    }
}
