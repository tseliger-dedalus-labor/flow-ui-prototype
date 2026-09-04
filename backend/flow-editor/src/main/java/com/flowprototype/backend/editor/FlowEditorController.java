package com.flowprototype.backend.editor;

import com.flowprototype.backend.flow.FlowService;
import com.flowprototype.backend.flow.FlowSummary;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.ValidationResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/flows")
public class FlowEditorController {
    private final FlowService service;

    public FlowEditorController(FlowService service) {
        this.service = service;
    }

    @GetMapping
    public List<FlowSummary> list() {
        return service.list();
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
