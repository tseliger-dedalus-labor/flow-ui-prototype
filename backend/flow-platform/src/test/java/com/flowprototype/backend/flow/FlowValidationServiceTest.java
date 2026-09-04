package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Deckt die Struktur-, Typ- und Erreichbarkeitsregeln der Flow-Validierung ab.
 *
 * <p>Jeder Test verändert gezielt einen ansonsten gültigen Referenz-Flow. Dadurch
 * bleibt erkennbar, welche einzelne Invariante den jeweiligen Fehler auslöst.</p>
 */
class FlowValidationServiceTest {
    private FlowValidationService validator;

    /**
     * Erstellt vor jedem Test eine kleine Komponenten-Registry mit allen für den
     * Referenz-Flow benötigten Ein- und Ausgabetypen.
     */
    @BeforeEach
    void setup() {
        ComponentDescriptorProvider provider = () -> List.of(
            new ComponentDescriptor("ward-list", "Stationsliste", false, List.of(),
                List.of(new OutputDescriptor("wardSelected", Map.of("wardId", SemanticType.WARD_ID)))),
            new ComponentDescriptor("ward-list-sidebar", "Stationsliste Sidebar", PresenterType.SIDEBAR, false, List.of(),
                List.of(new OutputDescriptor("wardSelected", Map.of("wardId", SemanticType.WARD_ID)))),
            new ComponentDescriptor("patient-list", "Patientenliste", false,
                List.of(
                    new InputDescriptor("wardId", SemanticType.WARD_ID, true, List.of()),
                    new InputDescriptor("mode", SemanticType.MODE, true, List.of("normal", "findings", "orders", "transfusions"))
                ),
                List.of(new OutputDescriptor("patientSelected", Map.of(
                    "patientId", SemanticType.PATIENT_ID,
                    "caseId", SemanticType.CASE_ID
                )))),
            new ComponentDescriptor("patient-view", "Patientenansicht", true,
                List.of(
                    new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of()),
                    new InputDescriptor("caseId", SemanticType.CASE_ID, true, List.of())
                ), List.of()),
            new ComponentDescriptor("demographics-panel", "Stammdaten", false,
                List.of(new InputDescriptor("patientId", SemanticType.PATIENT_ID, true, List.of())), List.of()),
            new ComponentDescriptor("demographics-sidebar", "Stammdaten Sidebar", PresenterType.SIDEBAR, false,
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
    void missingToolFails() {
        FlowDefinition def = buildValid();
        def.setTool(null);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getPath().equals("tool")));
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
    void childNodesInheritParentContext() {
        FlowDefinition def = buildValid();
        FlowNode patientView = def.getNodes().stream().filter(n -> n.getId().equals("view")).findFirst().orElseThrow();

        FlowNode demographics = new FlowNode();
        demographics.setId("demographics");
        demographics.setComponentId("demographics-panel");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        demographics.setInputBindings(Map.of("patientId", patientBinding));

        patientView.setChildren(List.of(demographics));
        def.getNodes().add(demographics);

        ValidationResult result = validator.validate(def);

        assertTrue(result.isValid(), () -> "Expected inherited context, got: " + result.getIssues().stream().map(ValidationIssue::getMessage).toList());
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

    @Test
    void validSidebarPasses() {
        FlowDefinition def = buildValid();
        FlowNode sidebarNode = new FlowNode();
        sidebarNode.setId("wards-sidebar");
        sidebarNode.setComponentId("ward-list-sidebar");
        def.getNodes().add(sidebarNode);
        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("wards-sidebar");
        sidebar.setPosition(SidebarPosition.RIGHT);
        sidebar.setWidth(320);
        FlowNode patients = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        patients.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertTrue(result.isValid(), () -> "Expected valid sidebar, got: " + result.getIssues().stream().map(ValidationIssue::getMessage).toList());
    }

    @Test
    void unknownSidebarNodeFails() {
        FlowDefinition def = buildValid();
        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("missing");
        FlowNode patients = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();
        patients.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getPath().equals("nodes.patients.sidebar.nodeId")));
    }

    @Test
    void sidebarReceivesContextOfActiveMainNode() {
        FlowDefinition def = buildValid();
        FlowNode view = def.getNodes().stream().filter(n -> n.getId().equals("view")).findFirst().orElseThrow();

        FlowNode demographics = new FlowNode();
        demographics.setId("demographics");
        demographics.setComponentId("demographics-sidebar");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        demographics.setInputBindings(Map.of("patientId", patientBinding));
        def.getNodes().add(demographics);

        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("demographics");
        view.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertTrue(result.isValid(), () -> "Expected valid contextual sidebar, got: " + result.getIssues().stream().map(ValidationIssue::getMessage).toList());
    }

    @Test
    void sidebarMissingHostContextFails() {
        FlowDefinition def = buildValid();
        FlowNode patients = def.getNodes().stream().filter(n -> n.getId().equals("patients")).findFirst().orElseThrow();

        FlowNode demographics = new FlowNode();
        demographics.setId("demographics");
        demographics.setComponentId("demographics-sidebar");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        demographics.setInputBindings(Map.of("patientId", patientBinding));
        def.getNodes().add(demographics);

        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("demographics");
        patients.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("nodes.patients.sidebar")
                && issue.getMessage().contains("patientId")
        ));
    }

    @Test
    void fallbackSidebarIsValidatedForEveryMainNodeContext() {
        FlowDefinition def = buildValid();

        FlowNode demographics = new FlowNode();
        demographics.setId("demographics");
        demographics.setComponentId("demographics-sidebar");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        demographics.setInputBindings(Map.of("patientId", patientBinding));
        def.getNodes().add(demographics);

        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("demographics");
        def.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("sidebar")
                && issue.getMessage().contains("patientId")
        ));
    }

    @Test
    void sidebarContextDoesNotLeakIntoMainNodeValidation() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(n -> n.getId().equals("wards")).findFirst().orElseThrow();
        FlowNode view = def.getNodes().stream().filter(n -> n.getId().equals("view")).findFirst().orElseThrow();

        FlowTransition directToView = wards.getTransitions().get(0);
        directToView.setTargetNodeId("view");
        directToView.setContextMapping(Map.of("patientId", "$context.patientId"));

        FlowSidebar sidebar = new FlowSidebar();
        FlowNode sidebarNode = new FlowNode();
        sidebarNode.setId("wards-sidebar");
        sidebarNode.setComponentId("ward-list-sidebar");
        def.getNodes().add(sidebarNode);
        sidebar.setNodeId("wards-sidebar");
        view.setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("nodes.wards.transitions")
                && issue.getMessage().contains("$context.patientId")
        ));
    }

    @Test
    void contentPresenterInSidebarFails() {
        FlowDefinition def = buildValid();
        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId("wards");
        def.getNodes().stream().filter(node -> node.getId().equals("patients")).findFirst().orElseThrow()
            .setSidebar(sidebar);

        ValidationResult result = validator.validate(def);

        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getMessage().contains("SIDEBAR-Presenter")
        ));
    }

    @Test
    void sidebarPresenterInContentFails() {
        FlowDefinition def = buildValid();
        def.getNodes().stream().filter(node -> node.getId().equals("wards")).findFirst().orElseThrow()
            .setComponentId("ward-list-sidebar");

        ValidationResult result = validator.validate(def);

        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getMessage().contains("CONTENT-Presenter")
        ));
    }

    @Test
    void sidebarPresenterAsNestedContentFails() {
        FlowDefinition def = buildValid();
        FlowNode view = def.getNodes().stream().filter(node -> node.getId().equals("view")).findFirst().orElseThrow();

        FlowNode nestedContainer = new FlowNode();
        nestedContainer.setId("nested");
        nestedContainer.setComponentId("patient-view");
        nestedContainer.setInputBindings(view.getInputBindings());

        FlowNode nestedSidebarPresenter = new FlowNode();
        nestedSidebarPresenter.setId("nested-sidebar");
        nestedSidebarPresenter.setComponentId("ward-list-sidebar");
        nestedContainer.setChildren(List.of(nestedSidebarPresenter));
        view.setChildren(List.of(nestedContainer));
        def.getNodes().addAll(List.of(nestedContainer, nestedSidebarPresenter));

        ValidationResult result = validator.validate(def);

        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("nodes.nested-sidebar.componentId")
                && issue.getMessage().contains("CONTENT-Presenter")
        ));
    }

    @Test
    void duplicateNodeIdsFail() {
        FlowDefinition def = buildValid();
        FlowNode duplicate = new FlowNode();
        duplicate.setId("wards");
        duplicate.setComponentId("ward-list");
        def.getNodes().add(duplicate);

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("nodes.3.id")
                && issue.getMessage().contains("mehrfach vorhanden")
        ));
    }

    @Test
    void childCycleFailsWithoutOverflowing() {
        FlowDefinition def = buildValid();
        FlowNode view = def.getNodes().stream().filter(node -> node.getId().equals("view")).findFirst().orElseThrow();
        view.setChildren(List.of(view));

        ValidationResult result = assertDoesNotThrow(() -> validator.validate(def));

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getMessage().contains("keinen Zyklus")
        ));
    }

    @Test
    void unknownInputBindingFails() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(node -> node.getId().equals("wards")).findFirst().orElseThrow();
        InputBinding binding = new InputBinding();
        binding.setSource(BindingSource.STATIC);
        binding.setStaticValue("unused");
        wards.setInputBindings(Map.of("unknown", binding));

        ValidationResult result = validator.validate(def);

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getPath().equals("nodes.wards.inputBindings.unknown")
        ));
    }

    @Test
    void nullNodeCollectionsProduceIssuesInsteadOfExceptions() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(node -> node.getId().equals("wards")).findFirst().orElseThrow();
        wards.setChildren(null);
        wards.setTransitions(null);

        ValidationResult result = assertDoesNotThrow(() -> validator.validate(def));

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getPath().equals("nodes.wards.children")));
        assertTrue(result.getIssues().stream().anyMatch(issue -> issue.getPath().equals("nodes.wards.transitions")));
    }

    @Test
    void nullTransitionContextMappingProducesIssueInsteadOfException() {
        FlowDefinition def = buildValid();
        FlowNode wards = def.getNodes().stream().filter(node -> node.getId().equals("wards")).findFirst().orElseThrow();
        wards.getTransitions().get(0).setContextMapping(null);

        ValidationResult result = assertDoesNotThrow(() -> validator.validate(def));

        assertFalse(result.isValid());
        assertTrue(result.getIssues().stream().anyMatch(issue ->
            issue.getMessage().contains("Context-Mapping darf nicht null sein")
        ));
    }

    /**
     * Baut den minimalen gültigen Pfad Stationsliste → Patientenliste →
     * Patientenansicht auf, der als Ausgangspunkt für alle Negativtests dient.
     *
     * @return Vollständig typisierter und erreichbarer Referenz-Flow.
     */
    private FlowDefinition buildValid() {
        FlowDefinition def = new FlowDefinition();
        def.setId("f");
        def.setName("test");
        def.setTool(Tool.WebclientTool);
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
        toView.setContextMapping(Map.of(
            "patientId", "$event.patientId",
            "caseId", "$event.caseId"
        ));
        patients.setTransitions(new java.util.ArrayList<>(List.of(toView)));

        FlowNode view = new FlowNode();
        view.setId("view");
        view.setComponentId("patient-view");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        InputBinding caseBinding = new InputBinding();
        caseBinding.setSource(BindingSource.CONTEXT);
        caseBinding.setContextKey("caseId");
        view.setInputBindings(Map.of("patientId", patientBinding, "caseId", caseBinding));

        def.setNodes(new java.util.ArrayList<>(List.of(wards, patients, view)));
        return def;
    }
}
