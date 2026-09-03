package com.flowprototype.backend.flow;

import com.flowprototype.backend.flow.model.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FlowValidationService {
    private final ComponentRegistryService registry;

    public FlowValidationService(ComponentRegistryService registry) {
        this.registry = registry;
    }

    public ValidationResult validate(FlowDefinition definition) {
        List<ValidationIssue> issues = new ArrayList<>();
        if (definition == null || definition.getNodes() == null || definition.getNodes().isEmpty()) {
            issues.add(new ValidationIssue("flow", "Flow enthält keine Knoten."));
            return new ValidationResult(issues);
        }

        Map<String, FlowNode> nodes = definition.getNodes().stream().collect(Collectors.toMap(FlowNode::getId, Function.identity(), (a, b) -> a));
        if (!nodes.containsKey(definition.getEntryNodeId())) {
            issues.add(new ValidationIssue("entryNodeId", "Entry-Knoten existiert nicht."));
        }

        Map<String, ComponentDescriptor> descriptorsById = registry.getAll().stream().collect(Collectors.toMap(ComponentDescriptor::getId, Function.identity()));
        Map<String, Map<String, SemanticType>> contextByNode = computeContextTypes(definition, nodes, descriptorsById, issues);

        for (FlowNode node : definition.getNodes()) {
            ComponentDescriptor descriptor = descriptorsById.get(node.getComponentId());
            if (descriptor == null) {
                issues.add(new ValidationIssue("nodes." + node.getId() + ".componentId", "Komponente '" + node.getComponentId() + "' existiert nicht in der Registry."));
                continue;
            }

            if (!node.getChildren().isEmpty() && !descriptor.isContainer()) {
                issues.add(new ValidationIssue("nodes." + node.getId() + ".children", "Kindknoten sind nur bei Container-Komponenten erlaubt."));
            }

            Map<String, InputBinding> bindings = node.getInputBindings() == null ? Map.of() : node.getInputBindings();
            Map<String, SemanticType> availableContext = contextByNode.getOrDefault(node.getId(), Map.of());

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
            for (FlowTransition transition : node.getTransitions()) {
                if (!seenTransitionOutputs.add(transition.getOnOutput())) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Mehrere Transitionen für Output '" + transition.getOnOutput() + "' sind nicht erlaubt."));
                    continue;
                }
                if (!outputs.containsKey(transition.getOnOutput())) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition referenziert unbekannten Output '" + transition.getOnOutput() + "'."));
                    continue;
                }
                FlowNode target = nodes.get(transition.getTargetNodeId());
                if (target == null) {
                    issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Transition-Ziel '" + transition.getTargetNodeId() + "' existiert nicht."));
                    continue;
                }

                Map<String, SemanticType> postTransitionContext = new HashMap<>(availableContext);
                OutputDescriptor outputDescriptor = outputs.get(transition.getOnOutput());
                for (Map.Entry<String, String> mapping : transition.getContextMapping().entrySet()) {
                    SemanticType mappedType = mappedType(mapping.getValue(), outputDescriptor, availableContext);
                    if (mappedType == null) {
                        issues.add(new ValidationIssue("nodes." + node.getId() + ".transitions", "Context-Mapping '" + mapping.getValue() + "' kann nicht aufgelöst werden."));
                    } else {
                        postTransitionContext.put(mapping.getKey(), mappedType);
                    }
                }

                ComponentDescriptor targetDescriptor = descriptorsById.get(target.getComponentId());
                if (targetDescriptor != null) {
                    Map<String, InputBinding> targetBindings = target.getInputBindings() == null ? Map.of() : target.getInputBindings();
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

    private Map<String, Map<String, SemanticType>> computeContextTypes(FlowDefinition definition, Map<String, FlowNode> nodes, Map<String, ComponentDescriptor> descriptorsById, List<ValidationIssue> issues) {
        Map<String, Map<String, SemanticType>> contextByNode = new HashMap<>();
        Set<String> reportedConflicts = new HashSet<>();
        if (definition.getEntryNodeId() == null || !nodes.containsKey(definition.getEntryNodeId())) {
            return contextByNode;
        }
        contextByNode.put(definition.getEntryNodeId(), new HashMap<>());

        boolean changed;
        do {
            changed = false;
            for (FlowNode node : definition.getNodes()) {
                Map<String, SemanticType> currentContext = contextByNode.get(node.getId());
                if (currentContext == null) {
                    continue;
                }
                ComponentDescriptor sourceDesc = descriptorsById.get(node.getComponentId());
                if (sourceDesc == null) {
                    continue;
                }
                Map<String, OutputDescriptor> outputs = sourceDesc.getOutputs().stream().collect(Collectors.toMap(OutputDescriptor::getName, Function.identity()));
                for (FlowTransition transition : node.getTransitions()) {
                    FlowNode targetNode = nodes.get(transition.getTargetNodeId());
                    OutputDescriptor output = outputs.get(transition.getOnOutput());
                    if (targetNode == null || output == null) {
                        continue;
                    }
                    Map<String, SemanticType> candidate = new HashMap<>(currentContext);
                    for (Map.Entry<String, String> m : transition.getContextMapping().entrySet()) {
                        SemanticType mappedType = mappedType(m.getValue(), output, currentContext);
                        if (mappedType != null) {
                            candidate.put(m.getKey(), mappedType);
                        }
                    }

                    Map<String, SemanticType> existing = contextByNode.computeIfAbsent(targetNode.getId(), ignored -> new HashMap<>());
                    for (Map.Entry<String, SemanticType> e : candidate.entrySet()) {
                        SemanticType old = existing.get(e.getKey());
                        if (old == null) {
                            existing.put(e.getKey(), e.getValue());
                            changed = true;
                        } else if (old != e.getValue()) {
                            String conflictId = targetNode.getId() + "::" + e.getKey();
                            if (reportedConflicts.add(conflictId)) {
                                issues.add(new ValidationIssue("nodes." + targetNode.getId(), "Context-Key '" + e.getKey() + "' hat widersprüchliche Typen auf unterschiedlichen Pfaden."));
                            }
                        }
                    }
                }
            }
        } while (changed);

        return contextByNode;
    }

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

    private boolean isStaticCompatible(Object value, InputDescriptor input) {
        if (value == null) {
            return !input.isRequired();
        }
        if (!(value instanceof String str)) {
            return false;
        }
        if (input.getSemanticType() == SemanticType.MODE && !input.getAllowedValues().contains(str)) {
            return false;
        }
        return true;
    }

    private boolean isCompatible(SemanticType actual, SemanticType expected) {
        if (actual == expected) {
            return true;
        }
        if (expected == SemanticType.STRING) {
            return true;
        }
        return false;
    }
}
