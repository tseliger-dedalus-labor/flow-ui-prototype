package com.flowprototype.backend.appointments;

import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppointmentsComponentDescriptorProviderTest {
    @Test
    void contributesAppointmentsComponent() {
        var descriptor = new AppointmentsComponentDescriptorProvider().descriptors().get(0);

        assertThat(descriptor.getId()).isEqualTo("appointments-panel");
        assertThat(descriptor.getInputs()).singleElement().satisfies(input -> {
            assertThat(input.getName()).isEqualTo("wardId");
            assertThat(input.getSemanticType()).isEqualTo(SemanticType.WARD_ID);
            assertThat(input.isRequired()).isTrue();
        });
    }
}
