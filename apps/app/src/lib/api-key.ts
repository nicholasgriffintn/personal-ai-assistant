import { AES, enc } from 'crypto-js';

const STORAGE_KEY = 'encrypted_api_key';
const ENCRYPTION_KEY = 'assistant_app_' + window.location.hostname;

export const apiKeyService = {
  setApiKey: (apiKey: string): void => {
    try {
      const encrypted = AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error storing API key:', error);
      throw new Error('Failed to store API key securely');
    }
  },

  getApiKey: (): string | null => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return null;
      
      const decrypted = AES.decrypt(encrypted, ENCRYPTION_KEY);
      return decrypted.toString(enc.Utf8);
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  },

  removeApiKey: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  },

  validateApiKey: (apiKey: string): boolean => {
    return typeof apiKey === 'string' && 
           apiKey.length >= 32 && 
           apiKey.length <= 256 &&
           /^[a-zA-Z0-9_-]+$/.test(apiKey);
  }
}; 