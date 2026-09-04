package com.flowprototype.backend.patient;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PatientDataController {
    private final PatientDataService patientData;

    public PatientDataController(PatientDataService patientData) {
        this.patientData = patientData;
    }

    @GetMapping("/wards")
    public List<Map<String, String>> wards() {
        return patientData.wards();
    }

    @GetMapping("/wards/{id}/patients")
    public List<Map<String, String>> patients(@PathVariable String id) {
        return patientData.patients(id);
    }

    @GetMapping("/patients/{id}")
    public Map<String, String> patient(@PathVariable String id) {
        return patientData.patient(id);
    }

    @GetMapping("/patients/{id}/findings")
    public List<Map<String, String>> findings(@PathVariable String id) {
        return patientData.findings(id);
    }

    @GetMapping("/patients/{id}/orders")
    public List<Map<String, String>> orders(@PathVariable String id) {
        return patientData.orders(id);
    }

    @GetMapping("/patients/{id}/transfusions")
    public List<Map<String, String>> transfusions(@PathVariable String id) {
        return patientData.transfusions(id);
    }
}
