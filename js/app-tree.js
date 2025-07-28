/**
 * Main application entry point - uses TreeViewManager
 * Simple and focused on the tree view functionality
 */

import { TreeViewManager } from './tree-view-manager.js';

class MaterialsApp {
  constructor() {
    this.treeViewManager = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Create and initialize the tree view manager
      this.treeViewManager = new TreeViewManager();
      await this.treeViewManager.init();
      
      console.log('Materials application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('Error al inicializar la aplicación. Verifique la consola para más detalles.');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const container = document.getElementById('tree') || document.body;
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #dc2626; background-color: #fef2f2; border-radius: 8px; margin: 20px;">
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reintentar
        </button>
      </div>
    `;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new MaterialsApp();
  await app.init();
  
  // Make toggleSubjectApproval globally accessible
  window.toggleSubjectApproval = (subjectCode) => {
    if (app.treeViewManager) {
      app.treeViewManager.toggleSubjectApproval(subjectCode);
    }
  };
});

// Export for potential external use
export { MaterialsApp };
