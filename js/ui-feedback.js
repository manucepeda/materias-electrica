/**
 * Enhanced UI Feedback Component
 * Provides clear, user-friendly explanations for prerequisite requirements
 */

export class PrerequisiteUIFeedback {
  constructor(prerequisiteManager) {
    this.prerequisiteManager = prerequisiteManager;
    this.allSubjects = [];
  }

  /**
   * Initialize with subjects data
   */
  init(subjects) {
    this.allSubjects = subjects;
  }

  /**
   * Generate detailed prerequisite explanation modal/popup content
   */
  generatePrerequisiteExplanation(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (!subject) {
      return this.createErrorMessage('Materia no encontrada');
    }

    const isAvailable = this.prerequisiteManager.isSubjectAvailable(subjectCode);
    
    if (isAvailable) {
      return this.createSuccessMessage(subject);
    }

    const explanation = this.prerequisiteManager.getUnavailabilityExplanation(subjectCode);
    const recommendedPath = this.prerequisiteManager.getRecommendedPath(subjectCode);
    
    return this.createDetailedExplanationHTML(subject, explanation, recommendedPath);
  }

  /**
   * Create success message when subject is available
   */
  createSuccessMessage(subject) {
    return `
      <div class="prerequisite-explanation success">
        <div class="explanation-header success">
          <h3>✅ ${subject.nombre}</h3>
          <span class="status-badge available">Disponible</span>
        </div>
        <div class="explanation-content">
          <p class="success-message">
            Esta materia está disponible para cursar. Todos los previas han sido cumplidos.
          </p>
          <div class="action-buttons">
            <button class="btn-primary" onclick="this.markAsPlanned('${subject.codigo}')">
              📋 Agregar al Plan
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create detailed explanation for unavailable subjects
   */
  createDetailedExplanationHTML(subject, explanation, recommendedPath) {
    const requirements = this.parseExplanationRequirements(explanation);
    
    return `
      <div class="prerequisite-explanation unavailable">
        <div class="explanation-header unavailable">
          <h3>⚠️ ${subject.nombre}</h3>
          <span class="status-badge unavailable">No Disponible</span>
        </div>
        
        <div class="explanation-content">
          <div class="requirements-section">
            <h4>📋 Requisitos Pendientes:</h4>
            ${this.renderRequirements(requirements)}
          </div>
          
          ${recommendedPath.availableNow.length > 0 ? `
            <div class="available-now-section">
              <h4>✅ Puedes cursar ahora:</h4>
              <div class="subject-list available">
                ${recommendedPath.availableNow.map(subj => 
                  `<div class="subject-item available">
                     <span class="subject-code">${subj.codigo}</span>
                     <span class="subject-name">${subj.nombre}</span>
                     <span class="subject-semester">Sem. ${subj.semestre || '?'}</span>
                   </div>`
                ).join('')}
              </div>
            </div>
          ` : ''}
          
          ${recommendedPath.pendingPrerequisites.length > 0 ? `
            <div class="pending-section">
              <h4>⏳ Previas pendientes:</h4>
              <div class="subject-list pending">
                ${recommendedPath.pendingPrerequisites.map(subj => 
                  `<div class="subject-item pending">
                     <span class="subject-code">${subj.codigo}</span>
                     <span class="subject-name">${subj.nombre}</span>
                     <span class="subject-semester">Sem. ${subj.semestre || '?'}</span>
                   </div>`
                ).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="action-buttons">
            <button class="btn-secondary" onclick="this.showRecommendedPath('${subject.codigo}')">
              🗺️ Ver Ruta Recomendada
            </button>
            <button class="btn-tertiary" onclick="this.simulatePrerequisites('${subject.codigo}')">
              🔮 Simular Progreso
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create error message
   */
  createErrorMessage(message) {
    return `
      <div class="prerequisite-explanation error">
        <div class="explanation-header error">
          <h3>❌ Error</h3>
        </div>
        <div class="explanation-content">
          <p class="error-message">${message}</p>
        </div>
      </div>
    `;
  }

  /**
   * Parse explanation text into structured requirements
   */
  parseExplanationRequirements(explanation) {
    // This would parse the markdown-like explanation into structured data
    // For now, return the explanation as-is with proper formatting
    return explanation
      .split('\\n\\n')
      .filter(section => section.trim())
      .map(section => ({
        text: section.trim(),
        type: section.includes('**Opción') ? 'option' : 'requirement'
      }));
  }

  /**
   * Render requirements with proper formatting
   */
  renderRequirements(requirements) {
    return requirements.map(req => {
      if (req.type === 'option') {
        return `<div class="requirement-option">${this.formatMarkdown(req.text)}</div>`;
      } else {
        return `<div class="requirement-item">${this.formatMarkdown(req.text)}</div>`;
      }
    }).join('');
  }

  /**
   * Simple markdown formatter for bold text
   */
  formatMarkdown(text) {
    return text.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  }

  /**
   * Generate prerequisite card for subject listings
   */
  generatePrerequisiteCard(subject) {
    if (!subject.prerequisites || subject.prerequisites.length === 0) {
      return `
        <div class="prereq-card no-prereq">
          <span class="prereq-status">✅ Sin previas</span>
        </div>
      `;
    }

    const isAvailable = this.prerequisiteManager.isSubjectAvailable(subject.codigo);
    
    if (isAvailable) {
      return `
        <div class="prereq-card available">
          <span class="prereq-status">✅ Disponible</span>
          <button class="prereq-details-btn" onclick="this.showPrerequisiteDetails('${subject.codigo}')">
            Ver detalles
          </button>
        </div>
      `;
    }

    const missingCount = this.getMissingPrerequisiteCount(subject);
    
    return `
      <div class="prereq-card unavailable">
        <span class="prereq-status">⚠️ ${missingCount} pendiente${missingCount > 1 ? 's' : ''}</span>
        <button class="prereq-details-btn" onclick="this.showPrerequisiteDetails('${subject.codigo}')">
          ¿Qué necesito?
        </button>
      </div>
    `;
  }

  /**
   * Get count of missing prerequisites
   */
  getMissingPrerequisiteCount(subject) {
    // Simple count - in reality this would be more sophisticated
    let count = 0;
    
    if (subject.prerequisites) {
      subject.prerequisites.forEach(req => {
        if (!this.prerequisiteManager.isRequirementSatisfied(req)) {
          count++;
        }
      });
    }
    
    return count;
  }

  /**
   * Generate interactive prerequisite tree/graph
   */
  generatePrerequisiteTree(subjectCode) {
    const recommendedPath = this.prerequisiteManager.getRecommendedPath(subjectCode);
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    
    if (!subject) return '';

    const treeHTML = `
      <div class="prerequisite-tree">
        <div class="tree-header">
          <h4>📊 Árbol de Previas: ${subject.nombre}</h4>
        </div>
        
        <div class="tree-content">
          <div class="target-subject">
            <div class="subject-node target ${recommendedPath.isTargetAvailable ? 'available' : 'locked'}">
              <span class="node-code">${subject.codigo}</span>
              <span class="node-name">${subject.nombre}</span>
              <span class="node-status">${recommendedPath.isTargetAvailable ? '✅' : '🔒'}</span>
            </div>
          </div>
          
          ${this.renderPrerequisiteNodes(subject.prerequisites || [])}
        </div>
        
        <div class="tree-legend">
          <div class="legend-item">
            <span class="legend-icon available">✅</span>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon completed">✓</span>
            <span>Completada</span>
          </div>
          <div class="legend-item">
            <span class="legend-icon locked">🔒</span>
            <span>Bloqueada</span>
          </div>
        </div>
      </div>
    `;
    
    return treeHTML;
  }

  /**
   * Render prerequisite nodes recursively
   */
  renderPrerequisiteNodes(prerequisites) {
    return prerequisites.map(req => {
      const isSatisfied = this.prerequisiteManager.isRequirementSatisfied(req);
      
      if (req.tipo === 'SIMPLE') {
        const prereqSubject = this.allSubjects.find(s => s.codigo === req.codigo);
        const approval = this.prerequisiteManager.getApprovalState(req.codigo);
        
        let status = '🔒';
        let statusClass = 'locked';
        
        if (approval.isExonerated) {
          status = '🏆';
          statusClass = 'exonerated';
        } else if (approval.isApproved) {
          status = '✓';
          statusClass = 'approved';
        } else if (this.prerequisiteManager.isSubjectAvailable(req.codigo)) {
          status = '✅';
          statusClass = 'available';
        }
        
        return `
          <div class="subject-node prereq ${statusClass}">
            <span class="node-code">${req.codigo}</span>
            <span class="node-name">${prereqSubject ? prereqSubject.nombre : 'Desconocida'}</span>
            <span class="node-status">${status}</span>
            <span class="node-requirement">${req.description || ''}</span>
          </div>
        `;
      }
      
      if (req.tipo === 'OR') {
        return `
          <div class="requirement-group or-group ${isSatisfied ? 'satisfied' : 'unsatisfied'}">
            <div class="group-header">Una de las siguientes:</div>
            <div class="group-options">
              ${req.opciones.map(option => this.renderPrerequisiteNodes([option])).join('')}
            </div>
          </div>
        `;
      }
      
      if (req.tipo === 'AND') {
        return `
          <div class="requirement-group and-group ${isSatisfied ? 'satisfied' : 'unsatisfied'}">
            <div class="group-header">Todas las siguientes:</div>
            <div class="group-conditions">
              ${req.condiciones.map(cond => {
                const condSubject = this.allSubjects.find(s => s.codigo === cond.codigo);
                const approval = this.prerequisiteManager.getApprovalState(cond.codigo);
                
                let status = '🔒';
                if (approval.isExonerated) status = '🏆';
                else if (approval.isApproved) status = '✓';
                else if (this.prerequisiteManager.isSubjectAvailable(cond.codigo)) status = '✅';
                
                return `
                  <div class="condition-node">
                    <span class="node-code">${cond.codigo}</span>
                    <span class="node-name">${condSubject ? condSubject.nombre : 'Desconocida'}</span>
                    <span class="node-status">${status}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
      
      return '';
    }).join('');
  }

  /**
   * Generate CSS styles for the prerequisite UI components
   */
  generateCSS() {
    return `
      <style>
        .prerequisite-explanation {
          max-width: 600px;
          margin: 0 auto;
          background: var(--card-background, #fff);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .explanation-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .explanation-header.success {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .explanation-header.unavailable {
          background: linear-gradient(135deg, #FF9800, #f57c00);
          color: white;
        }

        .explanation-header.error {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-badge.available {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .status-badge.unavailable {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .explanation-content {
          padding: 20px;
        }

        .requirements-section, .available-now-section, .pending-section {
          margin-bottom: 20px;
        }

        .requirements-section h4, .available-now-section h4, .pending-section h4 {
          margin: 0 0 10px 0;
          color: var(--text-primary, #333);
          font-size: 16px;
        }

        .requirement-item, .requirement-option {
          background: var(--background-secondary, #f5f5f5);
          padding: 12px;
          margin: 8px 0;
          border-radius: 8px;
          border-left: 4px solid var(--accent-color, #2196F3);
        }

        .requirement-option {
          border-left-color: var(--warning-color, #FF9800);
        }

        .subject-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subject-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-radius: 6px;
          background: var(--background-secondary, #f5f5f5);
        }

        .subject-item.available {
          background: rgba(76, 175, 80, 0.1);
          border-left: 3px solid #4CAF50;
        }

        .subject-item.pending {
          background: rgba(255, 152, 0, 0.1);
          border-left: 3px solid #FF9800;
        }

        .subject-code {
          font-weight: bold;
          color: var(--primary-color, #2196F3);
        }

        .subject-name {
          flex: 1;
          margin: 0 10px;
        }

        .subject-semester {
          font-size: 12px;
          color: var(--text-secondary, #666);
          background: var(--background-tertiary, #eee);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: center;
        }

        .btn-primary, .btn-secondary, .btn-tertiary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--primary-color, #2196F3);
          color: white;
        }

        .btn-secondary {
          background: var(--secondary-color, #9E9E9E);
          color: white;
        }

        .btn-tertiary {
          background: transparent;
          color: var(--primary-color, #2196F3);
          border: 2px solid var(--primary-color, #2196F3);
        }

        .btn-primary:hover, .btn-secondary:hover, .btn-tertiary:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .prereq-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .prereq-card.available {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .prereq-card.unavailable {
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .prereq-card.no-prereq {
          background: rgba(96, 125, 139, 0.1);
          border: 1px solid rgba(96, 125, 139, 0.3);
        }

        .prereq-details-btn {
          background: none;
          border: none;
          color: var(--primary-color, #2196F3);
          cursor: pointer;
          font-size: 12px;
          text-decoration: underline;
        }

        .prerequisite-tree {
          background: var(--card-background, #fff);
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .subject-node {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          margin: 4px 0;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .subject-node.available {
          background: rgba(76, 175, 80, 0.1);
          border-color: #4CAF50;
        }

        .subject-node.approved {
          background: rgba(33, 150, 243, 0.1);
          border-color: #2196F3;
        }

        .subject-node.exonerated {
          background: rgba(255, 193, 7, 0.1);
          border-color: #FFC107;
        }

        .subject-node.locked {
          background: rgba(158, 158, 158, 0.1);
          border-color: #9E9E9E;
        }

        .requirement-group {
          margin: 12px 0;
          padding: 12px;
          border-radius: 8px;
          border: 2px dashed #ddd;
        }

        .requirement-group.satisfied {
          border-color: #4CAF50;
          background: rgba(76, 175, 80, 0.05);
        }

        .requirement-group.unsatisfied {
          border-color: #FF9800;
          background: rgba(255, 152, 0, 0.05);
        }

        .group-header {
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--text-primary, #333);
        }

        .tree-legend {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #ddd;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
      </style>
    `;
  }
}
