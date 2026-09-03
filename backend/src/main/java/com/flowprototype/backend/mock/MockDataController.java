package com.flowprototype.backend.mock;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MockDataController {

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
