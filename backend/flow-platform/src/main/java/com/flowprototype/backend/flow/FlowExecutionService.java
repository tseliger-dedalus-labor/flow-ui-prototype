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
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Führt Flow-Navigation und Kontextänderungen ausschließlich auf dem Server aus.
 */
@Service
public class FlowExecutionService {
    private final FlowService flowService;
    private final ComponentRegistryService componentRegistry;
    private final FlowTransitionResolverRegistry resolverRegistry;
    private final Map<String, Execution> executions = new ConcurrentHashMap<>();

    public FlowExecutionService(
        FlowService flowService,
        ComponentRegistryService componentRegistry,
        FlowTransitionResolverRegistry resolverRegistry
    ) {
        this.flowService = flowService;
        this.componentRegistry = componentRegistry;
        this.resolverRegistry = resolverRegistry;
    }

    public FlowExecutionView start(String flowId) {
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

    public FlowExecutionView transition(String executionId, FlowOutputRequest request) {
        Execution execution = execution(executionId);
        synchronized (execution) {
            assertVersion(execution, request.expectedVersion());
            FlowNode source = node(execution.definition, request.sourceNodeId());
            if (source == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quellknoten nicht gefunden");
            }
            FlowTransition transition = source.getTransitions().stream()
                .filter(candidate -> request.outputName().equals(candidate.getOnOutput()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transition nicht gefunden"));

            Map<String, Object> event = new HashMap<>(request.payload());
            if (transition.getResolverId() != null && !transition.getResolverId().isBlank()) {
                FlowTransitionResolver resolver = resolverRegistry.byId(transition.getResolverId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Transition-Resolver nicht gefunden"));
                event.putAll(resolver.resolve(Map.copyOf(event), Map.copyOf(execution.context)));
            }

            Map<String, Object> nextContext = new HashMap<>(execution.context);
            Map<String, String> mappings = transition.getContextMapping() == null ? Map.of() : transition.getContextMapping();
            mappings.forEach((key, expression) -> nextContext.put(key, resolveExpression(expression, event, nextContext)));

            FlowNode target = resolveTarget(execution.definition, transition, event);
            if (target == null) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Zielknoten nicht gefunden");
            }
            execution.history.push(new Snapshot(execution.currentNodeId, Map.copyOf(execution.context)));
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
                execution.definition.getId(),
                execution.version,
                execution.definition,
                execution.currentNodeId,
                Map.copyOf(execution.context),
                Map.copyOf(inputs),
                !execution.history.isEmpty()
            );
        }
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
        return Map.copyOf(result);
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
        if (execution == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flow-Ausführung nicht gefunden");
        }
        return execution;
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

        private Execution(String id, FlowDefinition definition) {
            this.id = id;
            this.definition = definition;
            currentNodeId = definition.getEntryNodeId();
        }
    }

    private record Snapshot(String nodeId, Map<String, Object> context) {}
}
