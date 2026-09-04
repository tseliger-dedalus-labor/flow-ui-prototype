package com.flowprototype.backend.appointments;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stellt die Komponentenbeschreibungen des Terminplanungsmoduls bereit.
 *
 * <p>Das Manifest wird beim Bauen des Moduls aus der Oberflächenanwendung in den Klassenpfad kopiert,
 * sodass Backend und Benutzeroberfläche dieselben Komponentenmetadaten verwenden.</p>
 */
@Component
public class AppointmentsComponentDescriptorProvider implements ComponentDescriptorProvider {
    private static final String MANIFEST = "/META-INF/flow-components/appointments.components.json";
    private final ComponentManifestLoader manifestLoader;

    /**
     * Erstellt den Provider mit gemeinsamem Manifestlader.
     *
     * @param manifestLoader Ladekomponente für JSON-Komponentenmanifeste.
     */
    public AppointmentsComponentDescriptorProvider(ComponentManifestLoader manifestLoader) {
        this.manifestLoader = manifestLoader;
    }

    /**
     * Lädt alle vom Terminmodul angebotenen Flow-Komponenten.
     *
     * @return Komponentenbeschreibungen des Moduls.
     */
    @Override
    public List<ComponentDescriptor> descriptors() {
        return manifestLoader.load(MANIFEST, "appointments");
    }
}
