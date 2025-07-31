/**
 * Graph Application - Core initialization and error handling
 */
import { GraphManager } from './graph-manager.js';

class GraphApp {
  constructor() {
    this.graphManager = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.graphManager = new GraphManager();
      await this.graphManager.init();
      
      // Global access for debugging
      window.graphManager = this.graphManager;
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Error al inicializar la aplicación');
    }
  }

  /**
   * Display error message
   */
  showError(message) {
    const container = document.getElementById('tree') || document.body;
    container.innerHTML = `
      <div class="error-container">
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="retry-btn">
          Reintentar
        </button>
      </div>
    `;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new GraphApp().init();
});

export { GraphApp };