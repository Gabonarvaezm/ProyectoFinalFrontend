// Entorno de DESARROLLO local
// ─────────────────────────────────────────────────────────────────────────────
// Este archivo NO debe commitearse con valores reales de producción.
// Para el Client ID real de Google, usa environment.prod.ts o variables de CI/CD.
export const environment = {
  production: false,
  /**
   * Google Identity Services Client ID.
   * Obtenerlo en: https://console.cloud.google.com/apis/credentials
   * En desarrollo puedes dejarlo vacío; el componente activará el modo sandbox.
   */
  googleClientId: '',
};
