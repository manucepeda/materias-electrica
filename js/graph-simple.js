/**
 * Simple Graph View for Materias Eléctrica
 * Working version that properly loads and displays profiles
 */

import { PROFILE_CONFIG } from './config.js';

class GraphApp {
  constructor() {
    this.allSubjects = [];
    this.profiles = {};
    this.approvedSubjects = new Set();
    this.exoneratedSubjects = new Set();
    this.showRecommendedPath = true;
    this.currentProfile = null;
    this.currentEmphasis = null;
  }

  async init() {
    try {
      console.log('Loading application data...');
      await this.loadData();
      console.log('Data loaded successfully');
      this.initializeUI();
      console.log('UI initialized');
      this.setupEventListeners();
      console.log('Event listeners setup');
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
      this.showError('Error loading application data: ' + error.message);
    }
  }

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

  async loadAllProfiles() {
    const profilePromises = Object.entries(PROFILE_CONFIG).map(async ([name, config]) => {
      try {
        const response = await fetch(config.file);
        if (!response.ok) {
          throw new Error(`Failed to load profile ${name}`);
        }
        const profileData = await response.json();
        this.profiles[name] = profileData;
        console.log(`Loaded profile: ${name}`, profileData);
      } catch (error) {
        console.error(`Error loading profile ${name}:`, error);
      }
    });

    await Promise.all(profilePromises);
    console.log('All profiles loaded:', Object.keys(this.profiles));
  }

  initializeUI() {
    this.populateProfileSelector();
    this.updateStatus();
  }

  populateProfileSelector() {
    const profileSelect = document.getElementById('perfil');
    if (!profileSelect) return;

    // Clear existing options
    profileSelect.innerHTML = '<option value="">Seleccione un perfil</option>';

    // Add profile options
    Object.keys(PROFILE_CONFIG).forEach(profileName => {
      const option = document.createElement('option');
      option.value = profileName;
      option.textContent = profileName;
      profileSelect.appendChild(option);
    });
  }

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

    // Filter controls
    const controls = ['dictationSemester', 'creditFilter'];
    controls.forEach(controlId => {
      const element = document.getElementById(controlId);
      if (element) {
        element.addEventListener('change', () => this.renderGraph());
      }
    });

    // Exam only filter
    const examFilter = document.getElementById('examOnlyFilter');
    if (examFilter) {
      examFilter.addEventListener('change', () => this.renderGraph());
    }

    // Global function for subject toggles
    window.toggleSubjectApproval = (subjectCode) => this.toggleSubjectApproval(subjectCode);
  }

  handleProfileChange() {
    const profileSelect = document.getElementById('perfil');
    const emphasisSelect = document.getElementById('emphasis');
    const tableViewLink = document.getElementById('table-view-link');

    if (!profileSelect || !emphasisSelect) return;

    const selectedProfile = profileSelect.value;
    this.currentProfile = selectedProfile;
    this.currentEmphasis = null;

    console.log('Profile changed to:', selectedProfile);
    console.log('Available profiles:', Object.keys(this.profiles));
    console.log('Profile data:', this.profiles[selectedProfile]);

    // Reset subject approval state when changing profiles
    const confirmClear = window.confirm('Changing profiles will clear your approved and exonerated subjects. Do you want to proceed?');
    if (!confirmClear) {
        profileSelect.value = this.currentProfile; // Revert profile selection
        return;
    }
    this.approvedSubjects.clear();
    this.exoneratedSubjects.clear();

    if (!selectedProfile) {
      emphasisSelect.disabled = true;
      emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
      if (tableViewLink) tableViewLink.style.display = 'none';
      this.hideRecommendedPathToggle();
      this.renderGraph();
      return;
    }

    const config = PROFILE_CONFIG[selectedProfile];
    
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

    this.renderGraph();
  }

  handleEmphasisChange() {
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      this.currentEmphasis = emphasisSelect.value;
      console.log('Emphasis changed to:', this.currentEmphasis);
      
      this.renderGraph();
    }
  }

  renderGraph() {
    const treeContainer = document.getElementById('tree');
    if (!treeContainer) {
      console.error('Tree container not found');
      return;
    }

    if (!this.currentProfile) {
      treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #666;">
          Seleccione un perfil para visualizar el grafo de materias
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

    console.log('Rendering profile:', this.currentProfile, 'Show recommended path:', this.showRecommendedPath);
    console.log('Profile data:', profile);

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

  renderRecommendedPath(profile, planRecomendado) {
    const treeContainer = document.getElementById('tree');
    const plan = planRecomendado;

    let html = `
      <div class="recommended-path-header">
        <h3>Plan de Estudio Recomendado - ${profile.nombre}</h3>
        ${this.currentEmphasis ? `<p>Énfasis: ${this.currentEmphasis}</p>` : ''}
      </div>
    `;

    // Sort semesters numerically
    const semesters = Object.keys(plan).sort((a, b) => parseInt(a) - parseInt(b));

    semesters.forEach(semester => {
      const subjectCodes = plan[semester];
      if (!subjectCodes || subjectCodes.length === 0) return;

      html += `
        <div class="semester-row">
          <div class="semester-label">Semestre ${semester}</div>
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
            <div class="subject ${status} ${!isAvailable ? 'unavailable' : ''}" 
                 onclick="toggleSubjectApproval('${subject.codigo}')"
                 title="${subject.nombre} - ${subject.creditos} créditos">
              <div class="subject-code">${subject.codigo}</div>
              <div class="subject-name">${subject.nombre}</div>
              <div class="subject-credits">${subject.creditos} cr</div>
              ${this.getSubjectBadges(subject, { materias_core, materias_optativas, materias_sugeridas })}
            </div>
          `;
        } else {
          // Handle subjects not found in ucs.json
          html += `
            <div class="subject unknown">
              <div class="subject-code">${subjectCode}</div>
              <div class="subject-name">Materia no encontrada</div>
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
    
    // Get profile-specific subjects directly
    const coreSubjects = this.allSubjects.filter(s => 
      materias_core.includes(s.codigo)
    );
    
    const optionalSubjects = this.allSubjects.filter(s => 
      materias_optativas.includes(s.codigo)
    );
    
    const suggestedSubjects = this.allSubjects.filter(s => 
      materias_sugeridas.includes(s.codigo)
    );
    
    console.log('Core subjects:', coreSubjects.length, coreSubjects.map(s => s.codigo));
    console.log('Optional subjects:', optionalSubjects.length, optionalSubjects.map(s => s.codigo));
    console.log('Suggested subjects:', suggestedSubjects.length, suggestedSubjects.map(s => s.codigo));

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
      { name: 'Materias Obligatorias del Perfil', subjects: coreSubjects, badge: 'core' },
      { name: 'Materias Opcionales del Perfil', subjects: optionalSubjects, badge: 'opcional' },
      { name: 'Materias Sugeridas', subjects: suggestedSubjects, badge: 'sugerida' }
    ];

    categories.forEach(category => {
      html += `
        <div class="category-section">
          <h4 class="category-title">${category.name} (${category.subjects.length})</h4>
      `;

      if (category.subjects.length === 0) {
        html += `<p style="color: #64748b; font-style: italic; margin: 1rem 0;">No hay materias en esta categoría.</p>`;
      } else {
        html += `<div class="subjects-grid">`;

        category.subjects.forEach(subject => {
          const status = this.getSubjectStatus(subject);
          const isAvailable = this.isSubjectAvailable(subject);
          
          html += `
            <div class="subject ${status} ${!isAvailable ? 'unavailable' : ''}" 
                 onclick="toggleSubjectApproval('${subject.codigo}')"
                 title="${subject.nombre} - ${subject.creditos} créditos">
              <div class="subject-code">${subject.codigo}</div>
              <div class="subject-name">${subject.nombre}</div>
              <div class="subject-credits">${subject.creditos} cr</div>
              ${this.getSubjectBadges(subject, { materias_core, materias_optativas, materias_sugeridas })}
            </div>
          `;
        });

        html += `</div>`;
      }

      html += `</div>`;
    });

    // Add notes if available
    if (profile.notas_importantes && profile.notas_importantes.length > 0) {
      html += this.renderProfileNotes(profile);
    }

    treeContainer.innerHTML = html;
  }

  getSubjectBadges(subject, materiaLists) {
    let badges = '';

    // Handle both old profile structure and new explicit materia lists
    const materias_core = materiaLists.materias_core || (materiaLists.materias_core !== undefined ? materiaLists.materias_core : []);
    const materias_optativas = materiaLists.materias_optativas || (materiaLists.materias_optativas !== undefined ? materiaLists.materias_optativas : []);
    const materias_sugeridas = materiaLists.materias_sugeridas || (materiaLists.materias_sugeridas !== undefined ? materiaLists.materias_sugeridas : []);

    if (materias_core && materias_core.includes(subject.codigo)) {
      badges += '<span class="tag-badge core-badge">Obl</span>';
    }
    
    if (materias_optativas && materias_optativas.includes(subject.codigo)) {
      badges += '<span class="tag-badge opcional-badge">Opcional</span>';
    }
    
    if (materias_sugeridas && materias_sugeridas.includes(subject.codigo)) {
      badges += '<span class="tag-badge sugerida-badge">Sugerida</span>';
    }

    return badges;
  }

  getSubjectStatus(subject) {
    if (this.exoneratedSubjects.has(subject.codigo)) return 'exonerated';
    if (this.approvedSubjects.has(subject.codigo)) return 'approved';
    if (!this.isSubjectAvailable(subject)) return 'unavailable';
    return 'available';
  }

  isSubjectAvailable(subject) {
    if (!subject.prerequisitos || subject.prerequisitos.length === 0) return true;
    
    return subject.prerequisitos.every(prereq => {
      // Handle both old and new prerequisite formats
      const prereqCode = typeof prereq === 'string' ? prereq : prereq.codigo;
      return this.approvedSubjects.has(prereqCode) || this.exoneratedSubjects.has(prereqCode);
    });
  }

  toggleSubjectApproval(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (!subject) return;

    if (this.exoneratedSubjects.has(subjectCode)) {
      this.exoneratedSubjects.delete(subjectCode);
    } else if (this.approvedSubjects.has(subjectCode)) {
      this.approvedSubjects.delete(subjectCode);
      this.exoneratedSubjects.add(subjectCode);
    } else {
      this.approvedSubjects.add(subjectCode);
    }

    this.renderGraph();
  }

  renderProfileNotes(profile) {
    if (!profile.notas_importantes || profile.notas_importantes.length === 0) return '';

    let notesHTML = `
      <div class="profile-notes">
        <h4>Información importante para el perfil de ${profile.nombre}</h4>
        <div class="notes-grid">
    `;

    profile.notas_importantes.forEach(nota => {
      notesHTML += `
        <div class="note-card" data-note-id="${nota.id}">
          <div class="note-content">
            <h5>${nota.titulo}</h5>
            <div class="note-description">${nota.descripcion}</div>
          </div>
        </div>
      `;
    });

    notesHTML += `
        </div>
      </div>
    `;

    return notesHTML;
  }

  updateStatus() {
    let totalCredits = 0;
    let approvedCount = this.approvedSubjects.size;
    let exoneratedCount = this.exoneratedSubjects.size;

    // Calculate total credits
    for (const subjectCode of this.approvedSubjects) {
      const subject = this.allSubjects.find(s => s.codigo === subjectCode);
      if (subject) totalCredits += subject.creditos;
    }

    for (const subjectCode of this.exoneratedSubjects) {
      const subject = this.allSubjects.find(s => s.codigo === subjectCode);
      if (subject) totalCredits += subject.creditos;
    }

    // Update UI
    const elements = {
      totalSubjects: document.getElementById('totalSubjects'),
      approvedSubjects: document.getElementById('approvedSubjects'),
      exoneratedSubjects: document.getElementById('exoneratedSubjects'),
      totalCredits: document.getElementById('totalCredits')
    };

    if (elements.totalSubjects) elements.totalSubjects.textContent = approvedCount + exoneratedCount;
    if (elements.approvedSubjects) elements.approvedSubjects.textContent = approvedCount;
    if (elements.exoneratedSubjects) elements.exoneratedSubjects.textContent = exoneratedCount;
    if (elements.totalCredits) elements.totalCredits.textContent = totalCredits;
  }

  showError(message) {
    const treeContainer = document.getElementById('tree');
    if (treeContainer) {
      treeContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; color: #d32f2f;">
          <h3>Error</h3>
          <p>${message}</p>
        </div>`;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.graphApp = new GraphApp();
  window.graphApp.init();
});