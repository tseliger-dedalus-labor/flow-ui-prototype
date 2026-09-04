package com.flowprototype.backend.flow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Beschreibt eine im Flow verwendbare Oberflächenkomponente.
 *
 * <p>Die Beschreibung stammt aus den Modulmanifesten und dient sowohl dem Editor
 * zur Komponentenpalette als auch der Laufzeitvalidierung für Eingaben, Ausgaben und Containerverhalten.</p>
 */
public class ComponentDescriptor {
    private String id;
    private String title;
    private IxtDisplayType displayType;
    private PresenterType presenter;
    private boolean container;
    private List<InputDescriptor> inputs = new ArrayList<>();
    private List<OutputDescriptor> outputs = new ArrayList<>();

    /** Erstellt eine leere Komponentenbeschreibung für die JSON-Bindung. */
    public ComponentDescriptor() {}

    /**
     * Erstellt eine vollständige Komponentenbeschreibung.
     *
     * @param id Technische Komponenten-ID.
     * @param title Anzeigename der Komponente.
     * @param container Kennzeichnet Layout-Komponenten mit Kindknoten.
     * @param inputs Erwartete Eingaben der Komponente.
     * @param outputs Von der Komponente emittierte Ausgaben.
     */
    public ComponentDescriptor(String id, String title, boolean container, List<InputDescriptor> inputs, List<OutputDescriptor> outputs) {
        this.id = id;
        this.title = title;
        this.presenter = PresenterType.CONTENT;
        this.container = container;
        if (inputs != null) {
            this.inputs = inputs;
        }
        if (outputs != null) {
            this.outputs = outputs;
        }
    }

    /**
     * Erstellt eine Komponentenbeschreibung mit festem Darstellungsbereich.
     */
    public ComponentDescriptor(
        String id,
        String title,
        PresenterType presenter,
        boolean container,
        List<InputDescriptor> inputs,
        List<OutputDescriptor> outputs
    ) {
        this(id, title, container, inputs, outputs);
        this.presenter = presenter;
    }

    /** @return Technische Komponenten-ID. */
    public String getId() { return id; }
    /** @param id Technische Komponenten-ID. */
    public void setId(String id) { this.id = id; }
    /** @return Anzeigename der Komponente. */
    public String getTitle() { return title; }
    /** @param title Anzeigename der Komponente. */
    public void setTitle(String title) { this.title = title; }
    /** @return Zugeordneter ixserv-Display-Typ oder {@code null}. */
    public IxtDisplayType getDisplayType() { return displayType; }
    /** @param displayType Zugeordneter ixserv-Display-Typ oder {@code null}. */
    public void setDisplayType(IxtDisplayType displayType) { this.displayType = displayType; }
    /** @return Zulässiger Darstellungsbereich der Komponente. */
    public PresenterType getPresenter() { return presenter; }
    /** @param presenter Zulässiger Darstellungsbereich der Komponente. */
    public void setPresenter(PresenterType presenter) { this.presenter = presenter; }
    /** @return {@code true}, wenn die Komponente Kindknoten aufnehmen darf. */
    public boolean isContainer() { return container; }
    /** @param container Kennzeichnet Layout-Komponenten mit Kindknoten. */
    public void setContainer(boolean container) { this.container = container; }
    /** @return Beschriebene Eingabeschnittstelle der Komponente. */
    public List<InputDescriptor> getInputs() { return inputs; }
    /** @param inputs Beschriebene Eingabeschnittstelle der Komponente. */
    public void setInputs(List<InputDescriptor> inputs) { this.inputs = inputs; }
    /** @return Beschriebene Ausgabeschnittstelle der Komponente. */
    public List<OutputDescriptor> getOutputs() { return outputs; }
    /** @param outputs Beschriebene Ausgabeschnittstelle der Komponente. */
    public void setOutputs(List<OutputDescriptor> outputs) { this.outputs = outputs; }
}
