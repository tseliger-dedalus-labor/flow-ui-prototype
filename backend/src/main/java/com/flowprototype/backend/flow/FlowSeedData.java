package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FlowSeedData implements CommandLineRunner {
    private final FlowRepository repository;
    private final FlowMapper mapper;

    public FlowSeedData(FlowRepository repository, FlowMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) {
            return;
        }

        FlowDefinition normalFlow = new FlowDefinition();
        normalFlow.setId("flow-normal");
        normalFlow.setName("Standardfluss");
        normalFlow.setEntryNodeId("wards");

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
        FlowTransition toPatient = new FlowTransition();
        toPatient.setOnOutput("patientSelected");
        toPatient.setTargetNodeId("patientView");
        toPatient.setContextMapping(Map.of("patientId", "$event.patientId"));
        patients.setTransitions(List.of(toPatient));

        FlowNode patientView = new FlowNode();
        patientView.setId("patientView");
        patientView.setComponentId("patient-view");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        patientView.setInputBindings(Map.of("patientId", patientBinding));

        FlowNode stack = new FlowNode();
        stack.setId("patientStack");
        stack.setComponentId("stack-layout");

        FlowNode demographics = panel("demographics", "demographics-panel");
        FlowNode findings = panel("findings", "findings-panel");
        stack.setChildren(List.of(demographics, findings));
        patientView.setChildren(List.of(stack));

        normalFlow.setNodes(List.of(wards, patients, patientView, stack, demographics, findings));

        FlowDefinition ordersFlow = new FlowDefinition();
        ordersFlow.setId("flow-orders");
        ordersFlow.setName("Auftragsfokus");
        ordersFlow.setEntryNodeId("wards2");

        FlowNode wards2 = new FlowNode();
        wards2.setId("wards2");
        wards2.setComponentId("ward-list");
        FlowTransition toPatients2 = new FlowTransition();
        toPatients2.setOnOutput("wardSelected");
        toPatients2.setTargetNodeId("patients2");
        toPatients2.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards2.setTransitions(List.of(toPatients2));

        FlowNode patients2 = new FlowNode();
        patients2.setId("patients2");
        patients2.setComponentId("patient-list");
        InputBinding ward2 = new InputBinding(); ward2.setSource(BindingSource.CONTEXT); ward2.setContextKey("wardId");
        InputBinding mode2 = new InputBinding(); mode2.setSource(BindingSource.STATIC); mode2.setStaticValue("orders");
        patients2.setInputBindings(Map.of("wardId", ward2, "mode", mode2));
        FlowTransition toPatient2 = new FlowTransition();
        toPatient2.setOnOutput("patientSelected");
        toPatient2.setTargetNodeId("patientView2");
        toPatient2.setContextMapping(Map.of("patientId", "$event.patientId"));
        patients2.setTransitions(List.of(toPatient2));

        FlowNode patientView2 = new FlowNode();
        patientView2.setId("patientView2");
        patientView2.setComponentId("patient-view");
        InputBinding pid2 = new InputBinding(); pid2.setSource(BindingSource.CONTEXT); pid2.setContextKey("patientId");
        patientView2.setInputBindings(Map.of("patientId", pid2));

        FlowNode layout2 = new FlowNode();
        layout2.setId("layout2");
        layout2.setComponentId("stack-layout");
        FlowNode orders = panel("orders", "orders-panel");
        FlowNode transfusions = panel("transfusions", "transfusions-panel");
        layout2.setChildren(List.of(orders, transfusions));
        patientView2.setChildren(List.of(layout2));

        ordersFlow.setNodes(List.of(wards2, patients2, patientView2, layout2, orders, transfusions));

        FlowEntity first = mapper.toEntity(normalFlow, true);
        FlowEntity second = mapper.toEntity(ordersFlow, false);
        repository.saveAll(List.of(first, second));
    }

    private FlowNode panel(String id, String componentId) {
        FlowNode node = new FlowNode();
        node.setId(id);
        node.setComponentId(componentId);
        InputBinding b = new InputBinding();
        b.setSource(BindingSource.CONTEXT);
        b.setContextKey("patientId");
        node.setInputBindings(Map.of("patientId", b));
        return node;
    }
}
