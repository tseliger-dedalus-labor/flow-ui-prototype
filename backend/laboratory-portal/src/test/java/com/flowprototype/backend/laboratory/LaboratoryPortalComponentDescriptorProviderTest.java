package com.flowprototype.backend.laboratory;

import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.SemanticType;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class LaboratoryPortalComponentDescriptorProviderTest {
    @Test
    void contributesReportcenterComponent() {
        var loader = new ComponentManifestLoader(new ObjectMapper());
        var descriptor = new LaboratoryPortalComponentDescriptorProvider(loader).descriptors().get(0);

        assertThat(descriptor.getId()).isEqualTo("reportcenter");
        assertThat(descriptor.getDisplayType()).isEqualTo(IxtDisplayType.DISPTYPE_REPORTCENTER_VIEW);
        assertThat(descriptor.getInputs()).isEmpty();
        assertThat(descriptor.getOutputs()).singleElement().satisfies(output -> {
            assertThat(output.getName()).isEqualTo("recordSelected");
            assertThat(output.getPayload()).containsEntry("RecordID", SemanticType.RECORD_ID);
        });
    }
}
