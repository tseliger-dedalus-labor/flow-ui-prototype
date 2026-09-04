package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PatientComponentDescriptorProviderTest {
    @Test
    void contributesPatientWorkflowComponents() {
        var descriptors = new PatientComponentDescriptorProvider().descriptors();

        assertThat(descriptors).extracting("id")
            .contains("ward-list", "patient-list", "patient-view", "demographics-panel");
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("patient-list"))
            .singleElement()
            .satisfies(descriptor -> assertThat(descriptor.getInputs())
                .anySatisfy(input -> assertThat(input.getSemanticType()).isEqualTo(SemanticType.WARD_ID)));
    }
}
