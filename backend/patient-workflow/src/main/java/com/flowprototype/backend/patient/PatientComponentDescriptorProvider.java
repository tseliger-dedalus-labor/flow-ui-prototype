package com.flowprototype.backend.patient;

import com.flowprototype.backend.flow.ComponentDescriptorProvider;
import com.flowprototype.backend.flow.ComponentManifestLoader;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stellt die Komponentenbeschreibungen des Patienten-Workflow-Moduls bereit.
 *
 * <p>Wie im Produktivsystem beschreibt das Modul selbst seine Oberflächenbausteine; die
 * Flow-Plattform muss diese nur laden und global registrieren.</p>
 */
@Component
public class PatientComponentDescriptorProvider implements ComponentDescriptorProvider {
    private static final String MANIFEST = "/META-INF/flow-components/patient-workflow.components.json";
    private final ComponentManifestLoader manifestLoader;

    /**
     * Erstellt den Provider mit gemeinsamem Manifestlader.
     *
     * @param manifestLoader Ladekomponente für JSON-Komponentenmanifeste.
     */
    public PatientComponentDescriptorProvider(ComponentManifestLoader manifestLoader) {
        this.manifestLoader = manifestLoader;
    }

    /**
     * Lädt alle vom Patientenmodul angebotenen Flow-Komponenten.
     *
     * @return Komponentenbeschreibungen des Moduls.
     */
    @Override
    public List<ComponentDescriptor> descriptors() {
        return manifestLoader.load(MANIFEST, "patient-workflow");
    }
}
