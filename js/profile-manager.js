/**
 * Profile Manager module for handling profile data loading and management
 */

import { PROFILE_CONFIG, getProfileNames, getProfileConfig, validateProfileData } from './config.js';

export class ProfileManager {
  constructor() {
    this.profiles = {};
    this.loadingPromises = {};
  }

  /**
   * Load all profiles from their respective files
   */
  async loadAllProfiles() {
    const profileNames = getProfileNames();
    const loadPromises = profileNames.map(name => this.loadProfile(name));
    
    try {
      await Promise.all(loadPromises);
      console.log('All profiles loaded successfully');
      return this.profiles;
    } catch (error) {
      console.error('Error loading profiles:', error);
      throw error;
    }
  }

  /**
   * Load a specific profile from its file
   */
  async loadProfile(profileName) {
    if (this.profiles[profileName]) {
      return this.profiles[profileName];
    }

    if (this.loadingPromises[profileName]) {
      return this.loadingPromises[profileName];
    }

    const config = getProfileConfig(profileName);
    if (!config) {
      throw new Error(`Unknown profile: ${profileName}`);
    }

    this.loadingPromises[profileName] = this._fetchProfile(config.file, profileName);
    
    try {
      const profileData = await this.loadingPromises[profileName];
      this.profiles[profileName] = profileData;
      delete this.loadingPromises[profileName];
      return profileData;
    } catch (error) {
      delete this.loadingPromises[profileName];
      throw error;
    }
  }

  /**
   * Internal method to fetch profile data from file
   */
  async _fetchProfile(filePath, profileName) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load profile ${profileName}: ${response.status}`);
      }
      
      const profileData = await response.json();
      
      // Validate profile data
      validateProfileData(profileData);
      
      return profileData;
    } catch (error) {
      console.error(`Error loading profile ${profileName}:`, error);
      throw error;
    }
  }

  /**
   * Get a loaded profile
   */
  getProfile(profileName) {
    return this.profiles[profileName] || null;
  }

  /**
   * Check if a profile is loaded
   */
  isProfileLoaded(profileName) {
    return this.profiles.hasOwnProperty(profileName);
  }

  /**
   * Get all loaded profiles
   */
  getAllProfiles() {
    return { ...this.profiles };
  }

  /**
   * Check if a subject belongs to a profile
   */
  isSubjectInProfile(profileName, subjectCode) {
    const profile = this.getProfile(profileName);
    if (!profile) return false;

    return profile.materias_core.includes(subjectCode) || 
           profile.materias_optativas.includes(subjectCode) ||
           (profile.materias_sugeridas && profile.materias_sugeridas.includes(subjectCode));
  }

  /**
   * Get subject classification within a profile
   */
  getSubjectClassification(profileName, subjectCode) {
    const profile = this.getProfile(profileName);
    if (!profile) return null;

    if (profile.materias_core.includes(subjectCode)) {
      return 'core';
    }
    if (profile.materias_optativas.includes(subjectCode)) {
      return 'opcional';
    }
    if (profile.materias_sugeridas && profile.materias_sugeridas.includes(subjectCode)) {
      return 'sugerida';
    }
    
    return null;
  }

  /**
   * Check if a subject belongs to an emphasis within a profile
   */
  isSubjectInEmphasis(profileName, emphasisName, subjectCode) {
    const profile = this.getProfile(profileName);
    if (!profile || !profile.emphasis) return false;

    const emphasis = profile.emphasis.find(e => e.nombre === emphasisName);
    if (!emphasis) return false;

    return (emphasis.materias_core && emphasis.materias_core.includes(subjectCode)) ||
           (emphasis.materias_optativas && emphasis.materias_optativas.includes(subjectCode));
  }

  /**
   * Get emphasis classification for a subject
   */
  getEmphasisClassification(profileName, emphasisName, subjectCode) {
    const profile = this.getProfile(profileName);
    if (!profile || !profile.emphasis) return null;

    const emphasis = profile.emphasis.find(e => e.nombre === emphasisName);
    if (!emphasis) return null;

    if (emphasis.materias_core && emphasis.materias_core.includes(subjectCode)) {
      return 'emphasis-core';
    }
    if (emphasis.materias_optativas && emphasis.materias_optativas.includes(subjectCode)) {
      return 'emphasis-opcional';
    }
    
    return null;
  }

  /**
   * Get recommended plan for a profile
   */
  getRecommendedPlan(profileName, emphasisName = null) {
    const profile = this.getProfile(profileName);
    if (!profile) return null;

    if (emphasisName && profile.emphasis) {
      const emphasis = profile.emphasis.find(e => e.nombre === emphasisName);
      return emphasis ? emphasis.plan_recomendado : null;
    }

    return profile.plan_recomendado || null;
  }

  /**
   * Add a new profile dynamically (for future extensibility)
   */
  addProfile(profileName, profileData, config) {
    try {
      validateProfileData(profileData);
      this.profiles[profileName] = profileData;
      
      // Update configuration if provided
      if (config) {
        PROFILE_CONFIG[profileName] = config;
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding profile ${profileName}:`, error);
      return false;
    }
  }
}
