package com.flowprototype.backend.patient;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    public List<PatientDataService.PatientSummary> patients(@PathVariable String id) {
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
     * Liefert Befunde eines Patientenfalls.
     *
     * @param patientId Technische Patienten-ID.
     * @param caseId Technische Fall-ID.
     * @return Befundliste für den Beispielbereich.
     */
    @GetMapping("/patients/{patientId}/cases/{caseId}/findings")
    public List<Map<String, String>> findings(
        @PathVariable String patientId,
        @PathVariable String caseId
    ) {
        return patientData.findings(patientId, caseId);
    }

    /**
     * Liefert einen Befund anhand seiner RecordId.
     */
    @GetMapping("/patients/{patientId}/cases/{caseId}/findings/{recordId}")
    public Map<String, String> finding(
        @PathVariable String patientId,
        @PathVariable String caseId,
        @PathVariable String recordId
    ) {
        return patientData.finding(patientId, caseId, recordId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Befund mit RecordId '" + recordId + "' wurde nicht gefunden."
            ));
    }

    /**
     * Liefert alle Aufträge eines Patientenfalls.
     *
     * @param patientId Technische Patienten-ID.
     * @param caseId Technische Fall-ID.
     * @return Auftragsliste für den ausgewählten Fall.
     */
    @GetMapping("/patients/{patientId}/cases/{caseId}/orders")
    public List<Map<String, String>> orders(
        @PathVariable String patientId,
        @PathVariable String caseId
    ) {
        return patientData.orders(patientId, caseId);
    }

    /**
     * Liefert einen Auftrag anhand seiner RecordId.
     *
     * @param patientId Technische Patienten-ID.
     * @param caseId Technische Fall-ID.
     * @param recordId RecordId des Auftrags.
     * @return Auftragsdetails.
     */
    @GetMapping("/patients/{patientId}/cases/{caseId}/orders/{recordId}")
    public Map<String, String> order(
        @PathVariable String patientId,
        @PathVariable String caseId,
        @PathVariable String recordId
    ) {
        return patientData.order(patientId, caseId, recordId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Auftrag mit RecordId '" + recordId + "' wurde nicht gefunden."
            ));
    }

    /**
     * Liefert alle Mock-Records einschließlich ihres Navigationskontexts.
     *
     * @return Vollständige Recordliste für das Reportcenter.
     */
    @GetMapping("/records")
    public List<PatientDataService.PatientRecord> records() {
        return patientData.records();
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
