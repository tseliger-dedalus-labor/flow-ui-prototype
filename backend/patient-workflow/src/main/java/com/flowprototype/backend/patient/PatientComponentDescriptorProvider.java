package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PatientComponentDescriptorProvider implements ComponentDescriptorProvider {
    private static final String MANIFEST = "/META-INF/flow-components/patient-workflow.components.json";
    private final ComponentManifestLoader manifestLoader;

    public PatientComponentDescriptorProvider(ComponentManifestLoader manifestLoader) {
        this.manifestLoader = manifestLoader;
    }

    @Override
    public List<ComponentDescriptor> descriptors() {
        return manifestLoader.load(MANIFEST, "patient-workflow");
    }
}
