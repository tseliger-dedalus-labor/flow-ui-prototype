package com.flowprototype.backend.appointments;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AppointmentsComponentDescriptorProvider implements ComponentDescriptorProvider {
    private static final String MANIFEST = "/META-INF/flow-components/appointments.components.json";
    private final ComponentManifestLoader manifestLoader;

    public AppointmentsComponentDescriptorProvider(ComponentManifestLoader manifestLoader) {
        this.manifestLoader = manifestLoader;
    }

    @Override
    public List<ComponentDescriptor> descriptors() {
        return manifestLoader.load(MANIFEST, "appointments");
    }
}
