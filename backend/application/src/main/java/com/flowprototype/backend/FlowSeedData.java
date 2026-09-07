package com.flowprototype.backend;

import com.flowprototype.backend.flow.FlowMapper;
import com.flowprototype.backend.flow.model.*;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Legt beim Start Beispiel-Flows an, falls die Datenbank noch leer ist.
 *
 * <p>Die Saatdaten demonstrieren die Modulgrenzen des Systems: allgemeine
 * Flow-Struktur kommt aus {@code flow-platform}, konkrete Komponenten aus
 * Patienten- und Terminmodulen. Dadurch kann eine frische Instanz sofort mit
 * realistischen Beispielgraphen betrieben werden.</p>
 */
@Component
public class FlowSeedData implements CommandLineRunner {
    private final FlowRepository repository;
    private final FlowMapper mapper;

    /**
     * Erstellt die Saatdatenkomponente mit Persistenzzugriff und Flow-Umsetzung.
     *
     * @param repository Datenzugriff für gespeicherte Flows.
     * @param mapper Umsetzer zwischen Schnittstellenmodell und JPA-Entität.
     */
    public FlowSeedData(FlowRepository repository, FlowMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Erzeugt die initialen Beispielflows für die Anwendung.
     *
     * @param args Startargumente des Spring-Boot-Prozesses.
     */
    @Override
    public void run(String... args) {
        // Vorhandene Flows bleiben unverändert; fehlende Standardflows werden bei Upgrades ergänzt.
        boolean emptyRepository = repository.count() == 0;

        // Standardfluss: Die Sidebar wechselt von der Stations- zur Patientenliste.
        FlowDefinition normalFlow = new FlowDefinition();
        normalFlow.setId("flow-normal");
        normalFlow.setName("Standardfluss");
        normalFlow.setTool(Tool.WebclientTool);
        normalFlow.setEntryNodeId("wards");

        FlowNode wards = new FlowNode();
        wards.setId("wards");
        wards.setComponentId("ward-list-content");
        FlowTransition toPatients = new FlowTransition();
        toPatients.setOnOutput("wardSelected");
        toPatients.setTargetNodeId("patients");
        toPatients.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards.setTransitions(List.of(toPatients));

        FlowNode patients = new FlowNode();
        patients.setId("patients");
        patients.setComponentId("patient-list-content");
        InputBinding wardBinding = new InputBinding();
        wardBinding.setSource(BindingSource.CONTEXT);
        wardBinding.setContextKey("wardId");
        InputBinding modeBinding = new InputBinding();
        modeBinding.setSource(BindingSource.STATIC);
        modeBinding.setStaticValue("normal");
        patients.setInputBindings(Map.of("wardId", wardBinding, "mode", modeBinding));
        patients.setSidebar(sidebar("wardsSidebar", "Stationsauswahl"));
        FlowTransition toPatient = new FlowTransition();
        toPatient.setOnOutput("patientSelected");
        toPatient.setTargetNodeId("patientView");
        toPatient.setContextMapping(Map.of(
            "patientId", "$event.patientId",
            "caseId", "$event.caseId"
        ));
        patients.setTransitions(List.of(toPatient));

        FlowNode patientView = new FlowNode();
        patientView.setId("patientView");
        patientView.setComponentId("patient-view");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        InputBinding caseBinding = new InputBinding();
        caseBinding.setSource(BindingSource.CONTEXT);
        caseBinding.setContextKey("caseId");
        patientView.setInputBindings(Map.of("patientId", patientBinding, "caseId", caseBinding));
        patientView.setSidebar(sidebar("patientsSidebar", "Patientenauswahl"));
        FlowTransition toOrder = recordTransition("orderSelected", "order");
        FlowTransition toFinding = recordTransition("findingSelected", "finding");
        patientView.setTransitions(List.of(toOrder, toFinding));

        FlowNode wardsSidebar = new FlowNode();
        wardsSidebar.setId("wardsSidebar");
        wardsSidebar.setComponentId("ward-list-sidebar");
        wardsSidebar.setTransitions(List.of(toPatients));

        FlowNode patientsSidebar = new FlowNode();
        patientsSidebar.setId("patientsSidebar");
        patientsSidebar.setComponentId("patient-list-sidebar");
        patientsSidebar.setInputBindings(Map.of("wardId", wardBinding, "mode", modeBinding));
        patientsSidebar.setTransitions(List.of(toPatient));

        FlowNode order = recordPanel("order", "orders-panel");
        order.setSidebar(sidebar("patientsSidebar", "Patientenauswahl"));
        FlowNode finding = recordPanel("finding", "findings-panel");
        finding.setSidebar(sidebar("patientsSidebar", "Patientenauswahl"));

        normalFlow.setNodes(List.of(
            wards, patients, patientView, order, finding, wardsSidebar, patientsSidebar
        ));

        // Alternative Sicht für denselben Navigationspfad mit anderem fachlichen Fokus im Patientendetail.
        FlowDefinition ordersFlow = new FlowDefinition();
        ordersFlow.setId("flow-orders");
        ordersFlow.setName("Auftragsfokus");
        ordersFlow.setTool(Tool.WebclientTool);
        ordersFlow.setEntryNodeId("wards2");

        FlowNode wards2 = new FlowNode();
        wards2.setId("wards2");
        wards2.setComponentId("ward-list-content");
        FlowTransition toPatients2 = new FlowTransition();
        toPatients2.setOnOutput("wardSelected");
        toPatients2.setTargetNodeId("patients2");
        toPatients2.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards2.setTransitions(List.of(toPatients2));

        FlowNode patients2 = new FlowNode();
        patients2.setId("patients2");
        patients2.setComponentId("patient-list-content");
        InputBinding ward2 = new InputBinding(); ward2.setSource(BindingSource.CONTEXT); ward2.setContextKey("wardId");
        InputBinding mode2 = new InputBinding(); mode2.setSource(BindingSource.STATIC); mode2.setStaticValue("orders");
        patients2.setInputBindings(Map.of("wardId", ward2, "mode", mode2));
        patients2.setSidebar(sidebar("wards2Sidebar", "Stationsauswahl"));
        FlowTransition toPatient2 = new FlowTransition();
        toPatient2.setOnOutput("patientSelected");
        toPatient2.setTargetNodeId("patientView2");
        toPatient2.setContextMapping(Map.of(
            "patientId", "$event.patientId",
            "caseId", "$event.caseId"
        ));
        patients2.setTransitions(List.of(toPatient2));

        FlowNode patientView2 = new FlowNode();
        patientView2.setId("patientView2");
        patientView2.setComponentId("patient-view");
        InputBinding pid2 = new InputBinding(); pid2.setSource(BindingSource.CONTEXT); pid2.setContextKey("patientId");
        InputBinding case2 = new InputBinding(); case2.setSource(BindingSource.CONTEXT); case2.setContextKey("caseId");
        patientView2.setInputBindings(Map.of("patientId", pid2, "caseId", case2));
        patientView2.setSidebar(sidebar("patients2Sidebar", "Patientenauswahl"));
        patientView2.setTransitions(List.of(
            recordTransition("orderSelected", "order2"),
            recordTransition("findingSelected", "finding2")
        ));

        FlowNode wards2Sidebar = new FlowNode();
        wards2Sidebar.setId("wards2Sidebar");
        wards2Sidebar.setComponentId("ward-list-sidebar");
        wards2Sidebar.setTransitions(List.of(toPatients2));

        FlowNode patients2Sidebar = new FlowNode();
        patients2Sidebar.setId("patients2Sidebar");
        patients2Sidebar.setComponentId("patient-list-sidebar");
        patients2Sidebar.setInputBindings(Map.of("wardId", ward2, "mode", mode2));
        patients2Sidebar.setTransitions(List.of(toPatient2));

        FlowNode order2 = recordPanel("order2", "orders-panel");
        order2.setSidebar(sidebar("patients2Sidebar", "Patientenauswahl"));
        FlowNode finding2 = recordPanel("finding2", "findings-panel");
        finding2.setSidebar(sidebar("patients2Sidebar", "Patientenauswahl"));

        ordersFlow.setNodes(List.of(
            wards2, patients2, patientView2, order2, finding2, wards2Sidebar, patients2Sidebar
        ));

        FlowDefinition appointmentsFlow = new FlowDefinition();
        appointmentsFlow.setId("flow-appointments");
        appointmentsFlow.setName("Stationsbezogene Terminplanung");
        appointmentsFlow.setTool(Tool.AppointmentTool);
        appointmentsFlow.setEntryNodeId("appointmentWards");

        FlowNode appointmentWards = new FlowNode();
        appointmentWards.setId("appointmentWards");
        appointmentWards.setComponentId("ward-list-content");
        FlowTransition toAppointments = new FlowTransition();
        toAppointments.setOnOutput("wardSelected");
        toAppointments.setTargetNodeId("appointments");
        toAppointments.setContextMapping(Map.of("wardId", "$event.wardId"));
        appointmentWards.setTransitions(List.of(toAppointments));

        FlowNode appointments = new FlowNode();
        appointments.setId("appointments");
        appointments.setComponentId("appointments-panel");
        InputBinding appointmentWard = new InputBinding();
        appointmentWard.setSource(BindingSource.CONTEXT);
        appointmentWard.setContextKey("wardId");
        appointments.setInputBindings(Map.of("wardId", appointmentWard));
        appointments.setSidebar(sidebar("appointmentWardsSidebar", "Stationsauswahl"));
        appointments.setRequiredPermissions(List.of("APPOINTMENTS_READ"));
        FlowNode appointmentWardsSidebar = new FlowNode();
        appointmentWardsSidebar.setId("appointmentWardsSidebar");
        appointmentWardsSidebar.setComponentId("ward-list-sidebar");
        appointmentWardsSidebar.setTransitions(List.of(toAppointments));
        appointmentsFlow.setNodes(List.of(appointmentWards, appointments, appointmentWardsSidebar));

        FlowDefinition reportcenterFlow = new FlowDefinition();
        reportcenterFlow.setId("flow-reportcenter");
        reportcenterFlow.setName("Reportcenter");
        reportcenterFlow.setTool(Tool.ReportcenterTool);
        reportcenterFlow.setEntryNodeId("reportcenter");

        FlowNode reportcenter = new FlowNode();
        reportcenter.setId("reportcenter");
        reportcenter.setComponentId("reportcenter");
        FlowTransition toReport = new FlowTransition();
        toReport.setOnOutput("recordSelected");
        toReport.setTargetNodeId("report");
        toReport.setContextMapping(Map.of(
            "RecordId", "$event.RecordID",
            "caseId", "$event.CaseID",
            "patientId", "$event.PatientID"
        ));
        reportcenter.setTransitions(List.of(toReport));

        FlowNode report = new FlowNode();
        report.setId("report");
        report.setComponentId("orders-panel");
        InputBinding reportRecord = new InputBinding();
        reportRecord.setSource(BindingSource.CONTEXT);
        reportRecord.setContextKey("RecordId");
        InputBinding reportCase = new InputBinding();
        reportCase.setSource(BindingSource.CONTEXT);
        reportCase.setContextKey("caseId");
        InputBinding reportPatient = new InputBinding();
        reportPatient.setSource(BindingSource.CONTEXT);
        reportPatient.setContextKey("patientId");
        report.setInputBindings(Map.of(
            "RecordId", reportRecord,
            "caseId", reportCase,
            "patientId", reportPatient
        ));
        reportcenterFlow.setNodes(List.of(reportcenter, report));

        // Persistiert die Beispielflows im produktiven Format, also mit relationalen Metadaten und JSON-Definition.
        repository.saveAll(Stream.of(
                seedEntity(normalFlow, emptyRepository),
                seedEntity(ordersFlow, false),
                seedEntity(appointmentsFlow, false),
                seedEntity(reportcenterFlow, false)
            )
            .flatMap(Optional::stream)
            .toList());
    }

    /**
     * Ergänzt fehlende Standardflows und ersetzt nur bekannte, durch die Komponentenänderung veraltete Varianten.
     */
    private Optional<FlowEntity> seedEntity(FlowDefinition definition, boolean activeByDefault) {
        if (!repository.existsById(definition.getId())) {
            return Optional.of(mapper.toEntity(definition, activeByDefault));
        }
        return repository.findById(definition.getId())
            .filter(entity -> requiresCaseRecordMigration(mapper.toDefinition(entity)))
            .map(entity -> mapper.toEntity(definition, entity.isActive()));
    }

    private boolean requiresCaseRecordMigration(FlowDefinition definition) {
        return switch (definition.getId()) {
            case "flow-normal", "flow-orders" -> definition.getNodes().stream()
                .filter(node -> "patient-view".equals(node.getComponentId()))
                .anyMatch(node -> node.getChildren() != null && !node.getChildren().isEmpty());
            case "flow-reportcenter" -> definition.getNodes().stream()
                .anyMatch(node -> "order-view".equals(node.getComponentId()));
            default -> false;
        };
    }

    /**
     * Baut einen wiederverwendbaren Detailknoten für patientenbezogene Bereiche.
     *
     * @param id Technische Knoten-ID im Flow-Graphen.
     * @param componentId Komponenten-ID aus dem Komponentenverzeichnis.
     * @return Vollständig konfigurierter Bereichsknoten.
     */
    private FlowNode panel(String id, String componentId) {
        FlowNode node = new FlowNode();
        node.setId(id);
        node.setComponentId(componentId);
        InputBinding b = new InputBinding();
        b.setSource(BindingSource.CONTEXT);
        b.setContextKey("patientId");
        node.setInputBindings(Map.of("patientId", b));
        return node;
    }

    /**
     * Baut einen Detailknoten, der zusätzlich zum Patienten den ausgewählten Fall verwendet.
     *
     * @param id Technische Knoten-ID im Flow-Graphen.
     * @param componentId Komponenten-ID aus dem Komponentenverzeichnis.
     * @return Vollständig konfigurierter fallbezogener Bereichsknoten.
     */
    private FlowNode casePanel(String id, String componentId) {
        FlowNode node = new FlowNode();
        node.setId(id);
        node.setComponentId(componentId);
        InputBinding patient = new InputBinding();
        patient.setSource(BindingSource.CONTEXT);
        patient.setContextKey("patientId");
        InputBinding patientCase = new InputBinding();
        patientCase.setSource(BindingSource.CONTEXT);
        patientCase.setContextKey("caseId");
        node.setInputBindings(Map.of("patientId", patient, "caseId", patientCase));
        return node;
    }

    /**
     * Baut einen fallbezogenen Detailknoten für einen ausgewählten Record.
     */
    private FlowNode recordPanel(String id, String componentId) {
        FlowNode node = casePanel(id, componentId);
        InputBinding record = new InputBinding();
        record.setSource(BindingSource.CONTEXT);
        record.setContextKey("RecordId");
        node.setInputBindings(Map.of(
            "patientId", node.getInputBindings().get("patientId"),
            "caseId", node.getInputBindings().get("caseId"),
            "RecordId", record
        ));
        return node;
    }

    /**
     * Erzeugt eine Navigation von einem Eintrag der Patientenansicht zu dessen Detailpanel.
     */
    private FlowTransition recordTransition(String output, String targetNodeId) {
        FlowTransition transition = new FlowTransition();
        transition.setOnOutput(output);
        transition.setTargetNodeId(targetNodeId);
        transition.setContextMapping(Map.of("RecordId", "$event.RecordId"));
        return transition;
    }

    /**
     * Erzeugt die Standardseitenleiste für Flows mit vorgeschalteter Stationsauswahl.
     *
     * @param nodeId ID des Knotens, der in der Seitenleiste angedockt dargestellt wird.
     * @param ariaLabel Beschriftung der jeweils dargestellten Auswahl.
     * @return Konfiguration einer linken Seitenleiste mit fester Breite und ARIA-Beschriftung.
     */
    private FlowSidebar sidebar(String nodeId, String ariaLabel) {
        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId(nodeId);
        sidebar.setPosition(SidebarPosition.LEFT);
        sidebar.setWidth(280);
        sidebar.setAriaLabel(ariaLabel);
        return sidebar;
    }
}
