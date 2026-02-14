import 'server-only';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes (64 hex characters)
const IV_LENGTH = 16; // AES block size

function getKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypts a string.
 * Returns in format: "iv:encryptedText" (hex encoded)
 */
export function encrypt(text: string): string {
  if (!text) return text;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts a string.
 * Expects format: "iv:encryptedText" (hex encoded)
 * If format doesn't match, returns existing text (graceful fallback for existing plaintext data).
 */
export function decrypt(text: string): string {
  if (!text) return text;

  // Check if text matches encrypted format (iv:content)
  const parts = text.split(':');
  if (parts.length !== 2 || parts[0].length !== IV_LENGTH * 2) {
    // Return original text if not encrypted (graceful migration)
    return text;
  }

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed, returning original text:', error);
    // Return original text on failure to be safe/resilient
    return text;
  }
}
