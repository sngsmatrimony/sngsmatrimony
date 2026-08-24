/**
 * Encryption Utilities for E2EE Chat
 *
 * This module handles message encryption and decryption using the Web Crypto API.
 * For production use, integrate with proper Signal Protocol implementation.
 */

/**
 * Generate a new RSA key pair
 * @returns {Promise<Object>} { publicKey, privateKey }
 */
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
};

/**
 * Export public key to JWK format for sharing
 * @param {CryptoKey} publicKey - The public key to export
 * @returns {Promise<Object>} JWK representation
 */
export const exportPublicKey = async (publicKey) => {
  return await window.crypto.subtle.exportKey('jwk', publicKey);
};

/**
 * Export private key to JWK format for storage
 * @param {CryptoKey} privateKey - The private key to export
 * @returns {Promise<Object>} JWK representation
 */
export const exportPrivateKey = async (privateKey) => {
  return await window.crypto.subtle.exportKey('jwk', privateKey);
};

/**
 * Import a public key from JWK format
 * @param {Object} jwkPublicKey - JWK representation of public key
 * @returns {Promise<CryptoKey>} Imported public key
 */
export const importPublicKey = async (jwkPublicKey) => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwkPublicKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
};

/**
 * Import a private key from JWK format
 * @param {Object} jwkPrivateKey - JWK representation of private key
 * @returns {Promise<CryptoKey>} Imported private key
 */
export const importPrivateKey = async (jwkPrivateKey) => {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwkPrivateKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
};

/**
 * Encrypt a message with a public key
 * @param {string} message - Plain text message to encrypt
 * @param {CryptoKey} publicKey - The recipient's public key
 * @returns {Promise<string>} Base64 encoded encrypted message
 */
export const encryptMessage = async (message, publicKey) => {
  try {
    const encodedMessage = new TextEncoder().encode(message);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      encodedMessage
    );

    // Convert to Base64 for transmission
    const binaryString = String.fromCharCode(...new Uint8Array(encryptedData));
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Failed to encrypt message: ${error.message}`);
  }
};

/**
 * Decrypt a message with a private key
 * @param {string} encryptedMessageBase64 - Base64 encoded encrypted message
 * @param {CryptoKey} privateKey - The recipient's private key
 * @returns {Promise<string>} Decrypted plain text message
 */
export const decryptMessage = async (encryptedMessageBase64, privateKey) => {
  try {
    // Convert from Base64
    const binaryString = atob(encryptedMessageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      bytes
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt message: ${error.message}`);
  }
};

/**
 * Sign a message with a private key
 * @param {string} message - Message to sign
 * @param {CryptoKey} privateKey - The private key to sign with
 * @returns {Promise<string>} Base64 encoded signature
 */
export const signMessage = async (message, privateKey) => {
  try {
    const encodedMessage = new TextEncoder().encode(message);

    const signature = await window.crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      privateKey,
      encodedMessage
    );

    // Convert to Base64
    const binaryString = String.fromCharCode(...new Uint8Array(signature));
    return btoa(binaryString);
  } catch (error) {
    console.error('Signing failed:', error);
    throw new Error(`Failed to sign message: ${error.message}`);
  }
};

/**
 * Verify a message signature with a public key
 * @param {string} message - Original message
 * @param {string} signatureBase64 - Base64 encoded signature
 * @param {CryptoKey} publicKey - The public key to verify with
 * @returns {Promise<boolean>} True if signature is valid
 */
export const verifyMessageSignature = async (
  message,
  signatureBase64,
  publicKey
) => {
  try {
    const encodedMessage = new TextEncoder().encode(message);

    // Convert from Base64
    const binaryString = atob(signatureBase64);
    const signatureBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      signatureBytes[i] = binaryString.charCodeAt(i);
    }

    const isValid = await window.crypto.subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      publicKey,
      signatureBytes,
      encodedMessage
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {Promise<string>} Base64 encoded hash
 */
export const hashData = async (data) => {
  try {
    const encodedData = new TextEncoder().encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);

    // Convert to Base64
    const binaryString = String.fromCharCode(...new Uint8Array(hashBuffer));
    return btoa(binaryString);
  } catch (error) {
    console.error('Hashing failed:', error);
    throw new Error(`Failed to hash data: ${error.message}`);
  }
};

/**
 * Generate a random string (useful for message IDs, tokens, etc.)
 * @param {number} length - Length of random string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
};

/**
 * Store keys in session storage (for current session only)
 * @param {string} key - Storage key
 * @param {CryptoKey} cryptoKey - The crypto key
 */
export const storeKeyInSession = async (key, cryptoKey) => {
  try {
    const jwk = await exportPrivateKey(cryptoKey);
    sessionStorage.setItem(key, JSON.stringify(jwk));
  } catch (error) {
    console.error('Failed to store key:', error);
  }
};

/**
 * Retrieve key from session storage
 * @param {string} key - Storage key
 * @returns {Promise<CryptoKey|null>} The crypto key or null if not found
 */
export const retrieveKeyFromSession = async (key) => {
  try {
    const jwkString = sessionStorage.getItem(key);
    if (!jwkString) return null;

    const jwk = JSON.parse(jwkString);
    return await importPrivateKey(jwk);
  } catch (error) {
    console.error('Failed to retrieve key:', error);
    return null;
  }
};

export default {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifyMessageSignature,
  hashData,
  generateRandomString,
  storeKeyInSession,
  retrieveKeyFromSession,
};
