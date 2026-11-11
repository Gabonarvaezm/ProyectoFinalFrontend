export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  ai: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    apiKey: '', // Clave configurable para peticiones en vivo; si está vacía opera con el motor local mock
    model: 'gemini-1.5-flash',
  },
};
