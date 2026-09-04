package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ComponentRegistryServiceTest {
    @Test
    void aggregatesContributedDescriptors() {
        ComponentDescriptor descriptor = new ComponentDescriptor();
        descriptor.setId("feature-widget");

        ComponentRegistryService registry = new ComponentRegistryService(List.of(() -> List.of(descriptor)));

        assertThat(registry.byId("feature-widget")).containsSame(descriptor);
    }

    @Test
    void rejectsDuplicateComponentIds() {
        ComponentDescriptor first = new ComponentDescriptor();
        first.setId("duplicate");
        ComponentDescriptor second = new ComponentDescriptor();
        second.setId("duplicate");

        assertThatThrownBy(() -> new ComponentRegistryService(List.of(
            () -> List.of(first),
            () -> List.of(second)
        ))).isInstanceOf(IllegalStateException.class);
    }
}
