package com.flowprototype.backend.patient;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Liefert einfache REST-Endpunkte für stations- und patientenbezogene Beispieldaten.
 *
 * <p>Die Endpunkte versorgen sowohl Laufzeit-Flows als auch den Editor mit
 * reproduzierbaren Beispieldaten.</p>
 */
@RestController
@RequestMapping("/api")
public class PatientDataController {
    private final PatientDataService patientData;

    /**
     * Erstellt den Controller mit Zugriff auf den Patienten-Datendienst.
     *
     * @param patientData Dienst für Beispieldaten aus dem Patientenmodul.
     */
    public PatientDataController(PatientDataService patientData) {
        this.patientData = patientData;
    }

    /**
     * Liefert alle bekannten Stationen.
     *
     * @return Stationsliste mit ID und Anzeigename.
     */
    @GetMapping("/wards")
    public List<Map<String, String>> wards() {
        return patientData.wards();
    }

    /**
     * Liefert alle Patienten einer Station.
     *
     * @param id Technische Stations-ID.
     * @return Patientenliste für die Station.
     */
    @GetMapping("/wards/{id}/patients")
    public List<Map<String, String>> patients(@PathVariable String id) {
        return patientData.patients(id);
    }

    /**
     * Liefert Stammdaten zu einem Patienten.
     *
     * @param id Technische Patienten-ID.
     * @return Patientendaten für die Detailansicht.
     */
    @GetMapping("/patients/{id}")
    public Map<String, String> patient(@PathVariable String id) {
        return patientData.patient(id);
    }

    /**
     * Liefert Befunde eines Patienten.
     *
     * @param id Technische Patienten-ID.
     * @return Befundliste für den Beispielbereich.
     */
    @GetMapping("/patients/{id}/findings")
    public List<Map<String, String>> findings(@PathVariable String id) {
        return patientData.findings(id);
    }

    /**
     * Liefert Aufträge eines Patienten.
     *
     * @param id Technische Patienten-ID.
     * @return Auftragsliste für den Beispielbereich.
     */
    @GetMapping("/patients/{id}/orders")
    public List<Map<String, String>> orders(@PathVariable String id) {
        return patientData.orders(id);
    }

    /**
     * Liefert Transfusionen eines Patienten.
     *
     * @param id Technische Patienten-ID.
     * @return Transfusionsliste für den Beispielbereich.
     */
    @GetMapping("/patients/{id}/transfusions")
    public List<Map<String, String>> transfusions(@PathVariable String id) {
        return patientData.transfusions(id);
    }
}
