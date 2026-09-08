package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Prüft Flowbeschreibungen gegen Struktur-, Typ- und Erreichbarkeitsinvarianten.
 *
 * <p>Die Validierung verbindet Komponentenverzeichnis, Kontextfortpflanzung und
 * Zielknotenprüfung. Sie stellt sicher, dass ein Flow nicht nur syntaktisch
 * vollständig ist, sondern entlang jedes Übergangs die benötigten Daten anliegen.</p>
 */
@Service
public class FlowValidationService {
    private final ComponentRegistryService registry;
    private final FlowTransitionResolverRegistry resolverRegistry;

    /**
     * Erstellt den Prüfdienst mit Zugriff auf das globale Komponentenverzeichnis.
     *
     * @param registry Komponentenverzeichnis aller bekannten Komponenten.
     */
    public FlowValidationService(
        ComponentRegistryService registry,
        FlowTransitionResolverRegistry resolverRegistry
    ) {
        this.registry = registry;
        this.resolverRegistry = resolverRegistry;
    }

    /**
     * Validiert einen Flow vollständig.
     *
     * @param definition Zu prüfende Flowbeschreibung.
     * @return Sammlung aller gefundenen Validierungsprobleme.
     */
    public ValidationResult validate(FlowDefinition definition) {
        List<ValidationIssue> issues = new ArrayList<>();
        if (definition == null || definition.getNodes() == null || definition.getNodes().isEmpty()) {
            issues.add(new ValidationIssue("flow", "Flow enthält keine Knoten."));
            return new ValidationResult(issues);
        }
        if (definition.getTool() == null) {
            issues.add(new ValidationIssue("tool", "Flow muss einem Tool zugeordnet sein."));
        }

        Map<String, FlowNode> nodes = new LinkedHashMap<>();
        List<FlowNode> flowNodes = definition.getNodes().stream().filter(Objects::nonNull).toList();
        for (int index = 0; index < definition.getNodes().size(); index++) {
            FlowNode node = definition.getNodes().get(index);
            if (node == null) {
                issues.add(new ValidationIssue("nodes." + index, "Knoten darf nicht null sein."));
                continue;
            }
            if (node.getId() == null || node.getId().isBlank()) {
                issues.add(new ValidationIssue("nodes." + index + ".id", "Knoten-ID fehlt."));
                continue;
            }
            if (nodes.putIfAbsent(node.getId(), node) != null) {
                issues.add(new ValidationIssue("nodes." + index + ".id", "Knoten-ID '" + node.getId() + "' ist mehrfach vorhanden."));
            }
            validateNodeStructure(node, "nodes." + node.getId(), new HashSet<>(), Collections.newSetFromMap(new IdentityHashMap<>()), issues);
        }
        if (!nodes.containsKey(definition.getEntryNodeId())) {
            issues.add(new ValidationIssue("entryNodeId", "Entry-Knoten existiert nicht."));
        }
        FlowSidebar sidebar = definition.getSidebar();
        if (sidebar != null) {
            validateSidebarConfiguration(sidebar, "sidebar", nodes, issues);
        }

        Map<String, ComponentDescriptor> descriptorsById = registry.getAll().stream().collect(Collectors.toMap(ComponentDescriptor::getId, Function.identity()));
        Map<String, Map<String, SemanticType>> contextByNode = computeContextTypes(definition, nodes, descriptorsById, issues);
        Set<String> mainNodeIds = mainNodeIds(definition, descriptorsById);
        Set<String> childNodeIds = childNodeIds(definition);
        Set<String> sidebarNodeIds = flowNodes.stream()
            .map(FlowNode::getSidebar)
            .filter(Objects::nonNull)
            .map(FlowSidebar::getNodeId)
            .collect(Collectors.toSet());
        if (definition.getSidebar() != null) {
            sidebarNodeIds.add(definition.getSidebar().getNodeId());
        }

        for (FlowNode node : flowNodes) {
            ComponentDescriptor descriptor = descriptorsById.get(node.getComponentId());
            if (descriptor == null) {
                issues.add(new ValidationIssue("nodes." + node.getId() + ".componentId", "Komponente '" + node.getComponentId() + "' existiert nicht in der Registry."));
                continue;
            }
            if (sidebarNodeIds.contains(node.getId()) && descriptor.getPresenter() != PresenterType.SIDEBAR) {
                issues.add(new ValidationIssue(
                    "nodes." + node.getId() + ".componentId",
                    "Sidebar-Knoten benötigen eine SIDEBAR-Presenter-Komponente."
                ));
            }
            if ((mainNodeIds.contains(node.getId()) || childNodeIds.contains(node.getId()))
                && descriptor.getPresenter() != PresenterType.CONTENT) {
                issues.add(new ValidationIssue(
                    "nodes." + node.getId() + ".componentId",
                    "Haupt- und Kindknoten benötigen eine CONTENT-Presenter-Komponente."
                ));
            }

            Map<String, InputBinding> bindings = node.getInputBindings() == null ? Map.of() : node.getInputBindings();
            Map<String, SemanticType> availableContext = contextByNode.getOrDefault(node.getId(), Map.of());
            boolean sidebarOnly = sidebarNodeIds.contains(node.getId())
                && !mainNodeIds.contains(node.getId())
                && !childNodeIds.contains(node.getId());

            FlowSidebar nodeSidebar = node.getSidebar();
            if (nodeSidebar != null) {
                String sidebarPath = "nodes." + node.getId() + ".sidebar";
                validateSidebarConfiguration(nodeSidebar, sidebarPath, nodes, issues);
            }
            FlowSidebar activeSidebar = nodeSidebar != null ? nodeSidebar : definition.getSidebar();
            if (activeSidebar != null
                && mainNodeIds.contains(node.getId())
                && !node.getId().equals(activeSidebar.getNodeId())) {
                String sidebarPath = nodeSidebar != null ? "nodes." + node.getId() + ".sidebar" : "sidebar";
                validateSidebarExecution(activeSidebar, sidebarPath, availableContext, nodes, descriptorsById, issues);
            }

            // Nur Container dürfen verschachtelte Layoutknoten tragen; Fachkomponenten bleiben Blätter im Baum.
            if (!childrenOf(node).isEmpty() && !descriptor.isContainer()) {
                issues.add(new ValidationIssue("nodes." + node.getId() + ".children", "Kindknoten sind nur bei Container-Komponenten erlaubt."));
            }

            Set<String> inputNames = descriptor.getInputs().stream().map(InputDescriptor::getName).collect(Collectors.toSet());
            for (String bindingName : bindings.keySet()) {
                if (!inputNames.contains(bindingName)) {
                    issues.add(new ValidationIssue(
                        "nodes." + node.getId() + ".inputBindings." + bindingName,
                        "Input '" + bindingName + "' ist für die Komponente nicht definiert."
                    ));
                }
            }
            for (InputDescriptor input : descriptor.getInputs()) {
                InputBinding binding = bindings.get(input.getName());
                if (input.isRequired() && binding == null) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".inputBindings." + input.getName(), "Pflicht-Input fehlt."));
                    continue;
                }
                if (binding == null) {
                    continue;
                }
                if (binding.getSource() == BindingSource.STATIC) {
                    if (!isStaticCompatible(binding.getStaticValue(), input)) {
                        issues.add(new ValidationIssue("nodes." + node.getId() + ".inputBindings." + input.getName(), "Statischer Wert ist nicht typkompatibel oder Enum-Wert ist ungültig."));
                    }
                } else if (binding.getSource() == BindingSource.CONTEXT) {
                    if (sidebarOnly) {
                        continue;
                    }
                    SemanticType contextType = availableContext.get(binding.getContextKey());
                    if (contextType == null) {
                        issues.add(new ValidationIssue("nodes." + node.getId() + ".inputBindings." + input.getName(), "Context-Key '" + binding.getContextKey() + "' ist auf diesem Pfad nicht verfügbar."));
                    } else if (!isCompatible(contextType, input.getSemanticType())) {
                        issues.add(new ValidationIssue("nodes." + node.getId() + ".inputBindings." + input.getName(), "Context-Key '" + binding.getContextKey() + "' ist nicht typkompatibel."));
                    }
                } else {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".inputBindings." + input.getName(), "Input-Binding benötigt source STATIC oder CONTEXT."));
                }
            }

            Map<String, OutputDescriptor> outputs = descriptor.getOutputs().stream().collect(Collectors.toMap(OutputDescriptor::getName, Function.identity()));
            Set<String> seenTransitionOutputs = new HashSet<>();
            for (FlowTransition transition : transitionsOf(node)) {
                if (transition == null) {
                    continue;
                }
                // Pro Ausgabe gibt es höchstens einen Folgeknoten, damit die Laufzeitnavigation deterministisch bleibt.
                if (!seenTransitionOutputs.add(transition.getOnOutput())) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Mehrere Transitionen für Output '" + transition.getOnOutput() + "' sind nicht erlaubt."));
                    continue;
                }
                if (!outputs.containsKey(transition.getOnOutput())) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition referenziert unbekannten Output '" + transition.getOnOutput() + "'."));
                    continue;
                }
                FlowNode staticTarget = nodes.get(transition.getTargetNodeId());
                if (staticTarget == null) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition-Ziel '" + transition.getTargetNodeId() + "' existiert nicht."));
                    continue;
                }
                if (sidebarOnly) {
                    continue;
                }

                // Jede Transition erzeugt ihren eigenen Kontextzustand, der Ereignisnutzlast und vorhandenen Kontext kombiniert.
                Map<String, SemanticType> postTransitionContext = new HashMap<>(availableContext);
                OutputDescriptor outputDescriptor = resolvedOutputDescriptor(
                    transition,
                    outputs.get(transition.getOnOutput()),
                    "nodes." + node.getId() + ".transitions",
                    issues
                );
                Map<PrtType, IxtDisplayType> typeMappings = prtTypeDisplayTypesOf(transition);
                if (!typeMappings.isEmpty() && !outputDescriptor.getPayload().containsValue(SemanticType.PRT_TYPE)) {
                    issues.add(new ValidationIssue(
                        "nodes." + node.getId() + ".transitions",
                        "PrtType-Ziele benötigen ein Output-Feld vom Typ PRT_TYPE."
                    ));
                }
                for (Map.Entry<String, String> mapping : contextMappingOf(transition).entrySet()) {
                    SemanticType mappedType = mappedType(mapping.getValue(), outputDescriptor, availableContext);
                    if (mappedType == null) {
                        issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Context-Mapping '" + mapping.getValue() + "' kann nicht aufgelöst werden."));
                    } else {
                        postTransitionContext.put(mapping.getKey(), mappedType);
                    }
                }

                List<FlowNode> targets = transitionTargets(transition, nodes, descriptorsById);
                for (IxtDisplayType displayType : typeMappings.values()) {
                    boolean existsInFlow = targets.stream()
                        .map(FlowNode::getComponentId)
                        .map(descriptorsById::get)
                        .filter(Objects::nonNull)
                        .anyMatch(targetDescriptor -> displayType == targetDescriptor.getDisplayType());
                    if (!existsInFlow) {
                        issues.add(new ValidationIssue(
                            "nodes." + node.getId() + ".transitions",
                            "Für IxtDisplayType '" + displayType + "' existiert kein Zielknoten im Flow."
                        ));
                    }
                }
                for (FlowNode target : targets) {
                    ComponentDescriptor targetDescriptor = descriptorsById.get(target.getComponentId());
                    if (targetDescriptor == null) {
                        continue;
                    }
                    Map<String, InputBinding> targetBindings = target.getInputBindings() == null
                        ? Map.of()
                        : target.getInputBindings();
                    for (InputDescriptor requiredInput : targetDescriptor.getInputs().stream().filter(InputDescriptor::isRequired).toList()) {
                        InputBinding targetBinding = targetBindings.get(requiredInput.getName());
                        if (targetBinding == null) {
                            issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition zu '" + target.getId() + "' erreicht Pflicht-Input '" + requiredInput.getName() + "' ohne Binding nicht."));
                            continue;
                        }
                        if (targetBinding.getSource() == BindingSource.CONTEXT) {
                            SemanticType t = postTransitionContext.get(targetBinding.getContextKey());
                            if (t == null || !isCompatible(t, requiredInput.getSemanticType())) {
                                issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition zu '" + target.getId() + "' stellt Pflicht-Input '" + requiredInput.getName() + "' nicht erreichbar bereit."));
                            }
                        }
                    }
                }
            }
        }

        return new ValidationResult(issues);
    }

    /**
     * Berechnet für jeden erreichbaren Knoten die auf allen Pfaden bekannten Kontexttypen.
     *
     * @param definition Gesamte Flowbeschreibung.
     * @param nodes Knoten nach ID.
     * @param descriptorsById Komponentenbeschreibungen nach ID.
     * @param issues Ergebnisliste für Konfliktmeldungen.
     * @return Kontextsicht je Knoten-ID.
     */
    private Map<String, Map<String, SemanticType>> computeContextTypes(FlowDefinition definition, Map<String, FlowNode> nodes, Map<String, ComponentDescriptor> descriptorsById, List<ValidationIssue> issues) {
        Map<String, Map<String, SemanticType>> contextByNode = new HashMap<>();
        Set<String> reportedConflicts = new HashSet<>();
        Set<String> mainNodeIds = mainNodeIds(definition, descriptorsById);
        if (definition.getEntryNodeId() == null || !nodes.containsKey(definition.getEntryNodeId())) {
            return contextByNode;
        }
        contextByNode.put(definition.getEntryNodeId(), new HashMap<>());

        boolean changed;
        do {
            changed = false;
            for (FlowNode node : definition.getNodes()) {
                if (node == null) {
                    continue;
                }
                Map<String, SemanticType> currentContext = contextByNode.get(node.getId());
                if (currentContext == null) {
                    continue;
                }
                ComponentDescriptor sourceDesc = descriptorsById.get(node.getComponentId());
                if (sourceDesc == null) {
                    continue;
                }
                for (FlowNode child : childrenOf(node)) {
                    if (child == null) {
                        continue;
                    }
                    FlowNode childNode = nodes.get(child.getId());
                    if (childNode != null) {
                        // Layout-Kindknoten werden mit demselben Laufzeitkontext wie ihr Elternknoten gerendert.
                        changed |= mergeContext(childNode, currentContext, contextByNode, reportedConflicts, issues);
                    }
                }
                FlowSidebar activeSidebar = mainNodeIds.contains(node.getId())
                    ? node.getSidebar() != null ? node.getSidebar() : definition.getSidebar()
                    : null;
                if (activeSidebar != null && !node.getId().equals(activeSidebar.getNodeId())) {
                    FlowNode sidebarNode = nodes.get(activeSidebar.getNodeId());
                    if (sidebarNode != null) {
                        // Sidebar-Transitionen verwenden den Host-Kontext, ohne ihn dem Sidebar-Knoten als Hauptkontext zuzuschreiben.
                        changed |= propagateTransitions(
                            sidebarNode,
                            currentContext,
                            nodes,
                            descriptorsById,
                            contextByNode,
                            reportedConflicts,
                            issues
                        );
                    }
                }
                changed |= propagateTransitions(
                    node,
                    currentContext,
                    nodes,
                    descriptorsById,
                    contextByNode,
                    reportedConflicts,
                    issues
                );
            }
        } while (changed);

        return contextByNode;
    }

    /**
     * Propagiert die Transitionen eines Haupt-, Kind- oder Sidebar-Knotens aus einem konkreten Ausführungskontext.
     */
    private boolean propagateTransitions(
        FlowNode sourceNode,
        Map<String, SemanticType> currentContext,
        Map<String, FlowNode> nodes,
        Map<String, ComponentDescriptor> descriptorsById,
        Map<String, Map<String, SemanticType>> contextByNode,
        Set<String> reportedConflicts,
        List<ValidationIssue> issues
    ) {
        ComponentDescriptor sourceDescriptor = descriptorsById.get(sourceNode.getComponentId());
        if (sourceDescriptor == null) {
            return false;
        }
        boolean changed = false;
        Map<String, OutputDescriptor> outputs = sourceDescriptor.getOutputs().stream()
            .collect(Collectors.toMap(OutputDescriptor::getName, Function.identity()));
        for (FlowTransition transition : transitionsOf(sourceNode)) {
            if (transition == null) {
                continue;
            }
            OutputDescriptor output = resolvedOutputDescriptor(
                transition,
                outputs.get(transition.getOnOutput()),
                "nodes." + sourceNode.getId() + ".transitions",
                issues
            );
            if (output == null) {
                continue;
            }
            Map<String, SemanticType> candidate = new HashMap<>(currentContext);
            for (Map.Entry<String, String> mapping : contextMappingOf(transition).entrySet()) {
                SemanticType mappedType = mappedType(mapping.getValue(), output, currentContext);
                if (mappedType != null) {
                    candidate.put(mapping.getKey(), mappedType);
                }
            }
            for (FlowNode targetNode : transitionTargets(transition, nodes, descriptorsById)) {
                changed |= mergeContext(targetNode, candidate, contextByNode, reportedConflicts, issues);
            }
        }
        return changed;
    }

    /**
     * Ermittelt alle Knoten, die als aktiver Hauptinhalt auftreten können.
     */
    private Set<String> mainNodeIds(
        FlowDefinition definition,
        Map<String, ComponentDescriptor> descriptorsById
    ) {
        Set<String> ids = new HashSet<>();
        if (definition.getEntryNodeId() != null) {
            ids.add(definition.getEntryNodeId());
        }
        definition.getNodes().stream()
            .filter(Objects::nonNull)
            .flatMap(node -> transitionsOf(node).stream())
            .filter(Objects::nonNull)
            .map(FlowTransition::getTargetNodeId)
            .filter(Objects::nonNull)
            .forEach(ids::add);
        Set<IxtDisplayType> dynamicDisplayTypes = definition.getNodes().stream()
            .filter(Objects::nonNull)
            .flatMap(node -> transitionsOf(node).stream())
            .filter(Objects::nonNull)
            .flatMap(transition -> prtTypeDisplayTypesOf(transition).values().stream())
            .collect(Collectors.toSet());
        definition.getNodes().stream()
            .filter(Objects::nonNull)
            .filter(node -> {
                ComponentDescriptor descriptor = descriptorsById.get(node.getComponentId());
                return descriptor != null && dynamicDisplayTypes.contains(descriptor.getDisplayType());
            })
            .map(FlowNode::getId)
            .forEach(ids::add);
        return ids;
    }

    private List<FlowNode> transitionTargets(
        FlowTransition transition,
        Map<String, FlowNode> nodes,
        Map<String, ComponentDescriptor> descriptorsById
    ) {
        LinkedHashMap<String, FlowNode> targets = new LinkedHashMap<>();
        FlowNode staticTarget = nodes.get(transition.getTargetNodeId());
        if (staticTarget != null) {
            targets.put(staticTarget.getId(), staticTarget);
        }
        Set<IxtDisplayType> displayTypes = new HashSet<>(prtTypeDisplayTypesOf(transition).values());
        nodes.values().stream()
            .filter(node -> {
                ComponentDescriptor descriptor = descriptorsById.get(node.getComponentId());
                return descriptor != null && displayTypes.contains(descriptor.getDisplayType());
            })
            .forEach(node -> targets.put(node.getId(), node));
        return List.copyOf(targets.values());
    }

    /**
     * Ermittelt direkte und verschachtelte Kindknoten, die immer im Content-Bereich erscheinen.
     */
    private Set<String> childNodeIds(FlowDefinition definition) {
        Set<String> ids = new HashSet<>();
        for (FlowNode node : definition.getNodes()) {
            if (node != null) {
                collectChildNodeIds(node, ids, Collections.newSetFromMap(new IdentityHashMap<>()));
            }
        }
        return ids;
    }

    private void collectChildNodeIds(FlowNode node, Set<String> ids, Set<FlowNode> visited) {
        if (!visited.add(node)) {
            return;
        }
        for (FlowNode child : childrenOf(node)) {
            if (child != null && ids.add(child.getId())) {
                collectChildNodeIds(child, ids, visited);
            }
        }
    }

    /**
     * Prüft Referenz und Darstellungswerte einer Sidebar-Konfiguration.
     */
    private void validateSidebarConfiguration(
        FlowSidebar sidebar,
        String path,
        Map<String, FlowNode> nodes,
        List<ValidationIssue> issues
    ) {
        if (!nodes.containsKey(sidebar.getNodeId())) {
            issues.add(new ValidationIssue(path + ".nodeId", "Sidebar-Knoten existiert nicht."));
        }
        if (sidebar.getWidth() == null || sidebar.getWidth() < 160) {
            issues.add(new ValidationIssue(path + ".width", "Sidebar-Breite muss mindestens 160 Pixel betragen."));
        }
    }

    /**
     * Prüft Inputs und Transitionen eines Sidebar-Knotens mit dem Kontext des Hauptknotens.
     */
    private void validateSidebarExecution(
        FlowSidebar sidebar,
        String path,
        Map<String, SemanticType> hostContext,
        Map<String, FlowNode> nodes,
        Map<String, ComponentDescriptor> descriptorsById,
        List<ValidationIssue> issues
    ) {
        FlowNode sidebarNode = nodes.get(sidebar.getNodeId());
        if (sidebarNode == null) {
            return;
        }
        ComponentDescriptor descriptor = descriptorsById.get(sidebarNode.getComponentId());
        if (descriptor == null) {
            return;
        }

        Map<String, InputBinding> bindings = sidebarNode.getInputBindings() == null ? Map.of() : sidebarNode.getInputBindings();
        for (InputDescriptor input : descriptor.getInputs().stream().filter(InputDescriptor::isRequired).toList()) {
            InputBinding binding = bindings.get(input.getName());
            if (binding == null) {
                issues.add(new ValidationIssue(path, "Sidebar-Knoten '" + sidebarNode.getId() + "' erhält Pflicht-Input '" + input.getName() + "' nicht."));
            } else if (binding.getSource() == BindingSource.CONTEXT) {
                SemanticType type = hostContext.get(binding.getContextKey());
                if (type == null || !isCompatible(type, input.getSemanticType())) {
                    issues.add(new ValidationIssue(path, "Sidebar-Knoten '" + sidebarNode.getId() + "' erhält Pflicht-Input '" + input.getName() + "' nicht aus dem Kontext des Hauptknotens."));
                }
            }
        }

        Map<String, OutputDescriptor> outputs = descriptor.getOutputs().stream()
            .collect(Collectors.toMap(OutputDescriptor::getName, Function.identity()));
        for (FlowTransition transition : transitionsOf(sidebarNode)) {
            if (transition == null) {
                continue;
            }
            OutputDescriptor output = resolvedOutputDescriptor(
                transition,
                outputs.get(transition.getOnOutput()),
                path + ".transitions",
                issues
            );
            FlowNode target = nodes.get(transition.getTargetNodeId());
            if (output == null || target == null) {
                continue;
            }

            Map<String, SemanticType> postTransitionContext = new HashMap<>(hostContext);
            for (Map.Entry<String, String> mapping : contextMappingOf(transition).entrySet()) {
                SemanticType mappedType = mappedType(mapping.getValue(), output, hostContext);
                if (mappedType == null) {
                    issues.add(new ValidationIssue(path + ".transitions", "Sidebar-Context-Mapping '" + mapping.getValue() + "' kann nicht aufgelöst werden."));
                } else {
                    postTransitionContext.put(mapping.getKey(), mappedType);
                }
            }

            ComponentDescriptor targetDescriptor = descriptorsById.get(target.getComponentId());
            if (targetDescriptor == null) {
                continue;
            }
            Map<String, InputBinding> targetBindings = target.getInputBindings() == null ? Map.of() : target.getInputBindings();
            for (InputDescriptor input : targetDescriptor.getInputs().stream().filter(InputDescriptor::isRequired).toList()) {
                InputBinding binding = targetBindings.get(input.getName());
                if (binding != null && binding.getSource() == BindingSource.CONTEXT) {
                    SemanticType type = postTransitionContext.get(binding.getContextKey());
                    if (type == null || !isCompatible(type, input.getSemanticType())) {
                        issues.add(new ValidationIssue(
                            path + ".transitions",
                            "Sidebar-Output '" + transition.getOnOutput() + "' stellt Pflicht-Input '" + input.getName() + "' des Ziels '" + target.getId() + "' nicht bereit."
                        ));
                    }
                }
            }
        }
    }

    /**
     * Vereinigt neue Kontexttypen mit der bereits bekannten Sicht eines Zielknotens.
     */
    private boolean mergeContext(
        FlowNode targetNode,
        Map<String, SemanticType> candidate,
        Map<String, Map<String, SemanticType>> contextByNode,
        Set<String> reportedConflicts,
        List<ValidationIssue> issues
    ) {
        boolean changed = false;
        Map<String, SemanticType> existing = contextByNode.computeIfAbsent(targetNode.getId(), ignored -> new HashMap<>());
        for (Map.Entry<String, SemanticType> entry : candidate.entrySet()) {
            SemanticType old = existing.get(entry.getKey());
            if (old == null) {
                existing.put(entry.getKey(), entry.getValue());
                changed = true;
            } else if (old != entry.getValue()) {
                String conflictId = targetNode.getId() + "::" + entry.getKey();
                if (reportedConflicts.add(conflictId)) {
                    issues.add(new ValidationIssue(
                        "nodes." + targetNode.getId(),
                        "Context-Key '" + entry.getKey() + "' hat widersprüchliche Typen auf unterschiedlichen Pfaden."
                    ));
                }
            }
        }
        return changed;
    }

    /**
     * Leitet den Typ einer Ausdrucksquelle aus dem Kontextabbild ab.
     *
     * @param expression Mapping-Ausdruck aus der Transition.
     * @param outputDescriptor Ausgabebeschreibung des auslösenden Knotens.
     * @param currentContext Bereits bekannter Kontext am Quellknoten.
     * @return Abgeleiteter Typ oder {@code null}, wenn der Ausdruck nicht auflösbar ist.
     */
    private SemanticType mappedType(String expression, OutputDescriptor outputDescriptor, Map<String, SemanticType> currentContext) {
        if (expression == null) {
            return null;
        }

        if (expression.startsWith("$event.")) {
            String key = expression.substring("$event.".length());
            return outputDescriptor.getPayload().get(key);
        }
        if (expression.startsWith("$context.")) {
            String key = expression.substring("$context.".length());
            return currentContext.get(key);
        }
        return SemanticType.STRING;
    }

    private OutputDescriptor resolvedOutputDescriptor(
        FlowTransition transition,
        OutputDescriptor output,
        String path,
        List<ValidationIssue> issues
    ) {
        if (output == null || transition.getResolverId() == null || transition.getResolverId().isBlank()) {
            return output;
        }
        Optional<FlowTransitionResolver> configuredResolver = resolverRegistry.byId(transition.getResolverId());
        if (configuredResolver.isEmpty()) {
            issues.add(new ValidationIssue(path, "Transition-Resolver '" + transition.getResolverId() + "' ist nicht registriert."));
            return output;
        }
        FlowTransitionResolver resolver = configuredResolver.get();
        for (Map.Entry<String, SemanticType> required : resolver.inputTypes().entrySet()) {
            SemanticType actual = output.getPayload().get(required.getKey());
            if (actual == null || !isCompatible(actual, required.getValue())) {
                issues.add(new ValidationIssue(
                    path,
                    "Transition-Resolver '" + resolver.id() + "' erhält Output-Feld '" + required.getKey() + "' nicht typkompatibel."
                ));
            }
        }
        Map<String, SemanticType> enrichedPayload = new HashMap<>(output.getPayload());
        enrichedPayload.putAll(resolver.outputTypes());
        return new OutputDescriptor(output.getName(), enrichedPayload);
    }

    private void validateNodeStructure(
        FlowNode node,
        String path,
        Set<String> ancestorIds,
        Set<FlowNode> ancestors,
        List<ValidationIssue> issues
    ) {
        if (node.getChildren() == null) {
            issues.add(new ValidationIssue(path + ".children", "Kindknotenliste darf nicht null sein."));
        }
        if (node.getTransitions() == null) {
            issues.add(new ValidationIssue(path + ".transitions", "Transitionsliste darf nicht null sein."));
        } else if (node.getTransitions().stream().anyMatch(Objects::isNull)) {
            issues.add(new ValidationIssue(path + ".transitions", "Transition darf nicht null sein."));
        }

        boolean repeatedObject = !ancestors.add(node);
        boolean repeatedId = node.getId() != null && !ancestorIds.add(node.getId());
        if (repeatedObject || repeatedId) {
            issues.add(new ValidationIssue(path + ".children", "Kindknoten dürfen keinen Zyklus bilden."));
            return;
        }
        for (FlowNode child : childrenOf(node)) {
            if (child == null) {
                issues.add(new ValidationIssue(path + ".children", "Kindknoten darf nicht null sein."));
            } else {
                validateNodeStructure(child, path + ".children." + child.getId(), ancestorIds, ancestors, issues);
            }
        }
        ancestors.remove(node);
        if (node.getId() != null) {
            ancestorIds.remove(node.getId());
        }

        for (FlowTransition transition : transitionsOf(node)) {
            if (transition != null && transition.getContextMapping() == null) {
                issues.add(new ValidationIssue(path + ".transitions", "Context-Mapping darf nicht null sein."));
            }
        }
    }

    private List<FlowNode> childrenOf(FlowNode node) {
        return node.getChildren() == null ? List.of() : node.getChildren();
    }

    private List<FlowTransition> transitionsOf(FlowNode node) {
        return node.getTransitions() == null ? List.of() : node.getTransitions();
    }

    private Map<String, String> contextMappingOf(FlowTransition transition) {
        return transition.getContextMapping() == null ? Map.of() : transition.getContextMapping();
    }

    private Map<PrtType, IxtDisplayType> prtTypeDisplayTypesOf(FlowTransition transition) {
        return transition.getPrtTypeDisplayTypes() == null ? Map.of() : transition.getPrtTypeDisplayTypes();
    }

    /**
     * Prüft, ob ein statischer Zuordnungswert zur erwarteten Eingabe passt.
     *
     * @param value Statischer Wert aus der Flowbeschreibung.
     * @param input Zielbeschreibung der Eingabe.
     * @return {@code true}, wenn der Wert akzeptiert werden kann.
     */
    private boolean isStaticCompatible(Object value, InputDescriptor input) {
        if (value == null) {
            return !input.isRequired();
        }
        if (!(value instanceof String str)) {
            return false;
        }
        // MODE ist aktuell der einzige semantische Typ mit eingeschränkten Literalwerten.
        if (input.getSemanticType() == SemanticType.MODE && !input.getAllowedValues().contains(str)) {
            return false;
        }
        return true;
    }

    /**
     * Prüft die Typverträglichkeit zwischen vorhandenem Kontext und erwarteter Eingabe.
     *
     * @param actual Tatsächlicher Kontexttyp.
     * @param expected Erwarteter Typ der Eingabe.
     * @return {@code true}, wenn die Typen kompatibel sind.
     */
    private boolean isCompatible(SemanticType actual, SemanticType expected) {
        if (actual == expected) {
            return true;
        }
        // STRING dient als bewusst großzügiger Auffangtyp für generische Textfelder.
        if (expected == SemanticType.STRING) {
            return true;
        }
        return false;
    }
}
