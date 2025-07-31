/**
 * List Application - Subject listing and filtering
 * Main entry point for the subject listing/cards view
 */

import { dataManager } from './data-manager.js';
import { UIManager } from './ui.js';
import { SubjectFilter } from './filters.js';
import { getProfileConfig } from './config.js';

class ListApp {
  constructor() {
    this.uiManager = new UIManager();
    this.subjectFilter = new SubjectFilter();
    this.allSubjects = [];
    this.filteredSubjects = [];
    this.currentProfile = null;
    this.currentEmphasis = null;
    this.profileData = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Show loading state
      const container = document.getElementById('subjects-container');
      this.uiManager.showLoading(container, 'Cargando materias...');
      
      // Initialize data manager
      await dataManager.init();
      
      // Load subjects data
      await this.loadSubjectsData();
      
      // Initialize UI components
      this.setupUI();
      this.setupEventListeners();
      
      // Initial render
      this.applyFilters();
      
      console.log('List application initialized successfully');
    } catch (error) {
      console.error('Error initializing list application:', error);
      this.showError('Error al cargar los datos. Intente refrescar la página.');
    }
  }

  /**
   * Load subjects data using data manager
   */
  async loadSubjectsData() {
    try {
      this.allSubjects = await dataManager.loadSubjects();
      console.log(`Loaded ${this.allSubjects.length} subjects`);
    } catch (error) {
      console.error('Error loading subjects:', error);
      throw new Error('Failed to load subjects data');
    }
  }

  /**
   * Setup UI components
   */
  setupUI() {
    // Populate profile selector
    const profileSelect = document.getElementById('perfil');
    if (profileSelect) {
      this.uiManager.populateProfileSelector(profileSelect);
    }
    
    // Initialize search functionality
    this.setupSearchInput();
  }

  /**
   * Setup search input with keyboard shortcuts
   */
  setupSearchInput() {
    const searchInput = document.getElementById('search');
    const clearButton = document.getElementById('clear-search');

    if (!searchInput) return;

    // Focus search on '/' key
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
      }
      
      // Clear search on Escape
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        if (clearButton) clearButton.style.display = 'none';
        this.applyFilters();
      }
    });

    // Show/hide clear button
    searchInput.addEventListener('input', () => {
      if (clearButton) {
        clearButton.style.display = searchInput.value ? 'block' : 'none';
      }
      this.applyFilters();
    });

    // Clear button functionality
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        searchInput.focus();
        this.applyFilters();
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Profile selector
    const profileSelect = document.getElementById('perfil');
    if (profileSelect) {
      profileSelect.addEventListener('change', (e) => {
        this.handleProfileChange(e.target.value);
      });
    }

    // Emphasis selector
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      emphasisSelect.addEventListener('change', (e) => {
        this.handleEmphasisChange(e.target.value);
      });
    }

    // Credit filter
    const creditSelect = document.getElementById('creditos');
    if (creditSelect) {
      creditSelect.addEventListener('change', (e) => {
        this.subjectFilter.setCreditFilter(e.target.value);
        this.applyFilters();
      });
    }

    // Dictation semester filter
    const dictationSelect = document.getElementById('dictationSemester');
    if (dictationSelect) {
      dictationSelect.addEventListener('change', (e) => {
        this.subjectFilter.setDictationSemesterFilter(e.target.value);
        this.applyFilters();
      });
    }
  }

  /**
   * Handle profile change
   */
  async handleProfileChange(profileName) {
    this.currentProfile = profileName;
    this.profileData = null;
    
    // Update emphasis selector
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      this.uiManager.updateEmphasisSelector(profileName, emphasisSelect);
    }
    
    // Load profile data if selected
    if (profileName) {
      try {
        const profileConfig = getProfileConfig(profileName);
        if (profileConfig) {
          this.profileData = await dataManager.loadProfile(profileName, profileConfig);
        }
      } catch (error) {
        console.warn(`Could not load profile data for ${profileName}:`, error);
      }
    }
    
    // Update filters and re-render
    this.subjectFilter.setProfileFilter(profileName, this.currentEmphasis);
    this.applyFilters();
  }

  /**
   * Handle emphasis change
   */
  handleEmphasisChange(emphasisName) {
    this.currentEmphasis = emphasisName;
    this.subjectFilter.setProfileFilter(this.currentProfile, emphasisName);
    this.applyFilters();
  }

  /**
   * Apply all filters and render results
   */
  applyFilters() {
    // Get search query
    const searchInput = document.getElementById('search');
    const searchQuery = searchInput ? searchInput.value : '';
    this.subjectFilter.setSearchQuery(searchQuery);

    // Apply filters
    this.filteredSubjects = this.subjectFilter.applyFilters(
      this.allSubjects, 
      null, // We handle profile filtering internally
      this.profileData
    );

    // Render results
    this.renderSubjects();
    
    // Update results count
    this.uiManager.updateResultsCount(this.allSubjects.length, this.filteredSubjects.length);
  }

  /**
   * Render subjects in the container
   */
  renderSubjects() {
    const container = document.getElementById('subjects-container');
    if (!container) return;

    if (this.filteredSubjects.length === 0) {
      this.uiManager.showEmpty(container, 'No se encontraron materias con los filtros aplicados');
      return;
    }

    // Render subject cards
    const cardsHTML = this.filteredSubjects.map(subject => 
      this.uiManager.renderSubjectCard(subject, this.profileData)
    ).join('');

    container.innerHTML = `
      <div class="subjects-grid">
        ${cardsHTML}
      </div>
    `;

    // Add click handlers for subject cards
    this.addSubjectCardHandlers();
  }

  /**
   * Add event handlers to subject cards
   */
  addSubjectCardHandlers() {
    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        const subjectCode = card.dataset.subject;
        this.handleSubjectClick(subjectCode);
      });
    });
  }

  /**
   * Handle subject card click
   */
  handleSubjectClick(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (subject) {
      this.showSubjectDetails(subject);
    }
  }

  /**
   * Show subject details modal or similar
   */
  showSubjectDetails(subject) {
    // Create a simple modal or use existing modal system
    const modal = document.createElement('div');
    modal.className = 'subject-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${subject.codigo} - ${subject.nombre}</h2>
          <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="subject-details">
            <p><strong>Créditos:</strong> ${subject.creditos}</p>
            <p><strong>Semestre:</strong> ${subject.semestre}</p>
            <p><strong>Dictado:</strong> ${this.uiManager.formatDictationSemester(subject.dictation_semester)}</p>
            ${subject.exam_only ? '<p><strong>Modalidad:</strong> Solo examen</p>' : ''}
            ${subject.prerequisites && subject.prerequisites.length > 0 ? 
              `<p><strong>Prerequisitos:</strong> ${subject.prerequisites.length} requisitos</p>` : 
              '<p><strong>Prerequisitos:</strong> Ninguno</p>'
            }
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show error message
   */
  showError(message) {
    const container = document.getElementById('subjects-container');
    if (container) {
      this.uiManager.showError(container, message);
    } else {
      console.error(message);
      alert(message);
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new ListApp();
  await app.init();
});

// Export for potential external use
export { ListApp };
