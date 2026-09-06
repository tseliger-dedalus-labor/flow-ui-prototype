package com.flowprototype.backend.laboratory;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LaboratoryPortalComponentDescriptorProvider implements ComponentDescriptorProvider {
    private static final String MANIFEST = "/META-INF/flow-components/laboratory-portal.components.json";
    private final ComponentManifestLoader manifestLoader;

    public LaboratoryPortalComponentDescriptorProvider(ComponentManifestLoader manifestLoader) {
        this.manifestLoader = manifestLoader;
    }

    @Override
    public List<ComponentDescriptor> descriptors() {
        return manifestLoader.load(MANIFEST, "laboratory-portal");
    }
}
