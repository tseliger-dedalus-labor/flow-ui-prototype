package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.persistence.FlowRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class FlowServiceTest {

    @Test
    void rejectsDuplicateIdWhenCreatingFlow() {
        FlowRepository repository = mock(FlowRepository.class);
        FlowMapper mapper = mock(FlowMapper.class);
        FlowValidationService validationService = mock(FlowValidationService.class);
        FlowService service = new FlowService(repository, mapper, validationService);
        FlowDefinition definition = new FlowDefinition();
        definition.setId("existing");
        when(repository.existsById("existing")).thenReturn(true);

        assertThatThrownBy(() -> service.create(definition))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("409 CONFLICT");
        verifyNoInteractions(mapper, validationService);
    }
}
