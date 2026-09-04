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
}
