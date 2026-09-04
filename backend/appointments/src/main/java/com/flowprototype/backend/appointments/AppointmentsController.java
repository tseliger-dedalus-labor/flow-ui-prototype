package com.flowprototype.backend.appointments;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wards/{wardId}/appointments")
public class AppointmentsController {
    private final AppointmentsService appointments;

    public AppointmentsController(AppointmentsService appointments) {
        this.appointments = appointments;
    }

    @GetMapping
    public List<Map<String, String>> appointments(@PathVariable String wardId) {
        return appointments.appointments(wardId);
    }

    @PostMapping
    public Map<String, String> create(@PathVariable String wardId, @RequestBody Map<String, String> request) {
        return appointments.create(wardId, request);
    }
}
