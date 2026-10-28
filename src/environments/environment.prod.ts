// Entorno de PRODUCCIÓN
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE: NO hardcodear el Client ID aquí directamente en el repositorio.
// Opciones recomendadas para producción:
//   1. CI/CD injection: reemplazar el valor en el pipeline de build.
//   2. Variables de entorno en el servidor: leerlas con un endpoint seguro.
//   3. Angular build tokens: usar `--define` en el build de producción.
//
// Ejemplo con GitHub Actions / Jenkins:
//   sed -i "s|GOOGLE_CLIENT_ID_PLACEHOLDER|${{ secrets.GOOGLE_CLIENT_ID }}|g" src/environments/environment.prod.ts
export const environment = {
  production: true,
  /**
   * Reemplazar 'GOOGLE_CLIENT_ID_PLACEHOLDER' con el Client ID real
   * mediante el pipeline de CI/CD o script de build, nunca en el código fuente.
   */
  googleClientId: '',
};
