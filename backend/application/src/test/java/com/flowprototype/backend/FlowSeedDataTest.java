package com.flowprototype.backend;

import com.flowprototype.backend.flow.FlowMapper;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.persistence.FlowEntity;
import com.flowprototype.backend.persistence.FlowRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

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
}
