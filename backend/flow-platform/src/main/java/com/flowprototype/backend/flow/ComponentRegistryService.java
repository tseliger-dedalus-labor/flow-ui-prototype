package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

@Service
public class ComponentRegistryService {
    private final List<ComponentDescriptor> descriptors;

    public ComponentRegistryService(List<ComponentDescriptorProvider> providers) {
        LinkedHashMap<String, ComponentDescriptor> byId = new LinkedHashMap<>();
        providers.stream()
            .flatMap(provider -> provider.descriptors().stream())
            .forEach(descriptor -> {
                if (byId.putIfAbsent(descriptor.getId(), descriptor) != null) {
                    throw new IllegalStateException("Komponente mehrfach registriert: " + descriptor.getId());
                }
            });
        descriptors = List.copyOf(byId.values());
    }

    public List<ComponentDescriptor> getAll() {
        return descriptors;
    }

    public Optional<ComponentDescriptor> byId(String id) {
        return descriptors.stream().filter(d -> d.getId().equals(id)).findFirst();
    }
}
