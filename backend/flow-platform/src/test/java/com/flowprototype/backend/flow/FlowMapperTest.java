package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.SidebarMode;
import com.flowprototype.backend.flow.model.Tool;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

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

        FlowMapper mapper = new FlowMapper(new ObjectMapper());
        FlowDefinition restored = mapper.toDefinition(mapper.toEntity(definition, false));

        assertThat(restored.getSidebarMode()).isEqualTo(SidebarMode.COLLAPSE);
    }
}
