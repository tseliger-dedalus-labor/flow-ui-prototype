package com.flowprototype.backend.patient;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

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

    private static final Map<String, List<Map<String, String>>> PATIENTS_BY_WARD = Map.of(
        "ward-a", List.of(
            Map.of("id", "p-100", "name", "Anna Weber"),
            Map.of("id", "p-101", "name", "Paul Meier"),
            Map.of("id", "p-102", "name", "Leila Hartmann"),
            Map.of("id", "p-103", "name", "Jonas Richter")
        ),
        "ward-b", List.of(
            Map.of("id", "p-200", "name", "Erik Stern"),
            Map.of("id", "p-201", "name", "Mona Kraft"),
            Map.of("id", "p-202", "name", "Sofia Nguyen"),
            Map.of("id", "p-203", "name", "David König")
        ),
        "ward-c", List.of(
            Map.of("id", "p-300", "name", "Emil Fischer"),
            Map.of("id", "p-301", "name", "Mia Schneider"),
            Map.of("id", "p-302", "name", "Noah Wagner")
        )
    );

    private static final Map<String, Map<String, String>> PATIENT_DETAILS = Map.ofEntries(
        patient("p-100", "Anna Weber", "1978-04-12", "A-12", "F-2026-1001", "Gesetzlich"),
        patient("p-101", "Paul Meier", "1959-11-03", "A-08", "F-2026-1002", "Privat"),
        patient("p-102", "Leila Hartmann", "1986-07-24", "A-15", "F-2026-1003", "Gesetzlich"),
        patient("p-103", "Jonas Richter", "1967-02-18", "A-11", "F-2026-1004", "Gesetzlich"),
        patient("p-200", "Erik Stern", "1971-09-09", "B-03", "F-2026-2001", "Privat"),
        patient("p-201", "Mona Kraft", "1990-05-16", "B-06", "F-2026-2002", "Gesetzlich"),
        patient("p-202", "Sofia Nguyen", "1982-12-01", "B-09", "F-2026-2003", "Gesetzlich"),
        patient("p-203", "David König", "1954-06-27", "B-02", "F-2026-2004", "Privat"),
        patient("p-300", "Emil Fischer", "2017-03-14", "C-05", "F-2026-3001", "Familienversichert"),
        patient("p-301", "Mia Schneider", "2014-08-30", "C-07", "F-2026-3002", "Familienversichert"),
        patient("p-302", "Noah Wagner", "2019-01-22", "C-04", "F-2026-3003", "Familienversichert")
    );

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
    public List<Map<String, String>> patients(String wardId) {
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
                "caseNumber", "–",
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
     * Liefert Beispielaufträge zu einem Patienten.
     *
     * @param patientId Technische Patienten-ID.
     * @return Auftragsliste.
     */
    public List<Map<String, String>> orders(String patientId) {
        return List.of(
            Map.of("id", patientId + "-o-1", "text", "Laborauftrag: kleines Blutbild – in Bearbeitung"),
            Map.of("id", patientId + "-o-2", "text", "Konsil: Kardiologie – Termin bestätigt"),
            Map.of("id", patientId + "-o-3", "text", "Diagnostik: Sonografie Abdomen – geplant für 05.09.2026")
        );
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
            .filter(patient -> patientId.equals(patient.get("id")))
            .map(patient -> patient.get("name"))
            .findFirst()
            .orElse(null);
    }

    /**
     * Erzeugt einen Eintrag für die unveränderliche Stammdaten-Tabelle.
     *
     * @param id Technische Patienten-ID.
     * @param name Anzeigename.
     * @param birthDate Geburtsdatum im ISO-Format.
     * @param room Aktuelle Zimmerbezeichnung.
     * @param caseNumber Fallnummer des Demo-Aufenthalts.
     * @param insurance Versicherungsart.
     * @return Schlüssel-Wert-Eintrag für {@link Map#ofEntries(Map.Entry[])}.
     */
    private static Map.Entry<String, Map<String, String>> patient(
        String id,
        String name,
        String birthDate,
        String room,
        String caseNumber,
        String insurance
    ) {
        return Map.entry(
            id,
            Map.of(
                "id", id,
                "name", name,
                "birthDate", birthDate,
                "room", room,
                "caseNumber", caseNumber,
                "insurance", insurance
            )
        );
    }
}
