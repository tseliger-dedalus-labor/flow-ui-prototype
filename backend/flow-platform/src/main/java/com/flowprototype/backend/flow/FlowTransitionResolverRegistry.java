package com.flowprototype.backend.flow;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Aggregiert die von Fachmodulen bereitgestellten Transition-Resolver.
 */
@Service
public class FlowTransitionResolverRegistry {
    private final Map<String, FlowTransitionResolver> resolvers;

    public FlowTransitionResolverRegistry(List<FlowTransitionResolver> contributedResolvers) {
        Map<String, FlowTransitionResolver> byId = new LinkedHashMap<>();
        for (FlowTransitionResolver resolver : contributedResolvers) {
            if (byId.putIfAbsent(resolver.id(), resolver) != null) {
                throw new IllegalStateException("Transition-Resolver mehrfach registriert: " + resolver.id());
            }
        }
        resolvers = Map.copyOf(byId);
    }

    public Optional<FlowTransitionResolver> byId(String id) {
        return Optional.ofNullable(resolvers.get(id));
    }
}
