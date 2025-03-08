export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;

export const APP_NAME = 'Polychat';
export const APP_TAGLINE = 'AI Assistant';
export const CONTACT_LINK = 'https://nicholasgriffin.dev/contact';
export const JURISDICTION = 'United Kingdom';
export const TERMS_EFFECTIVE_DATE = 'March 8, 2025';
export const PRIVACY_EFFECTIVE_DATE = 'March 8, 2025';
export const API_BASE_URL = ENVIRONMENT === 'production' ? "https://api.polychat.app" : "http://localhost:8787";
export const CHATS_QUERY_KEY = 'chats';