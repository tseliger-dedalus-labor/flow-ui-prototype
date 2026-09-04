package com.flowprototype.backend.appointments;

import com.flowprototype.backend.patient.PatientDataService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Verwaltet die nur im Speicher gehaltenen Termine des Oberflächenprototyps.
 *
 * <p>Die Daten werden absichtlich nur im Speicher gehalten: Der Dienst soll die
 * Backend-Schnittstellen für Terminplanung demonstrieren, ohne bereits eine echte
 * Fachpersistenz einzuführen.</p>
 */
@Service
public class AppointmentsService {
    private final PatientDataService patientData;
    private final List<Map<String, String>> appointments = new CopyOnWriteArrayList<>(List.of(
        Map.of("id", "a-1", "wardId", "ward-a", "patientId", "p-100", "patientName", "Anna Weber", "date", "2026-09-04", "time", "09:00", "reason", "Kontrolle"),
        Map.of("id", "a-2", "wardId", "ward-a", "patientId", "p-101", "patientName", "Paul Meier", "date", "2026-09-04", "time", "11:30", "reason", "Diagnostik"),
        Map.of("id", "a-3", "wardId", "ward-a", "patientId", "p-102", "patientName", "Leila Hartmann", "date", "2026-09-05", "time", "08:15", "reason", "Sonografie"),
        Map.of("id", "a-4", "wardId", "ward-a", "patientId", "p-103", "patientName", "Jonas Richter", "date", "2026-09-05", "time", "14:00", "reason", "Kardiologisches Konsil"),
        Map.of("id", "a-5", "wardId", "ward-b", "patientId", "p-200", "patientName", "Erik Stern", "date", "2026-09-05", "time", "10:15", "reason", "Nachsorge"),
        Map.of("id", "a-6", "wardId", "ward-b", "patientId", "p-201", "patientName", "Mona Kraft", "date", "2026-09-05", "time", "12:45", "reason", "Wundkontrolle"),
        Map.of("id", "a-7", "wardId", "ward-b", "patientId", "p-202", "patientName", "Sofia Nguyen", "date", "2026-09-06", "time", "09:30", "reason", "Physiotherapie"),
        Map.of("id", "a-8", "wardId", "ward-b", "patientId", "p-203", "patientName", "David König", "date", "2026-09-06", "time", "15:15", "reason", "Aufklärungsgespräch"),
        Map.of("id", "a-9", "wardId", "ward-c", "patientId", "p-300", "patientName", "Emil Fischer", "date", "2026-09-04", "time", "10:00", "reason", "Pädiatrische Visite"),
        Map.of("id", "a-10", "wardId", "ward-c", "patientId", "p-301", "patientName", "Mia Schneider", "date", "2026-09-05", "time", "13:30", "reason", "Lungenfunktion"),
        Map.of("id", "a-11", "wardId", "ward-c", "patientId", "p-302", "patientName", "Noah Wagner", "date", "2026-09-06", "time", "08:45", "reason", "Entlassgespräch")
    ));
    private final AtomicInteger appointmentSequence = new AtomicInteger(11);

    /**
     * Erstellt den Dienst mit Zugriff auf Patientendaten zur Plausibilisierung.
     *
     * @param patientData Dienst für Stations- und Patientenzuordnung.
     */
    public AppointmentsService(PatientDataService patientData) {
        this.patientData = patientData;
    }

    /**
     * Filtert alle Termine auf eine Station.
     *
     * @param wardId Technische Stations-ID.
     * @return Termine der gewünschten Station.
     */
    public List<Map<String, String>> appointments(String wardId) {
        return appointments.stream().filter(appointment -> wardId.equals(appointment.get("wardId"))).toList();
    }

    /**
     * Legt einen neuen Termin an und prüft dabei Stations- und Patientenkontext.
     *
     * @param wardId Technische Stations-ID.
     * @param request Anfrage mit Termindaten.
     * @return Neu angelegter Termin.
     */
    public Map<String, String> create(String wardId, Map<String, String> request) {
        // Zustandsänderungen dürfen nur für bekannte Stationen erfolgen, damit die Beispieldaten konsistent bleiben.
        if (!patientData.wardExists(wardId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Station nicht gefunden");
        }
        String patientId = request.getOrDefault("patientId", "");
        String patientName = patientData.patientName(wardId, patientId);
        // Ein Termin darf nur für Patienten der gewählten Station entstehen.
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

    /**
     * Liest ein Pflichtfeld aus der Anfrage und meldet fehlende Werte als 400.
     *
     * @param request Anfrage mit Termindaten.
     * @param field Name des Pflichtfelds.
     * @return Nichtleerer Feldwert.
     */
    private String requiredValue(Map<String, String> request, String field) {
        String value = request.get(field);
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " fehlt");
        }
        return value;
    }
}
