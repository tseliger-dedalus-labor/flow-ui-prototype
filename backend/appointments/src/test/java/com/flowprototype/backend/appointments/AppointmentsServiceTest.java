package com.flowprototype.backend.appointments;

import com.flowprototype.backend.patient.PatientDataService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Prüft Filterung, Anlage und fachliche Stationszuordnung der speicherinternen
 * Termin-Mockdaten.
 */
class AppointmentsServiceTest {
    private final AppointmentsService appointments = new AppointmentsService(new PatientDataService());

    @Test
    void returnsOnlyAppointmentsForRequestedWard() {
        assertThat(appointments.appointments("ward-a"))
            .hasSize(4)
            .allMatch(appointment -> "ward-a".equals(appointment.get("wardId")));
    }

    @Test
    void createsAppointmentForWardPatient() {
        Map<String, String> created = appointments.create("ward-b", Map.of(
            "patientId", "p-201",
            "date", "2026-09-06",
            "time", "13:00",
            "reason", "Kontrolle"
        ));

        assertThat(created.get("patientName")).isEqualTo("Mona Kraft");
        assertThat(appointments.appointments("ward-b")).contains(created);
    }

    @Test
    void rejectsPatientFromAnotherWard() {
        assertThatThrownBy(() -> appointments.create("ward-b", Map.of(
            "patientId", "p-100",
            "date", "2026-09-06",
            "time", "13:00",
            "reason", "Kontrolle"
        ))).isInstanceOf(ResponseStatusException.class);
    }
}
