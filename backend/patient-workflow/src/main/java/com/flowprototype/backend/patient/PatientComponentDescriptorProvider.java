package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.InputDescriptor;
import com.flowprototype.backend.flow.model.OutputDescriptor;
import com.flowprototype.backend.flow.model.SemanticType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class PatientComponentDescriptorProvider implements ComponentDescriptorProvider {
    @Override
    public List<ComponentDescriptor> descriptors() {
        return List.of(
            new ComponentDescriptor("ward-list", "Stationsliste", false, List.of(), List.of(new OutputDescriptor("wardSelected", Map.of("wardId", SemanticType.WARD_ID)))),
            new ComponentDescriptor("patient-list", "Patientenliste", false,
                List.of(
                    new InputDescriptor("wardId", SemanticType.WARD_ID, true, List.of()),
                    new InputDescriptor("mode", SemanticType.MODE, true, List.of("normal", "findings", "orders", "transfusions"))
                ),
                List.of(new OutputDescriptor("patientSelected", Map.of("patientId", SemanticType.PATIENT_ID)))
            ),
            new ComponentDescriptor("patient-view", "Patientenansicht", true,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
                List.of()),
            new ComponentDescriptor("stack-layout", "Stack-Layout", true, List.of(), List.of()),
            panel("demographics-panel", "Stammdaten"),
            panel("findings-panel", "Befunde"),
            panel("orders-panel", "Aufträge"),
            panel("transfusions-panel", "Transfusionen")
        );
    }

    private ComponentDescriptor panel(String id, String title) {
        return new ComponentDescriptor(id, title, false,
            List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
            List.of());
    }
}
