package com.crimelens.audit.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

public class HashChainUtils {

    public static final String GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    /**
     * Compute SHA-256 hash of a string input.
     */
    public static String sha256(String input) {
        if (input == null) {
            input = "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available in JVM", e);
        }
    }

    /**
     * Compute SHA-256 hash of raw byte content (e.g. evidence files/blobs).
     */
    public static String sha256(byte[] data) {
        if (data == null) {
            return sha256("");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(data);
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available in JVM", e);
        }
    }

    /**
     * Produce a deterministic, normalized canonical payload string from key record attributes.
     */
    public static String buildCanonicalPayload(String eventType, String actorId, String caseId,
                                                String evidenceId, String contentHash, String details) {
        StringBuilder sb = new StringBuilder();
        sb.append("action=").append(eventType != null ? eventType.trim() : "").append("|");
        sb.append("actor=").append(actorId != null ? actorId.trim() : "ANONYMOUS").append("|");
        sb.append("case=").append(caseId != null ? caseId.trim() : "NONE").append("|");
        sb.append("evidence=").append(evidenceId != null ? evidenceId.trim() : "NONE").append("|");
        sb.append("contentHash=").append(contentHash != null ? contentHash.trim() : "NONE").append("|");
        sb.append("details=").append(details != null ? details.trim() : "");
        return sb.toString();
    }

    /**
     * Compute the cryptographically linked CurrentHash for a chain record:
     * CurrentHash = SHA-256(CanonicalPayload + "|" + PreviousHash + "|" + SequenceIndex + "|" + EpochMilliTimestamp)
     */
    public static String calculateCurrentHash(String canonicalPayload, String previousHash,
                                               Long sequenceIndex, Instant timestamp) {
        String safePrevHash = (previousHash == null || previousHash.isBlank()) ? GENESIS_PREVIOUS_HASH : previousHash;
        long timeMilli = timestamp != null ? timestamp.toEpochMilli() : 0L;
        String rawToHash = canonicalPayload + "|" + safePrevHash + "|" + sequenceIndex + "|" + timeMilli;
        return sha256(rawToHash);
    }

    /**
     * Format a hex digest string with 0x prefix.
     */
    public static String toBytes32(String hexDigest) {
        if (hexDigest == null) {
            return "0x0000000000000000000000000000000000000000000000000000000000000000";
        }
        String clean = hexDigest.trim();
        if (clean.startsWith("0x") || clean.startsWith("0X")) {
            return clean.toLowerCase();
        }
        return "0x" + clean.toLowerCase();
    }
}
