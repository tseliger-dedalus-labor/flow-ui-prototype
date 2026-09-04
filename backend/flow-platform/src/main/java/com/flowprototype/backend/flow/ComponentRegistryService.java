package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

@Service
public class ComponentRegistryService {
    private final List<ComponentDescriptor> descriptors;
    private final EnumMap<IxtDisplayType, ComponentDescriptor> byDisplayType;

    public ComponentRegistryService(List<ComponentDescriptorProvider> providers) {
        LinkedHashMap<String, ComponentDescriptor> byId = new LinkedHashMap<>();
        EnumMap<IxtDisplayType, ComponentDescriptor> displayTypes = new EnumMap<>(IxtDisplayType.class);
        providers.stream()
            .flatMap(provider -> provider.descriptors().stream())
            .forEach(descriptor -> {
                if (byId.putIfAbsent(descriptor.getId(), descriptor) != null) {
                    throw new IllegalStateException("Komponente mehrfach registriert: " + descriptor.getId());
                }
                if (descriptor.getDisplayType() != null) {
                    ComponentDescriptor existing = displayTypes.putIfAbsent(descriptor.getDisplayType(), descriptor);
                    if (existing != null) {
                        throw new IllegalStateException(
                            "IxtDisplayType mehrfach registriert: " + descriptor.getDisplayType()
                                + " (" + existing.getId() + ", " + descriptor.getId() + ")"
                        );
                    }
                }
            });
        descriptors = List.copyOf(byId.values());
        byDisplayType = displayTypes;
    }

    public List<ComponentDescriptor> getAll() {
        return descriptors;
    }

    public Optional<ComponentDescriptor> byId(String id) {
        return descriptors.stream().filter(d -> d.getId().equals(id)).findFirst();
    }

    public Optional<ComponentDescriptor> byDisplayType(IxtDisplayType displayType) {
        return Optional.ofNullable(byDisplayType.get(displayType));
    }
}
