package com.flowprototype.backend.flow;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class FlowPlatformConfiguration {

    @Bean
    @ConditionalOnMissingBean(ObjectMapper.class)
    ObjectMapper flowObjectMapper() {
        return new ObjectMapper();
    }
}
