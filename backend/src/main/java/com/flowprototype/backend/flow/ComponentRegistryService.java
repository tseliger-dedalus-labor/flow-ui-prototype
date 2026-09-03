package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.InputDescriptor;
import com.flowprototype.backend.flow.model.OutputDescriptor;
import com.flowprototype.backend.flow.model.SemanticType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ComponentRegistryService {
    private final List<ComponentDescriptor> descriptors;

    public ComponentRegistryService() {
        descriptors = List.of(
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
            new ComponentDescriptor("demographics-panel", "Stammdaten", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
                List.of()),
            new ComponentDescriptor("findings-panel", "Befunde", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
                List.of()),
            new ComponentDescriptor("orders-panel", "Aufträge", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
                List.of()),
            new ComponentDescriptor("transfusions-panel", "Transfusionen", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())),
                List.of()),
            new ComponentDescriptor("appointments-panel", "Terminplanung", false,
                List.of(new InputDescriptor("wardId", SemanticType.WARD_ID, true, List.of())),
                List.of())
        );
    }

    public List<ComponentDescriptor> getAll() {
        return descriptors;
    }

    public Optional<ComponentDescriptor> byId(String id) {
        return descriptors.stream().filter(d -> d.getId().equals(id)).findFirst();
    }
}
