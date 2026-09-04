package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flows")
public class FlowController {
    private final FlowService service;

    public FlowController(FlowService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public FlowDefinition get(@PathVariable String id) {
        return service.get(id);
    }

    @GetMapping("/effective")
    public FlowDefinition effective() {
        return service.getEffective();
    }

}
