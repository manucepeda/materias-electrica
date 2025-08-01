/**
 * Módulo de Filtros de Materias - Sistema de filtrado avanzado
 * Maneja la lógica de filtrado de materias por múltiples criterios
 */

export class SubjectFilter {
  constructor() {
    this.searchQuery = '';
    this.creditFilter = '';
    this.dictationSemesterFilter = 'all';
    this.profileFilter = null;
    this.emphasisFilter = null;
  }

  /**
   * Set search query filter
   */
  setSearchQuery(query) {
    this.searchQuery = query || '';
  }

  /**
   * Set credit filter
   */
  setCreditFilter(credits) {
    this.creditFilter = credits || '';
  }

  /**
   * Set dictation semester filter
   */
  setDictationSemesterFilter(semester) {
    this.dictationSemesterFilter = semester || 'all';
  }

  /**
   * Set profile and emphasis filter
   */
  setProfileFilter(profile, emphasis = null) {
    this.profileFilter = profile;
    this.emphasisFilter = emphasis;
  }

  /**
   * Apply all active filters to subjects array
   */
  applyFilters(subjects, profileManager) {
    let filtered = [...subjects];

    // Apply search filter
    if (this.searchQuery) {
      filtered = this.filterBySearch(filtered, this.searchQuery);
    }

    // Apply credit filter
    if (this.creditFilter) {
      filtered = this.filterByCredits(filtered, this.creditFilter);
    }

    // Apply dictation semester filter
    if (this.dictationSemesterFilter !== 'all') {
      filtered = this.filterByDictationSemester(filtered, this.dictationSemesterFilter);
    }

    // Apply profile filter
    if (this.profileFilter && profileManager) {
      filtered = this.filterByProfile(filtered, this.profileFilter, this.emphasisFilter, profileManager);
    }

    return filtered;
  }

  /**
   * Obtener semestre de dictado por defecto basado en el número de semestre
   * @param {number} semester - El número de semestre
   * @returns {string} El semestre de dictado por defecto ('1' o '2')
   */
  getDefaultDictationSemester(semester) {
    return semester % 2 === 1 ? '1' : '2';
  }

  /**
   * Filtrar materias por consulta de búsqueda
   */
  filterBySearch(subjects, searchQuery) {
    if (!searchQuery) return subjects;
    
    const query = searchQuery.toLowerCase();
    return subjects.filter(subject => 
      (subject.nombre && subject.nombre.toLowerCase().includes(query)) || 
      (subject.codigo && subject.codigo.toLowerCase().includes(query))
    );
  }

  /**
   * Filtrar materias por créditos específicos o rangos
   */
  filterByCredits(subjects, creditValue) {
    if (!creditValue) return subjects;
    
    return subjects.filter(subject => {
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
          return credits === targetCredits;
      }
    });
  }

  /**
   * Filtrar materias por semestre de dictado
   */
  filterByDictationSemester(subjects, dictationSemester) {
    if (dictationSemester === 'all') return subjects;

    return subjects.filter(subject => {
      if (!subject.dictation_semester) {
        // Semestre de dictado por defecto basado en el valor de semestre actual
        const defaultDictation = this.getDefaultDictationSemester(subject.semestre);
        if (dictationSemester === 'both') return false;
        return dictationSemester === defaultDictation;
      } else {
        // Verificar el valor real de semestre de dictado
        if (dictationSemester === 'both') {
          return subject.dictation_semester === 'both';
        } else {
          return subject.dictation_semester === dictationSemester || 
                 subject.dictation_semester === 'both';
        }
      }
    });
  }

  /**
   * Filtrar materias por perfil y énfasis
   */
  filterByProfile(subjects, profileName, emphasisName = null, profileManager) {
    if (!profileName || !profileManager) return subjects;

    return subjects.filter(subject => {
      // Check if subject belongs to profile
      const belongsToProfile = profileManager.isSubjectInProfile(profileName, subject.codigo);
      
      // If emphasis is selected, also check emphasis
      if (emphasisName && profileManager.isSubjectInEmphasis) {
        const belongsToEmphasis = profileManager.isSubjectInEmphasis(
          profileName, emphasisName, subject.codigo
        );
        
        // Subject matches if it belongs to profile OR emphasis
        return belongsToProfile || belongsToEmphasis;
      }
      
      return belongsToProfile;
    });
  }

  /**
   * Filtrar materias por estado de materia libre
   */
  filterByExamOnly(subjects, showExamOnly) {
    if (showExamOnly) return subjects;
    
    return subjects.filter(subject => !subject.exam_only);
  }

  /**
   * Ordenar materias por criterio
   */
  sortSubjects(subjects, sortBy = 'semester') {
    return subjects.sort((a, b) => {
      switch (sortBy) {
        case 'semester':
          if (a.semestre !== b.semestre) {
            return a.semestre - b.semestre;
          }
          return (a.nombre || '').localeCompare(b.nombre || '');
        
        case 'name':
          return (a.nombre || '').localeCompare(b.nombre || '');
        
        case 'credits':
          if (a.creditos !== b.creditos) {
            return b.creditos - a.creditos; // Descendente
          }
          return (a.nombre || '').localeCompare(b.nombre || '');
        
        case 'code':
          return (a.codigo || '').localeCompare(b.codigo || '');
        
        default:
          return 0;
      }
    });
  }

  /**
   * Obtener valores únicos para opciones de filtros
   */
  getFilterOptions(subjects) {
    const semesters = [...new Set(subjects.map(s => s.semestre))].sort((a, b) => a - b);
    const credits = [...new Set(subjects.map(s => s.creditos))].sort((a, b) => a - b);
    
    return {
      semesters,
      credits
    };
  }

  /**
   * Obtener estadísticas de materias filtradas
   */
  getFilterStats(subjects) {
    return {
      total: subjects.length,
      totalCredits: subjects.reduce((sum, subject) => sum + parseInt(subject.creditos || 0), 0),
      examOnly: subjects.filter(s => s.exam_only).length,
      bySemester: subjects.reduce((acc, subject) => {
        acc[subject.semestre] = (acc[subject.semestre] || 0) + 1;
        return acc;
      }, {}),
      byCredits: subjects.reduce((acc, subject) => {
        acc[subject.creditos] = (acc[subject.creditos] || 0) + 1;
        return acc;
      }, {})
    };
  }
}
