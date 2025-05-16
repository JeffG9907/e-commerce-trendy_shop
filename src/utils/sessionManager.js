import { getAuth } from 'firebase/auth';
import { auth } from '../firebase/config';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos

class SessionManager {
  constructor() {
    this.timeoutId = null;
    this.auth = auth;
  }

  resetTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.onInactivity();
    }, TIMEOUT_DURATION);
  }

  onInactivity() {
    // Aquí puedes manejar la inactividad sin cerrar sesión.
    // Ejemplo: Mostrar un mensaje al usuario (sin cerrar sesión).
    console.log('Usuario inactivo durante 30 minutos.');
  }

  init() {
    document.addEventListener('mousemove', () => this.resetTimer());
    document.addEventListener('keypress', () => this.resetTimer());
    this.resetTimer(); // Inicia el temporizador.
  }

  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    document.removeEventListener('mousemove', this.resetTimer);
    document.removeEventListener('keypress', this.resetTimer);
  }
}

export const sessionManager = new SessionManager();