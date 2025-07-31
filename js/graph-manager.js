/**
 * GraphManager - Enhanced graph view manager
 * Combines clean architecture with advanced prerequisite handling
 */

import { PROFILE_CONFIG } from './config.js';
import { dataManager } from './data-manager.js';
import { UIManager } from './ui.js';
import { EnhancedPrerequisiteManager } from './prerequisites.js';
import { PrerequisiteUIFeedback } from './ui-feedback.js';

export class GraphManager {
  constructor() {
    this.allSubjects = [];
    this.profiles = {};
    this.approvedSubjects = new Set();
    this.exoneratedSubjects = new Set();
    this.currentProfile = null;
    this.currentEmphasis = null;
    this.uiManager = new UIManager();
    
    // Use imported profile configuration
    this.PROFILE_CONFIG = PROFILE_CONFIG;
    
    // Initialize enhanced components
    this.prerequisiteManager = new EnhancedPrerequisiteManager();
    this.uiFeedback = new PrerequisiteUIFeedback(this.prerequisiteManager);
  }

  /**
   * Initialize the GraphManager with data
   */
  async init() {
    try {
      console.log('Starting GraphManager initialization...');
      
      // Initialize data manager
      console.log('Initializing data manager...');
      await dataManager.init();
      
      console.log('Loading data...');
      await this.loadData();
      
      console.log('Initializing enhanced components...');
      // Initialize enhanced components
      this.prerequisiteManager.init(this.allSubjects);
      this.uiFeedback.init(this.allSubjects);
      
      console.log('Setting up event listeners...');
      this.setupEventListeners();
      
      console.log('Initializing UI...');
      this.initializeUI();
      
      console.log('Loading stored approvals...');
      this.loadStoredApprovals();
      
      console.log('Syncing approval states...');
      // Sync approval states with enhanced manager
      this.syncApprovalStates();
      
      console.log('Rendering...');
      this.render();
      
      console.log('GraphManager initialized successfully');
    } catch (error) {
      console.error('Error initializing GraphManager:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Load all necessary data using data manager
   */
  async loadData() {
    try {
      // Load subjects using data manager
      this.allSubjects = await dataManager.loadSubjects();

      // Load all profiles
      for (const [profileName, config] of Object.entries(this.PROFILE_CONFIG)) {
        try {
          this.profiles[profileName] = await dataManager.loadProfile(profileName, config);
          console.log(`Loaded profile: ${profileName}`);
        } catch (error) {
          console.warn(`Error loading profile ${profileName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Initialize profile selector
    this.initializeProfileSelector();
  }

  /**
   * Initialize profile selector with available profiles
   */
  initializeProfileSelector() {
    const profileSelect = document.getElementById('perfil');
    if (profileSelect) {
      this.uiManager.populateProfileSelector(profileSelect);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Profile selector
    const profileSelect = document.getElementById('perfil');
    if (profileSelect) {
      profileSelect.addEventListener('change', () => this.handleProfileChange());
    }

    // Emphasis selector
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      emphasisSelect.addEventListener('change', () => this.handleEmphasisChange());
    }

    // Filter controls
    const dictationFilter = document.getElementById('dictationSemester');
    if (dictationFilter) {
      dictationFilter.addEventListener('change', () => this.render());
    }

    const creditFilter = document.getElementById('creditFilter');
    if (creditFilter) {
      creditFilter.addEventListener('change', () => this.render());
    }

    const examOnlyFilter = document.getElementById('examOnlyFilter');
    if (examOnlyFilter) {
      examOnlyFilter.addEventListener('change', () => this.render());
    }
  }

  /**
   * Handle profile change
   */
  handleProfileChange() {
    const profileSelect = document.getElementById('perfil');
    const emphasisSelect = document.getElementById('emphasis');
    const statusPanel = document.querySelector('.status-panel');
    
    if (!profileSelect) return;
    
    this.currentProfile = profileSelect.value;
    this.currentEmphasis = null; // Reset emphasis when profile changes
    
    if (!this.currentProfile) {
      if (emphasisSelect) {
        emphasisSelect.disabled = true;
        emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
        emphasisSelect.value = '';
      }
      if (statusPanel) statusPanel.classList.remove('active');
      this.render();
      return;
    }

    // Update emphasis selector
    if (emphasisSelect) {
      this.uiManager.updateEmphasisSelector(this.currentProfile, emphasisSelect);
      // Reset emphasis selection when profile changes
      emphasisSelect.value = '';
    }

    // Show status panel for profiles
    if (statusPanel) {
      statusPanel.classList.add('active');
    }
    
    // Re-render with new profile
    this.render();
    
    // Update status panel after render
    this.updateStatusPanel();
  }

  /**
   * Handle emphasis change
   */
  handleEmphasisChange() {
    const emphasisSelect = document.getElementById('emphasis');
    if (!emphasisSelect) return;
    
    this.currentEmphasis = emphasisSelect.value;
    this.render();
    
    // Update status panel after render
    this.updateStatusPanel();
  }

  /**
   * Render the graph view
   */
  render() {
    const container = document.getElementById('tree');
    const statusPanel = document.querySelector('.status-panel');
    
    if (!container) return;

    if (this.allSubjects.length === 0) {
      this.uiManager.showLoading(container, 'Cargando materias...');
      if (statusPanel) statusPanel.classList.remove('active');
      return;
    }

    if (!this.currentProfile) {
      container.innerHTML = `
        <div class="welcome-message">
          <h3>Selecciona un perfil para ver el plan de estudios</h3>
          <p>Usa los filtros arriba para explorar las materias por perfil y énfasis.</p>
        </div>
      `;
      if (statusPanel) statusPanel.classList.remove('active');
      return;
    }

    // Check if profile has emphasis and no emphasis is selected
    const profileConfig = this.PROFILE_CONFIG[this.currentProfile];
    if (profileConfig && profileConfig.hasEmphasis && !this.currentEmphasis) {
      container.innerHTML = `
        <div class="emphasis-required-banner">
          <div class="emphasis-icon">⚠️</div>
          <div>Selecciona un énfasis: <strong>${profileConfig.emphasis.join(', ')}</strong></div>
        </div>
      `;
      if (statusPanel) statusPanel.classList.remove('active');
      return;
    }

    // Get filtered subjects
    const filteredSubjects = this.getFilteredSubjects();
    
    if (filteredSubjects.length === 0) {
      this.uiManager.showEmpty(container, 'No hay materias para mostrar con los filtros seleccionados');
      if (statusPanel) statusPanel.classList.remove('active');
      return;
    }

    // Generate HTML with profile header
    let html = `
      <div class="recommended-path-header">
        <h3>Plan de Estudio - ${this.currentProfile}${this.currentEmphasis ? `: ${this.currentEmphasis}` : ''}</h3>
        <p>Haz clic en las materias para marcarlas como aprobadas o exoneradas.</p>
      </div>
    `;

    // Group subjects by semester
    const subjectsBySemester = this.groupSubjectsBySemester(filteredSubjects);
    
    // Render subjects grouped by semester
    html += this.renderSubjectsBySemester(subjectsBySemester);
    
    // Add profile notes if available
    html += this.renderProfileNotes();
    
    container.innerHTML = html;
    
    // Show and update status panel
    if (statusPanel) {
      statusPanel.classList.add('active');
    }
    this.updateStatusPanel();
    this.updateCreditsDisplay();
  }

  /**
   * Get filtered subjects based on current filters
   */
  getFilteredSubjects() {
    let subjects = [...this.allSubjects];
    
    // Filter by profile and emphasis
    if (this.currentProfile && this.profiles[this.currentProfile]) {
      const profileData = this.profiles[this.currentProfile];
      const profileCodes = new Set();
      
      // Handle profile data structure with emphasis
      if (profileData.emphasis && Array.isArray(profileData.emphasis)) {
        if (this.currentEmphasis) {
          // Filter by specific emphasis
          const emphasisData = profileData.emphasis.find(e => e.nombre === this.currentEmphasis);
          if (emphasisData) {
            // Get subjects from emphasis plan
            if (emphasisData.plan_recomendado) {
              Object.values(emphasisData.plan_recomendado).forEach(semesterSubjects => {
                if (Array.isArray(semesterSubjects)) {
                  semesterSubjects.forEach(code => profileCodes.add(code));
                }
              });
            }
            // Also include core and optional subjects from emphasis
            if (emphasisData.materias_core) {
              emphasisData.materias_core.forEach(code => profileCodes.add(code));
            }
            if (emphasisData.materias_optativas) {
              emphasisData.materias_optativas.forEach(code => profileCodes.add(code));
            }
          }
        } else {
          // No emphasis selected for a profile with emphasis - return empty for now
          // The render method will show the emphasis selection message
          return [];
        }
      } else {
        // Profile without emphasis - use direct structure
        if (profileData.plan_recomendado) {
          // Direct plan_recomendado structure
          Object.values(profileData.plan_recomendado).forEach(semesterSubjects => {
            if (Array.isArray(semesterSubjects)) {
              semesterSubjects.forEach(code => profileCodes.add(code));
            }
          });
        }
        
        // Also add core, optional, and suggested subjects if they exist
        if (profileData.materias_core) {
          profileData.materias_core.forEach(code => profileCodes.add(code));
        }
        if (profileData.materias_optativas) {
          profileData.materias_optativas.forEach(code => profileCodes.add(code));
        }
        if (profileData.materias_sugeridas) {
          profileData.materias_sugeridas.forEach(code => profileCodes.add(code));
        }
      }
      
      // Filter subjects by profile codes
      if (profileCodes.size > 0) {
        subjects = subjects.filter(subject => profileCodes.has(subject.codigo));
      }
    }
    
    // Apply additional filters
    const dictationFilter = document.getElementById('dictationSemester');
    if (dictationFilter && dictationFilter.value !== 'all') {
      subjects = subjects.filter(subject => {
        if (dictationFilter.value === 'both') {
          return subject.dictation_semester === 'both';
        }
        return subject.dictation_semester === dictationFilter.value ||
               subject.dictation_semester === 'both';
      });
    }
    
    const creditFilter = document.getElementById('creditFilter');
    if (creditFilter && creditFilter.value !== 'all') {
      const creditValue = creditFilter.value;
      subjects = subjects.filter(subject => {
        const credits = parseInt(subject.creditos || 0);
        
        switch(creditValue) {
          case '1-5':
            return credits >= 1 && credits <= 5;
          case '6-10':
            return credits >= 6 && credits <= 10;
          case '11-15':
            return credits >= 11 && credits <= 15;
          case '16+':
            return credits >= 16;
          default:
            // For backwards compatibility with specific credit values
            const targetCredits = parseInt(creditValue);
            return !isNaN(targetCredits) && credits === targetCredits;
        }
      });
    }

    const examOnlyFilter = document.getElementById('examOnlyFilter');
    if (examOnlyFilter && examOnlyFilter.checked) {
      subjects = subjects.filter(subject => subject.exam_only);
    }
    
    return subjects;
  }

  /**
   * Group subjects by semester based on profile plan or default semester
   */
  groupSubjectsBySemester(subjects) {
    const grouped = {};
    
    // If we have a current profile, use the plan_recomendado structure
    if (this.currentProfile && this.profiles[this.currentProfile]) {
      const profileData = this.profiles[this.currentProfile];
      
      // Handle profiles with emphasis
      if (profileData.emphasis && this.currentEmphasis) {
        const emphasisData = profileData.emphasis.find(e => e.nombre === this.currentEmphasis);
        if (emphasisData && emphasisData.plan_recomendado) {
          // Group by the plan_recomendado semesters
          for (const [semester, subjectCodes] of Object.entries(emphasisData.plan_recomendado)) {
            grouped[semester] = [];
            subjectCodes.forEach(code => {
              const subject = subjects.find(s => s.codigo === code);
              if (subject) {
                grouped[semester].push(subject);
              }
            });
          }
          return grouped;
        }
      }
      
      // Handle profiles without emphasis
      if (profileData.plan_recomendado) {
        // Direct plan_recomendado structure
        for (const [semester, subjectCodes] of Object.entries(profileData.plan_recomendado)) {
          grouped[semester] = [];
          if (Array.isArray(subjectCodes)) {
            subjectCodes.forEach(code => {
              const subject = subjects.find(s => s.codigo === code);
              if (subject) {
                grouped[semester].push(subject);
              }
            });
          }
        }
        return grouped;
      }
    }
    
    // Fallback to default semester grouping
    subjects.forEach(subject => {
      const semester = subject.semestre || 'unknown';
      if (!grouped[semester]) {
        grouped[semester] = [];
      }
      grouped[semester].push(subject);
    });
    
    return grouped;
  }

  /**
   * Render subjects grouped by semester
   */
  renderSubjectsBySemester(subjectsBySemester) {
    const semesters = Object.keys(subjectsBySemester).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return parseInt(a) - parseInt(b);
    });
    
    return semesters.map(semester => {
      const subjects = subjectsBySemester[semester];
      const semesterTitle = semester === 'unknown' ? 'Sin semestre asignado' : `Semestre ${semester}`;
      
      return `
        <div class="semester-row">
          <div class="semester-label">${semesterTitle}</div>
          <div class="semester-subjects">
            ${subjects.map(subject => this.createSubjectHTML(subject)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render profile notes section
   */
  renderProfileNotes() {
    if (!this.currentProfile || !this.profiles[this.currentProfile]) {
      return '';
    }

    const profileData = this.profiles[this.currentProfile];
    
    // Check if current emphasis has notes, otherwise use profile notes
    let notesToShow = [];
    
    if (this.currentEmphasis && profileData.emphasis) {
      const emphasisData = profileData.emphasis.find(e => e.nombre === this.currentEmphasis);
      if (emphasisData && emphasisData.notas_importantes) {
        notesToShow = emphasisData.notas_importantes;
      }
    }
    
    // Fallback to profile notes if no emphasis notes
    if (notesToShow.length === 0 && profileData.notas_importantes) {
      notesToShow = profileData.notas_importantes;
    }

    if (!notesToShow || notesToShow.length === 0) {
      return '';
    }

    const profileTitle = this.currentEmphasis 
      ? `${this.currentProfile} - ${this.currentEmphasis}`
      : this.currentProfile;

    return `
      <section class="profile-notes">
        <div class="profile-notes-header">
          <h3 class="profile-notes-title">Notas Importantes</h3>
          <p class="profile-notes-subtitle">${profileTitle}</p>
        </div>
        
        <div class="notes-grid">
          ${notesToShow.map(note => this.renderNoteCard(note)).join('')}
        </div>
      </section>
    `;
  }

  /**
   * Render individual note card
   */
  renderNoteCard(note) {
    // Handle different note structures
    if (typeof note === 'string') {
      // Simple string note
      return `
        <div class="note-card" data-category="info">
          <div class="note-card-header">
            <div class="note-card-icon">i</div>
            <h4 class="note-card-title">Información Importante</h4>
          </div>
          <p class="note-card-description">${note}</p>
        </div>
      `;
    }

    // Object note with potential missing fields
    const titulo = note.titulo || note.title || 'Información Importante';
    const descripcion = note.descripcion || note.description || '';
    
    if (!descripcion) {
      return ''; // Skip empty notes
    }

    // Determine note category for styling
    const category = this.determineNoteCategory(note);
    const icon = this.getNoteIcon(category);
    
    return `
      <div class="note-card" data-category="${category}">
        <div class="note-card-header">
          <div class="note-card-icon">${icon}</div>
          <h4 class="note-card-title">${titulo}</h4>
        </div>
        <p class="note-card-description">${descripcion}</p>
      </div>
    `;
  }

  /**
   * Determine note category based on content
   */
  determineNoteCategory(note) {
    if (typeof note === 'string') {
      return 'info';
    }
    
    const titulo = (note.titulo || note.title || '').toLowerCase();
    const descripcion = (note.descripcion || note.description || '').toLowerCase();
    
    if (titulo.includes('obligatori') || descripcion.includes('deben') || descripcion.includes('debe')) {
      return 'requirement';
    }
    if (titulo.includes('recomend') || descripcion.includes('recomend') || titulo.includes('fuertemente')) {
      return 'recommendation';
    }
    if (titulo.includes('opcional') || descripcion.includes('opcional') || titulo.includes('opciones')) {
      return 'optional';
    }
    return 'info';
  }

  /**
   * Get icon for note category
   */
  getNoteIcon(category) {
    const icons = {
      requirement: '!',
      recommendation: 'i',
      optional: '?',
      info: '✓'
    };
    return icons[category] || 'i';
  }

  /**
   * Create HTML for a subject button
   */
  createSubjectHTML(subject) {
    const status = this.getSubjectStatus(subject);
    const isAvailable = this.prerequisiteManager.isSubjectAvailable(subject.codigo);
    
    let dictationText = '';
    if (subject.dictation_semester) {
      const dictationMap = {
        '1': 'Impar',
        '2': 'Par',
        'both': 'Ambos'
      };
      dictationText = `<span class="dictation">${dictationMap[subject.dictation_semester] || subject.dictation_semester}</span>`;
    }

    const displayName = subject.nombre.length > 22 ? 
      subject.nombre.substring(0, 20) + '...' : 
      subject.nombre;

    let statusClass = status;
    if (!isAvailable && status === 'available') {
      statusClass = 'unavailable';
    }

    return `
      <div 
        class="subject-btn ${statusClass}" 
        data-code="${subject.codigo}"
        onclick="window.toggleSubjectApproval('${subject.codigo}')"
        title="${subject.nombre} (${subject.creditos} créditos)${this.getPrerequisitesText(subject)}"
      >
        <span class="code">${subject.codigo}</span>
        <span class="name">${displayName}</span>
        <span class="credits">${subject.creditos} cr.</span>
        ${dictationText}
        ${subject.exam_only ? '<span class="exam-only">L</span>' : ''}
      </div>
    `;
  }

  /**
   * Get subject status (available, approved, locked)
   */
  getSubjectStatus(subject) {
    if (this.approvedSubjects.has(subject.codigo)) {
      return 'approved';
    }
    
    if (this.exoneratedSubjects.has(subject.codigo)) {
      return 'exonerated';
    }
    
    return 'available';
  }

  /**
   * Get prerequisites text for tooltip
   */
  getPrerequisitesText(subject) {
    if (!subject.prerequisites || subject.prerequisites.length === 0) {
      return '';
    }
    return `<br>Previas: ${subject.prerequisites.length} requisitos`;
  }

  /**
   * Toggle subject approval status or show prerequisites for unavailable subjects
   */
  toggleSubjectApproval(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (!subject) return;

    // Check if subject is available
    const isAvailable = this.prerequisiteManager.isSubjectAvailable(subjectCode);
    
    if (!isAvailable && !this.approvedSubjects.has(subjectCode) && !this.exoneratedSubjects.has(subjectCode)) {
      // Show prerequisites modal for unavailable subjects
      this.showPrerequisitesModal(subject);
      return;
    }

    // Standard toggle behavior for available subjects
    if (this.approvedSubjects.has(subjectCode)) {
      // If approved, move to exonerated
      this.approvedSubjects.delete(subjectCode);
      this.exoneratedSubjects.add(subjectCode);
      this.uiManager.showMessage(`${subjectCode} marcada como exonerada`);
    } else if (this.exoneratedSubjects.has(subjectCode)) {
      // If exonerated, remove completely
      this.exoneratedSubjects.delete(subjectCode);
      this.uiManager.showMessage(`${subjectCode} desmarcada`);
    } else {
      // If neither, make approved
      this.approvedSubjects.add(subjectCode);
      this.uiManager.showMessage(`${subjectCode} marcada como aprobada`);
    }

    // Sync with prerequisite manager
    this.syncApprovalStates();
    
    // Save to localStorage
    this.saveApprovals();
    
    // Update UI
    this.render();
    this.uiFeedback.updateAvailabilityFeedback(this.approvedSubjects);
  }

  /**
   * Show prerequisites modal for unavailable subjects
   */
  showPrerequisitesModal(subject) {
    const isAvailable = this.prerequisiteManager.isSubjectAvailable(subject.codigo);
    const explanation = this.prerequisiteManager.getUnavailabilityExplanation(subject.codigo);
    const recommendedPath = this.prerequisiteManager.getRecommendedPath(subject.codigo);
    
    let modalContent = `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content prerequisite-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>${subject.codigo} - ${subject.nombre}</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="subject-info-section">
              <div class="subject-credits">
                <strong>Créditos:</strong> ${subject.creditos}
              </div>
              <div class="subject-dictation">
                <strong>Dictado:</strong> ${this.uiManager.formatDictationSemester(subject.dictation_semester)}
              </div>
            </div>
            
            <div class="availability-status ${isAvailable ? 'available' : 'unavailable'}">
              <div class="status-indicator">
                <span class="status-icon">${isAvailable ? 'Disponible' : 'No disponible'}</span>
                <span class="status-text">
                  ${isAvailable ? 'Esta materia está disponible para cursar' : 'No puedes cursar esta materia aún'}
                </span>
              </div>
            </div>`;

    if (!isAvailable) {
      const missingPrereqs = this.prerequisiteManager.getMissingPrerequisites(subject.codigo);
      
      modalContent += `
            <div class="requirements-section">
              <h4>¿Qué necesitas para cursar esta materia?</h4>
              <div class="explanation-text">${explanation.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="missing-prereqs-section">
              <h5>Materias que debes completar primero:</h5>
              <ul class="prereq-list">`;
      
      missingPrereqs.forEach(prereqCode => {
        const prereqSubject = this.allSubjects.find(s => s.codigo === prereqCode);
        if (prereqSubject) {
          const prereqAvailable = this.prerequisiteManager.isSubjectAvailable(prereqCode);
          modalContent += `
                <li class="prereq-item ${prereqAvailable ? 'available' : 'unavailable'}">
                  <div class="prereq-info">
                    <span class="prereq-code">${prereqCode}</span>
                    <span class="prereq-name">${prereqSubject.nombre}</span>
                    <span class="prereq-credits">${prereqSubject.creditos} cr.</span>
                  </div>
                  <span class="prereq-status">
                    ${prereqAvailable ? 'Disponible ahora' : 'Bloqueada'}
                  </span>
                </li>`;
        }
      });
      
      modalContent += `
              </ul>
            </div>`;

      // Show what you can do now
      if (recommendedPath.availableNow.length > 0) {
        modalContent += `
            <div class="actionable-section">
              <h5>Puedes cursar ahora (para avanzar hacia esta materia):</h5>
              <ul class="available-list">`;
        
        recommendedPath.availableNow.forEach(availSubject => {
          modalContent += `
                <li class="available-item">
                  <span class="available-code">${availSubject.codigo}</span>
                  <span class="available-name">${availSubject.nombre}</span>
                  <span class="available-credits">${availSubject.creditos} cr.</span>
                </li>`;
        });
        
        modalContent += `
              </ul>
            </div>`;
      }
    }
    
    modalContent += `
            <div class="modal-footer">
              <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalContent);
  }

  /**
   * Update credits display
   */
  updateCreditsDisplay() {
    const approvedCredits = this.calculateCredits(this.approvedSubjects);
    const exoneratedCredits = this.calculateCredits(this.exoneratedSubjects);
    const totalCredits = approvedCredits + exoneratedCredits;

    const approvedElement = document.getElementById('approvedSubjects');
    const exoneratedElement = document.getElementById('exoneratedSubjects');
    const totalElement = document.getElementById('totalCredits');

    if (approvedElement) approvedElement.textContent = this.approvedSubjects.size;
    if (exoneratedElement) exoneratedElement.textContent = this.exoneratedSubjects.size;
    if (totalElement) totalElement.textContent = totalCredits;
  }

  /**
   * Calculate total credits for a set of subjects
   */
  calculateCredits(subjectSet) {
    let total = 0;
    subjectSet.forEach(code => {
      const subject = this.allSubjects.find(s => s.codigo === code);
      if (subject) {
        total += subject.creditos || 0;
      }
    });
    return total;
  }

  /**
   * Load stored approvals from localStorage
   */
  loadStoredApprovals() {
    try {
      const approved = localStorage.getItem('approvedSubjects');
      const exonerated = localStorage.getItem('exoneratedSubjects');
      
      if (approved) {
        this.approvedSubjects = new Set(JSON.parse(approved));
      }
      if (exonerated) {
        this.exoneratedSubjects = new Set(JSON.parse(exonerated));
      }
    } catch (error) {
      console.warn('Could not load stored approvals:', error);
    }
  }

  /**
   * Save approvals to localStorage
   */
  saveApprovals() {
    try {
      localStorage.setItem('approvedSubjects', JSON.stringify([...this.approvedSubjects]));
      localStorage.setItem('exoneratedSubjects', JSON.stringify([...this.exoneratedSubjects]));
    } catch (error) {
      console.warn('Could not save approvals:', error);
    }
  }

  /**
   * Update status panel with current stats
   */
  updateStatusPanel() {
    const panel = document.querySelector('.status-panel');
    if (!panel) return;
    
    const filteredSubjects = this.getFilteredSubjects();
    const totalSubjects = filteredSubjects.length;
    
    // Count approved subjects in current filter
    const approvedCount = Array.from(this.approvedSubjects).filter(code => 
      filteredSubjects.some(s => s.codigo === code)
    ).length;
    
    // Count exonerated subjects in current filter  
    const exoneratedCount = Array.from(this.exoneratedSubjects).filter(code => 
      filteredSubjects.some(s => s.codigo === code)
    ).length;
    
    // Calculate total credits from completed subjects
    const completedCredits = filteredSubjects
      .filter(s => this.approvedSubjects.has(s.codigo) || this.exoneratedSubjects.has(s.codigo))
      .reduce((sum, s) => sum + (s.creditos || 0), 0);
    
    // Calculate total possible credits
    const totalCredits = filteredSubjects.reduce((sum, s) => sum + (s.creditos || 0), 0);
    
    // Calculate progress percentage
    const completedSubjects = approvedCount + exoneratedCount;
    const progressPercentage = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;

    panel.innerHTML = `
      <h4>Estado del Plan</h4>
      <div class="stats">
        <div class="stat">
          <span class="label">Materias aprobadas:</span>
          <span class="value">${approvedCount}</span>
        </div>
        <div class="stat">
          <span class="label">Materias exoneradas:</span>
          <span class="value">${exoneratedCount}</span>
        </div>
        <div class="stat">
          <span class="label">Total completadas:</span>
          <span class="value">${completedSubjects}/${totalSubjects}</span>
        </div>
        <div class="stat">
          <span class="label">Créditos obtenidos:</span>
          <span class="value">${completedCredits}/${totalCredits}</span>
        </div>
        <div class="stat">
          <span class="label">Progreso del plan:</span>
          <span class="value">${progressPercentage}%</span>
        </div>
      </div>
    `;
    
    panel.classList.add('active');
  }

  /**
   * Sync approval states with enhanced manager
   */
  syncApprovalStates() {
    // Update the prerequisite manager with current approval states
    this.prerequisiteManager.approvedSubjects = new Set(this.approvedSubjects);
    this.prerequisiteManager.exoneratedSubjects = new Set(this.exoneratedSubjects);
  }
}

// Make toggleSubjectApproval globally accessible
window.toggleSubjectApproval = (subjectCode) => {
  if (window.graphManager) {
    window.graphManager.toggleSubjectApproval(subjectCode);
  }
};
