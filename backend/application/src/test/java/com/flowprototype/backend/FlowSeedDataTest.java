package com.flowprototype.backend;

import com.flowprototype.backend.flow.FlowMapper;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.PrtType;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FlowSeedDataTest {
    @Test
    void addsMissingReportcenterFlowToExistingInstallation() {
        FlowRepository repository = mock(FlowRepository.class);
        FlowMapper mapper = mock(FlowMapper.class);
        when(repository.count()).thenReturn(3L);
        when(repository.existsById(any())).thenAnswer(invocation ->
            !"flow-reportcenter".equals(invocation.getArgument(0)));
        when(mapper.toEntity(any(), anyBoolean())).thenAnswer(invocation -> {
            FlowDefinition definition = invocation.getArgument(0);
            FlowEntity entity = new FlowEntity();
            entity.setId(definition.getId());
            return entity;
        });

        new FlowSeedData(repository, mapper).run();

        ArgumentCaptor<Iterable<FlowEntity>> savedFlows = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).saveAll(savedFlows.capture());
        assertThat(StreamSupport.stream(savedFlows.getValue().spliterator(), false))
            .extracting(FlowEntity::getId)
            .containsExactly("flow-reportcenter");
    }

    @Test
    void defaultFlowsNavigateFromCaseRecordsToTheirDetailPanels() {
        FlowRepository repository = mock(FlowRepository.class);
        FlowMapper mapper = mock(FlowMapper.class);
        List<FlowDefinition> definitions = new ArrayList<>();
        when(repository.count()).thenReturn(0L);
        when(repository.existsById(any())).thenReturn(false);
        when(mapper.toEntity(any(), anyBoolean())).thenAnswer(invocation -> {
            FlowDefinition definition = invocation.getArgument(0);
            definitions.add(definition);
            FlowEntity entity = new FlowEntity();
            entity.setId(definition.getId());
            return entity;
        });

        new FlowSeedData(repository, mapper).run();

        assertThat(definitions).flatExtracting(FlowDefinition::getNodes)
            .extracting(node -> node.getComponentId())
            .doesNotContain("order-view");
        assertThat(definitions).filteredOn(definition -> definition.getId().equals("flow-normal"))
            .singleElement()
            .satisfies(definition -> {
                var patientView = definition.getNodes().stream()
                    .filter(node -> node.getComponentId().equals("patient-view"))
                    .findFirst()
                    .orElseThrow();
                assertThat(patientView.getTransitions()).singleElement().satisfies(transition -> {
                    assertThat(transition.getOnOutput()).isEqualTo("recordSelected");
                    assertThat(transition.getTargetNodeId()).isEqualTo("order");
                    assertThat(transition.getPrtTypeDisplayTypes()).containsExactlyInAnyOrderEntriesOf(java.util.Map.of(
                        PrtType.PRTTYPE_ORDER, IxtDisplayType.DISPTYPE_FORM,
                        PrtType.PRTTYPE_REPORT, IxtDisplayType.DISPTYPE_REPORT
                    ));
                });
                assertThat(definition.getNodes()).filteredOn(node -> node.getId().equals("order"))
                    .singleElement()
                    .extracting("componentId")
                    .isEqualTo("orders-panel");
                assertThat(definition.getNodes()).filteredOn(node -> node.getId().equals("finding"))
                    .singleElement()
                    .extracting("componentId")
                    .isEqualTo("findings-panel");
            });
        assertThat(definitions).filteredOn(definition -> definition.getId().equals("flow-orders"))
            .singleElement()
            .satisfies(definition -> {
                var transition = definition.getNodes().stream()
                    .filter(node -> node.getComponentId().equals("patient-view"))
                    .findFirst()
                    .orElseThrow()
                    .getTransitions()
                    .getFirst();
                assertThat(transition.getOnOutput()).isEqualTo("recordSelected");
                assertThat(transition.getPrtTypeDisplayTypes()).containsExactlyInAnyOrderEntriesOf(java.util.Map.of(
                    PrtType.PRTTYPE_ORDER, IxtDisplayType.DISPTYPE_FORM,
                    PrtType.PRTTYPE_REPORT, IxtDisplayType.DISPTYPE_REPORT
                ));
            });
        assertThat(definitions).filteredOn(definition -> definition.getId().equals("flow-reportcenter"))
            .singleElement()
            .satisfies(definition -> {
                var transition = definition.getNodes().stream()
                    .filter(node -> node.getId().equals("reportcenter"))
                    .findFirst()
                    .orElseThrow()
                    .getTransitions()
                    .getFirst();
                assertThat(transition.getPrtTypeDisplayTypes()).containsExactlyInAnyOrderEntriesOf(java.util.Map.of(
                    PrtType.PRTTYPE_ORDER, IxtDisplayType.DISPTYPE_FORM,
                    PrtType.PRTTYPE_REPORT, IxtDisplayType.DISPTYPE_REPORT,
                    PrtType.PRTTYPE_TRAFU, IxtDisplayType.DISPTYPE_WEC_INDEX_TRAFU
                ));
                assertThat(definition.getNodes()).extracting("componentId")
                    .contains("orders-panel", "findings-panel", "transfusions-panel");
            });
    }

    @Test
    void migratesAnExistingDefaultFlowThatReferencesOrderView() {
        FlowRepository repository = mock(FlowRepository.class);
        FlowMapper mapper = mock(FlowMapper.class);
        FlowEntity existing = new FlowEntity();
        existing.setId("flow-reportcenter");
        existing.setActive(true);
        FlowDefinition legacy = new FlowDefinition();
        legacy.setId("flow-reportcenter");
        var report = new com.flowprototype.backend.flow.model.FlowNode();
        report.setId("report");
        report.setComponentId("order-view");
        legacy.setNodes(List.of(report));
        when(repository.count()).thenReturn(4L);
        when(repository.existsById(any())).thenReturn(true);
        when(repository.findById("flow-reportcenter")).thenReturn(Optional.of(existing));
        when(mapper.toDefinition(existing)).thenReturn(legacy);
        when(mapper.toEntity(any(), anyBoolean())).thenAnswer(invocation -> {
            FlowDefinition definition = invocation.getArgument(0);
            FlowEntity entity = new FlowEntity();
            entity.setId(definition.getId());
            entity.setActive(invocation.getArgument(1));
            return entity;
        });

        new FlowSeedData(repository, mapper).run();

        ArgumentCaptor<Iterable<FlowEntity>> savedFlows = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).saveAll(savedFlows.capture());
        assertThat(StreamSupport.stream(savedFlows.getValue().spliterator(), false))
            .singleElement()
            .satisfies(flow -> {
                assertThat(flow.getId()).isEqualTo("flow-reportcenter");
                assertThat(flow.isActive()).isTrue();
            });
    }
}
