package com.flowprototype.backend.patient;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PatientDataService {
    public List<Map<String, String>> wards() {
        return List.of(
            Map.of("id", "ward-a", "name", "Station A"),
            Map.of("id", "ward-b", "name", "Station B")
        );
    }

    public List<Map<String, String>> patients(String wardId) {
        if ("ward-b".equals(wardId)) {
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

    public Map<String, String> patient(String patientId) {
        return Map.of("id", patientId, "name", "Patient " + patientId, "birthDate", "1980-01-01");
    }

    public List<Map<String, String>> findings(String patientId) {
        return List.of(Map.of("id", "f-1", "text", "Befund für " + patientId));
    }

    public List<Map<String, String>> orders(String patientId) {
        return List.of(Map.of("id", "o-1", "text", "Auftrag für " + patientId));
    }

    public List<Map<String, String>> transfusions(String patientId) {
        return List.of(Map.of("id", "t-1", "text", "Transfusion für " + patientId));
    }

    public boolean wardExists(String wardId) {
        return wards().stream().anyMatch(ward -> wardId.equals(ward.get("id")));
    }

    public String patientName(String wardId, String patientId) {
        return patients(wardId).stream()
            .filter(patient -> patientId.equals(patient.get("id")))
            .map(patient -> patient.get("name"))
            .findFirst()
            .orElse(null);
    }
}
