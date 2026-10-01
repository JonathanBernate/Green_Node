/**
 * Utilidades de validación reutilizables.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string, minLength = 6): boolean {
  return password.length >= minLength;
}

export function isValidName(name: string, minLength = 2): boolean {
  return name.trim().length >= minLength;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
