/**
 * TreeViewManager - Manages the interactive tree view for suggested study plans
 * Extracted and optimized from graph-simple.js
 */

export class TreeViewManager {
  constructor() {
    this.allSubjects = [];
    this.profiles = {};
    this.approvedSubjects = new Set();
    this.exoneratedSubjects = new Set();
    this.currentProfile = null;
    this.currentEmphasis = null;
    
    // Profile configuration
    this.PROFILE_CONFIG = {
      'Electrónica': {
        file: 'data/profiles/electronica.json',
        hasEmphasis: true,
        emphasis: ['Electrónica Biomédica', 'Sistemas Embebidos', 'Circuitos y Sistemas Electrónicos']
      },
      'Control': {
        file: 'data/profiles/control.json',
        hasEmphasis: false
      },
      'Sistemas Eléctricos de Potencia': {
        file: 'data/profiles/potencia.json',
        hasEmphasis: false
      },
      'Ingeniería Biomédica': {
        file: 'data/profiles/biomedica.json',
        hasEmphasis: true,
        emphasis: ['Electrónica', 'Ingeniería Clínica', 'Señales', 'Informática'],
        hasTableView: true
      },
      'Señales y Aprendizaje Automático': {
        file: 'data/profiles/senales.json',
        hasEmphasis: false
      }
    };
  }

  /**
   * Initialize the TreeViewManager with data
   */
  async init() {
    try {
      await this.loadData();
      this.setupEventListeners();
      this.initializeUI();
      this.loadStoredApprovals();
      this.render();
      console.log('TreeViewManager initialized successfully');
    } catch (error) {
      console.error('Error initializing TreeViewManager:', error);
      this.showError('No se pudieron cargar los datos del plan de estudios.');
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
    for (const [profileName, config] of Object.entries(this.PROFILE_CONFIG)) {
      try {
        const response = await fetch(config.file);
        if (response.ok) {
          this.profiles[profileName] = await response.json();
          console.log(`Loaded profile: ${profileName}`);
        } else {
          console.warn(`Failed to load profile: ${profileName}`);
        }
      } catch (error) {
        console.warn(`Error loading profile ${profileName}:`, error);
      }
    }
  }

  /**
   * Initialize UI elements
   */
  initializeUI() {
    this.initializeProfileSelector();
  }

  /**
   * Initialize profile selector
   */
  initializeProfileSelector() {
    const profileSelect = document.getElementById('perfil');
    if (!profileSelect) return;

    // Clear existing options
    profileSelect.innerHTML = '<option value="">Seleccione un perfil</option>';

    // Add profile options
    Object.keys(this.PROFILE_CONFIG).forEach(profileName => {
      const option = document.createElement('option');
      option.value = profileName;
      option.textContent = profileName;
      profileSelect.appendChild(option);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Profile selection
    const profileSelect = document.getElementById('perfil');
    if (profileSelect) {
      profileSelect.addEventListener('change', () => this.handleProfileChange());
    }

    // Emphasis selection
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      emphasisSelect.addEventListener('change', () => this.handleEmphasisChange());
    }

    // Global function for subject toggles
    window.toggleSubjectApproval = (subjectCode) => this.toggleSubjectApproval(subjectCode);
  }

  /**
   * Handle profile selection change
   */
  handleProfileChange() {
    const profileSelect = document.getElementById('perfil');
    const emphasisSelect = document.getElementById('emphasis');
    const tableViewLink = document.getElementById('table-view-link');

    if (!profileSelect || !emphasisSelect) return;

    const selectedProfile = profileSelect.value;
    this.currentProfile = selectedProfile;
    this.currentEmphasis = null;

    console.log('Profile changed to:', selectedProfile);

    if (!selectedProfile) {
      emphasisSelect.disabled = true;
      emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
      if (tableViewLink) tableViewLink.style.display = 'none';
      this.render();
      return;
    }

    const config = this.PROFILE_CONFIG[selectedProfile];
    
    // Handle emphasis
    if (config && config.hasEmphasis && config.emphasis) {
      emphasisSelect.disabled = false;
      emphasisSelect.innerHTML = '<option value="">Seleccione un énfasis</option>';
      
      config.emphasis.forEach(emphasis => {
        const option = document.createElement('option');
        option.value = emphasis;
        option.textContent = emphasis;
        emphasisSelect.appendChild(option);
      });
    } else {
      emphasisSelect.disabled = true;
      emphasisSelect.innerHTML = '<option value="">Sin énfasis disponible</option>';
    }

    // Handle table view link
    if (tableViewLink) {
      tableViewLink.style.display = (config && config.hasTableView) ? 'inline' : 'none';
    }

    this.render();
  }

  /**
   * Handle emphasis selection change
   */
  handleEmphasisChange() {
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      this.currentEmphasis = emphasisSelect.value;
      console.log('Emphasis changed to:', this.currentEmphasis);
      this.render();
    }
  }

  /**
   * Main render method - always shows the study plan when available
   */
  render() {
    const treeContainer = document.getElementById('tree');
    if (!treeContainer) {
      console.error('Tree container not found');
      return;
    }

    if (!this.currentProfile) {
      treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          Seleccione un perfil para visualizar el plan de estudio recomendado
        </div>`;
      return;
    }

    const profile = this.profiles[this.currentProfile];
    if (!profile) {
      console.error('Profile not found:', this.currentProfile);
      treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          Error: No se pudo cargar el perfil ${this.currentProfile}
        </div>`;
      return;
    }

    console.log('Rendering profile:', this.currentProfile);

    // Get the correct plan_recomendado based on profile structure
    let planRecomendado = null;
    if (profile.plan_recomendado) {
      // Profile without emphasis - plan at root level
      planRecomendado = profile.plan_recomendado;
    } else if (profile.emphasis && this.currentEmphasis) {
      // Profile with emphasis - plan inside selected emphasis
      const selectedEmphasis = profile.emphasis.find(emp => emp.nombre === this.currentEmphasis);
      if (selectedEmphasis && selectedEmphasis.plan_recomendado) {
        planRecomendado = selectedEmphasis.plan_recomendado;
      }
    }

    // Always show recommended path if available, otherwise show subjects by profile
    if (planRecomendado) {
      this.renderRecommendedPath(profile, planRecomendado);
    } else {
      this.renderSubjectsByProfile(profile);
    }

    this.updateStatus();
  }

  /**
   * Render the recommended study plan as a tree view
   */
  renderRecommendedPath(profile, planRecomendado) {
    const treeContainer = document.getElementById('tree');
    const plan = planRecomendado;

    let html = `
      <div class="recommended-path-header">
        <h3>Plan de Estudio Recomendado - ${profile.nombre}</h3>
        ${this.currentEmphasis ? `<p>Énfasis: ${this.currentEmphasis}</p>` : ''}
        <p class="plan-description">Haga clic en las materias para marcarlas como aprobadas o exoneradas</p>
      </div>
    `;

    // Sort semesters numerically
    const semesters = Object.keys(plan).sort((a, b) => parseInt(a) - parseInt(b));

    semesters.forEach(semester => {
      const subjectCodes = plan[semester];
      if (!subjectCodes || subjectCodes.length === 0) return;

      // Calculate semester credits
      const semesterCredits = subjectCodes.reduce((total, code) => {
        const subject = this.allSubjects.find(s => s.codigo === code);
        return total + (subject ? parseInt(subject.creditos) || 0 : 0);
      }, 0);

      html += `
        <div class="semester-row">
          <div class="semester-label">
            Semestre ${semester} 
            <span class="semester-credits">${semesterCredits} créditos</span>
          </div>
          <div class="semester-subjects">
      `;

      subjectCodes.forEach(subjectCode => {
        const subject = this.allSubjects.find(s => s.codigo === subjectCode);
        if (subject) {
          const status = this.getSubjectStatus(subject);
          const isAvailable = this.isSubjectAvailable(subject);
          
          // Get the correct data for badges based on profile structure
          let materias_core, materias_optativas, materias_sugeridas;
          if (profile.emphasis && this.currentEmphasis) {
            const selectedEmphasis = profile.emphasis.find(emp => emp.nombre === this.currentEmphasis);
            if (selectedEmphasis) {
              materias_core = selectedEmphasis.materias_core || [];
              materias_optativas = selectedEmphasis.materias_optativas || [];
              materias_sugeridas = selectedEmphasis.materias_sugeridas || [];
            }
          } else {
            materias_core = profile.materias_core || [];
            materias_optativas = profile.materias_optativas || [];
            materias_sugeridas = profile.materias_sugeridas || [];
          }
          
          html += `
            <div class="subject-btn ${status} ${!isAvailable ? 'unavailable' : ''}" 
                 onclick="toggleSubjectApproval('${subject.codigo}')"
                 title="${subject.nombre} - ${subject.creditos} créditos">
              <span class="code">${subject.codigo}</span>
              ${subject.nombre}
              <span class="credits">${subject.creditos} cr.</span>
              ${subject.exam_only ? `<span class="exam-only">L</span>` : ''}
              ${this.getSubjectBadges(subject, { materias_core, materias_optativas, materias_sugeridas })}
            </div>
          `;
        } else {
          // Handle subjects not found in ucs.json
          html += `
            <div class="subject-btn unknown">
              <span class="code">${subjectCode}</span>
              Materia no encontrada
            </div>
          `;
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    // Add notes if available
    if (profile.notas_importantes && profile.notas_importantes.length > 0) {
      html += this.renderProfileNotes(profile);
    }

    treeContainer.innerHTML = html;
  }

  /**
   * Render subjects by profile (fallback when no plan_recomendado is available)
   */
  renderSubjectsByProfile(profile) {
    const treeContainer = document.getElementById('tree');
    
    console.log('Rendering profile subjects for:', profile.nombre);
    
    // Get the correct data based on profile structure
    let materias_core, materias_optativas, materias_sugeridas;
    
    if (profile.emphasis && this.currentEmphasis) {
      // Profile with emphasis - get data from selected emphasis
      const selectedEmphasis = profile.emphasis.find(emp => emp.nombre === this.currentEmphasis);
      if (selectedEmphasis) {
        materias_core = selectedEmphasis.materias_core || [];
        materias_optativas = selectedEmphasis.materias_optativas || [];
        materias_sugeridas = selectedEmphasis.materias_sugeridas || [];
      } else {
        materias_core = [];
        materias_optativas = [];
        materias_sugeridas = [];
      }
    } else {
      // Profile without emphasis or no emphasis selected - get data from root level
      materias_core = profile.materias_core || [];
      materias_optativas = profile.materias_optativas || [];
      materias_sugeridas = profile.materias_sugeridas || [];
    }

    let html = `
      <div class="profile-header">
        <h3>${profile.nombre}</h3>
        ${this.currentEmphasis ? `<p>Énfasis: ${this.currentEmphasis}</p>` : ''}
        <p>${profile.descripcion}</p>
      </div>
    `;

    // Show message if profile has emphasis but none is selected
    if (profile.emphasis && !this.currentEmphasis) {
      html += `
        <div style="text-align: center; padding: 30px; color: #f59e0b; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
          <h4>Seleccione un énfasis para ver las materias específicas</h4>
          <p>Este perfil requiere que seleccione un énfasis para mostrar el plan de estudios detallado.</p>
        </div>
      `;
      treeContainer.innerHTML = html;
      return;
    }

    // Render subject categories
    const categories = [
      { name: 'Materias Obligatorias', subjects: materias_core, className: 'core' },
      { name: 'Materias Optativas', subjects: materias_optativas, className: 'opcional' },
      { name: 'Materias Sugeridas', subjects: materias_sugeridas, className: 'sugerida' }
    ];

    categories.forEach(category => {
      if (category.subjects.length > 0) {
        html += `
          <div class="subject-category ${category.className}">
            <h4>${category.name}</h4>
            <div class="subjects-grid">
        `;
        
        category.subjects.forEach(subjectCode => {
          const subject = this.allSubjects.find(s => s.codigo === subjectCode);
          if (subject) {
            const status = this.getSubjectStatus(subject);
            const isAvailable = this.isSubjectAvailable(subject);
            
            html += `
              <div class="subject-btn ${status} ${!isAvailable ? 'unavailable' : ''}" 
                   onclick="toggleSubjectApproval('${subject.codigo}')"
                   title="${subject.nombre} - ${subject.creditos} créditos">
                <span class="code">${subject.codigo}</span>
                ${subject.nombre}
                <span class="credits">${subject.creditos} cr.</span>
                ${subject.exam_only ? `<span class="exam-only">L</span>` : ''}
                ${this.getSubjectBadges(subject, { materias_core, materias_optativas, materias_sugeridas })}
              </div>
            `;
          }
        });

        html += `</div></div>`;
      }
    });

    // Add notes if available
    if (profile.notas_importantes && profile.notas_importantes.length > 0) {
      html += this.renderProfileNotes(profile);
    }

    treeContainer.innerHTML = html;
  }

  /**
   * Get subject status (available, approved, exonerated)
   */
  getSubjectStatus(subject) {
    if (this.exoneratedSubjects.has(subject.codigo)) {
      return 'exonerated';
    } else if (this.approvedSubjects.has(subject.codigo)) {
      return 'approved';
    }
    return 'available';
  }

  /**
   * Check if subject is available (prerequisites met)
   */
  isSubjectAvailable(subject) {
    if (!subject.prerequisitos || subject.prerequisitos.length === 0) {
      return true;
    }
    
    return subject.prerequisitos.every(prereq => 
      this.approvedSubjects.has(prereq) || this.exoneratedSubjects.has(prereq)
    );
  }

  /**
   * Toggle subject approval/exoneration status
   */
  toggleSubjectApproval(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (!subject) return;

    // Check if subject is available
    if (!this.isSubjectAvailable(subject)) {
      alert(`No se puede aprobar ${subjectCode}. Faltan materias previas: ${subject.prerequisitos.filter(p => !this.approvedSubjects.has(p) && !this.exoneratedSubjects.has(p)).join(', ')}`);
      return;
    }

    // Cycle through states: available -> approved -> exonerated -> available
    if (this.exoneratedSubjects.has(subjectCode)) {
      // From exonerated to available
      this.exoneratedSubjects.delete(subjectCode);
    } else if (this.approvedSubjects.has(subjectCode)) {
      // From approved to exonerated
      this.approvedSubjects.delete(subjectCode);
      this.exoneratedSubjects.add(subjectCode);
    } else {
      // From available to approved
      this.approvedSubjects.add(subjectCode);
    }

    this.saveApprovals();
    this.render();
  }

  /**
   * Get subject badges based on profile classification
   */
  getSubjectBadges(subject, { materias_core, materias_optativas, materias_sugeridas }) {
    let badges = '';
    
    if (materias_core.includes(subject.codigo)) {
      badges += '<span class="tag-badge core-badge">Obl</span>';
    }
    if (materias_optativas.includes(subject.codigo)) {
      badges += '<span class="tag-badge opcional-badge">Opcional</span>';
    }
    if (materias_sugeridas.includes(subject.codigo)) {
      badges += '<span class="tag-badge sugerida-badge">Sugerida</span>';
    }
    
    return badges;
  }

  /**
   * Render profile notes
   */
  renderProfileNotes(profile) {
    if (!profile.notas_importantes || profile.notas_importantes.length === 0) {
      return '';
    }

    let html = `
      <div class="profile-notes">
        <h4>Información importante para el perfil de ${profile.nombre}</h4>
        <div class="notes-grid">
    `;

    profile.notas_importantes.forEach(nota => {
      html += `
        <div class="note-card" data-note-id="${nota.id}">
          <div class="note-content">
            <h5>${nota.titulo}</h5>
            <div class="note-description">${nota.descripcion}</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Update status display (credits, counts, etc.)
   */
  updateStatus() {
    const totalSubjectsEl = document.getElementById('totalSubjects');
    const approvedSubjectsEl = document.getElementById('approvedSubjects');
    const exoneratedSubjectsEl = document.getElementById('exoneratedSubjects');
    const totalCreditsEl = document.getElementById('totalCredits');

    if (totalSubjectsEl) {
      totalSubjectsEl.textContent = this.allSubjects.length;
    }

    if (approvedSubjectsEl) {
      approvedSubjectsEl.textContent = this.approvedSubjects.size;
    }

    if (exoneratedSubjectsEl) {
      exoneratedSubjectsEl.textContent = this.exoneratedSubjects.size;
    }

    if (totalCreditsEl) {
      // Only exonerated subjects count towards credits, not approved ones
      const exoneratedCredits = Array.from(this.exoneratedSubjects).reduce((total, code) => {
        const subject = this.allSubjects.find(s => s.codigo === code);
        return total + (subject ? parseInt(subject.creditos) || 0 : 0);
      }, 0);

      totalCreditsEl.textContent = exoneratedCredits;
    }
  }

  /**
   * Save approvals to localStorage
   */
  saveApprovals() {
    localStorage.setItem('approvedSubjects', JSON.stringify(Array.from(this.approvedSubjects)));
    localStorage.setItem('exoneratedSubjects', JSON.stringify(Array.from(this.exoneratedSubjects)));
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
      console.warn('Error loading stored approvals:', error);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const treeContainer = document.getElementById('tree');
    if (treeContainer) {
      treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #dc2626; background-color: #fef2f2; border-radius: 8px; margin: 20px 0;">
          <h4>Error</h4>
          <p>${message}</p>
        </div>
      `;
    }
  }
}
