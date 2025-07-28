/**
 * UI Manager module for handling user interface updates and interactions
 */

import { getProfileNames, profileHasEmphasis, getProfileEmphasis, profileHasTableView, getSubjectNoteClass } from './config.js';

export class UIManager {
  constructor(profileManager) {
    this.profileManager = profileManager;
    this.currentProfile = null;
    this.currentEmphasis = null;
  }

  /**
   * Initialize profile selector with all available profiles
   */
  initializeProfileSelector(selectElement) {
    if (!selectElement) return;

    // Clear existing options
    selectElement.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccione un perfil';
    selectElement.appendChild(defaultOption);

    // Add profile options
    const profileNames = getProfileNames();
    profileNames.forEach(profileName => {
      const option = document.createElement('option');
      option.value = profileName;
      option.textContent = profileName;
      selectElement.appendChild(option);
    });
  }

  /**
   * Update emphasis selector based on selected profile
   */
  updateEmphasisSelector(profileName, emphasisElement) {
    if (!emphasisElement) return;

    // Clear existing options
    emphasisElement.innerHTML = '';
    this.currentEmphasis = null;

    if (!profileName) {
      emphasisElement.innerHTML = '<option value="">Seleccione un perfil primero</option>';
      emphasisElement.disabled = true;
      this.toggleVisibility(emphasisElement, false);
      return;
    }

    if (profileHasEmphasis(profileName)) {
      // Profile has emphasis options
      emphasisElement.disabled = false;
      this.toggleVisibility(emphasisElement, true);

      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Todos los énfasis';
      emphasisElement.appendChild(defaultOption);

      // Add emphasis options
      const emphasisOptions = getProfileEmphasis(profileName);
      emphasisOptions.forEach(emphasis => {
        const option = document.createElement('option');
        option.value = emphasis;
        option.textContent = emphasis;
        emphasisElement.appendChild(option);
      });
    } else {
      // Profile has no emphasis options
      emphasisElement.innerHTML = '<option value="">No hay énfasis para este perfil</option>';
      emphasisElement.disabled = true;
      emphasisElement.classList.add('hidden');
      emphasisElement.classList.remove('visible');
    }
  }

  /**
   * Update table view link visibility
   */
  updateTableViewLink(profileName, linkElement) {
    if (!linkElement) return;

    if (profileHasTableView(profileName)) {
      linkElement.classList.add('visible');
      linkElement.classList.remove('hidden');
    } else {
      linkElement.classList.add('hidden');
      linkElement.classList.remove('visible');
    }
  }

  /**
   * Handle profile change in UI
   */
  handleProfileChange(profileName, emphasisElement, tableViewElement) {
    this.currentProfile = profileName;
    this.updateEmphasisSelector(profileName, emphasisElement);
    this.updateTableViewLink(profileName, tableViewElement);
  }

  /**
   * Handle emphasis change in UI
   */
  handleEmphasisChange(emphasisName) {
    this.currentEmphasis = emphasisName;
  }

  /**
   * Create profile tags for a subject
   */
  createProfileTags(subject, selectedProfile, selectedEmphasis) {
    const profileTags = [];
    const emphasisTags = [];

    const allProfiles = this.profileManager.getAllProfiles();

    Object.entries(allProfiles).forEach(([profileName, profileData]) => {
      const classification = this.profileManager.getSubjectClassification(profileName, subject.codigo);
      
      if (classification) {
        profileTags.push(`<span class="tag perfil-tag" title="Perfil: ${profileName}">${profileName}</span>`);
        
        // Add classification tags for selected profile
        if (profileName === selectedProfile) {
          const tagClass = classification === 'core' ? 'core-tag' : 
                          classification === 'opcional' ? 'opcional-tag' : 'sugerida-tag';
          const tagText = classification === 'core' ? 'Core' : 
                         classification === 'opcional' ? 'Opcional' : 'Sugerida';
          profileTags.push(`<span class="tag ${tagClass}">${tagText}</span>`);
        }
        
        // Check emphasis
        if (profileData.emphasis) {
          profileData.emphasis.forEach(emphasis => {
            const emphasisClassification = this.profileManager.getEmphasisClassification(
              profileName, emphasis.nombre, subject.codigo
            );
            
            if (emphasisClassification) {
              emphasisTags.push(`<span class="tag enfasis-tag" title="Énfasis: ${emphasis.nombre} (${profileName})">${emphasis.nombre}</span>`);
            }
          });
        }
      }
    });

    return { profileTags, emphasisTags };
  }

  /**
   * Create subject card HTML
   */
  createSubjectCard(subject, selectedProfile, selectedEmphasis) {
    // Get dictation semester text
    let dictationText = '';
    if (subject.dictation_semester) {
      if (subject.dictation_semester === 'both') {
        dictationText = '<span class="dictation-tag">Ambos semestres</span>';
      } else if (subject.dictation_semester === '1') {
        dictationText = '<span class="dictation-tag">Semestre impar</span>';
      } else if (subject.dictation_semester === '2') {
        dictationText = '<span class="dictation-tag">Semestre par</span>';
      }
    }

    // Create profile and emphasis tags
    const { profileTags, emphasisTags } = this.createProfileTags(subject, selectedProfile, selectedEmphasis);

    // Generate prerequisites info if available
    let prereqInfo = '';
    if (subject.Previas && subject.Previas.length > 0) {
      const prereqsList = subject.Previas.join(', ');
      prereqInfo = `<div class="prereq-info">Previas: ${prereqsList}</div>`;
    }

    // Table view link for profiles that support it
    let tableViewButton = '';
    if (profileHasTableView(selectedProfile) && selectedEmphasis) {
      tableViewButton = `<a href="table-view.html?highlight=${subject.codigo}&emphasis=${selectedEmphasis}" class="table-link" title="Ver en tabla de plan recomendado">📋</a>`;
    }

    return `
      <article>
        <h2 style="margin:0;font-size:1.05rem;font-weight:700;">
          <span class="codigo">${subject.codigo || ''}</span> ${subject.nombre} ${tableViewButton}
        </h2>

        <div class="muted">
          <span style="margin-right:.75rem;">Semestre: <b>${subject.semestre}</b></span>
          <span>Créditos: <b>${subject.creditos}</b></span>
          ${subject.exam_only ? '<span class="exam-only-tag">Libre</span>' : ''}
          ${dictationText}
        </div>

        <div style="margin-top:0.5rem;">
          ${profileTags.join(' ')}
          ${emphasisTags.join(' ')}
        </div>
        
        ${prereqInfo}
      </article>
    `;
  }

  /**
   * Create subject button for graph view
   */
  createSubjectButton(subject, selectedProfile, selectedEmphasis, status, prerequisites = []) {
    const classification = this.profileManager.getSubjectClassification(selectedProfile, subject.codigo);
    let profileTags = [];

    // Add profile classification tags
    if (classification) {
      const classificationBadges = {
        core: '<span class="tag-badge core-badge">Obl</span>',
        opcional: '<span class="tag-badge opcional-badge">Opcional</span>',
        sugerida: '<span class="tag-badge sugerida-badge">Sugerida</span>',
      };
      if (classificationBadges[classification]) {
        profileTags.push(classificationBadges[classification]);
      }
    }

    // Add emphasis classification if applicable
    if (selectedEmphasis) {
      const emphasisClassification = this.profileManager.getEmphasisClassification(
        selectedProfile, selectedEmphasis, subject.codigo
      );
      
      if (emphasisClassification === 'emphasis-core') {
        profileTags.push('<span class="tag-badge emphasis-core-badge">EC</span>');
      } else if (emphasisClassification === 'emphasis-opcional') {
        profileTags.push('<span class="tag-badge emphasis-opcional-badge">EO</span>');
      }
    }

    // Get note classes for profiles with notes
    const noteClasses = getSubjectNoteClass(selectedProfile, subject.codigo);

    // Create prerequisites text
    let prereqText = '';
    if (prerequisites.length > 0) {
      prereqText = `<div class="prereq-text">Previas: ${prerequisites.join(', ')}</div>`;
    }

    return `
      <div class="subject-btn ${status} ${noteClasses}" 
           onclick="toggleSubjectApproval('${subject.codigo}')"
           title="Créditos: ${subject.creditos}${subject.exam_only ? ' (Libre)' : ''}"
           data-subject-code="${subject.codigo}">
        <div class="subject-name">${subject.nombre}</div>
        <div class="subject-code">${subject.codigo}</div>
        <div class="subject-credits">${subject.creditos} cr.</div>
        ${profileTags.join('')}
        ${prereqText}
      </div>
    `;
  }

  /**
   * Show temporary message to user
   */
  showMessage(message, duration = 3000) {
    // Remove existing messages
    const existingMessage = document.getElementById('temp-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.id = 'temp-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #003366;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      animation: fade-in 0.3s ease;
    `;

    document.body.appendChild(messageDiv);

    // Auto-remove after duration
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, duration);
  }

  /**
   * Get current selections
   */
  getCurrentSelections() {
    return {
      profile: this.currentProfile,
      emphasis: this.currentEmphasis
    };
  }
}
