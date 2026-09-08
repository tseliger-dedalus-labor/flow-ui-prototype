package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.FlowTransitionResolutionException;
import com.flowprototype.backend.flow.model.PrtType;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PatientRecordTransitionResolverTest {
    private final PatientRecordTransitionResolver resolver =
        new PatientRecordTransitionResolver(new PatientDataService());

    @Test
    void enrichesARecordIdWithAuthoritativePatientData() {
        var resolved = resolver.resolve(Map.of("RecordID", "ORD-p-100-F-2026-1001-001"), Map.of());

        assertThat(resolved)
            .containsEntry("RecordId", "ORD-p-100-F-2026-1001-001")
            .containsEntry("patientId", "p-100")
            .containsEntry("caseId", "F-2026-1001")
            .containsEntry("prtType", PrtType.PRTTYPE_ORDER.name());
    }

    @Test
    void rejectsUnknownRecords() {
        assertThatThrownBy(() -> resolver.resolve(Map.of("RecordID", "missing"), Map.of()))
            .isInstanceOf(FlowTransitionResolutionException.class);
    }
}
