/**
 * Constantes centralizadas para autenticación, validación y rutas del sistema.
 * Clean Data Standard - Cero Magic Strings ni Números Mágicos.
 */

export const AUTH_ROUTES = {
  PROFESSOR: '/profesor',
  STUDENT: '/estudiante',
  HOME: '/',
  LOGIN: '/login',
  FORO: '/foro',
} as const;

export const AUTH_TIMERS = {
  LOGIN_REDIRECT_DELAY_MS: 1200,
  REGISTER_SIMULATION_MS: 1200,
  REGISTER_REDIRECT_DELAY_MS: 1500,
  TOAST_DISPLAY_MS: 3000,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_STRONG_MIN_LENGTH: 8,
} as const;

export const VALIDATION_REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  FULL_NAME: /^[\p{L}\s]+$/u,
  PASSWORD_SECURE: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
} as const;

export const AUTH_MESSAGES = {
  REQUIRED_EMAIL: 'El correo electrónico es requerido',
  REQUIRED_PASSWORD: 'La contraseña es requerida',
  INVALID_EMAIL_FORMAT: 'Ingresa un correo válido (ej: estudiante@universidad.edu)',
  INVALID_PASSWORD_MIN_LENGTH: (min: number): string =>
    `La contraseña debe contener al menos ${min} caracteres`,
  FORM_INCOMPLETE: 'Por favor, completa correctamente los campos obligatorios.',
  LOGIN_SUCCESS_PROFESSOR: '¡Acceso concedido! Redirigiendo a tu panel docente...',
  LOGIN_SUCCESS_STUDENT: '¡Acceso concedido! Redirigiendo a tu espacio de estudio...',
  LOGIN_SUCCESS_DEFAULT: '¡Acceso concedido! Redirigiendo...',
  LOGIN_FAILED: 'Credenciales no válidas o usuario no registrado.',
  PASSWORD_RESET_SENT: (email: string): string =>
    `Se ha enviado un enlace de recuperación a ${email}`,
  PASSWORD_RESET_PROMPT:
    'Ingresa tu correo en el formulario para solicitar la recuperación.',
} as const;

