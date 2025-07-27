/**
 * Main application module for Materias Eléctrica
 * Clean, modular architecture for easy maintenance and extension
 */

import { ProfileManager } from './profile-manager.js';
import { UIManager } from './ui-manager.js';
import { SubjectFilter } from './subject-filter.js';

class MateriasElectricaApp {
  constructor() {
    this.allSubjects = [];
    this.profileManager = new ProfileManager();
    this.uiManager = new UIManager(this.profileManager);
    this.subjectFilter = new SubjectFilter(this.profileManager);
    
    // UI Elements
    this.elements = {
      search: null,
      semester: null,
      credits: null,
      profile: null,
      emphasis: null,
      dictationSemester: null,
      tableViewLink: null,
      grid: null,
      count: null
    };
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      await this.loadData();
      this.initializeUI();
      this.setupEventListeners();
      this.render();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('No se pudieron cargar los datos. ¿Están los archivos y los paths correctos?');
    }
  }

  /**
   * Load all necessary data
   */
  async loadData() {
    // Load subjects data
    const ucsResponse = await fetch('data/ucs.json');
    if (!ucsResponse.ok) {
      throw new Error('Failed to load subjects data');
    }
    this.allSubjects = await ucsResponse.json();

    // Load all profiles
    await this.profileManager.loadAllProfiles();
  }

  /**
   * Initialize UI elements
   */
  initializeUI() {
    // Get DOM elements
    this.elements = {
      search: document.getElementById('search'),
      semester: document.getElementById('semestre'),
      credits: document.getElementById('creditos'),
      profile: document.getElementById('perfil'),
      emphasis: document.getElementById('emphasis'),
      dictationSemester: document.getElementById('dictationSemester'),
      tableViewLink: document.getElementById('table-view-link'),
      grid: document.getElementById('grid'),
      count: document.getElementById('count')
    };

    // Initialize profile selector
    this.uiManager.initializeProfileSelector(this.elements.profile);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search and filter events
    if (this.elements.search) {
      this.elements.search.addEventListener('input', () => this.render());
    }

    if (this.elements.semester) {
      this.elements.semester.addEventListener('input', () => this.render());
    }

    if (this.elements.credits) {
      this.elements.credits.addEventListener('input', () => this.render());
    }

    if (this.elements.dictationSemester) {
      this.elements.dictationSemester.addEventListener('change', () => this.render());
    }

    // Profile and emphasis events
    if (this.elements.profile) {
      this.elements.profile.addEventListener('change', () => this.handleProfileChange());
    }

    if (this.elements.emphasis) {
      this.elements.emphasis.addEventListener('change', () => this.handleEmphasisChange());
    }
  }

  /**
   * Handle profile selection change
   */
  handleProfileChange() {
    const selectedProfile = this.elements.profile.value;
    
    this.uiManager.handleProfileChange(
      selectedProfile,
      this.elements.emphasis,
      this.elements.tableViewLink
    );

    this.render();
  }

  /**
   * Handle emphasis selection change
   */
  handleEmphasisChange() {
    const selectedEmphasis = this.elements.emphasis.value;
    this.uiManager.handleEmphasisChange(selectedEmphasis);
    this.render();
  }

  /**
   * Get current filter values
   */
  getCurrentFilters() {
    const selections = this.uiManager.getCurrentSelections();
    
    return {
      search: this.elements.search?.value.toLowerCase() || '',
      semester: this.elements.semester?.value || '',
      credits: this.elements.credits?.value || '',
      dictationSemester: this.elements.dictationSemester?.value || 'all',
      profile: selections.profile,
      emphasis: selections.emphasis
    };
  }

  /**
   * Render the subject list
   */
  render() {
    if (!this.elements.grid) return;

    const filters = this.getCurrentFilters();
    
    // Apply filters
    const filtered = this.subjectFilter.applyFilters(this.allSubjects, filters);
    
    // Sort subjects
    const sorted = this.subjectFilter.sortSubjects(filtered, 'semester');

    // Render subject cards
    this.renderSubjectCards(sorted, filters.profile, filters.emphasis);

    // Update count
    this.updateCount(sorted.length);
  }

  /**
   * Render subject cards
   */
  renderSubjectCards(subjects, selectedProfile, selectedEmphasis) {
    if (!this.elements.grid) return;

    if (subjects.length === 0) {
      this.elements.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">
          No se encontraron materias con los filtros seleccionados.
        </div>`;
      return;
    }

    const cardsHTML = subjects.map(subject => 
      this.uiManager.createSubjectCard(subject, selectedProfile, selectedEmphasis)
    ).join('');

    this.elements.grid.innerHTML = cardsHTML;
  }

  /**
   * Update subject count display
   */
  updateCount(count) {
    if (this.elements.count) {
      this.elements.count.textContent = `${count} materia(s)`;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.grid) {
      this.elements.grid.innerHTML = `
        <p style="color:#b91c1c;">${message}</p>`;
    }
  }

  /**
   * Get application statistics
   */
  getStats() {
    const filters = this.getCurrentFilters();
    const filtered = this.subjectFilter.applyFilters(this.allSubjects, filters);
    return this.subjectFilter.getFilterStats(filtered);
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.materiasApp = new MateriasElectricaApp();
  window.materiasApp.init();
});

// Export for potential external use
export default MateriasElectricaApp;
