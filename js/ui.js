/**
 * Manages UI updates and interactions for the application
 */
import { 
  getProfileNames, 
  profileHasEmphasis, 
  getProfileEmphasis, 
  getSubjectNoteClass 
} from './config.js';

export class UIManager {
  constructor() {
    this.currentProfile = null;
    this.currentEmphasis = null;
  }

  /**
   * Populates profile selector dropdown
   * @param {HTMLSelectElement} selectElement - The select element to populate
   */
  populateProfileSelector(selectElement) {
    if (!selectElement) return;

    selectElement.innerHTML = `
      <option value="">Seleccione un perfil</option>
      ${getProfileNames().map(name => 
        `<option value="${name}">${name}</option>`
      ).join('')}
    `;
  }

  /**
   * Updates emphasis selector based on selected profile
   * @param {string} profileName - Selected profile name
   * @param {HTMLSelectElement} emphasisElement - Emphasis select element
   */
  updateEmphasisSelector(profileName, emphasisElement) {
    if (!emphasisElement) return;

    // Always keep emphasis selector visible
    emphasisElement.style.display = '';
    emphasisElement.classList.remove('hidden');

    if (!profileName) {
      emphasisElement.innerHTML = '<option value="">Seleccione un perfil primero</option>';
      emphasisElement.disabled = true;
      return;
    }

    if (profileHasEmphasis(profileName)) {
      const emphasisList = getProfileEmphasis(profileName);
      
      if (emphasisList.length > 0) {
        emphasisElement.innerHTML = `
          <option value="">Seleccione un énfasis</option>
          ${emphasisList.map(emphasis =>
            `<option value="${emphasis}">${emphasis}</option>`
          ).join('')}
        `;
        emphasisElement.disabled = false;
      } else {
        emphasisElement.innerHTML = '<option value="">Sin énfasis disponibles</option>';
        emphasisElement.disabled = true;
      }
    } else {
      emphasisElement.innerHTML = '<option value="">No requiere énfasis</option>';
      emphasisElement.disabled = true;
    }
  }

  /**
   * Toggles element visibility
   * @param {HTMLElement} element - Element to toggle
   * @param {boolean} visible - Whether to show or hide
   */
  toggleVisibility(element, visible) {
    if (!element) return;
    element.classList.toggle('hidden', !visible);
    element.style.display = visible ? '' : 'none';
  }

  /**
   * Handles profile selection change
   */
  handleProfileChange(profileName, emphasisElement) {
    this.currentProfile = profileName;
    this.updateEmphasisSelector(profileName, emphasisElement);
  }

  /**
   * Handles emphasis selection change
   */
  handleEmphasisChange(emphasisName) {
    this.currentEmphasis = emphasisName;
  }

  /**
   * Creates profile tags HTML for a subject
   */
  createProfileTags(subject, profileData) {
    if (!profileData?.subjects) return '';
    
    const tags = [];
    const { codigo } = subject;
    
    if (profileData.materias_core?.includes(codigo)) {
      tags.push('<span class="tag core-tag">Core</span>');
    }
    
    if (profileData.materias_optativas?.includes(codigo)) {
      tags.push('<span class="tag opcional-tag">Opcional</span>');
    }
    
    if (this.currentEmphasis && profileData.emphasis) {
      const emphasisData = profileData.emphasis.find(e => e.nombre === this.currentEmphasis);
      if (emphasisData) {
        if (emphasisData.materias_core?.includes(codigo)) {
          tags.push(`<span class="tag enfasis-tag">${this.currentEmphasis}</span>`);
        }
        if (emphasisData.materias_optativas?.includes(codigo)) {
          tags.push(`<span class="tag enfasis-tag">${this.currentEmphasis} (Opt)</span>`);
        }
      }
    }
    
    return tags.length > 0 
      ? `<span class="tag perfil-tag">${this.currentProfile}</span>${tags.join('')}`
      : '';
  }

  /**
   * Renders a subject card
   */
  renderSubjectCard(subject, profileData = null) {
    const noteClass = getSubjectNoteClass(this.currentProfile, subject.codigo);
    const profileTags = this.createProfileTags(subject, profileData);
    
    const prereqInfo = subject.prerequisitos?.length > 0
      ? `<div class="prereq-info"><strong>Requisitos:</strong> ${subject.prerequisitos.join(', ')}</div>`
      : '';
      
    const dictationTag = subject.dictation_semester
      ? `<span class="dictation-tag">${this.formatDictationSemester(subject.dictation_semester)}</span>`
      : '';
    
    return `
      <div class="subject-card subject-card-clickable ${noteClass}" data-subject="${subject.codigo}">
        <div class="subject-header">
          <div class="subject-title">
            <span class="subject-code">${subject.codigo}</span>
            <span class="subject-name-title">${subject.nombre}</span>
          </div>
        </div>
        
        <div class="subject-meta">
          <div class="meta-item semester-badge">
            <span class="icon">📚</span>
            <span>Semestre ${subject.semestre}</span>
          </div>
          <div class="meta-item credits-badge">
            <span class="icon">⭐</span>
            <span>${subject.creditos} créditos</span>
          </div>
          ${dictationTag}
          ${subject.exam_only ? '<span class="exam-only-tag">Solo Examen</span>' : ''}
        </div>
        
        ${prereqInfo}
        ${profileTags ? `<div class="subject-tags">${profileTags}</div>` : ''}
        
        <div class="subject-actions">
          <a href="index.html?highlight=${subject.codigo}" class="btn-view-graph">
            <span>Ver en Grafo</span>
            <span>→</span>
          </a>
          ${this.currentProfile === 'Ingeniería Biomédica' ? `
            <a href="table-view.html?highlight=${subject.codigo}" class="table-link">
              <span>📋</span>
              <span>Ver en Tabla</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renders a subject button for graph view
   */
  renderSubjectButton(subject, status = 'available', profileData = null) {
    const noteClass = getSubjectNoteClass(this.currentProfile, subject.codigo);
    const profileTags = this.createProfileTags(subject, profileData);
    
    const statusText = {
      'available': '✅ Disponible',
      'approved': '✓ Aprobada', 
      'locked': '🔒 Bloqueada',
      'in-progress': '📚 Cursando'
    }[status] || status;
    
    return `
      <div class="subject-button ${status} ${noteClass}" 
           data-subject="${subject.codigo}">
        <div class="subject-code">${subject.codigo}</div>
        <div class="subject-name">${subject.nombre}</div>
        <div class="subject-credits">${subject.creditos} cr</div>
        <div class="subject-status">${statusText}</div>
        ${profileTags}
      </div>
    `;
  }

  /**
   * Formats dictation semester for display
   */
  formatDictationSemester(dictation) {
    return {
      'both': 'Ambos semestres',
      '1': 'Primer semestre',
      '2': 'Segundo semestre'
    }[dictation] || dictation;
  }

  /**
   * Shows loading state
   */
  showLoading(container, message = 'Cargando...') {
    if (!container) return;
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Shows error state
   */
  showError(container, message = 'Error al cargar los datos') {
    if (!container) return;
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="retry-btn">Reintentar</button>
      </div>
    `;
  }

  /**
   * Shows empty state
   */
  showEmpty(container, message = 'No se encontraron resultados') {
    if (!container) return;
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>Sin resultados</h3>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Updates results count display
   */
  updateResultsCount(total, filtered) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
      countElement.textContent = filtered < total
        ? `Mostrando ${filtered} de ${total} materias`
        : `${total} materias`;
    }
  }

  /**
   * Highlights search terms in text
   */
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escapedTerm})`, 'gi'), '<mark>$1</mark>');
  }

  /**
   * Creates filter summary text
   */
  createFilterSummary(filters) {
    const activeFilters = [];
    
    if (filters.searchQuery) activeFilters.push(`Búsqueda: "${filters.searchQuery}"`);
    if (filters.profileFilter) activeFilters.push(`Perfil: ${filters.profileFilter}`);
    if (filters.emphasisFilter) activeFilters.push(`Énfasis: ${filters.emphasisFilter}`);
    if (filters.creditFilter) activeFilters.push(`Créditos: ${filters.creditFilter}`);
    if (filters.dictationSemesterFilter && filters.dictationSemesterFilter !== 'all') {
      activeFilters.push(`Dictado: ${this.formatDictationSemester(filters.dictationSemesterFilter)}`);
    }
    
    return activeFilters.length > 0 
      ? `Filtros activos: ${activeFilters.join(', ')}` 
      : 'Sin filtros activos';
  }

  /**
   * Shows temporary message toast
   */
  showMessage(message, duration = 3000) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message-toast';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.classList.add('fade-out');
      setTimeout(() => messageEl.remove(), 300);
    }, duration);
  }
}