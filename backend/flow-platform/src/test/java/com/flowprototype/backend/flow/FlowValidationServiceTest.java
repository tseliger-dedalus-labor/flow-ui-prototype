package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FlowValidationServiceTest {
    private FlowValidationService validator;

    @BeforeEach
    void setup() {
        ComponentDescriptorProvider provider = () -> List.of(
            new ComponentDescriptor("ward-list", "Stationsliste", false, List.of(),
                List.of(new OutputDescriptor("wardSelected", Map.of("wardId", SemanticType.WARD_ID)))),
            new ComponentDescriptor("patient-list", "Patientenliste", false,
                List.of(
                    new InputDescriptor("wardId", SemanticType.WARD_ID, true, List.of()),
                    new InputDescriptor("mode", SemanticType.MODE, true, List.of("normal", "findings", "orders", "transfusions"))
                ),
                List.of(new OutputDescriptor("patientSelected", Map.of("patientId", SemanticType.PATIENT_ID)))),
            new ComponentDescriptor("patient-view", "Patientenansicht", true,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())), List.of()),
            new ComponentDescriptor("demographics-panel", "Stammdaten", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())), List.of())
        );
        validator = new FlowValidationService(new ComponentRegistryService(List.of(provider)));
    }

    @Test
    void validDefinitionPasses() {
        ValidationResult result = validator.validate(buildValid());
        assertTrue(result.isValid(), () -> "Expected valid, got: " + result.getIssues().stream().map(ValidationIssue::getMessage).toList());
    }

    @Test
    void missingRequiredInputFails() {
        FlowDefinition def = buildValid();
        FlowNode patientList = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        Map<String, InputBinding> mutable = new HashMap<>(patientList.getInputBindings());
        mutable.remove("mode");
        patientList.setInputBindings(mutable);
        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
    }

    @Test
    void invalidEnumFails() {
        FlowDefinition def = buildValid();
        FlowNode patientList = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        patientList.getInputBindings().get("mode").setStaticValue("bogus");
        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
    }

    @Test
    void transitionUnknownOutputFails() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(n -> n.getId().equals("wards")).findFirst().orElseThrow();
        wards.getTransitions().get(0).setOnOutput("notThere");
        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
    }

    @Test
    void childrenOnNonContainerFails() {
        FlowDefinition def = buildValid();
        FlowNode patientList = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        FlowNode child = new FlowNode();
        child.setId("child");
        child.setComponentId("demographics-panel");
        patientList.setChildren(List.of(child));
        def.getNodes().add(child);
        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
    }

    @Test
    void multiHopContextPropagationPasses() {
        FlowDefinition def = buildValid();
        FlowNode patients = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        patients.getTransitions().get(0).setTargetNodeId("middle");

        FlowNode middle = new FlowNode();
        middle.setId("middle");
        middle.setComponentId("ward-list");
        FlowTransition toView = new FlowTransition();
        toView.setOnOutput("wardSelected");
        toView.setTargetNodeId("view");
        toView.setContextMapping(Map.of("patientId", "$context.patientId"));
        middle.setTransitions(List.of(toView));

        def.getNodes().add(middle);

        ValidationResult result = validator.validate(def);
        assertTrue(result.isValid(), () -> "Expected valid multi-hop context, got: " + result.getIssues().stream().map(ValidationIssue::getMessage).toList());
    }

    @Test
    void conflictingContextTypesAcrossPathsFail() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(n -> n.getId().equals("wards")).findFirst().orElseThrow();
        FlowTransition wrongTypePath = new FlowTransition();
        wrongTypePath.setOnOutput("wardSelected");
        wrongTypePath.setTargetNodeId("view");
        wrongTypePath.setContextMapping(Map.of("patientId", "$event.wardId"));
        wards.getTransitions().add(wrongTypePath);

        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getMessage().contains("widersprüchliche Typen")));
    }

    @Test
    void duplicateTransitionsForSameOutputFail() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(n -> n.getId().equals("wards")).findFirst().orElseThrow();
        FlowTransition duplicate = new FlowTransition();
        duplicate.setOnOutput("wardSelected");
        duplicate.setTargetNodeId("view");
        duplicate.setContextMapping(Map.of("patientId", "$event.wardId"));
        wards.getTransitions().add(duplicate);

        ValidationResult result = validator.validate(def);
        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getMessage().contains("Mehrere Transitionen")));
    }

    private FlowDefinition buildValid() {
        FlowDefinition def = new FlowDefinition();
        def.setId("f");
        def.setName("test");
        def.setEntryNodeId("wards");

        FlowNode wards = new FlowNode();
        wards.setId("wards");
        wards.setComponentId("ward-list");
        FlowTransition toPatients = new FlowTransition();
        toPatients.setOnOutput("wardSelected");
        toPatients.setTargetNodeId("patients");
        toPatients.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards.setTransitions(new java.util.ArrayList<>(List.of(toPatients)));

        FlowNode patients = new FlowNode();
        patients.setId("patients");
        patients.setComponentId("patient-list");
        InputBinding wardBinding = new InputBinding();
        wardBinding.setSource(BindingSource.CONTEXT);
        wardBinding.setContextKey("wardId");
        InputBinding modeBinding = new InputBinding();
        modeBinding.setSource(BindingSource.STATIC);
        modeBinding.setStaticValue("normal");
        patients.setInputBindings(Map.of("wardId", wardBinding, "mode", modeBinding));

        FlowTransition toView = new FlowTransition();
        toView.setOnOutput("patientSelected");
        toView.setTargetNodeId("view");
        toView.setContextMapping(Map.of("patientId", "$event.patientId"));
        patients.setTransitions(new java.util.ArrayList<>(List.of(toView)));

        FlowNode view = new FlowNode();
        view.setId("view");
        view.setComponentId("patient-view");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        view.setInputBindings(Map.of("patientId", patientBinding));

        def.setNodes(new java.util.ArrayList<>(List.of(wards, patients, view)));
        return def;
    }
}
