package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.FlowTransitionResolutionException;
import com.flowprototype.backend.flow.FlowTransitionResolver;
import com.flowprototype.backend.flow.model.SemanticType;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Lädt zu einer Reportcenter-Record-ID den vollständigen Zielkontext.
 */
@Component
public class PatientRecordTransitionResolver implements FlowTransitionResolver {
    public static final String ID = "patient-record";

    private final PatientDataService patientData;

    public PatientRecordTransitionResolver(PatientDataService patientData) {
        this.patientData = patientData;
    }

    @Override
    public String id() {
        return ID;
    }

    @Override
    public Map<String, SemanticType> inputTypes() {
        return Map.of("RecordID", SemanticType.RECORD_ID);
    }

    @Override
    public Map<String, SemanticType> outputTypes() {
        return Map.of(
            "RecordId", SemanticType.RECORD_ID,
            "patientId", SemanticType.PATIENT_ID,
            "caseId", SemanticType.CASE_ID,
            "prtType", SemanticType.PRT_TYPE
        );
    }

    @Override
    public Map<String, Object> resolve(Map<String, Object> output, Map<String, Object> context) {
        Object recordId = output.get("RecordID");
        if (!(recordId instanceof String id) || id.isBlank()) {
            throw new FlowTransitionResolutionException("RecordID fehlt");
        }
        PatientDataService.PatientRecord record = patientData.records().stream()
            .filter(candidate -> id.equals(candidate.RecordID()))
            .findFirst()
            .orElseThrow(() -> new FlowTransitionResolutionException("Record nicht gefunden: " + id));

        Map<String, Object> enriched = new LinkedHashMap<>();
        enriched.put("RecordId", record.RecordID());
        enriched.put("patientId", record.PatientID());
        enriched.put("caseId", record.CaseID());
        enriched.put("prtType", record.prtType().name());
        return enriched;
    }
}
