package com.flowprototype.backend.appointments;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * HTTP-Schnittstelle für stationsbezogene Termine des Prototyps.
 *
 * <p>Der Controller hält die Schnittstelle schlank und delegiert Validierung sowie
 * Zustandsänderungen an {@link AppointmentsService}.</p>
 */
@RestController
@RequestMapping("/api/wards/{wardId}/appointments")
public class AppointmentsController {
    private final AppointmentsService appointments;

    /**
     * Erstellt den Controller mit Zugriff auf die Terminfachlogik.
     *
     * @param appointments Dienst für Lese- und Schreibzugriffe auf Termine.
     */
    public AppointmentsController(AppointmentsService appointments) {
        this.appointments = appointments;
    }

    /**
     * Liefert alle Termine einer Station.
     *
     * @param wardId Technische Stations-ID.
     * @return Terminliste als einfache Schlüssel-Wert-Maps für den Prototyp.
     */
    @GetMapping
    public List<Map<String, String>> appointments(@PathVariable String wardId) {
        return appointments.appointments(wardId);
    }

    /**
     * Legt einen neuen Termin für eine Station an.
     *
     * @param wardId Technische Stations-ID.
     * @param request Nutzlast mit Patient, Datum, Uhrzeit und Grund.
     * @return Neu angelegter Termin.
     */
    @PostMapping
    public Map<String, String> create(@PathVariable String wardId, @RequestBody Map<String, String> request) {
        return appointments.create(wardId, request);
    }
}
