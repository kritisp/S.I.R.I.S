/**
 * S.I.R.I.S. — Entity Normalizer
 *
 * Provides canonical entity normalization for use in the frontend before
 * API calls, ensuring deduplication consistency with the Python backend.
 *
 * Rules enforce entity deduplication: two phones in different formats must hash to the
 * same normalized value, or they become two separate graph nodes.
 */

// ─── Phone ────────────────────────────────────────────────────────────────────

/**
 * Strips +91/0/91 prefix and returns 10-digit Indian mobile number.
 * "+91 98765-43210" → "9876543210"
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
  // Last resort: take trailing 10 digits
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

// ─── UPI ─────────────────────────────────────────────────────────────────────

/**
 * Normalizes UPI IDs to lowercase.
 * "Rahul123@Paytm" → "rahul123@paytm"
 */
export function normalizeUPI(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// ─── Email ───────────────────────────────────────────────────────────────────

export function normalizeEmail(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// ─── EVM Wallet ──────────────────────────────────────────────────────────────

/**
 * Lowercases the wallet address (preserving 0x prefix).
 * "0x4A2b..." → "0x4a2b..."
 */
export function normalizeWallet(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// ─── Bank Account ────────────────────────────────────────────────────────────

/**
 * Strips all non-digit characters.
 * "32118 638 954" → "32118638954"
 */
export function normalizeBankAccount(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

// ─── Person ──────────────────────────────────────────────────────────────────

/**
 * Lowercase trim; does NOT strip spaces (names need them for identity).
 * "VIKRAM RATHORE" → "vikram rathore"
 */
export function normalizePerson(raw: string): string {
  return (raw || '').trim().toLowerCase();
}

// ─── IP Address ──────────────────────────────────────────────────────────────

export function normalizeIP(raw: string): string {
  return (raw || '').trim();
}

// ─── Telegram Handle ─────────────────────────────────────────────────────────

/**
 * Strips leading @, lowercases.
 * "@Vikram_ops" → "vikram_ops"
 */
export function normalizeTelegram(raw: string): string {
  return (raw || '').replace(/^@/, '').trim().toLowerCase();
}

// ─── Dispatch ────────────────────────────────────────────────────────────────

/**
 * Dispatch function — call with entity type and raw value.
 *
 * @example
 *   normalize('PHONE', '+91 98765 43210')   // "9876543210"
 *   normalize('UPI', 'Rahul123@Paytm')       // "rahul123@paytm"
 *   normalize('WALLET', '0x4A2b...')          // "0x4a2b..."
 */
export function normalize(entityType: string, raw: string): string {
  switch ((entityType || '').toUpperCase()) {
    case 'PHONE':        return normalizePhone(raw);
    case 'UPI':          return normalizeUPI(raw);
    case 'EMAIL':        return normalizeEmail(raw);
    case 'WALLET':       return normalizeWallet(raw);
    case 'BANK_ACCOUNT': return normalizeBankAccount(raw);
    case 'PERSON':       return normalizePerson(raw);
    case 'IP':           return normalizeIP(raw);
    case 'TELEGRAM':     return normalizeTelegram(raw);
    default:             return (raw || '').trim().toLowerCase();
  }
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** Returns true if the string looks like a valid 10-digit Indian mobile. */
export function isValidIndianPhone(raw: string): boolean {
  const norm = normalizePhone(raw);
  return /^[6-9]\d{9}$/.test(norm);
}

/** Returns true if the string looks like a UPI ID. */
export function isValidUPI(raw: string): boolean {
  return /^[A-Za-z0-9._-]{2,}@[A-Za-z][A-Za-z0-9]{1,}$/.test((raw || '').trim());
}

/** Returns true if the string looks like an EVM wallet address. */
export function isValidWallet(raw: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test((raw || '').trim());
}

/** Returns true if the string looks like an Indian bank account number (11–18 digits). */
export function isValidBankAccount(raw: string): boolean {
  const digits = normalizeBankAccount(raw);
  return digits.length >= 11 && digits.length <= 18;
}
