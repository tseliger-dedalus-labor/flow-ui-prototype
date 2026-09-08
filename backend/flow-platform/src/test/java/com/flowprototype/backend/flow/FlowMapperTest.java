package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.FlowNode;
import com.flowprototype.backend.flow.model.FlowTransition;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.PrtType;
import com.flowprototype.backend.flow.model.SidebarMode;
import com.flowprototype.backend.flow.model.Tool;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class FlowMapperTest {

    @Test
    void preservesSidebarModeWhenMappingToAndFromPersistence() {
        FlowDefinition definition = new FlowDefinition();
        definition.setId("flow");
        definition.setName("Test");
        definition.setTool(Tool.WebclientTool);
        definition.setEntryNodeId("start");
        definition.setSidebarMode(SidebarMode.COLLAPSE);
        FlowTransition transition = new FlowTransition();
        transition.setOnOutput("recordSelected");
        transition.setTargetNodeId("detail");
        transition.setPrtTypeDisplayTypes(Map.of(
            PrtType.PRTTYPE_ORDER, IxtDisplayType.DISPTYPE_FORM
        ));
        FlowNode start = new FlowNode();
        start.setId("start");
        start.setComponentId("reportcenter");
        start.setTransitions(List.of(transition));
        definition.setNodes(List.of(start));

        FlowMapper mapper = new FlowMapper(new ObjectMapper());
        FlowDefinition restored = mapper.toDefinition(mapper.toEntity(definition, false));

        assertThat(restored.getSidebarMode()).isEqualTo(SidebarMode.COLLAPSE);
        assertThat(restored.getNodes().getFirst().getTransitions().getFirst().getPrtTypeDisplayTypes())
            .containsEntry(PrtType.PRTTYPE_ORDER, IxtDisplayType.DISPTYPE_FORM);
    }
}
