package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FlowExecutionServiceTest {
    private FlowExecutionService service;

    @BeforeEach
    void setup() {
        FlowService flowService = mock(FlowService.class);
        FlowDefinition flow = flow();
        when(flowService.get("flow")).thenReturn(flow);

        ComponentDescriptor order = descriptor("orders-panel", IxtDisplayType.DISPTYPE_FORM);
        ComponentDescriptor finding = descriptor("findings-panel", IxtDisplayType.DISPTYPE_REPORT);
        ComponentRegistryService components = new ComponentRegistryService(List.of(() -> List.of(order, finding)));
        FlowTransitionResolver resolver = new FlowTransitionResolver() {
            public String id() { return "record"; }
            public Map<String, SemanticType> inputTypes() { return Map.of("RecordID", SemanticType.RECORD_ID); }
            public Map<String, SemanticType> outputTypes() {
                return Map.of("RecordId", SemanticType.RECORD_ID, "prtType", SemanticType.PRT_TYPE);
            }
            public Map<String, Object> resolve(Map<String, Object> output, Map<String, Object> context) {
                return Map.of("RecordId", output.get("RecordID"), "prtType", PrtType.PRTTYPE_REPORT.name());
            }
        };
        service = new FlowExecutionService(
            flowService,
            components,
            new FlowTransitionResolverRegistry(List.of(resolver))
        );
    }

    @Test
    void resolvesOutputOnServerAndNavigatesBack() {
        FlowExecutionView started = service.start("flow");

        FlowExecutionView transitioned = service.transition(started.executionId(), new FlowOutputRequest(
            started.version(), "records", "recordSelected", Map.of("RecordID", "FND-1")
        ));

        assertThat(transitioned.currentNodeId()).isEqualTo("finding");
        assertThat(transitioned.context()).containsEntry("RecordId", "FND-1");
        assertThat(transitioned.resolvedInputsByNode().get("finding")).containsEntry("RecordId", "FND-1");
        assertThat(transitioned.canGoBack()).isTrue();

        FlowExecutionView restored = service.back(
            started.executionId(),
            new FlowExecutionRequest(transitioned.version())
        );
        assertThat(restored.currentNodeId()).isEqualTo("records");
        assertThat(restored.context()).isEmpty();
    }

    @Test
    void rejectsStaleCommands() {
        FlowExecutionView started = service.start("flow");
        service.transition(started.executionId(), new FlowOutputRequest(
            started.version(), "records", "recordSelected", Map.of("RecordID", "FND-1")
        ));

        assertThatThrownBy(() -> service.transition(started.executionId(), new FlowOutputRequest(
            started.version(), "records", "recordSelected", Map.of("RecordID", "FND-1")
        )))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("409 CONFLICT");
    }

    private FlowDefinition flow() {
        FlowTransition transition = new FlowTransition();
        transition.setOnOutput("recordSelected");
        transition.setTargetNodeId("order");
        transition.setResolverId("record");
        transition.setContextMapping(Map.of("RecordId", "$event.RecordId"));
        transition.setPrtTypeDisplayTypes(Map.of(PrtType.PRTTYPE_REPORT, IxtDisplayType.DISPTYPE_REPORT));

        FlowNode records = node("records", "reportcenter");
        records.setTransitions(List.of(transition));
        FlowNode order = node("order", "orders-panel");
        FlowNode finding = node("finding", "findings-panel");
        InputBinding binding = new InputBinding();
        binding.setSource(BindingSource.CONTEXT);
        binding.setContextKey("RecordId");
        finding.setInputBindings(Map.of("RecordId", binding));

        FlowDefinition flow = new FlowDefinition();
        flow.setId("flow");
        flow.setName("Flow");
        flow.setTool(Tool.ReportcenterTool);
        flow.setEntryNodeId("records");
        flow.setNodes(List.of(records, order, finding));
        return flow;
    }

    private FlowNode node(String id, String componentId) {
        FlowNode node = new FlowNode();
        node.setId(id);
        node.setComponentId(componentId);
        return node;
    }

    private ComponentDescriptor descriptor(String id, IxtDisplayType displayType) {
        ComponentDescriptor descriptor = new ComponentDescriptor(id, id, false, List.of(), List.of());
        descriptor.setDisplayType(displayType);
        return descriptor;
    }
}
