package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Prüft die globalen Eindeutigkeitsregeln des Komponentenverzeichnisses.
 *
 * <p>Die Tests schützen insbesondere den Anwendungsstart: doppelte technische
 * Komponenten-IDs oder mehrfach belegte ixserv-Darstellungstypen müssen bereits
 * beim Aufbau des Spring-Kontexts abgelehnt werden.</p>
 */
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

    @Test
    void resolvesComponentByDisplayType() {
        ComponentDescriptor descriptor = new ComponentDescriptor();
        descriptor.setId("patient-list");
        descriptor.setDisplayType(IxtDisplayType.DISPTYPE_WEC_PAT_LIST);

        ComponentRegistryService registry = new ComponentRegistryService(List.of(() -> List.of(descriptor)));

        assertThat(registry.byDisplayType(IxtDisplayType.DISPTYPE_WEC_PAT_LIST)).containsSame(descriptor);
    }

    @Test
    void rejectsDuplicateDisplayTypesDuringStartup() {
        ComponentDescriptor first = new ComponentDescriptor();
        first.setId("first");
        first.setDisplayType(IxtDisplayType.DISPTYPE_REPORT);
        ComponentDescriptor second = new ComponentDescriptor();
        second.setId("second");
        second.setDisplayType(IxtDisplayType.DISPTYPE_REPORT);

        assertThatThrownBy(() -> new ComponentRegistryService(List.of(
            () -> List.of(first),
            () -> List.of(second)
        )))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("DISPTYPE_REPORT")
            .hasMessageContaining("first")
            .hasMessageContaining("second");
    }

    @Test
    void allowsMultipleComponentsWithoutDisplayType() {
        ComponentDescriptor first = new ComponentDescriptor();
        first.setId("ward-list");
        ComponentDescriptor second = new ComponentDescriptor();
        second.setId("stack-layout");

        ComponentRegistryService registry = new ComponentRegistryService(
            List.of(() -> List.of(first, second))
        );

        assertThat(registry.getAll()).containsExactly(first, second);
    }
}
