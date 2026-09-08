package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.BindingSource;
import com.flowprototype.backend.flow.model.ComponentDescriptor;
import com.flowprototype.backend.flow.model.FlowDefinition;
import com.flowprototype.backend.flow.model.FlowNode;
import com.flowprototype.backend.flow.model.FlowTransition;
import com.flowprototype.backend.flow.model.InputBinding;
import com.flowprototype.backend.flow.model.IxtDisplayType;
import com.flowprototype.backend.flow.model.PrtType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayDeque;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;
import java.time.Instant;

/**
 * Führt Flow-Navigation und Kontextänderungen ausschließlich auf dem Server aus.
 */
@Service
public class FlowExecutionService {
    private static final Duration EXECUTION_TTL = Duration.ofHours(24);
    private static final int MAX_EXECUTIONS = 10_000;
    private static final int MAX_HISTORY_ENTRIES = 100;

    private final FlowService flowService;
    private final ComponentRegistryService componentRegistry;
    private final FlowTransitionResolverRegistry resolverRegistry;
    private final FlowResumeTokenService resumeTokens;
    private final Map<String, Execution> executions = new ConcurrentHashMap<>();

    public FlowExecutionService(
        FlowService flowService,
        ComponentRegistryService componentRegistry,
        FlowTransitionResolverRegistry resolverRegistry,
        FlowResumeTokenService resumeTokens
    ) {
        this.flowService = flowService;
        this.componentRegistry = componentRegistry;
        this.resolverRegistry = resolverRegistry;
        this.resumeTokens = resumeTokens;
    }

    public FlowExecutionView start(String flowId) {
        removeExpiredExecutions();
        if (executions.size() >= MAX_EXECUTIONS) {
            executions.values().stream()
                .min(java.util.Comparator.comparing(candidate -> candidate.lastAccess))
                .ifPresent(candidate -> executions.remove(candidate.id, candidate));
        }
        FlowDefinition definition = flowService.get(flowId);
        if (node(definition, definition.getEntryNodeId()) == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Einstiegsknoten nicht gefunden");
        }
        Execution execution = new Execution(UUID.randomUUID().toString(), definition);
        executions.put(execution.id, execution);
        return view(execution);
    }

    public FlowExecutionView get(String executionId) {
        return view(execution(executionId));
    }

    /**
     * Erzeugt aus einem signierten Link eine neue, unabhängige Ausführung.
     */
    public FlowExecutionView resume(String token) {
        removeExpiredExecutions();
        ensureCapacity();
        FlowResumeState state = resumeTokens.verify(token);
        FlowDefinition definition = flowService.get(state.flowId());
        if (definition.getVersion() != state.flowVersion()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Der Flow wurde seit Erstellung des Ansichtslinks geändert");
        }
        if (node(definition, state.currentNodeId()) == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Zielknoten des Ansichtslinks nicht gefunden");
        }
        Execution execution = new Execution(UUID.randomUUID().toString(), definition);
        execution.currentNodeId = state.currentNodeId();
        execution.context = mutableCopy(state.context());
        execution.version = state.executionVersion();
        execution.viewScopes = immutableCopy(state.viewScopes());
        if (state.history() != null) {
            state.history().stream()
                .limit(MAX_HISTORY_ENTRIES)
                .forEach(snapshot -> {
                    if (node(definition, snapshot.nodeId()) == null) {
                        throw new ResponseStatusException(
                            HttpStatus.UNPROCESSABLE_ENTITY,
                            "Historischer Knoten des Ansichtslinks nicht gefunden"
                        );
                    }
                    execution.history.addLast(new Snapshot(snapshot.nodeId(), immutableCopy(snapshot.context())));
                });
        }
        executions.put(execution.id, execution);
        return view(execution);
    }

    /**
     * Bindet komponentenspezifischen View-Zustand in den signierten Zustand einer Ausführung ein.
     */
    public FlowLinkView createLink(String executionId, FlowLinkRequest request) {
        Execution execution = execution(executionId);
        synchronized (execution) {
            Map<String, Object> scopes = request.viewScopes() == null ? Map.of() : immutableCopy(request.viewScopes());
            String path = request.path() == null ? "" : request.path();
            if (!path.startsWith("/") || path.length() > 2_048) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ungültiger Pfad für Ansichtslink");
            }
            return new FlowLinkView(resumeTokens.sign(resumeState(execution, path, scopes)));
        }
    }

    public FlowExecutionView transition(String executionId, FlowOutputRequest request) {
        Execution execution = execution(executionId);
        synchronized (execution) {
            assertVersion(execution, request.expectedVersion());
            FlowNode source = node(execution.definition, request.sourceNodeId());
            if (source == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quellknoten nicht gefunden");
            }
            if (!isAllowedSource(execution, source)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Quellknoten ist in der aktuellen Ansicht nicht aktiv");
            }
            FlowTransition transition = source.getTransitions().stream()
                .filter(candidate -> request.outputName().equals(candidate.getOnOutput()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transition nicht gefunden"));

            Map<String, Object> event = new HashMap<>(request.payload());
            if (transition.getResolverId() != null && !transition.getResolverId().isBlank()) {
                FlowTransitionResolver resolver = resolverRegistry.byId(transition.getResolverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Transition-Resolver nicht gefunden"));
                for (String requiredField : resolver.inputTypes().keySet()) {
                    if (!event.containsKey(requiredField) || event.get(requiredField) == null) {
                        throw new ResponseStatusException(
                            HttpStatus.UNPROCESSABLE_ENTITY,
                            "Resolver-Eingabefeld fehlt: " + requiredField
                        );
                    }
                }
                event.putAll(resolver.resolve(
                    Collections.unmodifiableMap(event),
                    Collections.unmodifiableMap(execution.context)
                ));
            }

            Map<String, Object> nextContext = new HashMap<>(execution.context);
            Map<String, String> mappings = transition.getContextMapping() == null ? Map.of() : transition.getContextMapping();
            mappings.forEach((key, expression) ->
                nextContext.put(key, resolveExpression(expression, event, execution.context))
            );

            FlowNode target = resolveTarget(execution.definition, transition, event);
            if (target == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Zielknoten nicht gefunden");
            }
            execution.history.push(new Snapshot(
                execution.currentNodeId,
                Collections.unmodifiableMap(new LinkedHashMap<>(execution.context))
            ));
            if (execution.history.size() > MAX_HISTORY_ENTRIES) {
                execution.history.removeLast();
            }
            execution.currentNodeId = target.getId();
            execution.context = nextContext;
            execution.version++;
            return view(execution);
        }
    }

    public FlowExecutionView back(String executionId, FlowExecutionRequest request) {
        Execution execution = execution(executionId);
        synchronized (execution) {
            assertVersion(execution, request.expectedVersion());
            Snapshot previous = execution.history.poll();
            if (previous == null) {
                return view(execution);
            }
            execution.currentNodeId = previous.nodeId;
            execution.context = new HashMap<>(previous.context);
            execution.version++;
            return view(execution);
        }
    }

    private FlowExecutionView view(Execution execution) {
        synchronized (execution) {
            Map<String, Map<String, Object>> inputs = new LinkedHashMap<>();
            for (FlowNode node : execution.definition.getNodes()) {
                inputs.put(node.getId(), resolveInputs(node, execution.context));
            }
            return new FlowExecutionView(
                execution.id,
                resumeTokens.signIfConfigured(resumeState(execution, "", Map.of())),
                execution.definition.getId(),
                execution.version,
                execution.definition,
                execution.currentNodeId,
                Collections.unmodifiableMap(new LinkedHashMap<>(execution.context)),
                Map.copyOf(inputs),
                !execution.history.isEmpty(),
                execution.viewScopes
            );
        }
    }

    private FlowResumeState resumeState(Execution execution, String path, Map<String, Object> viewScopes) {
        return new FlowResumeState(
            FlowResumeState.CURRENT_SCHEMA_VERSION,
            execution.definition.getId(),
            execution.definition.getVersion(),
            execution.currentNodeId,
            immutableCopy(execution.context),
            execution.history.stream()
                .map(snapshot -> new FlowResumeSnapshot(snapshot.nodeId, immutableCopy(snapshot.context)))
                .toList(),
            execution.version,
            path,
            viewScopes
        );
    }

    private Map<String, Object> mutableCopy(Map<String, Object> value) {
        return value == null ? new HashMap<>() : new HashMap<>(value);
    }

    private Map<String, Object> immutableCopy(Map<String, Object> value) {
        return value == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(value));
    }

    private Map<String, Object> resolveInputs(FlowNode node, Map<String, Object> context) {
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, InputBinding> bindings = node.getInputBindings() == null ? Map.of() : node.getInputBindings();
        bindings.forEach((name, binding) -> result.put(
            name,
            binding.getSource() == BindingSource.CONTEXT
                ? context.get(binding.getContextKey())
                : binding.getStaticValue()
        ));
        return Collections.unmodifiableMap(result);
    }

    private FlowNode resolveTarget(FlowDefinition definition, FlowTransition transition, Map<String, Object> event) {
        Object prtTypeValue = event.get("prtType");
        if (prtTypeValue instanceof String value && transition.getPrtTypeDisplayTypes() != null) {
            try {
                IxtDisplayType displayType = transition.getPrtTypeDisplayTypes().get(PrtType.valueOf(value));
                if (displayType != null) {
                    String componentId = componentRegistry.byDisplayType(displayType)
                        .map(ComponentDescriptor::getId)
                        .orElse(null);
                    if (componentId != null) {
                        return definition.getNodes().stream()
                            .filter(candidate -> componentId.equals(candidate.getComponentId()))
                            .findFirst()
                            .orElse(null);
                    }

                }
            } catch (IllegalArgumentException ignored) {
                // Unbekannte fachliche Typwerte fallen auf das statische Ziel zurück.
            }
        }
        return node(definition, transition.getTargetNodeId());
    }

    private boolean isAllowedSource(Execution execution, FlowNode source) {
        if (source.getId().equals(execution.currentNodeId)) {
            return true;
        }
        FlowNode current = node(execution.definition, execution.currentNodeId);
        if (current == null) {
            return false;
        }
        if (current.getSidebar() != null && source.getId().equals(current.getSidebar().getNodeId())) {
            return true;
        }
        if (current.getSidebar() == null
            && execution.definition.getSidebar() != null
            && source.getId().equals(execution.definition.getSidebar().getNodeId())) {
            return true;
        }
        return execution.definition.getSidebarMode() != null
            && execution.definition.getSidebarMode().name().equals("COLLAPSE")
            && execution.definition.getNodes().stream()
                .map(FlowNode::getSidebar)
                .filter(java.util.Objects::nonNull)
                .anyMatch(sidebar -> source.getId().equals(sidebar.getNodeId()));
    }

    private Object resolveExpression(String expression, Map<String, Object> event, Map<String, Object> context) {
        if (expression != null && expression.startsWith("$event.")) {
            return event.get(expression.substring("$event.".length()));
        }
        if (expression != null && expression.startsWith("$context.")) {
            return context.get(expression.substring("$context.".length()));
        }
        return expression;
    }

    private Execution execution(String id) {
        Execution execution = executions.get(id);
        if (execution == null || execution.lastAccess.plus(EXECUTION_TTL).isBefore(Instant.now())) {
            if (execution != null) {
                executions.remove(id, execution);
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow-Ausführung nicht gefunden");
        }
        execution.lastAccess = Instant.now();
        return execution;
    }

    private void removeExpiredExecutions() {
        Instant cutoff = Instant.now().minus(EXECUTION_TTL);
        executions.entrySet().removeIf(entry -> entry.getValue().lastAccess.isBefore(cutoff));
    }

    private void ensureCapacity() {
        if (executions.size() >= MAX_EXECUTIONS) {
            executions.values().stream()
                .min(java.util.Comparator.comparing(candidate -> candidate.lastAccess))
                .ifPresent(candidate -> executions.remove(candidate.id, candidate));
        }
    }

    private void assertVersion(Execution execution, long expectedVersion) {
        if (execution.version != expectedVersion) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Flow-Ausführung wurde zwischenzeitlich geändert");
        }
    }

    private FlowNode node(FlowDefinition definition, String id) {
        return definition.getNodes().stream().filter(candidate -> candidate.getId().equals(id)).findFirst().orElse(null);
    }

    private static final class Execution {
        private final String id;
        private final FlowDefinition definition;
        private final Deque<Snapshot> history = new ArrayDeque<>();
        private long version;
        private String currentNodeId;
        private Map<String, Object> context = new HashMap<>();
        private Map<String, Object> viewScopes = Map.of();
        private volatile Instant lastAccess = Instant.now();

        private Execution(String id, FlowDefinition definition) {
            this.id = id;
            this.definition = definition;
            currentNodeId = definition.getEntryNodeId();
        }
    }

    private record Snapshot(String nodeId, Map<String, Object> context) {}
}
