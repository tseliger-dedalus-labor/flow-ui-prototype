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

@Component
public class ComponentManifestLoader {
    private final ObjectMapper objectMapper;

    public ComponentManifestLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<ComponentDescriptor> load(String resourcePath, String expectedModule) {
        try (InputStream input = ComponentManifestLoader.class.getResourceAsStream(resourcePath)) {
            if (input == null) {
                throw new IllegalStateException("Komponenten-Metadaten fehlen: " + resourcePath);
            }
            ComponentManifest manifest = objectMapper.readValue(input, ComponentManifest.class);
            validate(manifest, expectedModule, resourcePath);
            return List.copyOf(manifest.getComponents());
        } catch (JacksonException e) {
            throw new IllegalStateException("Komponenten-Metadaten sind ungültig: " + resourcePath, e);
        } catch (IOException e) {
            throw new IllegalStateException("Komponenten-Metadaten konnten nicht gelesen werden: " + resourcePath, e);
        }
    }

    private void validate(ComponentManifest manifest, String expectedModule, String resourcePath) {
        if (manifest.getSchemaVersion() != 1) {
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
            if (descriptor.getId() == null || descriptor.getId().isBlank()) {
                throw new IllegalStateException("Komponenten-ID fehlt in Metadaten: " + resourcePath);
            }
            if (!ids.add(descriptor.getId())) {
                throw new IllegalStateException("Komponente mehrfach im Metadaten-Manifest: " + descriptor.getId());
            }
            if (descriptor.getInputs() == null || descriptor.getOutputs() == null) {
                throw new IllegalStateException("Inputs oder Outputs fehlen für Komponente: " + descriptor.getId());
            }
        }
    }

    public static class ComponentManifest {
        private int schemaVersion;
        private String module;
        private String moduleVersion;
        private List<ComponentDescriptor> components;

        public int getSchemaVersion() {
            return schemaVersion;
        }

        public void setSchemaVersion(int schemaVersion) {
            this.schemaVersion = schemaVersion;
        }

        public String getModule() {
            return module;
        }

        public void setModule(String module) {
            this.module = module;
        }

        public String getModuleVersion() {
            return moduleVersion;
        }

        public void setModuleVersion(String moduleVersion) {
            this.moduleVersion = moduleVersion;
        }

        public List<ComponentDescriptor> getComponents() {
            return components;
        }

        public void setComponents(List<ComponentDescriptor> components) {
            this.components = components;
        }
    }
}
