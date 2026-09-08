package com.flowprototype.backend.flow;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Serialisiert portable Flow-Zustände und schützt sie mit HMAC-SHA-256 gegen Manipulation.
 */
@Service
public class FlowResumeTokenService {
    private static final int MAX_TOKEN_LENGTH = 65_536;
    private static final int IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final SecureRandom secureRandom = new SecureRandom();

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
            String header = encode(objectMapper.writeValueAsBytes(new FlowResumeTokenHeader(
                state.schemaVersion(),
                state.flowId(),
                state.path()
            )));
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            byte[] ciphertext = encrypt(objectMapper.writeValueAsBytes(state), iv, header);
            byte[] encrypted = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, encrypted, 0, iv.length);
            System.arraycopy(ciphertext, 0, encrypted, iv.length, ciphertext.length);
            String body = encode(encrypted);
            String signedContent = header + "." + body;
            String token = signedContent + "." + encode(mac(signedContent));
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
        if (parts.length != 3) {
            throw invalidLink();
        }
        String signedContent = parts[0] + "." + parts[1];
        if (!MessageDigest.isEqual(decode(parts[2]), mac(signedContent))) {
            throw invalidLink();
        }
        try {
            FlowResumeTokenHeader header = objectMapper.readValue(decode(parts[0]), FlowResumeTokenHeader.class);
            byte[] encrypted = decode(parts[1]);
            if (encrypted.length <= IV_LENGTH) {
                throw invalidLink();
            }
            byte[] iv = java.util.Arrays.copyOfRange(encrypted, 0, IV_LENGTH);
            byte[] ciphertext = java.util.Arrays.copyOfRange(encrypted, IV_LENGTH, encrypted.length);
            FlowResumeState state = objectMapper.readValue(decrypt(ciphertext, iv, parts[0]), FlowResumeState.class);
            if (state.schemaVersion() != FlowResumeState.CURRENT_SCHEMA_VERSION) {
                throw new ResponseStatusException(HttpStatus.GONE, "Die Version des Ansichtslinks wird nicht mehr unterstützt");
            }
            if (state.flowId() == null || state.flowId().isBlank()
                || state.currentNodeId() == null || state.currentNodeId().isBlank()
                || state.context() == null || state.history() == null
                || state.path() == null || state.viewScopes() == null) {
                throw invalidLink();
            }
            if (header.schemaVersion() != state.schemaVersion()
                || !header.flowId().equals(state.flowId())
                || !header.path().equals(state.path())) {
                throw invalidLink();
            }
            return state;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw invalidLink();
        }
    }

    private byte[] encrypt(byte[] plaintext, byte[] iv, String header) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            cipher.updateAAD(header.getBytes(StandardCharsets.UTF_8));
            return cipher.doFinal(plaintext);
        } catch (Exception e) {
            throw new IllegalStateException("Flow-Link konnte nicht verschlüsselt werden", e);
        }
    }

    private byte[] decrypt(byte[] ciphertext, byte[] iv, String header) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, encryptionKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        cipher.updateAAD(header.getBytes(StandardCharsets.UTF_8));
        return cipher.doFinal(ciphertext);
    }

    private SecretKeySpec encryptionKey() throws Exception {
        return new SecretKeySpec(derivedKey("flow-resume-encryption"), "AES");
    }

    private byte[] derivedKey(String purpose) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(purpose.getBytes(StandardCharsets.UTF_8));
        return digest.digest(secret);
    }

    private byte[] mac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(derivedKey("flow-resume-signing"), "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Flow-Link konnte nicht signiert werden", e);
        }
    }

    private byte[] decode(String value) {
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(value);
            if (!encode(decoded).equals(value)) {
                throw invalidLink();
            }
            return decoded;
        } catch (IllegalArgumentException e) {
            throw invalidLink();
        }
    }

    private String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
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
