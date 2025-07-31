/**
 * Enhanced Prerequisite Manager
 * Optimized for complex prerequisite logic with multiple paths and clear user feedback
 * 
 * Key improvements:
 * - Simplified data structure with clear hierarchies
 * - Automatic transitive prerequisite calculation
 * - Human-readable explanations for all scenarios
 * - Efficient caching and validation
 * - Support for complex OR/AND combinations
 */

export class EnhancedPrerequisiteManager {
  constructor() {
    this.allSubjects = [];
    this.approvedSubjects = new Set();
    this.exoneratedSubjects = new Set();
    this.prerequisiteCache = new Map();
    this.explanationCache = new Map();
    this.transitiveCache = new Map(); // Cache for transitive prerequisites
  }

  /**
   * Initialize with subjects data
   */
  init(subjects) {
    this.allSubjects = subjects;
    this.buildCaches();
  }

  /**
   * Build all caches for efficient operation
   */
  buildCaches() {
    this.prerequisiteCache.clear();
    this.explanationCache.clear();
    this.transitiveCache.clear();
    
    this.allSubjects.forEach(subject => {
      if (subject.prerequisites && subject.prerequisites.length > 0) {
        this.prerequisiteCache.set(subject.codigo, subject.prerequisites);
        this.buildTransitivePrerequisites(subject.codigo);
      }
    });
  }

  /**
   * Build transitive prerequisites - all subjects needed to unlock a target subject
   * This automatically handles chains like: P4 requires P3, P3 requires P2, P2 requires P1
   */
  buildTransitivePrerequisites(subjectCode, visited = new Set()) {
    if (visited.has(subjectCode)) {
      console.warn(`Circular dependency detected for ${subjectCode}`);
      return [];
    }

    if (this.transitiveCache.has(subjectCode)) {
      return this.transitiveCache.get(subjectCode);
    }

    visited.add(subjectCode);
    const directPrereqs = this.prerequisiteCache.get(subjectCode) || [];
    const allCodes = new Set();

    // Extract all prerequisite codes from the requirement structure
    directPrereqs.forEach(req => {
      const codes = this.extractCodesFromRequirement(req);
      codes.forEach(code => {
        allCodes.add(code);
        // Recursively get transitive prerequisites
        const transitive = this.buildTransitivePrerequisites(code, new Set(visited));
        transitive.forEach(tCode => allCodes.add(tCode));
      });
    });

    const result = Array.from(allCodes);
    this.transitiveCache.set(subjectCode, result);
    visited.delete(subjectCode);
    return result;
  }

  /**
   * Extract all subject codes from a requirement structure
   */
  extractCodesFromRequirement(requirement) {
    const codes = [];

    if (requirement.tipo === 'SIMPLE' && requirement.codigo) {
      codes.push(requirement.codigo);
    } else if (requirement.tipo === 'OR' && requirement.opciones) {
      requirement.opciones.forEach(opcion => {
        codes.push(...this.extractCodesFromRequirement(opcion));
      });
    } else if (requirement.tipo === 'AND' && requirement.condiciones) {
      requirement.condiciones.forEach(condicion => {
        codes.push(...this.extractCodesFromRequirement(condicion));
      });
    }

    return codes;
  }

  /**
   * Check if a subject is available (all prerequisites satisfied)
   */
  isSubjectAvailable(subjectCode) {
    const prerequisites = this.prerequisiteCache.get(subjectCode);
    if (!prerequisites || prerequisites.length === 0) {
      return true;
    }

    // All requirements must be satisfied (AND logic between different requirements)
    return prerequisites.every(requirement => this.isRequirementSatisfied(requirement));
  }

  /**
   * Check if a specific requirement is satisfied
   */
  isRequirementSatisfied(requirement) {
    switch (requirement.tipo) {
      case 'SIMPLE':
        return this.checkSimpleRequirement(requirement);
      
      case 'OR':
        // At least one option must be satisfied
        return requirement.opciones.some(opcion => this.isRequirementSatisfied(opcion));
      
      case 'AND':
        // All conditions must be satisfied
        return requirement.condiciones.every(condicion => this.checkSimpleRequirement(condicion));
      
      default:
        console.warn(`Unknown requirement type: ${requirement.tipo}`);
        return false;
    }
  }

  /**
   * Check if a simple requirement is satisfied
   */
  checkSimpleRequirement(req) {
    if (!req.codigo) return true;

    const isApproved = this.approvedSubjects.has(req.codigo);
    const isExonerated = this.exoneratedSubjects.has(req.codigo);

    // Both course and exoneration required
    if (req.requiere_curso && req.requiere_exoneracion) {
      return isExonerated; // Exoneration implies course completion
    }
    
    // Only exoneration required
    if (req.requiere_exoneracion && !req.requiere_curso) {
      return isExonerated;
    }
    
    // Only course required (default) - either approval or exoneration satisfies
    return isApproved || isExonerated;
  }

  /**
   * Get detailed explanation of why a subject is not available
   * Returns a user-friendly message with clear options
   */
  getUnavailabilityExplanation(subjectCode) {
    const subject = this.allSubjects.find(s => s.codigo === subjectCode);
    if (!subject) {
      return 'Materia no encontrada.';
    }

    if (this.isSubjectAvailable(subjectCode)) {
      return `${subject.nombre} está disponible para cursar.`;
    }

    const prerequisites = this.prerequisiteCache.get(subjectCode);
    if (!prerequisites || prerequisites.length === 0) {
      return `${subject.nombre} no tiene prerequisitos.`;
    }

    const unsatisfiedRequirements = prerequisites.filter(req => !this.isRequirementSatisfied(req));
    
    if (unsatisfiedRequirements.length === 0) {
      return `${subject.nombre} está disponible para cursar.`;
    }

    let explanation = `Para poder cursar ${subject.nombre} se necesita cumplir con:\\n\\n`;
    
    unsatisfiedRequirements.forEach((req, index) => {
      const reqExplanation = this.buildRequirementExplanation(req);
      explanation += `**Requisito ${index + 1}:** ${reqExplanation}\\n\\n`;
    });

    return explanation.trim();
  }

  /**
   * Build human-readable explanation for a requirement
   */
  buildRequirementExplanation(requirement) {
    switch (requirement.tipo) {
      case 'SIMPLE':
        return requirement.description || this.generateSimpleDescription(requirement);
      
      case 'OR':
        const options = requirement.opciones.map((opcion, idx) => {
          const optionDesc = this.buildRequirementExplanation(opcion);
          return `**Opción ${idx + 1}:** ${optionDesc}`;
        });
        return options.join('\\n\\n');
      
      case 'AND':
        const conditions = requirement.condiciones.map(condicion => {
          return condicion.description || this.generateSimpleDescription(condicion);
        });
        return conditions.join(' **Y** ');
      
      default:
        return requirement.description || 'Requisito desconocido';
    }
  }

  /**
   * Generate description for simple requirements
   */
  generateSimpleDescription(req) {
    if (!req.codigo) return 'Requisito inválido';

    const subject = this.allSubjects.find(s => s.codigo === req.codigo);
    const subjectName = subject ? subject.nombre : req.codigo;

    if (req.requiere_curso && req.requiere_exoneracion) {
      return `Salvar curso **${subjectName}** y Exonerar **${subjectName}**`;
    } else if (req.requiere_exoneracion && !req.requiere_curso) {
      return `Exonerar **${subjectName}**`;
    } else {
      return `Salvar curso **${subjectName}**`;
    }
  }

  /**
   * Get all subjects that would become available if a specific subject is approved/exonerated
   */
  getUnlockedSubjects(subjectCode, asExonerated = false) {
    const unlocked = [];
    
    this.allSubjects.forEach(subject => {
      if (subject.codigo === subjectCode) return; // Skip self
      
      // Temporarily add the subject to see what becomes available
      const wasApproved = this.approvedSubjects.has(subjectCode);
      const wasExonerated = this.exoneratedSubjects.has(subjectCode);
      
      if (asExonerated) {
        this.exoneratedSubjects.add(subjectCode);
      } else {
        this.approvedSubjects.add(subjectCode);
      }
      
      const wasAvailable = this.isSubjectAvailable(subject.codigo);
      
      // Restore original state
      if (!wasApproved) this.approvedSubjects.delete(subjectCode);
      if (!wasExonerated) this.exoneratedSubjects.delete(subjectCode);
      if (asExonerated && !wasExonerated) this.exoneratedSubjects.delete(subjectCode);
      if (!asExonerated && !wasApproved) this.approvedSubjects.delete(subjectCode);
      
      const isAvailableNow = this.isSubjectAvailable(subject.codigo);
      
      if (wasAvailable && !isAvailableNow) {
        unlocked.push({
          codigo: subject.codigo,
          nombre: subject.nombre,
          semestre: subject.semestre
        });
      }
    });
    
    return unlocked.sort((a, b) => (a.semestre || 99) - (b.semestre || 99));
  }

  /**
   * Get recommended study path for a target subject
   * Returns the optimal sequence of subjects to take
   */
  getRecommendedPath(targetSubjectCode) {
    const allRequired = this.transitiveCache.get(targetSubjectCode) || [];
    const available = [];
    const pending = [];
    
    allRequired.forEach(code => {
      if (this.isSubjectAvailable(code)) {
        if (!this.approvedSubjects.has(code) && !this.exoneratedSubjects.has(code)) {
          available.push(this.allSubjects.find(s => s.codigo === code));
        }
      } else {
        pending.push(this.allSubjects.find(s => s.codigo === code));
      }
    });

    return {
      target: this.allSubjects.find(s => s.codigo === targetSubjectCode),
      availableNow: available.filter(s => s).sort((a, b) => (a.semestre || 99) - (b.semestre || 99)),
      pendingPrerequisites: pending.filter(s => s).sort((a, b) => (a.semestre || 99) - (b.semestre || 99)),
      isTargetAvailable: this.isSubjectAvailable(targetSubjectCode)
    };
  }

  /**
   * Update approval state
   */
  setApprovalState(subjectCode, isApproved, isExonerated) {
    if (isApproved) {
      this.approvedSubjects.add(subjectCode);
    } else {
      this.approvedSubjects.delete(subjectCode);
    }
    
    if (isExonerated) {
      this.exoneratedSubjects.add(subjectCode);
    } else {
      this.exoneratedSubjects.delete(subjectCode);
    }
  }

  /**
   * Get current approval state
   */
  getApprovalState(subjectCode) {
    return {
      isApproved: this.approvedSubjects.has(subjectCode),
      isExonerated: this.exoneratedSubjects.has(subjectCode)
    };
  }

  /**
   * Validate data structure integrity
   */
  validateDataStructure() {
    const errors = [];
    const validCodes = new Set(this.allSubjects.map(s => s.codigo));

    this.allSubjects.forEach(subject => {
      if (!subject.prerequisites) return;
      
      subject.prerequisites.forEach(req => {
        this.validateRequirement(req, validCodes, subject.codigo, errors);
      });
    });

    return errors;
  }

  /**
   * Validate a single requirement recursively
   */
  validateRequirement(requirement, validCodes, subjectCode, errors) {
    if (requirement.tipo === 'SIMPLE') {
      if (requirement.codigo && !validCodes.has(requirement.codigo)) {
        errors.push(`Subject ${subjectCode} references invalid prerequisite: ${requirement.codigo}`);
      }
    } else if (requirement.tipo === 'OR' && requirement.opciones) {
      requirement.opciones.forEach(opcion => {
        this.validateRequirement(opcion, validCodes, subjectCode, errors);
      });
    } else if (requirement.tipo === 'AND' && requirement.condiciones) {
      requirement.condiciones.forEach(condicion => {
        if (condicion.codigo && !validCodes.has(condicion.codigo)) {
          errors.push(`Subject ${subjectCode} references invalid prerequisite: ${condicion.codigo}`);
        }
      });
    }
  }
}
