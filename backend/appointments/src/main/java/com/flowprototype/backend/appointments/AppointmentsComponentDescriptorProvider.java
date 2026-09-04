package com.flowprototype.backend.appointments;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.InputDescriptor;
import com.flowprototype.backend.flow.model.SemanticType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AppointmentsComponentDescriptorProvider implements ComponentDescriptorProvider {
    @Override
    public List<ComponentDescriptor> descriptors() {
        return List.of(new ComponentDescriptor(
            "appointments-panel",
            "Terminplanung",
            false,
            List.of(new InputDescriptor("wardId", SemanticType.WARD_ID, true, List.of())),
            List.of()
        ));
    }
}
