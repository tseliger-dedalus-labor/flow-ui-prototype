package com.flowprototype.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Konfiguriert CORS für die lokal entwickelte Oberflächenanwendung.
 *
 * <p>Das Backend ist als Prototyp für die Benutzeroberfläche auf einen lokalen Angular-Client ausgerichtet
 * und erlaubt deshalb gezielt Zugriffe von {@code http://localhost:4200}.</p>
 */
@Configuration
public class CorsConfig {
    /**
     * Registriert einen Filter mit den für die lokale Benutzeroberfläche benötigten CORS-Regeln.
     *
     * @return Filter für freigegebene Ursprünge, Methoden und Header.
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
