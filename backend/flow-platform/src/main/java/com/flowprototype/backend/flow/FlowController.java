package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.ValidationResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flows")
public class FlowController {
    private final FlowService service;

    public FlowController(FlowService service) {
        this.service = service;
    }

    @GetMapping
    public List<FlowSummary> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public FlowDefinition get(@PathVariable String id) {
        return service.get(id);
    }

    @GetMapping("/effective")
    public FlowDefinition effective() {
        return service.getEffective();
    }

    @PostMapping
    public FlowDefinition create(@RequestBody FlowDefinition definition) {
        return service.create(definition);
    }

    @PutMapping("/{id}")
    public FlowDefinition update(@PathVariable String id, @RequestBody FlowDefinition definition) {
        return service.update(id, definition);
    }

    @PostMapping("/{id}/validate")
    public ValidationResult validate(@PathVariable String id, @RequestBody FlowDefinition definition) {
        definition.setId(id);
        return service.validate(definition);
    }
}
