package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ComponentRegistryServiceTest {
    @Test
    void registersWardAppointmentComponent() {
        ComponentDescriptor descriptor = new ComponentRegistryService().byId("appointments-panel").orElseThrow();

        assertThat(descriptor.getTitle()).isEqualTo("Terminplanung");
        assertThat(descriptor.getInputs()).singleElement().satisfies(input -> {
            assertThat(input.getName()).isEqualTo("wardId");
            assertThat(input.getSemanticType()).isEqualTo(SemanticType.WARD_ID);
            assertThat(input.isRequired()).isTrue();
        });
    }
}
