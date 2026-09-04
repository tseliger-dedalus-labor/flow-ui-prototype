package com.flowprototype.backend.flow;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

/**
 * Stellt Grundkonfiguration für das modulare Flow-Backend bereit.
 *
 * <p>Das Modul kann allein oder eingebettet in die Gesamtanwendung laufen.
 * Deshalb wird nur dann ein {@link ObjectMapper} erzeugt, wenn noch keiner durch
 * die umgebende Anwendung bereitgestellt wurde.</p>
 */
@Configuration
public class FlowPlatformConfiguration {

    /**
     * Liefert einen Ersatz-Objektabbildner für Manifest- und Flow-Serialisierung.
     *
     * @return Standard-{@link ObjectMapper}, falls noch keine andere Bean existiert.
     */
    @Bean
    @ConditionalOnMissingBean(ObjectMapper.class)
    ObjectMapper flowObjectMapper() {
        return new ObjectMapper();
    }
}
