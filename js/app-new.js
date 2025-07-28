/**
 * Listado de Materias Application
 * Main application for subject listing and search functionality
 */

import { PROFILE_CONFIG } from './config.js';

class ListadoApp {
  constructor() {
    this.allSubjects = [];
    this.profiles = {};
    this.filteredSubjects = [];
    this.currentFilters = {
      search: '',
      semestre: '',
      creditos: '',
      perfil: '',
      emphasis: '',
      dictationSemester: 'all',
      examOnly: 'all'
    };
    
    // Use imported profile configuration
    this.PROFILE_CONFIG = PROFILE_CONFIG;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Loading application data...');
      await this.loadData();
      console.log('Data loaded successfully', {
        subjects: this.allSubjects.length,
        profiles: Object.keys(this.profiles)
      });
      
      this.setupEventListeners();
      this.initializeUI();
      this.applyFilters();
      
      console.log('Listado application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('Error al cargar los datos de las materias.');
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
    console.log('Loaded subjects:', this.allSubjects.length);

    // Load all profiles
    await this.loadAllProfiles();
  }

  /**
   * Load all profile data
   */
  async loadAllProfiles() {
    const profilePromises = Object.entries(this.PROFILE_CONFIG).map(async ([name, config]) => {
      try {
        const response = await fetch(config.file);
        if (!response.ok) {
          console.warn(`Failed to load profile ${name}`);
          return;
        }
        this.profiles[name] = await response.json();
        console.log(`Loaded profile: ${name}`);
      } catch (error) {
        console.warn(`Error loading profile ${name}:`, error);
      }
    });

    await Promise.all(profilePromises);
    console.log('All profiles loaded:', Object.keys(this.profiles));
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    this.populateProfileSelector();
    this.populateCreditOptions();
    this.updateQuickStats();
  }

  /**
   * Populate profile selector with loaded profiles
   */
  populateProfileSelector() {
    const profileSelect = document.getElementById('perfil');
    if (!profileSelect) return;

    // Clear existing options except the first one
    profileSelect.innerHTML = '<option value="">Todos los perfiles</option>';

    // Add profile options
    Object.keys(this.PROFILE_CONFIG).forEach(profileName => {
      const option = document.createElement('option');
      option.value = profileName;
      option.textContent = profileName;
      profileSelect.appendChild(option);
    });
  }

  /**
   * Populate credit options based on available subjects
   */
  populateCreditOptions() {
    const creditSelect = document.getElementById('creditos');
    if (!creditSelect) return;

    // Get unique credit values from subjects
    const credits = [...new Set(this.allSubjects.map(s => s.creditos))].sort((a, b) => a - b);
    
    // Clear existing options except the first one
    const firstOption = creditSelect.querySelector('option[value=""]');
    creditSelect.innerHTML = '';
    if (firstOption) {
      creditSelect.appendChild(firstOption);
    }

    // Add credit options
    credits.forEach(credit => {
      const option = document.createElement('option');
      option.value = credit;
      option.textContent = credit;
      creditSelect.appendChild(option);
    });
  }

  /**
   * Setup event listeners for all filters
   */
  setupEventListeners() {
    // Search input with debouncing for better performance
    const searchInput = document.getElementById('search');
    const clearBtn = document.getElementById('clear-search');
    
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentFilters.search = e.target.value.toLowerCase();
          this.applyFilters();
          
          // Show/hide clear button
          if (clearBtn) {
            clearBtn.style.display = e.target.value ? 'block' : 'none';
          }
        }, 300); // Debounce for 300ms
      });

      // Clear search button
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          this.currentFilters.search = '';
          clearBtn.style.display = 'none';
          this.applyFilters();
          searchInput.focus();
        });
      }

      // Focus search on '/' key press
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          e.preventDefault();
          searchInput.focus();
        }
        // Clear search on Escape
        if (e.key === 'Escape' && e.target === searchInput) {
          searchInput.value = '';
          this.currentFilters.search = '';
          if (clearBtn) clearBtn.style.display = 'none';
          this.applyFilters();
        }
      });
    }

    // Semester filter
    const semestreSelect = document.getElementById('semestre');
    if (semestreSelect) {
      semestreSelect.addEventListener('change', (e) => {
        this.currentFilters.semestre = e.target.value;
        this.applyFilters();
      });
    }

    // Credits filter
    const creditosSelect = document.getElementById('creditos');
    if (creditosSelect) {
      creditosSelect.addEventListener('change', (e) => {
        this.currentFilters.creditos = e.target.value;
        this.applyFilters();
      });
    }

    // Exam only filter
    const examOnlySelect = document.getElementById('examOnly');
    if (examOnlySelect) {
      examOnlySelect.addEventListener('change', (e) => {
        this.currentFilters.examOnly = e.target.value;
        this.applyFilters();
      });
    }

    // Profile filter
    const perfilSelect = document.getElementById('perfil');
    if (perfilSelect) {
      perfilSelect.addEventListener('change', (e) => {
        this.currentFilters.perfil = e.target.value;
        this.updateEmphasisSelector(e.target.value);
        this.applyFilters();
      });
    }

    // Emphasis filter
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      emphasisSelect.addEventListener('change', (e) => {
        this.currentFilters.emphasis = e.target.value;
        this.applyFilters();
      });
    }

    // Dictation semester filter
    const dictationSelect = document.getElementById('dictationSemester');
    if (dictationSelect) {
      dictationSelect.addEventListener('change', (e) => {
        this.currentFilters.dictationSemester = e.target.value;
        this.applyFilters();
      });
    }
  }

  /**
   * Update quick stats display
   */
  updateQuickStats() {
    const quickStats = document.getElementById('quickStats');
    if (!quickStats) return;

    const totalSubjects = this.allSubjects.length;
    const totalCredits = this.allSubjects.reduce((sum, subject) => sum + (subject.creditos || 0), 0);
    const examOnlyCount = this.allSubjects.filter(s => s.exam_only).length;
    const curricularCount = totalSubjects - examOnlyCount;

    document.getElementById('totalSubjectsCount').textContent = totalSubjects;
    document.getElementById('totalCreditsCount').textContent = totalCredits;
    document.getElementById('examOnlyCount').textContent = examOnlyCount;
    document.getElementById('curricularCount').textContent = curricularCount;

    quickStats.style.display = 'block';
  }

  /**
   * Update emphasis selector based on selected profile
   */
  updateEmphasisSelector(profileName) {
    const emphasisSelect = document.getElementById('emphasis');
    if (!emphasisSelect) return;

    // Clear emphasis filter
    this.currentFilters.emphasis = '';
    
    // Clear existing options
    emphasisSelect.innerHTML = '';

    if (!profileName) {
      emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
      emphasisSelect.disabled = true;
      return;
    }

    const config = this.PROFILE_CONFIG[profileName];
    if (config && config.hasEmphasis && config.emphasis) {
      emphasisSelect.disabled = false;
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Todos los énfasis';
      emphasisSelect.appendChild(defaultOption);

      // Add emphasis options
      config.emphasis.forEach(emphasis => {
        const option = document.createElement('option');
        option.value = emphasis;
        option.textContent = emphasis;
        emphasisSelect.appendChild(option);
      });
    } else {
      emphasisSelect.innerHTML = '<option value="">No hay énfasis para este perfil</option>';
      emphasisSelect.disabled = true;
    }
  }

  /**
   * Apply all current filters and update the display
   */
  applyFilters() {
    let filtered = [...this.allSubjects];

    // Apply search filter
    if (this.currentFilters.search) {
      const searchTerm = this.currentFilters.search;
      filtered = filtered.filter(subject => 
        (subject.nombre && subject.nombre.toLowerCase().includes(searchTerm)) ||
        (subject.codigo && subject.codigo.toLowerCase().includes(searchTerm))
      );
    }

    // Apply semester filter
    if (this.currentFilters.semestre) {
      filtered = filtered.filter(subject => 
        subject.semestre && String(subject.semestre) === this.currentFilters.semestre
      );
    }

    // Apply credits filter
    if (this.currentFilters.creditos) {
      filtered = filtered.filter(subject => 
        subject.creditos && String(subject.creditos) === this.currentFilters.creditos
      );
    }

    // Apply exam only filter
    if (this.currentFilters.examOnly !== 'all') {
      const isExamOnly = this.currentFilters.examOnly === 'true';
      filtered = filtered.filter(subject => subject.exam_only === isExamOnly);
    }

    // Apply dictation semester filter
    if (this.currentFilters.dictationSemester !== 'all') {
      filtered = filtered.filter(subject => {
        const dictation = subject.dictation_semester;
        if (this.currentFilters.dictationSemester === 'both') {
          return dictation === 'both';
        } else if (this.currentFilters.dictationSemester === '1') {
          return dictation === '1' || dictation === 'both';
        } else if (this.currentFilters.dictationSemester === '2') {
          return dictation === '2' || dictation === 'both';
        }
        return true;
      });
    }

    // Apply profile filter
    if (this.currentFilters.perfil) {
      filtered = filtered.filter(subject => 
        this.isSubjectInProfile(subject.codigo, this.currentFilters.perfil, this.currentFilters.emphasis)
      );
    }

    this.filteredSubjects = filtered;
    console.log(`Filtered ${filtered.length} subjects from ${this.allSubjects.length} total`);
    this.renderSubjects();
    this.updateCount();
  }

  /**
   * Check if a subject belongs to a profile (and optionally emphasis)
   */
  isSubjectInProfile(subjectCode, profileName, emphasisName = null) {
    const profile = this.profiles[profileName];
    if (!profile) return false;

    // Check if subject is in any of the profile's subject lists
    const inCore = profile.materias_core && profile.materias_core.includes(subjectCode);
    const inOptional = profile.materias_optativas && profile.materias_optativas.includes(subjectCode);
    const inSuggested = profile.materias_sugeridas && profile.materias_sugeridas.includes(subjectCode);
    
    let inProfile = inCore || inOptional || inSuggested;

    // If emphasis is specified, also check emphasis-specific subjects
    if (emphasisName && profile.emphasis) {
      const emphasisData = profile.emphasis.find(e => e.nombre === emphasisName);
      if (emphasisData) {
        const inEmphasisCore = emphasisData.materias_core && emphasisData.materias_core.includes(subjectCode);
        const inEmphasisOptional = emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subjectCode);
        const inEmphasisSuggested = emphasisData.materias_sugeridas && emphasisData.materias_sugeridas.includes(subjectCode);
        
        inProfile = inProfile || inEmphasisCore || inEmphasisOptional || inEmphasisSuggested;
      }
    }

    return inProfile;
  }

  /**
   * Get subjects that have this subject as a prerequisite
   */
  getRelatedSubjects(subjectCode) {
    const relatedSubjects = this.allSubjects.filter(subject => {
      if (!subject.Previas || subject.Previas.length === 0) return false;
      
      return subject.Previas.some(prereq => {
        if (typeof prereq === 'string') {
          return prereq === subjectCode;
        } else if (prereq.codigo) {
          return prereq.codigo === subjectCode;
        }
        return false;
      });
    });

    if (relatedSubjects.length === 0) {
      return '<span class="no-related">No habilita directamente otras materias</span>';
    }

    const relatedItems = relatedSubjects.slice(0, 5).map(related => `
      <div class="related-item">
        <span class="related-code">${related.codigo}</span>
        <span class="related-name">${related.nombre}</span>
        ${related.semestre ? `<span class="related-semester">Sem. ${related.semestre}</span>` : ''}
      </div>
    `).join('');

    const moreText = relatedSubjects.length > 5 ? 
      `<div class="more-related">Y ${relatedSubjects.length - 5} materias más...</div>` : '';

    return `<div class="related-list">${relatedItems}${moreText}</div>`;
  }

  /**
   * Get subject classification within a profile
   */
  getSubjectClassification(subjectCode, profileName, emphasisName = null) {
    const profile = this.profiles[profileName];
    if (!profile) return null;

    // Check profile-level classifications
    if (profile.materias_core && profile.materias_core.includes(subjectCode)) {
      return 'core';
    }
    if (profile.materias_optativas && profile.materias_optativas.includes(subjectCode)) {
      return 'opcional';
    }
    if (profile.materias_sugeridas && profile.materias_sugeridas.includes(subjectCode)) {
      return 'sugerida';
    }

    // Check emphasis-level classifications
    if (emphasisName && profile.emphasis) {
      const emphasisData = profile.emphasis.find(e => e.nombre === emphasisName);
      if (emphasisData) {
        if (emphasisData.materias_core && emphasisData.materias_core.includes(subjectCode)) {
          return 'core';
        }
        if (emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subjectCode)) {
          return 'opcional';
        }
        if (emphasisData.materias_sugeridas && emphasisData.materias_sugeridas.includes(subjectCode)) {
          return 'sugerida';
        }
      }
    }

    return null;
  }

  /**
   * Render the filtered subjects
   */
  renderSubjects() {
    const grid = document.getElementById('grid');
    if (!grid) return;

    if (this.filteredSubjects.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <h3>No se encontraron materias</h3>
          <p>Intenta ajustar los filtros de búsqueda.</p>
        </div>
      `;
      return;
    }

    const html = this.filteredSubjects.map(subject => this.createSubjectCard(subject)).join('');
    grid.innerHTML = html;
  }

  /**
   * Create HTML for a subject card
   */
  createSubjectCard(subject) {
    const prerequisitesText = this.getPrerequisitesText(subject);
    const dictationText = this.getDictationSemesterText(subject.dictation_semester);
    const examOnlyText = subject.exam_only ? 'Materia libre' : 'Materia curricular';
    const profileTags = this.getProfileTags(subject.codigo);

    return `
      <article class="subject-card" data-subject-code="${subject.codigo}">
        <div class="subject-header">
          <h3 class="subject-title">${subject.nombre || 'Nombre no disponible'}</h3>
          <div class="subject-code">${subject.codigo || 'Código no disponible'}</div>
        </div>
        
        <div class="subject-meta">
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-icon">📊</span>
              <div>
                <span class="meta-label">Créditos:</span>
                <span class="meta-value">${subject.creditos || 'No especificado'}</span>
              </div>
            </div>
            
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <div>
                <span class="meta-label">Dictado:</span>
                <span class="meta-value">${dictationText}</span>
              </div>
            </div>
            
            <div class="meta-item">
              <span class="meta-icon">${subject.exam_only ? '📝' : '🎓'}</span>
              <div>
                <span class="meta-label">Modalidad:</span>
                <span class="meta-value ${subject.exam_only ? 'exam-only' : 'curricular'}">${examOnlyText}</span>
              </div>
            </div>
            
            ${subject.semestre ? `
              <div class="meta-item">
                <span class="meta-icon">🗓️</span>
                <div>
                  <span class="meta-label">Semestre sugerido:</span>
                  <span class="meta-value">${subject.semestre}</span>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="prerequisites-section">
          <div class="prereq-header">
            <span class="meta-icon">🔗</span>
            <span class="section-title">Previas</span>
          </div>
          <div class="prereq-content">
            ${prerequisitesText}
          </div>
        </div>

        ${profileTags ? `
          <div class="profile-tags">
            <div class="tags-header">
              <span class="meta-icon">🏷️</span>
              <span class="section-title">Relevancia por perfil</span>
            </div>
            <div class="tags-content">
              ${profileTags}
            </div>
          </div>
        ` : ''}
      </article>
    `;
  }

  /**
   * Get formatted prerequisites text
   */
  getPrerequisitesText(subject) {
    if (!subject.Previas || subject.Previas.length === 0) {
      return '<span class="no-prereq">Sin Previas</span>';
    }

    const prereqItems = subject.Previas.map(prereq => {
      if (typeof prereq === 'string') {
        return `<span class="prereq-item simple">${prereq}</span>`;
      } else if (prereq.codigo) {
        const prereqSubject = this.allSubjects.find(s => s.codigo === prereq.codigo);
        const subjectName = prereqSubject ? prereqSubject.nombre : 'Materia no encontrada';
        
        let requirementType = '';
        let requirementClass = '';
        if (prereq.requiere_exoneracion) {
          requirementType = 'Exoneración requerida';
          requirementClass = 'exon-required';
        } else if (prereq.requiere_curso) {
          requirementType = 'Curso aprobado requerido';
          requirementClass = 'course-required';
        } else {
          requirementType = 'Aprobada';
          requirementClass = 'approved-required';
        }
        
        return `
          <div class="prereq-item detailed ${requirementClass}">
            <div class="prereq-main">
              <span class="prereq-code">${prereq.codigo}</span>
              <span class="prereq-name">${subjectName}</span>
            </div>
            <div class="prereq-requirement">${requirementType}</div>
          </div>
        `;
      }
      return '<span class="prereq-item unknown">Prerequisito no válido</span>';
    }).join('');

    return `<div class="prereq-list">${prereqItems}</div>`;
  }

  /**
   * Get formatted dictation semester text
   */
  getDictationSemesterText(dictationSemester) {
    switch (dictationSemester) {
      case 'both': return 'Ambos semestres';
      case '1': return 'Semestres impares';
      case '2': return 'Semestres pares';
      default: return 'No especificado';
    }
  }

  /**
   * Get profile tags for a subject - showing all relevant profiles
   */
  getProfileTags(subjectCode) {
    const tags = [];

    // Check all profiles for this subject
    Object.entries(this.profiles).forEach(([profileName, profileData]) => {
      const classification = this.getSubjectClassificationForProfile(subjectCode, profileName);
      if (classification) {
        const config = this.PROFILE_CONFIG[profileName];
        
        // Add profile tag
        tags.push(`
          <div class="profile-tag-item">
            <span class="profile-name">${profileName}</span>
            <span class="classification-tag ${classification.type}">${classification.label}</span>
            ${classification.emphasis ? `<span class="emphasis-tag">${classification.emphasis}</span>` : ''}
          </div>
        `);
      }
    });

    return tags.length > 0 ? tags.join('') : null;
  }

  /**
   * Get subject classification for a specific profile
   */
  getSubjectClassificationForProfile(subjectCode, profileName) {
    const profile = this.profiles[profileName];
    if (!profile) return null;

    // Check profile-level classifications
    if (profile.materias_core && profile.materias_core.includes(subjectCode)) {
      return { type: 'core', label: 'Obligatoria' };
    }
    if (profile.materias_optativas && profile.materias_optativas.includes(subjectCode)) {
      return { type: 'opcional', label: 'Opcional' };
    }
    if (profile.materias_sugeridas && profile.materias_sugeridas.includes(subjectCode)) {
      return { type: 'sugerida', label: 'Sugerida' };
    }

    // Check emphasis-level classifications
    if (profile.emphasis) {
      for (const emphasisData of profile.emphasis) {
        if (emphasisData.materias_core && emphasisData.materias_core.includes(subjectCode)) {
          return { type: 'core', label: 'Obligatoria', emphasis: emphasisData.nombre };
        }
        if (emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subjectCode)) {
          return { type: 'opcional', label: 'Opcional', emphasis: emphasisData.nombre };
        }
        if (emphasisData.materias_sugeridas && emphasisData.materias_sugeridas.includes(subjectCode)) {
          return { type: 'sugerida', label: 'Sugerida', emphasis: emphasisData.nombre };
        }
      }
    }

    return null;
  }

  /**
   * Update the subjects count display
   */
  updateCount() {
    const countElement = document.getElementById('count');
    if (!countElement) return;

    const total = this.filteredSubjects.length;
    const totalCredits = this.filteredSubjects.reduce((sum, subject) => sum + (subject.creditos || 0), 0);

    countElement.innerHTML = `
      <div class="count-info">
        <span class="count-item">
          <strong>${total}</strong> materia${total !== 1 ? 's' : ''} encontrada${total !== 1 ? 's' : ''}
        </span>
        <span class="count-item">
          <strong>${totalCredits}</strong> créditos totales
        </span>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    const grid = document.getElementById('grid');
    if (grid) {
      grid.innerHTML = `
        <div class="error-message">
          <h3>Error</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="retry-button">
            Reintentar
          </button>
        </div>
      `;
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new ListadoApp();
  await app.init();
});

// Export for potential external use
export { ListadoApp };
