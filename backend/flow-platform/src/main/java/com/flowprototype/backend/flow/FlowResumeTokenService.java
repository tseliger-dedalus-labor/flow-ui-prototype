package com.flowprototype.backend.flow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Serialisiert portable Flow-Zustände und schützt sie mit HMAC-SHA-256 gegen Manipulation.
 */
@Service
public class FlowResumeTokenService {
    private static final int MAX_TOKEN_LENGTH = 65_536;
    private final ObjectMapper objectMapper;
    private final byte[] secret;

    public FlowResumeTokenService(
        ObjectMapper objectMapper,
        @Value("${flow.resume-link.secret:}") String secret
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String sign(FlowResumeState state) {
        ensureConfigured();
        try {
            String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(objectMapper.writeValueAsBytes(state));
            String token = payload + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(mac(payload));
            if (token.length() > MAX_TOKEN_LENGTH) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Der Ansichtslink ist zu groß");
            }
            return token;
        } catch (JacksonException e) {
            throw new IllegalStateException("Flow-Link konnte nicht erzeugt werden", e);
        }
    }

    public String signIfConfigured(FlowResumeState state) {
        return secret.length < 32 ? "" : sign(state);
    }

    public FlowResumeState verify(String token) {
        ensureConfigured();
        if (token == null || token.length() > MAX_TOKEN_LENGTH) {
            throw invalidLink();
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2 || !MessageDigest.isEqual(decode(parts[1]), mac(parts[0]))) {
            throw invalidLink();
        }
        try {
            FlowResumeState state = objectMapper.readValue(decode(parts[0]), FlowResumeState.class);
            if (state.schemaVersion() != FlowResumeState.CURRENT_SCHEMA_VERSION) {
                throw new ResponseStatusException(HttpStatus.GONE, "Die Version des Ansichtslinks wird nicht mehr unterstützt");
            }
            if (state.flowId() == null || state.flowId().isBlank()
                || state.currentNodeId() == null || state.currentNodeId().isBlank()
                || state.context() == null || state.history() == null
                || state.path() == null || state.viewScopes() == null) {
                throw invalidLink();
            }
            return state;
        } catch (JacksonException | IllegalArgumentException e) {
            throw invalidLink();
        }
    }

    private byte[] mac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Flow-Link konnte nicht signiert werden", e);
        }
    }

    private byte[] decode(String value) {
        try {
            return Base64.getUrlDecoder().decode(value);
        } catch (IllegalArgumentException e) {
            throw invalidLink();
        }
    }

    private void ensureConfigured() {
        if (secret.length < 32) {
            throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "FLOW_RESUME_LINK_SECRET muss mit mindestens 32 Zeichen konfiguriert werden"
            );
        }
    }

    private ResponseStatusException invalidLink() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Der Ansichtslink ist ungültig oder wurde verändert");
    }
}
