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
        validator = new FlowValidationService(new ComponentRegistryService());
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
        wards.setTransitions(List.of(toPatients));

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
        patients.setTransitions(List.of(toView));

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
