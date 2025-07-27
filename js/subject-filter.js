/**
 * Subject Filter module for filtering subjects based on various criteria
 */

export class SubjectFilter {
  constructor(profileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Get default dictation semester based on semester number
   * @param {number} semester - The semester number
   * @returns {string} The default dictation semester ('1' or '2')
   */
  getDefaultDictationSemester(semester) {
    return semester % 2 === 1 ? '1' : '2';
  }

  /**
   * Filter subjects based on search query
   */
  filterBySearch(subjects, searchQuery) {
    if (!searchQuery) return subjects;
    
    const query = searchQuery.toLowerCase();
    return subjects.filter(subject => 
      subject.nombre.toLowerCase().includes(query) || 
      (subject.codigo && subject.codigo.toLowerCase().includes(query))
    );
  }

  /**
   * Filter subjects by semester
   */
  filterBySemester(subjects, semester) {
    if (!semester) return subjects;
    
    return subjects.filter(subject => String(subject.semestre) === semester);
  }

  /**
   * Filter subjects by credits
   */
  filterByCredits(subjects, credits) {
    if (!credits) return subjects;
    
    return subjects.filter(subject => String(subject.creditos) === credits);
  }

  /**
   * Filter subjects by dictation semester
   */
  filterByDictationSemester(subjects, dictationSemester) {
    if (dictationSemester === 'all') return subjects;

    return subjects.filter(subject => {
      if (!subject.dictation_semester) {
        // Default dictation semester based on the current semester value
        const defaultDictation = this.getDefaultDictationSemester(subject.semestre);
        if (dictationSemester === 'both') return false;
        return dictationSemester === defaultDictation;
      } else {
        // Check the actual dictation semester value
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
   * Filter subjects by profile and emphasis
   */
  filterByProfile(subjects, profileName, emphasisName = null) {
    if (!profileName) return subjects;

    return subjects.filter(subject => {
      // Check if subject belongs to the profile
      const belongsToProfile = this.profileManager.isSubjectInProfile(profileName, subject.codigo);
      
      // If emphasis is selected, also check emphasis
      if (emphasisName) {
        const belongsToEmphasis = this.profileManager.isSubjectInEmphasis(
          profileName, emphasisName, subject.codigo
        );
        
        // Subject matches if it belongs to profile OR emphasis
        return belongsToProfile || belongsToEmphasis;
      }
      
      return belongsToProfile;
    });
  }

  /**
   * Filter subjects by exam-only status
   */
  filterByExamOnly(subjects, showExamOnly) {
    if (showExamOnly) return subjects;
    
    return subjects.filter(subject => !subject.exam_only);
  }

  /**
   * Filter subjects by credit range
   */
  filterByCreditRange(subjects, creditFilter) {
    if (creditFilter === 'all') return subjects;
    
    if (creditFilter === 'less10') {
      return subjects.filter(subject => parseInt(subject.creditos) < 10);
    } else if (creditFilter === 'more10') {
      return subjects.filter(subject => parseInt(subject.creditos) >= 10);
    }
    
    return subjects;
  }

  /**
   * Apply all filters to subjects
   */
  applyFilters(subjects, filters) {
    let filtered = [...subjects];

    // Apply search filter
    if (filters.search) {
      filtered = this.filterBySearch(filtered, filters.search);
    }

    // Apply semester filter
    if (filters.semester) {
      filtered = this.filterBySemester(filtered, filters.semester);
    }

    // Apply credits filter
    if (filters.credits) {
      filtered = this.filterByCredits(filtered, filters.credits);
    }

    // Apply dictation semester filter
    if (filters.dictationSemester) {
      filtered = this.filterByDictationSemester(filtered, filters.dictationSemester);
    }

    // Apply profile filter
    if (filters.profile) {
      filtered = this.filterByProfile(filtered, filters.profile, filters.emphasis);
    }

    // Apply exam-only filter
    if (filters.hasOwnProperty('showExamOnly')) {
      filtered = this.filterByExamOnly(filtered, filters.showExamOnly);
    }

    // Apply credit range filter
    if (filters.creditRange) {
      filtered = this.filterByCreditRange(filtered, filters.creditRange);
    }

    return filtered;
  }

  /**
   * Sort subjects by criteria
   */
  sortSubjects(subjects, sortBy = 'semester') {
    return subjects.sort((a, b) => {
      switch (sortBy) {
        case 'semester':
          if (a.semestre !== b.semestre) {
            return a.semestre - b.semestre;
          }
          return a.nombre.localeCompare(b.nombre);
        
        case 'name':
          return a.nombre.localeCompare(b.nombre);
        
        case 'credits':
          if (a.creditos !== b.creditos) {
            return b.creditos - a.creditos; // Descending
          }
          return a.nombre.localeCompare(b.nombre);
        
        case 'code':
          return (a.codigo || '').localeCompare(b.codigo || '');
        
        default:
          return 0;
      }
    });
  }

  /**
   * Get unique values for filter options
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
   * Get statistics for filtered subjects
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
