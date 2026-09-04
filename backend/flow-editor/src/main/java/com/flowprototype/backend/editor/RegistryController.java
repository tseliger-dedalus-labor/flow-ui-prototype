package com.flowprototype.backend.editor;

import com.flowprototype.backend.flow.ComponentRegistryService;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/flow-registry")
public class RegistryController {
    private final ComponentRegistryService registryService;

    public RegistryController(ComponentRegistryService registryService) {
        this.registryService = registryService;
    }

    @GetMapping
    public List<ComponentDescriptor> getRegistry() {
        return registryService.getAll();
    }
}
