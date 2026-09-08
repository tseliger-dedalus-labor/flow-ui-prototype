package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.model.PrtType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Schützt die Zuordnung mehrerer Fälle zu einem Patienten.
 */
class PatientDataServiceTest {
    private final PatientDataService service = new PatientDataService();

    @Test
    void returnsPatientsWithTheirCases() {
        var patients = service.patients("ward-a");

        assertThat(patients).filteredOn(patient -> patient.id().equals("p-100"))
            .singleElement()
            .satisfies(patient -> assertThat(patient.cases())
                .extracting(PatientDataService.PatientCase::id)
                .containsExactly("F-2026-1001", "F-2024-0815"));
    }

    @Test
    void identifiesCaseOrdersByRecordId() {
        var orders = service.orders("p-100", "F-2026-1001");
        var recordId = orders.getFirst().get("RecordId");

        assertThat(recordId).startsWith("ORD-p-100-F-2026-1001-");
        assertThat(service.order("p-100", "F-2026-1001", recordId).orElseThrow())
            .containsEntry("RecordId", recordId)
            .containsKeys("text", "status", "createdAt");
    }

    @Test
    void identifiesCaseFindingsByRecordId() {
        var findings = service.findings("p-100", "F-2026-1001");
        var recordId = findings.getFirst().get("RecordId");

        assertThat(recordId).startsWith("FND-p-100-F-2026-1001-");
        assertThat(service.finding("p-100", "F-2026-1001", recordId).orElseThrow())
            .containsEntry("RecordId", recordId)
            .containsKeys("text", "createdAt");
    }

    @Test
    void returnsAllRecordsWithNavigationContext() {
        var records = service.records();

        assertThat(records).hasSize(64);
        assertThat(records).allSatisfy(record -> assertThat(record.prtType())
            .isEqualTo(PrtType.PRTTYPE_ORDER));
        assertThat(records).anySatisfy(record -> {
            assertThat(record.PatientID()).isEqualTo("p-100");
            assertThat(record.CaseID()).isEqualTo("F-2026-1001");
            assertThat(record.RecordID()).isEqualTo("ORD-p-100-F-2026-1001-001");
        });
    }
}
