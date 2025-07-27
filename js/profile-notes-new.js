/**
 * Profile Notes Manager for handling profile-specific notes and interactions
 */

import { getSubjectNoteClass } from './config.js';

export class ProfileNotesManager {
  constructor() {
    this.currentProfile = null;
    this.highlightedSubjects = new Set();
  }

  /**
   * Set the current profile for note management
   */
  setProfile(profileName) {
    this.currentProfile = profileName;
    this.clearHighlights();
  }

  /**
   * Handle note card hover to highlight related subjects
   */
  handleNoteHover(noteId, isHovering) {
    if (!this.currentProfile) return;

    const subjects = this.getSubjectsForNote(noteId);
    
    if (isHovering) {
      this.highlightSubjects(subjects);
    } else {
      this.clearHighlights();
    }
  }

  /**
   * Get subjects related to a specific note
   */
  getSubjectsForNote(noteId) {
    // This would be expanded based on note mappings
    // For now, return empty array
    return [];
  }

  /**
   * Highlight subjects related to a note
   */
  highlightSubjects(subjectCodes) {
    this.clearHighlights();
    
    subjectCodes.forEach(code => {
      const elements = document.querySelectorAll(`[data-subject-code="${code}"]`);
      elements.forEach(el => {
        el.classList.add('highlighted');
        this.highlightedSubjects.add(code);
      });
    });
  }

  /**
   * Clear all subject highlights
   */
  clearHighlights() {
    this.highlightedSubjects.forEach(code => {
      const elements = document.querySelectorAll(`[data-subject-code="${code}"]`);
      elements.forEach(el => el.classList.remove('highlighted'));
    });
    this.highlightedSubjects.clear();
  }

  /**
   * Setup note card event listeners
   */
  setupNoteEventListeners() {
    const noteCards = document.querySelectorAll('.note-card');
    
    noteCards.forEach(card => {
      const noteId = card.dataset.noteId;
      
      card.addEventListener('mouseenter', () => {
        this.handleNoteHover(noteId, true);
      });
      
      card.addEventListener('mouseleave', () => {
        this.handleNoteHover(noteId, false);
      });
    });
  }

  /**
   * Get note class for a subject in the current profile
   */
  getSubjectNoteClass(subjectCode) {
    if (!this.currentProfile) return '';
    return getSubjectNoteClass(this.currentProfile, subjectCode);
  }
}