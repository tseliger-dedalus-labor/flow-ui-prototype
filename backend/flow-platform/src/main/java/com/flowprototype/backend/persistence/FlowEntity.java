package com.flowprototype.backend.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * Persistierte Repräsentation eines Flows.
 *
 * <p>Basis-Metadaten liegen in eigenen Spalten, damit Listen und Aktivabfragen
 * ohne Auswertung des JSON möglich bleiben. Die eigentliche Flowbeschreibung wird als
 * JSON-Zeichenkette im CLOB gespeichert, weil sie verschachtelte Knoten, Seitenleisten- und
 * Transition-Strukturen ohne starres relationales Schema enthält.</p>
 */
@Entity
@Table(name = "flows")
public class FlowEntity {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean active;

    @Version
    private long version;

    @Lob
    @Column(nullable = false)
    private String definitionJson;

    /** @return Persistente Flow-ID. */
    public String getId() { return id; }
    /** @param id Persistente Flow-ID. */
    public void setId(String id) { this.id = id; }
    /** @return Anzeigename des Flows. */
    public String getName() { return name; }
    /** @param name Anzeigename des Flows. */
    public void setName(String name) { this.name = name; }
    /** @return {@code true}, wenn der Flow als aktiv markiert ist. */
    public boolean isActive() { return active; }
    /** @param active Neuer Aktivstatus des Flows. */
    public void setActive(boolean active) { this.active = active; }
    /** @return Optimistische Revision der Flowdefinition. */
    public long getVersion() { return version; }
    /** @param version Optimistische Revision der Flowdefinition. */
    public void setVersion(long version) { this.version = version; }
    /** @return Als JSON serialisierte Flowbeschreibung. */
    public String getDefinitionJson() { return definitionJson; }
    /** @param definitionJson Als JSON serialisierte Flowbeschreibung. */
    public void setDefinitionJson(String definitionJson) { this.definitionJson = definitionJson; }
}
