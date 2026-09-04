package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lädt Komponenten-Metadaten aus JSON-Manifesten im Klassenpfad.
 *
 * <p>Die Fachmodule liefern ihre Metadaten als beim Bauen eingebundene Ressourcen mit. Diese
 * Ladekomponente bildet die Modulgrenze zwischen den kopierten JSON-Dateien und dem
 * typsicheren Backend-Modell.</p>
 */
@Component
public class ComponentManifestLoader {
    private final ObjectMapper objectMapper;

    /**
     * Erstellt die Ladekomponente mit dem im Backend verwendeten JSON-Objektabbildner.
     *
     * @param objectMapper Objektabbildner für die Manifest-Deserialisierung.
     */
    public ComponentManifestLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Lädt und validiert ein Komponenten-Manifest für ein Modul.
     *
     * @param resourcePath Pfad zur Manifestdatei im Klassenpfad.
     * @param expectedModule Erwarteter Modulname aus dem Bauprozess.
     * @return Deserialisierte Komponentenliste des Manifests.
     */
    public List<ComponentDescriptor> load(String resourcePath, String expectedModule) {
        try (InputStream input = ComponentManifestLoader.class.getResourceAsStream(resourcePath)) {
            // Fehler sollen bereits beim Start auftreten, falls ein Modul seine Metadaten nicht eingebunden hat.
            if (input == null) {
                throw new IllegalStateException("Komponenten-Metadaten fehlen: " + resourcePath);
            }
            ComponentManifest manifest = objectMapper.readValue(input, ComponentManifest.class);
            // Vor der Registrierung wird sichergestellt, dass eingebaute Ressource und Modulvertrag zusammenpassen.
            validate(manifest, expectedModule, resourcePath);
            return List.copyOf(manifest.getComponents());
        } catch (JacksonException e) {
            throw new IllegalStateException("Komponenten-Metadaten sind ungültig: " + resourcePath, e);
        } catch (IOException e) {
            throw new IllegalStateException("Komponenten-Metadaten konnten nicht gelesen werden: " + resourcePath, e);
        }
    }

    /**
     * Prüft die strukturellen Invarianten eines Manifests vor der Registrierung.
     *
     * @param manifest Deserialisiertes Manifest.
     * @param expectedModule Erwarteter Modulname.
     * @param resourcePath Ursprungsdatei für Fehlermeldungen.
     */
    private void validate(ComponentManifest manifest, String expectedModule, String resourcePath) {
        if (manifest.getSchemaVersion() != 2) {
            throw new IllegalStateException("Nicht unterstützte Metadaten-Version in " + resourcePath);
        }
        if (!expectedModule.equals(manifest.getModule())) {
            throw new IllegalStateException("Falsches Modul in Komponenten-Metadaten: " + resourcePath);
        }
        if (manifest.getModuleVersion() == null || manifest.getModuleVersion().isBlank()) {
            throw new IllegalStateException("Modulversion fehlt in Komponenten-Metadaten: " + resourcePath);
        }
        if (manifest.getComponents() == null) {
            throw new IllegalStateException("Komponentenliste fehlt in Metadaten: " + resourcePath);
        }

        Set<String> ids = new HashSet<>();
        for (ComponentDescriptor descriptor : manifest.getComponents()) {
            // Doppelte IDs würden später fachlich verschiedene Komponenten ununterscheidbar machen.
            if (descriptor.getId() == null || descriptor.getId().isBlank()) {
                throw new IllegalStateException("Komponenten-ID fehlt in Metadaten: " + resourcePath);
            }
            if (!ids.add(descriptor.getId())) {
                throw new IllegalStateException("Komponente mehrfach im Metadaten-Manifest: " + descriptor.getId());
            }
            if (descriptor.getInputs() == null || descriptor.getOutputs() == null) {
                throw new IllegalStateException("Inputs oder Outputs fehlen für Komponente: " + descriptor.getId());
            }
            if (descriptor.getPresenter() == null) {
                throw new IllegalStateException("Presenter-Typ fehlt für Komponente: " + descriptor.getId());
            }
        }
    }

    /**
     * Interne Repräsentation des JSON-Manifests einer Modulkomponente.
     */
    public static class ComponentManifest {
        private int schemaVersion;
        private String module;
        private String moduleVersion;
        private List<ComponentDescriptor> components;

        /** @return Unterstützte Schemaversion des Manifests. */
        public int getSchemaVersion() {
            return schemaVersion;
        }

        /** @param schemaVersion Unterstützte Schemaversion des Manifests. */
        public void setSchemaVersion(int schemaVersion) {
            this.schemaVersion = schemaVersion;
        }

        /** @return Name des Moduls, das die Komponenten bereitstellt. */
        public String getModule() {
            return module;
        }

        /** @param module Name des Moduls, das die Komponenten bereitstellt. */
        public void setModule(String module) {
            this.module = module;
        }

        /** @return Version des liefernden Moduls. */
        public String getModuleVersion() {
            return moduleVersion;
        }

        /** @param moduleVersion Version des liefernden Moduls. */
        public void setModuleVersion(String moduleVersion) {
            this.moduleVersion = moduleVersion;
        }

        /** @return Komponentenbeschreibungen des Manifests. */
        public List<ComponentDescriptor> getComponents() {
            return components;
        }

        /** @param components Komponentenbeschreibungen des Manifests. */
        public void setComponents(List<ComponentDescriptor> components) {
            this.components = components;
        }
    }
}
