package com.flowprototype.backend.patient;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Liefert reproduzierbare Beispieldaten für den Patienten-Workflow.
 *
 * <p>Der Dienst bildet bewusst nur die für den Flow-Prototyp notwendigen
 * Fachinformationen ab. IDs und Rückgabeformate bleiben stabil, damit
 * Komponenten, Flows und Terminmodul denselben Kontext verwenden können.</p>
 */
@Service
public class PatientDataService {
    private static final List<Map<String, String>> WARDS = List.of(
        Map.of("id", "ward-a", "name", "Station A – Innere Medizin"),
        Map.of("id", "ward-b", "name", "Station B – Chirurgie"),
        Map.of("id", "ward-c", "name", "Station C – Pädiatrie")
    );

    private static final Map<String, List<PatientSummary>> PATIENTS_BY_WARD = Map.of(
        "ward-a", List.of(
            patientSummary("p-100", "Anna Weber", "F-2026-1001", "F-2024-0815"),
            patientSummary("p-101", "Paul Meier", "F-2026-1002"),
            patientSummary("p-102", "Leila Hartmann", "F-2026-1003", "F-2025-0642"),
            patientSummary("p-103", "Jonas Richter", "F-2026-1004")
        ),
        "ward-b", List.of(
            patientSummary("p-200", "Erik Stern", "F-2026-2001", "F-2025-1488"),
            patientSummary("p-201", "Mona Kraft", "F-2026-2002"),
            patientSummary("p-202", "Sofia Nguyen", "F-2026-2003"),
            patientSummary("p-203", "David König", "F-2026-2004", "F-2023-0991")
        ),
        "ward-c", List.of(
            patientSummary("p-300", "Emil Fischer", "F-2026-3001"),
            patientSummary("p-301", "Mia Schneider", "F-2026-3002", "F-2025-2310"),
            patientSummary("p-302", "Noah Wagner", "F-2026-3003")
        )
    );

    private static final Map<String, Map<String, String>> PATIENT_DETAILS = Map.ofEntries(
        patientDetails("p-100", "Anna Weber", "1978-04-12", "A-12", "Gesetzlich"),
        patientDetails("p-101", "Paul Meier", "1959-11-03", "A-08", "Privat"),
        patientDetails("p-102", "Leila Hartmann", "1986-07-24", "A-15", "Gesetzlich"),
        patientDetails("p-103", "Jonas Richter", "1967-02-18", "A-11", "Gesetzlich"),
        patientDetails("p-200", "Erik Stern", "1971-09-09", "B-03", "Privat"),
        patientDetails("p-201", "Mona Kraft", "1990-05-16", "B-06", "Gesetzlich"),
        patientDetails("p-202", "Sofia Nguyen", "1982-12-01", "B-09", "Gesetzlich"),
        patientDetails("p-203", "David König", "1954-06-27", "B-02", "Privat"),
        patientDetails("p-300", "Emil Fischer", "2017-03-14", "C-05", "Familienversichert"),
        patientDetails("p-301", "Mia Schneider", "2014-08-30", "C-07", "Familienversichert"),
        patientDetails("p-302", "Noah Wagner", "2019-01-22", "C-04", "Familienversichert")
    );

    /**
     * Kompakte Falldaten eines Patienten.
     *
     * @param id Technische Fall-ID und zugleich angezeigte Fallnummer.
     */
    public record PatientCase(String id) {}

    /**
     * Patienteneintrag für die Stationsauswahl mit beliebig vielen Fällen.
     *
     * @param id Technische Patienten-ID.
     * @param name Anzeigename.
     * @param cases Zugeordnete Fälle.
     */
    public record PatientSummary(String id, String name, List<PatientCase> cases) {}

    /**
     * Liefert die verfügbaren Beispielstationen.
     *
     * @return Stationsliste.
     */
    public List<Map<String, String>> wards() {
        return WARDS;
    }

    /**
     * Liefert alle Patienten einer Station.
     *
     * @param wardId Technische Stations-ID.
     * @return Patientenliste der Station.
     */
    public List<PatientSummary> patients(String wardId) {
        return PATIENTS_BY_WARD.getOrDefault(wardId, List.of());
    }

    /**
     * Liefert Stammdaten zu einem Patienten.
     *
     * @param patientId Technische Patienten-ID.
     * @return Einfache Stammdaten für die Beispieloberfläche.
     */
    public Map<String, String> patient(String patientId) {
        return PATIENT_DETAILS.getOrDefault(
            patientId,
            Map.of(
                "id", patientId,
                "name", "Unbekannter Patient",
                "birthDate", "–",
                "room", "–",
                "insurance", "–"
            )
        );
    }

    /**
     * Liefert Beispielbefunde zu einem Patienten.
     *
     * @param patientId Technische Patienten-ID.
     * @return Befundliste.
     */
    public List<Map<String, String>> findings(String patientId) {
        return List.of(
            Map.of("id", patientId + "-f-1", "text", "Blutbild vom 02.09.2026: Werte im erwarteten Bereich"),
            Map.of("id", patientId + "-f-2", "text", "Radiologie vom 03.09.2026: Verlaufskontrolle ohne neuen Befund"),
            Map.of("id", patientId + "-f-3", "text", "Ärztliche Visite vom 04.09.2026: klinischer Zustand stabil")
        );
    }

    /**
     * Liefert Beispielaufträge zu einem Patientenfall.
     *
     * @param patientId Technische Patienten-ID.
     * @param caseId Technische Fall-ID.
     * @return Auftragsliste mit RecordId als Schlüssel.
     */
    public List<Map<String, String>> orders(String patientId, String caseId) {
        return List.of(
            order(patientId, caseId, "001", "Laborauftrag: kleines Blutbild", "In Bearbeitung", "2026-09-04"),
            order(patientId, caseId, "002", "Konsil: Kardiologie", "Termin bestätigt", "2026-09-04"),
            order(patientId, caseId, "003", "Diagnostik: Sonografie Abdomen", "Geplant", "2026-09-05"),
            order(patientId, caseId, "004", "Medikationsprüfung", "Offen", "2026-09-05")
        );
    }

    /**
     * Liefert einen einzelnen Auftrag innerhalb eines Patientenfalls.
     *
     * @param patientId Technische Patienten-ID.
     * @param caseId Technische Fall-ID.
     * @param recordId RecordId des Auftrags.
     * @return Auftrag, sofern die RecordId in diesem Fall existiert.
     */
    public Optional<Map<String, String>> order(String patientId, String caseId, String recordId) {
        return orders(patientId, caseId).stream()
            .filter(order -> recordId.equals(order.get("RecordId")))
            .findFirst();
    }

    /**
     * Liefert Beispieltransfusionen zu einem Patienten.
     *
     * @param patientId Technische Patienten-ID.
     * @return Transfusionsliste.
     */
    public List<Map<String, String>> transfusions(String patientId) {
        return List.of(
            Map.of("id", patientId + "-t-1", "text", "EK-Konserve A positiv – Kreuzprobe freigegeben"),
            Map.of("id", patientId + "-t-2", "text", "Bedside-Test dokumentiert – keine Unverträglichkeit")
        );
    }

    /**
     * Prüft, ob eine Station in den Beispieldaten existiert.
     *
     * @param wardId Technische Stations-ID.
     * @return {@code true}, wenn die Station bekannt ist.
     */
    public boolean wardExists(String wardId) {
        return wards().stream().anyMatch(ward -> wardId.equals(ward.get("id")));
    }

    /**
     * Ermittelt den Patientennamen nur innerhalb einer Station.
     *
     * @param wardId Technische Stations-ID.
     * @param patientId Technische Patienten-ID.
     * @return Patientenname oder {@code null}, wenn der Patient nicht zur Station gehört.
     */
    public String patientName(String wardId, String patientId) {
        return patients(wardId).stream()
            .filter(patient -> patientId.equals(patient.id()))
            .map(PatientSummary::name)
            .findFirst()
            .orElse(null);
    }

    /**
     * Erzeugt einen Patienteneintrag mit einer variablen Anzahl von Fällen.
     *
     * @param id Technische Patienten-ID.
     * @param name Anzeigename.
     * @param caseIds Zugeordnete Fall-IDs.
     * @return Patient für die Stationsliste.
     */
    private static PatientSummary patientSummary(String id, String name, String... caseIds) {
        return new PatientSummary(
            id,
            name,
            Arrays.stream(caseIds).map(PatientCase::new).toList()
        );
    }

    /**
     * Erzeugt einen fallbezogenen Auftrag mit stabiler RecordId.
     */
    private static Map<String, String> order(
        String patientId,
        String caseId,
        String sequence,
        String text,
        String status,
        String createdAt
    ) {
        return Map.of(
            "RecordId", "ORD-" + patientId + "-" + caseId + "-" + sequence,
            "text", text,
            "status", status,
            "createdAt", createdAt
        );
    }

    /**
     * Erzeugt einen Eintrag für die unveränderliche Stammdaten-Tabelle.
     *
     * @param id Technische Patienten-ID.
     * @param name Anzeigename.
     * @param birthDate Geburtsdatum im ISO-Format.
     * @param room Aktuelle Zimmerbezeichnung.
     * @param insurance Versicherungsart.
     * @return Schlüssel-Wert-Eintrag für {@link Map#ofEntries(Map.Entry[])}.
     */
    private static Map.Entry<String, Map<String, String>> patientDetails(
        String id,
        String name,
        String birthDate,
        String room,
        String insurance
    ) {
        return Map.entry(
            id,
            Map.of(
                "id", id,
                "name", name,
                "birthDate", birthDate,
                "room", room,
                "insurance", insurance
            )
        );
    }
}
