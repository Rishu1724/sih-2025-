/**
 * Blockchain Service
 * Simulates blockchain functionality for assessment verification
 */

/**
 * Generate a random blockchain hash
 * @returns {string} 64-character hexadecimal hash
 */
const generateBlockchainHash = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
};

/**
 * Generate a random transaction ID
 * @returns {string} Transaction ID with 0x prefix
 */
const generateTransactionId = () => {
  const prefix = '0x';
  const characters = '0123456789abcdef';
  let id = prefix;
  for (let i = 0; i < 64; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
};

/**
 * Verify a blockchain hash (simulated)
 * @param {string} hash - The hash to verify
 * @returns {boolean} Whether the hash is valid
 */
const verifyBlockchainHash = (hash) => {
  // In a real implementation, this would check the blockchain
  // For simulation, we just check if it's the right format
  return typeof hash === 'string' && hash.length === 64;
};

/**
 * Verify a transaction ID (simulated)
 * @param {string} transactionId - The transaction ID to verify
 * @returns {boolean} Whether the transaction ID is valid
 */
const verifyTransactionId = (transactionId) => {
  // In a real implementation, this would check the blockchain
  // For simulation, we just check if it's the right format
  return typeof transactionId === 'string' && 
         transactionId.startsWith('0x') && 
         transactionId.length === 66;
};

module.exports = {
  generateBlockchainHash,
  generateTransactionId,
  verifyBlockchainHash,
  verifyTransactionId
};