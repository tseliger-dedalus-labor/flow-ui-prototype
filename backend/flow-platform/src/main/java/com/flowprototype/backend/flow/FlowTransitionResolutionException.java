package com.flowprototype.backend.flow;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Meldet fachlich nicht auflösbare Transition-Daten an den Runtime-Client.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class FlowTransitionResolutionException extends RuntimeException {
    public FlowTransitionResolutionException(String message) {
        super(message);
    }
}
