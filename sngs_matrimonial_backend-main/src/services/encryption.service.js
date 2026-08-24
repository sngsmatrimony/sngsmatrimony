/**
 * Encryption Service using Signal Protocol
 *
 * Note: Full Signal Protocol implementation requires careful key management.
 * For production, consider using a dedicated Signal Protocol library with proper session management.
 * This is a simplified implementation for demonstration.
 */

const crypto = require('crypto');

/**
 * Generate a keypair (public and private key)
 * @returns {Object} { publicKey, privateKey } both base64 encoded
 */
exports.generateKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64'),
  };
};

/**
 * Generate pre-keys (one-time use keys)
 * @param {number} count - Number of pre-keys to generate
 * @returns {Array} Array of pre-keys
 */
exports.generatePreKeys = (count = 100) => {
  const preKeys = [];

  for (let i = 0; i < count; i++) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    preKeys.push({
      keyId: i,
      publicKey: Buffer.from(publicKey).toString('base64'),
      privateKey: Buffer.from(privateKey).toString('base64'),
      used: false,
    });
  }

  return preKeys;
};

/**
 * Generate a signed pre-key
 * @param {string} identityPrivateKey - Base64 encoded identity private key
 * @param {number} keyId - Key ID
 * @returns {Object} Signed pre-key object
 */
exports.generateSignedPreKey = (identityPrivateKey, keyId = 0) => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Sign the public key with the identity key
  const identityKey = crypto.createPrivateKey(
    Buffer.from(identityPrivateKey, 'base64').toString()
  );

  const sign = crypto.createSign('sha256');
  sign.update(Buffer.from(publicKey));
  const signature = sign.sign(identityKey, 'base64');

  return {
    keyId,
    publicKey: Buffer.from(publicKey).toString('base64'),
    privateKey: Buffer.from(privateKey).toString('base64'),
    signature,
    timestamp: new Date(),
  };
};

/**
 * Encrypt a message using RSA (simplified E2EE)
 * In production, use Signal Protocol's actual encryption method
 * @param {string} message - Plain text message
 * @param {string} publicKeyBase64 - Base64 encoded public key
 * @returns {string} Base64 encoded encrypted message
 */
exports.encryptMessage = (message, publicKeyBase64) => {
  try {
    const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString();
    const publicKey = crypto.createPublicKey(publicKeyPem);

    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(message)
    );

    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(`Message encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt a message using RSA (simplified E2EE)
 * In production, use Signal Protocol's actual decryption method
 * @param {string} encryptedMessageBase64 - Base64 encoded encrypted message
 * @param {string} privateKeyBase64 - Base64 encoded private key
 * @returns {string} Decrypted plain text message
 */
exports.decryptMessage = (encryptedMessageBase64, privateKeyBase64) => {
  try {
    const privateKeyPem = Buffer.from(privateKeyBase64, 'base64').toString();
    const privateKey = crypto.createPrivateKey(privateKeyPem);

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedMessageBase64, 'base64')
    );

    return decrypted.toString();
  } catch (error) {
    throw new Error(`Message decryption failed: ${error.message}`);
  }
};

/**
 * Verify a signature
 * @param {string} message - Original message
 * @param {string} signatureBase64 - Base64 encoded signature
 * @param {string} publicKeyBase64 - Base64 encoded public key
 * @returns {boolean} True if signature is valid
 */
exports.verifySignature = (message, signatureBase64, publicKeyBase64) => {
  try {
    const publicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString();
    const publicKey = crypto.createPublicKey(publicKeyPem);

    const verify = crypto.createVerify('sha256');
    verify.update(Buffer.from(message));

    return verify.verify(
      publicKey,
      Buffer.from(signatureBase64, 'base64')
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

/**
 * Create a hash of data
 * @param {string} data - Data to hash
 * @returns {string} Base64 encoded hash
 */
exports.hashData = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('base64');
};

/**
 * Initialize user's Signal Protocol context
 * @returns {Object} User's initial keys for Signal Protocol
 */
exports.initializeUserKeys = () => {
  const identityKeyPair = this.generateKeyPair();
  const preKeys = this.generatePreKeys(100);
  const signedPreKey = this.generateSignedPreKey(
    identityKeyPair.privateKey,
    0
  );

  return {
    identityKeyPair,
    preKeys,
    signedPreKey,
  };
};

/**
 * Note on Signal Protocol Implementation:
 *
 * This service provides basic cryptographic operations. For a production
 * Signal Protocol implementation, you should:
 *
 * 1. Use @privacyresearch/libsignal-protocol-typescript for full protocol support
 * 2. Implement proper session management (Double Ratchet Algorithm)
 * 3. Handle pre-key bundles correctly
 * 4. Implement chain keys and message keys
 * 5. Maintain session state securely
 * 6. Use proper key derivation functions (KDF)
 *
 * Example usage with libsignal:
 *
 * const libsignal = require('@privacyresearch/libsignal-protocol-typescript');
 *
 * // Generate keys
 * const identityKeyPair = await libsignal.generateIdentityKeyPair();
 * const registrationId = libsignal.generateRegistrationId();
 * const preKeys = await libsignal.generatePreKeys(0, 100);
 * const signedPreKey = await libsignal.generateSignedPreKey(identityKeyPair, 0);
 *
 * // For message encryption/decryption, use SessionCipher from libsignal
 */
