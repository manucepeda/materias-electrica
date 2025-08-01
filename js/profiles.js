/**
 * Profile Manager module for handling profile data loading and management
 */

import { PROFILE_CONFIG, getProfileNames, getProfileConfig, validateProfileData } from './config.js';
import { dataManager } from './data-manager.js';

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

    this.loadingPromises[profileName] = dataManager.loadProfile(profileName, config);
    
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
   * Get profile subjects filtered by emphasis
   */
  getProfileSubjects(profileName, emphasis = null) {
    const profile = this.getProfile(profileName);
    if (!profile || !profile.subjects) {
      return [];
    }

    let subjects = profile.subjects;
    
    // Filter by emphasis if provided
    if (emphasis && profile.subjects_by_emphasis && profile.subjects_by_emphasis[emphasis]) {
      subjects = profile.subjects_by_emphasis[emphasis];
    }

    return subjects;
  }

  /**
   * Check if a subject is in the profile
   */
  isSubjectInProfile(profileName, subjectCode, emphasis = null) {
    const profileSubjects = this.getProfileSubjects(profileName, emphasis);
    return profileSubjects.some(subject => subject.codigo === subjectCode);
  }

  /**
   * Get profile statistics
   */
  getProfileStats(profileName, emphasis = null) {
    const profileSubjects = this.getProfileSubjects(profileName, emphasis);
    
    const stats = {
      totalSubjects: profileSubjects.length,
      totalCredits: profileSubjects.reduce((sum, subject) => sum + (subject.creditos || 0), 0),
      subjectsBySemester: {},
      subjectsByType: {
        core: 0,
        optional: 0,
        suggested: 0
      }
    };

    profileSubjects.forEach(subject => {
      // Count by semester
      const semester = subject.semestre || 'unknown';
      stats.subjectsBySemester[semester] = (stats.subjectsBySemester[semester] || 0) + 1;
      
      // Count by type (if available)
      if (subject.type) {
        stats.subjectsByType[subject.type] = (stats.subjectsByType[subject.type] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Clear all loaded profiles
   */
  clearProfiles() {
    this.profiles = {};
    this.loadingPromises = {};
  }

  /**
   * Reload a specific profile
   */
  async reloadProfile(profileName) {
    delete this.profiles[profileName];
    delete this.loadingPromises[profileName];
    return this.loadProfile(profileName);
  }
}
