package com.flowprototype.backend.appointments;

import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class AppointmentsComponentDescriptorProviderTest {
    @Test
    void contributesAppointmentsComponent() {
        var loader = new ComponentManifestLoader(new ObjectMapper());
        var descriptor = new AppointmentsComponentDescriptorProvider(loader).descriptors().get(0);

        assertThat(descriptor.getId()).isEqualTo("appointments-panel");
        assertThat(descriptor.getDisplayType()).isEqualTo(IxtDisplayType.DISPTYPE_APP_WARD_OVERVIEW);
        assertThat(descriptor.getInputs()).singleElement().satisfies(input -> {
            assertThat(input.getName()).isEqualTo("wardId");
            assertThat(input.getSemanticType()).isEqualTo(SemanticType.WARD_ID);
            assertThat(input.isRequired()).isTrue();
        });
    }
}
