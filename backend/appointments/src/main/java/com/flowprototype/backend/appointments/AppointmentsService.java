package com.flowprototype.backend.appointments;

import com.flowprototype.backend.patient.PatientDataService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AppointmentsService {
    private final PatientDataService patientData;
    private final List<Map<String, String>> appointments = new CopyOnWriteArrayList<>(List.of(
        Map.of("id", "a-1", "wardId", "ward-a", "patientId", "p-100", "patientName", "Anna Weber", "date", "2026-09-04", "time", "09:00", "reason", "Kontrolle"),
        Map.of("id", "a-2", "wardId", "ward-a", "patientId", "p-101", "patientName", "Paul Meier", "date", "2026-09-04", "time", "11:30", "reason", "Diagnostik"),
        Map.of("id", "a-3", "wardId", "ward-b", "patientId", "p-200", "patientName", "Erik Stern", "date", "2026-09-05", "time", "10:15", "reason", "Nachsorge")
    ));
    private final AtomicInteger appointmentSequence = new AtomicInteger(3);

    public AppointmentsService(PatientDataService patientData) {
        this.patientData = patientData;
    }

    public List<Map<String, String>> appointments(String wardId) {
        return appointments.stream().filter(appointment -> wardId.equals(appointment.get("wardId"))).toList();
    }

    public Map<String, String> create(String wardId, Map<String, String> request) {
        if (!patientData.wardExists(wardId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station nicht gefunden");
        }
        String patientId = request.getOrDefault("patientId", "");
        String patientName = patientData.patientName(wardId, patientId);
        if (patientName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient gehört nicht zur Station");
        }
        Map<String, String> appointment = Map.of(
            "id", "a-" + appointmentSequence.incrementAndGet(),
            "wardId", wardId,
            "patientId", patientId,
            "patientName", patientName,
            "date", requiredValue(request, "date"),
            "time", requiredValue(request, "time"),
            "reason", requiredValue(request, "reason")
        );
        appointments.add(appointment);
        return appointment;
    }

    private String requiredValue(Map<String, String> request, String field) {
        String value = request.get(field);
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " fehlt");
        }
        return value;
    }
}
