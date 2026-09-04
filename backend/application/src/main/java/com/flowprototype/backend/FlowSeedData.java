package com.flowprototype.backend;

import com.flowprototype.backend.flow.FlowMapper;
import com.flowprototype.backend.flow.model.*;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

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
        // Saatdaten werden nur einmal angelegt, damit lokale Änderungen an Flows erhalten bleiben.
        if (repository.count() > 0) {
            return;
        }

        // Standardfluss: Seitenleiste zeigt die Stationswahl, danach wird Patientenkontext schrittweise aufgebaut.
        FlowDefinition normalFlow = new FlowDefinition();
        normalFlow.setId("flow-normal");
        normalFlow.setName("Standardfluss");
        normalFlow.setTool(Tool.WebclientTool);
        normalFlow.setEntryNodeId("wards");
        normalFlow.setSidebar(sidebar("wards"));

        FlowNode wards = new FlowNode();
        wards.setId("wards");
        wards.setComponentId("ward-list");
        FlowTransition toPatients = new FlowTransition();
        toPatients.setOnOutput("wardSelected");
        toPatients.setTargetNodeId("patients");
        toPatients.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards.setTransitions(List.of(toPatients));

        FlowNode patients = new FlowNode();
        patients.setId("patients");
        patients.setComponentId("patient-list");
        InputBinding wardBinding = new InputBinding();
        wardBinding.setSource(BindingSource.CONTEXT);
        wardBinding.setContextKey("wardId");
        InputBinding modeBinding = new InputBinding();
        modeBinding.setSource(BindingSource.STATIC);
        modeBinding.setStaticValue("normal");
        patients.setInputBindings(Map.of("wardId", wardBinding, "mode", modeBinding));
        FlowTransition toPatient = new FlowTransition();
        toPatient.setOnOutput("patientSelected");
        toPatient.setTargetNodeId("patientView");
        toPatient.setContextMapping(Map.of("patientId", "$event.patientId"));
        patients.setTransitions(List.of(toPatient));

        FlowNode patientView = new FlowNode();
        patientView.setId("patientView");
        patientView.setComponentId("patient-view");
        InputBinding patientBinding = new InputBinding();
        patientBinding.setSource(BindingSource.CONTEXT);
        patientBinding.setContextKey("patientId");
        patientView.setInputBindings(Map.of("patientId", patientBinding));

        FlowNode stack = new FlowNode();
        stack.setId("patientStack");
        stack.setComponentId("stack-layout");

        FlowNode demographics = panel("demographics", "demographics-panel");
        FlowNode findings = panel("findings", "findings-panel");
        stack.setChildren(List.of(demographics, findings));
        patientView.setChildren(List.of(stack));

        // Die Knoten bleiben absichtlich sowohl hier als flache Liste als auch über Kindknotenverweise referenzierbar,
        // weil Validierung, Persistenz und Editor jeden Knoten global per ID adressieren.
        normalFlow.setNodes(List.of(wards, patients, patientView, stack, demographics, findings));

        // Alternative Sicht für denselben Navigationspfad mit anderem fachlichen Fokus im Patientendetail.
        FlowDefinition ordersFlow = new FlowDefinition();
        ordersFlow.setId("flow-orders");
        ordersFlow.setName("Auftragsfokus");
        ordersFlow.setTool(Tool.WebclientTool);
        ordersFlow.setEntryNodeId("wards2");
        ordersFlow.setSidebar(sidebar("wards2"));

        FlowNode wards2 = new FlowNode();
        wards2.setId("wards2");
        wards2.setComponentId("ward-list");
        FlowTransition toPatients2 = new FlowTransition();
        toPatients2.setOnOutput("wardSelected");
        toPatients2.setTargetNodeId("patients2");
        toPatients2.setContextMapping(Map.of("wardId", "$event.wardId"));
        wards2.setTransitions(List.of(toPatients2));

        FlowNode patients2 = new FlowNode();
        patients2.setId("patients2");
        patients2.setComponentId("patient-list");
        InputBinding ward2 = new InputBinding(); ward2.setSource(BindingSource.CONTEXT); ward2.setContextKey("wardId");
        InputBinding mode2 = new InputBinding(); mode2.setSource(BindingSource.STATIC); mode2.setStaticValue("orders");
        patients2.setInputBindings(Map.of("wardId", ward2, "mode", mode2));
        FlowTransition toPatient2 = new FlowTransition();
        toPatient2.setOnOutput("patientSelected");
        toPatient2.setTargetNodeId("patientView2");
        toPatient2.setContextMapping(Map.of("patientId", "$event.patientId"));
        patients2.setTransitions(List.of(toPatient2));

        FlowNode patientView2 = new FlowNode();
        patientView2.setId("patientView2");
        patientView2.setComponentId("patient-view");
        InputBinding pid2 = new InputBinding(); pid2.setSource(BindingSource.CONTEXT); pid2.setContextKey("patientId");
        patientView2.setInputBindings(Map.of("patientId", pid2));

        FlowNode layout2 = new FlowNode();
        layout2.setId("layout2");
        layout2.setComponentId("stack-layout");
        FlowNode orders = panel("orders", "orders-panel");
        FlowNode transfusions = panel("transfusions", "transfusions-panel");
        layout2.setChildren(List.of(orders, transfusions));
        patientView2.setChildren(List.of(layout2));

        ordersFlow.setNodes(List.of(wards2, patients2, patientView2, layout2, orders, transfusions));

        FlowDefinition appointmentsFlow = new FlowDefinition();
        appointmentsFlow.setId("flow-appointments");
        appointmentsFlow.setName("Stationsbezogene Terminplanung");
        appointmentsFlow.setTool(Tool.AppointmentTool);
        appointmentsFlow.setEntryNodeId("appointmentWards");
        appointmentsFlow.setSidebar(sidebar("appointmentWards"));

        FlowNode appointmentWards = new FlowNode();
        appointmentWards.setId("appointmentWards");
        appointmentWards.setComponentId("ward-list");
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
        appointments.setRequiredPermissions(List.of("APPOINTMENTS_READ"));
        appointmentsFlow.setNodes(List.of(appointmentWards, appointments));
        // Persistiert die Beispielflows im produktiven Format, also mit relationalen Metadaten und JSON-Definition.
        FlowEntity first = mapper.toEntity(normalFlow, true);
        FlowEntity second = mapper.toEntity(ordersFlow, false);
        FlowEntity third = mapper.toEntity(appointmentsFlow, false);
        repository.saveAll(List.of(first, second, third));
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
     * Erzeugt die Standardseitenleiste für Flows mit vorgeschalteter Stationsauswahl.
     *
     * @param nodeId ID des Knotens, der in der Seitenleiste angedockt dargestellt wird.
     * @return Konfiguration einer linken Seitenleiste mit fester Breite und ARIA-Beschriftung.
     */
    private FlowSidebar sidebar(String nodeId) {
        FlowSidebar sidebar = new FlowSidebar();
        sidebar.setNodeId(nodeId);
        sidebar.setPosition(SidebarPosition.LEFT);
        sidebar.setWidth(280);
        sidebar.setAriaLabel("Stationsauswahl");
        return sidebar;
    }
}
