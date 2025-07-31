/**
 * Data Manager - Centralized data loading and management
 * Handles both static file loading and API communication
 */

import { getApiUrl } from './config.js';

export class DataManager {
  constructor() {
    this.subjects = [];
    this.profiles = {};
    this.isBackendAvailable = false;
    this.cache = new Map();
  }

  /**
   * Initialize data manager and detect backend availability
   */
  async init() {
    try {
      // Test if backend is available
      await this.testBackendConnection();
      console.log('Backend detected - using API endpoints');
    } catch (error) {
      console.log('Backend not available - using static files');
      this.isBackendAvailable = false;
    }
  }

  /**
   * Test backend connection
   */
  async testBackendConnection() {
    try {
      const response = await fetch(getApiUrl('SUBJECTS'), {
        method: 'HEAD',
        timeout: 2000
      });
      this.isBackendAvailable = response.ok;
      return this.isBackendAvailable;
    } catch (error) {
      this.isBackendAvailable = false;
      return false;
    }
  }

  /**
   * Load subjects data from appropriate source
   */
  async loadSubjects() {
    const cacheKey = 'subjects';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let subjects;
      
      if (this.isBackendAvailable) {
        // Load from API
        const response = await fetch(getApiUrl('SUBJECTS'));
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        subjects = await response.json();
      } else {
        // Load from static file
        const response = await fetch('data/ucs-migrated.json');
        if (!response.ok) {
          throw new Error(`Static file error: ${response.status}`);
        }
        subjects = await response.json();
      }

      // Validate and clean data
      subjects = this.validateSubjectsData(subjects);
      
      this.subjects = subjects;
      this.cache.set(cacheKey, subjects);
      return subjects;
    } catch (error) {
      console.error('Error loading subjects:', error);
      
      // Fallback: try alternative source
      try {
        const response = await fetch('data/ucs-migrated.json');
        if (response.ok) {
          const subjects = await response.json();
          const validatedSubjects = this.validateSubjectsData(subjects);
          this.subjects = validatedSubjects;
          this.cache.set(cacheKey, validatedSubjects);
          return validatedSubjects;
        }
      } catch (fallbackError) {
        console.error('Fallback loading failed:', fallbackError);
      }
      
      throw new Error('Failed to load subjects data from any source');
    }
  }

  /**
   * Save subjects data (only available with backend)
   */
  async saveSubjects(subjects) {
    if (!this.isBackendAvailable) {
      throw new Error('Cannot save: Backend not available');
    }

    try {
      const response = await fetch(getApiUrl('SUBJECTS_SAVE'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjects)
      });

      if (!response.ok) {
        throw new Error(`Save error: ${response.status}`);
      }

      const result = await response.json();
      
      // Update cache
      this.subjects = subjects;
      this.cache.set('subjects', subjects);
      
      return result;
    } catch (error) {
      console.error('Error saving subjects:', error);
      throw error;
    }
  }

  /**
   * Load profile data
   */
  async loadProfile(profileName, profileConfig) {
    const cacheKey = `profile_${profileName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(profileConfig.file);
      if (!response.ok) {
        throw new Error(`Failed to load profile ${profileName}: ${response.status}`);
      }
      
      const profileData = await response.json();
      this.validateProfileData(profileData);
      
      this.profiles[profileName] = profileData;
      this.cache.set(cacheKey, profileData);
      return profileData;
    } catch (error) {
      console.error(`Error loading profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Validate subjects data
   */
  validateSubjectsData(subjects) {
    if (!Array.isArray(subjects)) {
      throw new Error('Subjects data must be an array');
    }

    return subjects.filter(subject => {
      // Basic validation
      if (!subject || typeof subject !== 'object') return false;
      if (!subject.codigo || !subject.nombre) return false;
      
      // Ensure required fields have defaults
      subject.creditos = subject.creditos || 0;
      subject.semestre = subject.semestre || 1;
      subject.dictation_semester = subject.dictation_semester || 'both';
      subject.exam_only = subject.exam_only || false;
      subject.prerequisites = subject.prerequisites || [];
      
      return true;
    });
  }

  /**
   * Validate profile data
   */
  validateProfileData(profileData) {
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Invalid profile data: must be an object');
    }
    
    // Allow flexible profile structure
    if (!profileData.subjects && !profileData.materias) {
      console.warn('Profile data missing subjects/materias array');
    }
    
    return true;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached data
   */
  getCachedSubjects() {
    return this.subjects;
  }

  /**
   * Get cached profile
   */
  getCachedProfile(profileName) {
    return this.profiles[profileName] || null;
  }

  /**
   * Check if backend is available
   */
  getBackendStatus() {
    return this.isBackendAvailable;
  }
}

// Create singleton instance
export const dataManager = new DataManager();
