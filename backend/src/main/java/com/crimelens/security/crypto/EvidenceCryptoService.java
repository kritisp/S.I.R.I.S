package com.crimelens.security.crypto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * AES-256-GCM Field and Payload Encryption Service adapted from ARGUS cryptoService.js.
 * Provides cryptographically secure encryption at rest with IV, Auth Tag, and AAD (Associated
 * Authenticated Data) binding to prevent ciphertext transposition across database entities.
 */
@Service
public class EvidenceCryptoService {

    private static final Logger logger = LoggerFactory.getLogger(EvidenceCryptoService.class);

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_BYTE_LENGTH = 12; // 96-bit nonce for GCM
    private static final int KEY_BYTE_LENGTH = 32; // 256-bit key

    private static final String DEFAULT_DEV_KEY_HEX = "4a8f9c2d1e0b5a3f7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b";

    private final SecureRandom secureRandom = new SecureRandom();
    private final String activeKeyVersion;
    private final SecretKey masterSecretKey;

    public EvidenceCryptoService(
            @Value("${crimelens.security.evidence-encryption-key:}") String configuredKeyHex,
            @Value("${crimelens.security.evidence-key-version:1}") String activeKeyVersion) {

        this.activeKeyVersion = activeKeyVersion;
        byte[] keyBytes = parseOrDeriveKey(configuredKeyHex);
        this.masterSecretKey = new SecretKeySpec(keyBytes, "AES");
        logger.info("Initialized EvidenceCryptoService [Algorithm: AES-256-GCM, KeyVersion: {}]", activeKeyVersion);
    }

    public static class EncryptedResult {
        private final String ciphertextBase64;
        private final String ivHex;
        private final String keyVersion;

        public EncryptedResult(String ciphertextBase64, String ivHex, String keyVersion) {
            this.ciphertextBase64 = ciphertextBase64;
            this.ivHex = ivHex;
            this.keyVersion = keyVersion;
        }

        public String getCiphertextBase64() {
            return ciphertextBase64;
        }

        public String getIvHex() {
            return ivHex;
        }

        public String getKeyVersion() {
            return keyVersion;
        }

        public String serialize() {
            return keyVersion + ":" + ivHex + ":" + ciphertextBase64;
        }

        public static EncryptedResult parse(String serialized) {
            if (serialized == null || !serialized.contains(":")) {
                return null;
            }
            String[] parts = serialized.split(":", 3);
            if (parts.length < 3) {
                return null;
            }
            return new EncryptedResult(parts[2], parts[1], parts[0]);
        }
    }

    /**
     * Encrypt plaintext string using AES-256-GCM with optional AAD binding.
     */
    public EncryptedResult encrypt(String plaintext, String aad) {
        if (plaintext == null) {
            return new EncryptedResult("", "", activeKeyVersion);
        }
        try {
            byte[] iv = new byte[IV_BYTE_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, masterSecretKey, gcmSpec);

            if (aad != null && !aad.isBlank()) {
                cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
            }

            byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            String ciphertextBase64 = Base64.getEncoder().encodeToString(encryptedBytes);
            String ivHex = HexFormat.of().formatHex(iv);

            return new EncryptedResult(ciphertextBase64, ivHex, activeKeyVersion);
        } catch (Exception e) {
            logger.error("AES-256-GCM encryption failed", e);
            throw new RuntimeException("Cryptographic encryption failure", e);
        }
    }

    /**
     * Decrypt ciphertext using AES-256-GCM with AAD verification.
     */
    public String decrypt(String ciphertextBase64, String ivHex, String aad) {
        if (ciphertextBase64 == null || ciphertextBase64.isBlank()) {
            return "";
        }
        try {
            byte[] iv = HexFormat.of().parseHex(ivHex);
            byte[] ciphertextBytes = Base64.getDecoder().decode(ciphertextBase64);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, masterSecretKey, gcmSpec);

            if (aad != null && !aad.isBlank()) {
                cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
            }

            byte[] plaintextBytes = cipher.doFinal(ciphertextBytes);
            return new String(plaintextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("AES-256-GCM decryption failed for AAD [{}]", aad, e);
            throw new RuntimeException("Cryptographic decryption failure: Authenticated payload or AAD compromised", e);
        }
    }

    /**
     * Helper to encrypt a string and return a serialized single-string container format.
     */
    public String encryptToString(String plaintext, String aad) {
        return encrypt(plaintext, aad).serialize();
    }

    /**
     * Helper to decrypt a serialized single-string container format.
     */
    public String decryptFromString(String serialized, String aad) {
        EncryptedResult res = EncryptedResult.parse(serialized);
        if (res == null) {
            return serialized; // Return as-is if unencrypted legacy string
        }
        return decrypt(res.getCiphertextBase64(), res.getIvHex(), aad);
    }

    private byte[] parseOrDeriveKey(String hexKey) {
        if (hexKey != null && !hexKey.isBlank()) {
            try {
                byte[] key = HexFormat.of().parseHex(hexKey.trim());
                if (key.length == KEY_BYTE_LENGTH) {
                    return key;
                }
            } catch (Exception ignored) {
            }
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                return digest.digest(hexKey.getBytes(StandardCharsets.UTF_8));
            } catch (NoSuchAlgorithmException e) {
                throw new RuntimeException("SHA-256 unavailable", e);
            }
        }
        return HexFormat.of().parseHex(DEFAULT_DEV_KEY_HEX);
    }
}
