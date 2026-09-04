package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

/**
 * Führt die Komponentenbeschreibungen aller Backend-Module zu einem Komponentenverzeichnis zusammen.
 *
 * <p>Das Komponentenverzeichnis ist die zentrale Lesesicht für Laufzeit und Editor. Es stellt
 * sicher, dass Modulgrenzen sauber bleiben: Module liefern nur ihre lokalen
 * Beschreibungen, die Plattform garantiert anschließend globale Eindeutigkeit.</p>
 */
@Service
public class ComponentRegistryService {
    private final List<ComponentDescriptor> descriptors;
    private final EnumMap<IxtDisplayType, ComponentDescriptor> byDisplayType;

    /**
     * Baut das Komponentenverzeichnis aus allen im Spring-Kontext gefundenen Bereitstellern auf.
     *
     * @param providers Komponentenquellen der geladenen Module.
     */
    public ComponentRegistryService(List<ComponentDescriptorProvider> providers) {
        LinkedHashMap<String, ComponentDescriptor> byId = new LinkedHashMap<>();
        EnumMap<IxtDisplayType, ComponentDescriptor> displayTypes = new EnumMap<>(IxtDisplayType.class);
        providers.stream()
            .flatMap(provider -> provider.descriptors().stream())
            .forEach(descriptor -> {
                // Komponenten-IDs sind die technische Schnittstelle zwischen Editor, Persistenz und Oberflächenanwendung.
                if (byId.putIfAbsent(descriptor.getId(), descriptor) != null) {
                    throw new IllegalStateException("Komponente mehrfach registriert: " + descriptor.getId());
                }
                if (descriptor.getDisplayType() != null) {
                    // Auch der ixserv-Display-Typ darf global nur einer Komponente zugeordnet sein.
                    ComponentDescriptor existing = displayTypes.putIfAbsent(descriptor.getDisplayType(), descriptor);
                    if (existing != null) {
                        throw new IllegalStateException(
                            "IxtDisplayType mehrfach registriert: " + descriptor.getDisplayType()
                                + " (" + existing.getId() + ", " + descriptor.getId() + ")"
                        );
                    }
                }
            });
        descriptors = List.copyOf(byId.values());
        byDisplayType = displayTypes;
    }

    /**
     * Gibt das vollständige Komponentenverzeichnis in stabiler Registrierungsreihenfolge zurück.
     *
     * @return Alle bekannten Komponenten.
     */
    public List<ComponentDescriptor> getAll() {
        return descriptors;
    }

    /**
     * Sucht eine Komponente über ihre technische ID.
     *
     * @param id Komponenten-ID.
     * @return Gefundene Komponente, falls registriert.
     */
    public Optional<ComponentDescriptor> byId(String id) {
        return descriptors.stream().filter(d -> d.getId().equals(id)).findFirst();
    }

    /**
     * Sucht die zu einem ixserv-Display-Typ gemappte Komponente.
     *
     * @param displayType Gemockter ixserv-Display-Typ.
     * @return Passende Komponentenbeschreibung, falls vorhanden.
     */
    public Optional<ComponentDescriptor> byDisplayType(IxtDisplayType displayType) {
        return Optional.ofNullable(byDisplayType.get(displayType));
    }
}
