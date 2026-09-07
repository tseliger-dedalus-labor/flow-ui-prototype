package com.flowprototype.backend.patient;

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
    void returnsAllRecordsWithNavigationContext() {
        var records = service.records();

        assertThat(records).hasSize(64);
        assertThat(records).allSatisfy(record -> assertThat(record)
            .containsKeys("RecordID", "CaseID", "PatientID", "patientName", "text", "status", "createdAt"));
        assertThat(records).anySatisfy(record -> assertThat(record)
            .containsEntry("PatientID", "p-100")
            .containsEntry("CaseID", "F-2026-1001")
            .containsEntry("RecordID", "ORD-p-100-F-2026-1001-001"));
    }
}
