package com.flowprototype.backend.mock;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api")
public class MockDataController {
    private final List<Map<String, String>> appointments = new CopyOnWriteArrayList<>(List.of(
        Map.of("id", "a-1", "wardId", "ward-a", "patientId", "p-100", "patientName", "Anna Weber", "date", "2026-09-04", "time", "09:00", "reason", "Kontrolle"),
        Map.of("id", "a-2", "wardId", "ward-a", "patientId", "p-101", "patientName", "Paul Meier", "date", "2026-09-04", "time", "11:30", "reason", "Diagnostik"),
        Map.of("id", "a-3", "wardId", "ward-b", "patientId", "p-200", "patientName", "Erik Stern", "date", "2026-09-05", "time", "10:15", "reason", "Nachsorge")
    ));
    private final AtomicInteger appointmentSequence = new AtomicInteger(3);

    @GetMapping("/wards")
    public List<Map<String, String>> wards() {
        return List.of(
            Map.of("id", "ward-a", "name", "Station A"),
            Map.of("id", "ward-b", "name", "Station B")
        );
    }

    @GetMapping("/wards/{id}/patients")
    public List<Map<String, String>> patients(@PathVariable String id) {
        if ("ward-b".equals(id)) {
            return List.of(
                Map.of("id", "p-200", "name", "Erik Stern"),
                Map.of("id", "p-201", "name", "Mona Kraft")
            );
        }
        return List.of(
            Map.of("id", "p-100", "name", "Anna Weber"),
            Map.of("id", "p-101", "name", "Paul Meier")
        );
    }

    @GetMapping("/patients/{id}")
    public Map<String, String> patient(@PathVariable String id) {
        return Map.of("id", id, "name", "Patient " + id, "birthDate", "1980-01-01");
    }

    @GetMapping("/wards/{id}/appointments")
    public List<Map<String, String>> appointments(@PathVariable String id) {
        return appointments.stream().filter(appointment -> id.equals(appointment.get("wardId"))).toList();
    }

    @PostMapping("/wards/{id}/appointments")
    public Map<String, String> createAppointment(@PathVariable String id, @RequestBody Map<String, String> request) {
        if (wards().stream().noneMatch(ward -> id.equals(ward.get("id")))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station nicht gefunden");
        }
        String patientId = request.getOrDefault("patientId", "");
        String patientName = patients(id).stream()
            .filter(patient -> patientId.equals(patient.get("id")))
            .map(patient -> patient.get("name"))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient gehört nicht zur Station"));
        String date = requiredValue(request, "date");
        String time = requiredValue(request, "time");
        String reason = requiredValue(request, "reason");
        Map<String, String> appointment = Map.of(
            "id", "a-" + appointmentSequence.incrementAndGet(),
            "wardId", id,
            "patientId", patientId,
            "patientName", patientName,
            "date", date,
            "time", time,
            "reason", reason
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

    @GetMapping("/patients/{id}/findings")
    public List<Map<String, String>> findings(@PathVariable String id) {
        return List.of(Map.of("id", "f-1", "text", "Befund für " + id));
    }

    @GetMapping("/patients/{id}/orders")
    public List<Map<String, String>> orders(@PathVariable String id) {
        return List.of(Map.of("id", "o-1", "text", "Auftrag für " + id));
    }

    @GetMapping("/patients/{id}/transfusions")
    public List<Map<String, String>> transfusions(@PathVariable String id) {
        return List.of(Map.of("id", "t-1", "text", "Transfusion für " + id));
    }
}
