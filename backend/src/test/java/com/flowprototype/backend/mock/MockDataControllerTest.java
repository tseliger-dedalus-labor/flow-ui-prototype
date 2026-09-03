package com.flowprototype.backend.mock;

import org.junit.jupiter.api.Test;

import java.util.Map;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MockDataControllerTest {
    private final MockDataController controller = new MockDataController();

    @Test
    void returnsOnlyAppointmentsForRequestedWard() {
        assertThat(controller.appointments("ward-a"))
            .hasSize(2)
            .allMatch(appointment -> "ward-a".equals(appointment.get("wardId")));
    }

    @Test
    void createsAppointmentForWardPatient() {
        Map<String, String> created = controller.createAppointment("ward-b", Map.of(
            "patientId", "p-201",
            "date", "2026-09-06",
            "time", "13:00",
            "reason", "Kontrolle"
        ));

        assertThat(created.get("patientName")).isEqualTo("Mona Kraft");
        assertThat(controller.appointments("ward-b")).contains(created);
    }

    @Test
    void rejectsPatientFromAnotherWard() {
        assertThatThrownBy(() -> controller.createAppointment("ward-b", Map.of(
            "patientId", "p-100",
            "date", "2026-09-06",
            "time", "13:00",
            "reason", "Kontrolle"
        ))).isInstanceOf(ResponseStatusException.class);
    }
}
