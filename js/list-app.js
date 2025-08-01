/**
 * List Application - Subject listing and filtering
 * Main entry point for the subject listing/cards view
 */

import { dataManager } from './data-manager.js';
import { UIManager } from './ui.js';
import { SubjectFilter } from './filters.js';
import { getProfileConfig } from './config.js';
import { EnhancedPrerequisiteManager } from './prerequisites.js';

class ListApp {
  constructor() {
    this.uiManager = new UIManager();
    this.subjectFilter = new SubjectFilter();
    this.prerequisiteManager = new EnhancedPrerequisiteManager();
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
      
      // Initialize prerequisite manager with subjects data
      this.prerequisiteManager.init(this.allSubjects);
      
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
    this.currentEmphasis = null; // Reset emphasis when profile changes
    this.profileData = null;
    
    // Update emphasis selector
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      this.uiManager.updateEmphasisSelector(profileName, emphasisSelect);
      emphasisSelect.value = ''; // Reset emphasis selection
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
    this.applyFilters();
  }

  /**
   * Handle emphasis change
   */
  handleEmphasisChange(emphasisName) {
    this.currentEmphasis = emphasisName;
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

    // Start with all subjects
    let filteredSubjects = [...this.allSubjects];

    // Apply search filter
    if (searchQuery) {
      filteredSubjects = this.subjectFilter.filterBySearch(filteredSubjects, searchQuery);
    }

    // Apply credit filter
    const creditSelect = document.getElementById('creditos');
    if (creditSelect && creditSelect.value) {
      filteredSubjects = this.subjectFilter.filterByCredits(filteredSubjects, creditSelect.value);
    }

    // Apply dictation semester filter
    const dictationSelect = document.getElementById('dictationSemester');
    if (dictationSelect && dictationSelect.value !== 'all') {
      filteredSubjects = this.subjectFilter.filterByDictationSemester(filteredSubjects, dictationSelect.value);
    }

    // Apply profile and emphasis filter
    if (this.currentProfile && this.profileData) {
      filteredSubjects = this.filterByProfileAndEmphasis(filteredSubjects);
    }

    this.filteredSubjects = filteredSubjects;

    // Render results
    this.renderSubjects();
    
    // Update results count
    this.uiManager.updateResultsCount(this.allSubjects.length, this.filteredSubjects.length);
  }

  /**
   * Filter subjects by profile and emphasis
   */
  filterByProfileAndEmphasis(subjects) {
    if (!this.profileData) return subjects;

    const profileCodes = new Set();

    // Handle profiles with emphasis
    if (this.profileData.emphasis && Array.isArray(this.profileData.emphasis)) {
      if (this.currentEmphasis) {
        // Filter by specific emphasis
        const emphasisData = this.profileData.emphasis.find(e => e.nombre === this.currentEmphasis);
        if (emphasisData) {
          // Add subjects from emphasis plan
          if (emphasisData.plan_recomendado) {
            Object.values(emphasisData.plan_recomendado).forEach(semesterSubjects => {
              if (Array.isArray(semesterSubjects)) {
                semesterSubjects.forEach(code => profileCodes.add(code));
              }
            });
          }
          // Add core and optional subjects from emphasis
          if (emphasisData.materias_core) {
            emphasisData.materias_core.forEach(code => profileCodes.add(code));
          }
          if (emphasisData.materias_optativas) {
            emphasisData.materias_optativas.forEach(code => profileCodes.add(code));
          }
        }
      } else {
        // Show all subjects from all emphasis
        this.profileData.emphasis.forEach(emphasis => {
          if (emphasis.plan_recomendado) {
            Object.values(emphasis.plan_recomendado).forEach(semesterSubjects => {
              if (Array.isArray(semesterSubjects)) {
                semesterSubjects.forEach(code => profileCodes.add(code));
              }
            });
          }
          if (emphasis.materias_core) {
            emphasis.materias_core.forEach(code => profileCodes.add(code));
          }
          if (emphasis.materias_optativas) {
            emphasis.materias_optativas.forEach(code => profileCodes.add(code));
          }
        });
      }
    } else {
      // Profile without emphasis
      if (this.profileData.plan_recomendado) {
        Object.values(this.profileData.plan_recomendado).forEach(semesterSubjects => {
          if (Array.isArray(semesterSubjects)) {
            semesterSubjects.forEach(code => profileCodes.add(code));
          }
        });
      }
      
      // Add core, optional, and suggested subjects
      if (this.profileData.materias_core) {
        this.profileData.materias_core.forEach(code => profileCodes.add(code));
      }
      if (this.profileData.materias_optativas) {
        this.profileData.materias_optativas.forEach(code => profileCodes.add(code));
      }
      if (this.profileData.materias_sugeridas) {
        this.profileData.materias_sugeridas.forEach(code => profileCodes.add(code));
      }
    }

    // Filter subjects by profile codes
    return subjects.filter(subject => profileCodes.has(subject.codigo));
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

    // Render subject cards directly in the container
    const cardsHTML = this.filteredSubjects.map(subject => 
      this.uiManager.renderSubjectCard(subject, this.profileData)
    ).join('');

    container.innerHTML = cardsHTML;

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
   * Show subject details modal - shows official university prerequisites
   */
  showSubjectDetails(subject) {
    // Format official prerequisites (not user-specific)
    const prereqFormatted = this.uiManager.formatPrerequisites(subject.prerequisites);
    
    // Create a detailed modal focusing on official requirements
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content prerequisite-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>${subject.codigo} - ${subject.nombre}</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <div class="subject-info-section">
            <div>
              <strong>Créditos</strong>
              <span>${subject.creditos}</span>
            </div>
            <div>
              <strong>Dictado</strong>
              <span>${this.uiManager.formatDictationSemester(subject.dictation_semester)}</span>
            </div>
            ${subject.exam_only ? `
              <div>
                <strong>Modalidad</strong>
                <span>Solo examen</span>
              </div>
            ` : ''}
            ${subject.semestre ? `
              <div>
                <strong>Semestre sugerido</strong>
                <span>Sem. ${subject.semestre}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="official-requirements-section">
            <h4>Requisitos oficiales de la universidad</h4>
            ${subject.prerequisites && subject.prerequisites.length > 0 ? `
              <div class="prereq-official">
                <div class="prereq-formatted">${prereqFormatted}</div>
              </div>
              ${this.renderDetailedPrerequisites(subject.prerequisites)}
            ` : `
              <div class="no-prereq-message">
                <p>Esta materia no tiene requisitos previos según el plan de estudios.</p>
              </div>
            `}
          </div>
          
          <div class="modal-footer">
            <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
              Cerrar
            </button>
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
    
    // Close modal on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Render detailed breakdown of prerequisites
   */
  renderDetailedPrerequisites(prerequisites) {
    if (!prerequisites || prerequisites.length === 0) return '';
    
    let html = '<div class="prereq-breakdown"><h5>Desglose detallado</h5><ul class="prereq-detailed-list">';
    
    prerequisites.forEach((req, index) => {
      html += `<li class="prereq-detail-item">`;
      html += `<strong>Requisito ${index + 1}:</strong> `;
      html += this.renderSinglePrerequisiteDetail(req);
      html += `</li>`;
    });
    
    html += '</ul></div>';
    return html;
  }

  /**
   * Render single prerequisite detail
   */
  renderSinglePrerequisiteDetail(requirement) {
    switch (requirement.tipo) {
      case 'SIMPLE':
        return this.renderSimplePrerequisiteDetail(requirement);
      
      case 'OR':
        if (requirement.opciones && requirement.opciones.length > 0) {
          const options = requirement.opciones.map(opt => this.renderSinglePrerequisiteDetail(opt));
          return `Una de las siguientes opciones: ${options.join(' <em>o</em> ')}`;
        }
        return requirement.description || 'Requisito OR';
      
      case 'AND':
        if (requirement.condiciones && requirement.condiciones.length > 0) {
          const conditions = requirement.condiciones.map(cond => this.renderSimplePrerequisiteDetail(cond));
          return `Todas las siguientes: ${conditions.join(' <em>y</em> ')}`;
        }
        return requirement.description || 'Requisito AND';
      
      default:
        return requirement.description || 'Requisito no especificado';
    }
  }

  /**
   * Render simple prerequisite detail
   */
  renderSimplePrerequisiteDetail(requirement) {
    if (!requirement.codigo) {
      return requirement.description || 'Requisito inválido';
    }

    const subject = this.allSubjects.find(s => s.codigo === requirement.codigo);
    const subjectName = subject ? subject.nombre : requirement.codigo;
    
    let typeText = '';
    if (requirement.requiere_curso && requirement.requiere_exoneracion) {
      typeText = ' (aprobar curso y exonerar)';
    } else if (requirement.requiere_exoneracion && !requirement.requiere_curso) {
      typeText = ' (solo exonerar)';
    } else {
      typeText = ' (aprobar curso)';
    }

    return `<span class="prereq-subject">${requirement.codigo}</span> - ${subjectName}${typeText}`;
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
