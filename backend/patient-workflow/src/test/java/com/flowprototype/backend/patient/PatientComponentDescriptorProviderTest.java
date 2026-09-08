package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.PresenterType;
import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prüft, ob das Patientenmodul sein generiertes Komponenten-Manifest vollständig
 * und typisiert in die zentrale Registry einbringt.
 */
class PatientComponentDescriptorProviderTest {
    @Test
    void contributesPatientWorkflowComponents() {
        var loader = new ComponentManifestLoader(new ObjectMapper());
        var descriptors = new PatientComponentDescriptorProvider(loader).descriptors();

        assertThat(descriptors).extracting("id")
            .contains("ward-list-content", "ward-list-sidebar", "patient-list-content",
                "patient-list-sidebar", "patient-view", "tab-panel", "orders-panel", "findings-panel", "demographics-panel")
            .doesNotContain("order-view");
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("patient-list-content"))
            .singleElement()
            .satisfies(descriptor -> {
                assertThat(descriptor.getDisplayType()).isEqualTo(IxtDisplayType.DISPTYPE_WEC_PAT_LIST);
                assertThat(descriptor.getInputs())
                    .anySatisfy(input -> assertThat(input.getSemanticType()).isEqualTo(SemanticType.WARD_ID));
                assertThat(descriptor.getOutputs())
                    .singleElement()
                    .satisfies(output -> assertThat(output.getPayload()).containsEntry("caseId", SemanticType.CASE_ID));
            });
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("patient-list-sidebar"))
            .singleElement()
            .extracting("presenter")
            .isEqualTo(PresenterType.SIDEBAR);
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("patient-view"))
            .singleElement()
            .satisfies(descriptor -> {
                assertThat(descriptor.isContainer()).isFalse();
                assertThat(descriptor.getInputs())
                    .anySatisfy(input -> assertThat(input.getSemanticType()).isEqualTo(SemanticType.CASE_ID));
                assertThat(descriptor.getOutputs()).extracting("name")
                    .containsExactly("recordSelected");
            });
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("transfusions-panel"))
            .singleElement()
            .extracting("displayType")
            .isEqualTo(IxtDisplayType.DISPTYPE_WEC_INDEX_TRAFU);
        assertThat(descriptors).filteredOn(descriptor -> descriptor.getId().equals("orders-panel"))
            .singleElement()
            .satisfies(descriptor -> assertThat(descriptor.getInputs())
                .anySatisfy(input -> {
                    assertThat(input.getName()).isEqualTo("RecordId");
                    assertThat(input.getSemanticType()).isEqualTo(SemanticType.RECORD_ID);
                }));
    }
}
