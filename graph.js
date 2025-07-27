// Global variables
let allSubjects = []; // All subjects from ucs.json
let profiles = {}; // All profile data from profile JSON files
let selectedPerfil = '';
let selectedEmphasis = '';
let approvedSubjects = new Set(); // Subjects that are approved but not exonerated
let exoneratedSubjects = new Set(); // Subjects that are exonerated
let totalCredits = 0;
let showExamOnlySubjects = false;
let selectedDictationSemester = 'all';
let selectedCreditFilter = 'all';
let recommendedSubjects = []; // Subjects recommended for the selected emphasis
let showRecommendedPath = false; // Flag to show recommended path

// Static definition of profile emphasis options
const EMPHASIS_OPTIONS = {
  'Electrónica': ['Electrónica Biomédica', 'Sistemas Embebidos', 'Circuitos y Sistemas Electrónicos'],
  'Ingeniería Biomédica': ['Electrónica', 'Ingeniería Clínica', 'Señales', 'Informática']
};

// Profiles that don't have emphasis options
const NO_EMPHASIS_PROFILES = ['Control', 'Sistemas Eléctricos de Potencia'];

// Profile file mapping
const PROFILE_FILES = {
  'Electrónica': 'data/profiles/electronica.json',
  'Control': 'data/profiles/control.json',
  'Sistemas Eléctricos de Potencia': 'data/profiles/potencia.json',
  'Ingeniería Biomédica': 'data/profiles/biomedica.json'
};

async function load() {
  try {
    // Load all universal subject data
    const ucsResponse = await fetch('data/ucs.json');
    if (!ucsResponse.ok) {
      throw new Error('Failed to load universal subjects data');
    }
    allSubjects = await ucsResponse.json();
    
    // Load all profiles
    for (const [profileName, profileFile] of Object.entries(PROFILE_FILES)) {
      try {
        const profileResponse = await fetch(profileFile);
        if (profileResponse.ok) {
          profiles[profileName] = await profileResponse.json();
        } else {
          console.error(`Failed to load profile data for ${profileName}`);
        }
      } catch (e) {
        console.error(`Error loading profile data for ${profileName}:`, e);
      }
    }
    
    // Add event listeners to profile and emphasis selectors
    document.getElementById('perfil').addEventListener('change', handleProfileChange);
    document.getElementById('emphasis').addEventListener('change', handleEmphasisChange);
    
    // Add event listeners to the new filters
    document.getElementById('dictationSemester').addEventListener('change', handleDictationSemesterChange);
    document.getElementById('examOnlyFilter').addEventListener('click', toggleExamOnlyFilter);
    document.getElementById('creditFilter').addEventListener('change', handleCreditFilterChange);
    
    // Initialize the graph (empty)
    renderGraph();
  } catch (e) {
    console.error('Error loading data:', e);
    document.getElementById('tree').innerHTML = `
      <p style="color:#b91c1c;">No se pudieron cargar los datos. ¿Están los archivos y los paths correctos?</p>`;
  }
}

function handleDictationSemesterChange() {
  selectedDictationSemester = document.getElementById('dictationSemester').value;
  renderGraph();
}

function toggleExamOnlyFilter() {
  showExamOnlySubjects = !showExamOnlySubjects;
  const button = document.getElementById('examOnlyFilter');
  if (showExamOnlySubjects) {
    button.classList.add('active');
    button.textContent = 'Ocultar materias libres';
  } else {
    button.classList.remove('active');
    button.textContent = 'Mostrar materias libres';
  }
  renderGraph();
}

function handleCreditFilterChange() {
  selectedCreditFilter = document.getElementById('creditFilter').value;
  renderGraph();
}

async function handleEmphasisChange() {
  selectedEmphasis = document.getElementById('emphasis').value;
  
  // Load and generate recommended subjects data if emphasis is selected
  loadRecommendedSubjects();
  
  renderGraph();
}

function loadRecommendedSubjects() {
  // Only process for profiles with selected emphasis
  if (selectedPerfil && selectedEmphasis && profiles[selectedPerfil]) {
    const profileData = profiles[selectedPerfil];
    
    if (profileData.emphasis) {
      const emphasisData = profileData.emphasis.find(e => e.nombre === selectedEmphasis);
      
      if (emphasisData && emphasisData.plan_recomendado) {
        // Create the toggle button for recommended path if it doesn't exist
        createRecommendedPathToggle();
        
        // Convert plan_recomendado data to a structured format for visualization
        recommendedSubjects = [];
        let totalCreditsByPlan = 0;
        
        // Process each semester in the recommended plan
        for (const [semester, subjectCodes] of Object.entries(emphasisData.plan_recomendado)) {
          if (subjectCodes && subjectCodes.length > 0) {
            const semesterSubjects = [];
            let semesterCredits = 0;
            
            // Get details for each subject in this semester
            subjectCodes.forEach(code => {
              const subject = allSubjects.find(s => s.codigo === code);
              if (subject) {
                semesterSubjects.push(subject);
                semesterCredits += parseInt(subject.creditos) || 0;
              } else {
                console.warn(`Subject with code ${code} not found in allSubjects`);
                // Add a placeholder for the subject
                semesterSubjects.push({
                  codigo: code,
                  nombre: code,
                  creditos: 0
                });
              }
            });
            
            // Add semester data to recommendedSubjects
            recommendedSubjects.push({
              semestre: parseInt(semester),
              materias: semesterSubjects,
              totalCreditos: semesterCredits
            });
            
            totalCreditsByPlan += semesterCredits;
          }
        }
        
        // Sort semesters in ascending order
        recommendedSubjects.sort((a, b) => a.semestre - b.semestre);
        
        // Show the recommended path toggle
        const toggleContainer = document.getElementById('recommendedPathToggleContainer');
        if (toggleContainer) {
          toggleContainer.style.display = 'block';
        }
        
        // Auto-enable recommended path view if toggle exists and is not currently active
        if (!showRecommendedPath) {
          showRecommendedPath = true;
          const button = document.getElementById('recommendedPathToggle');
          if (button) {
            button.classList.add('active');
            button.textContent = 'Ocultar Plan de Estudio Recomendado';
          }
        }
      } else {
        // Reset recommended subjects if no plan is found
        recommendedSubjects = [];
        hideRecommendedPathToggle();
      }
    } else {
      // Reset if profile has no emphasis
      recommendedSubjects = [];
      hideRecommendedPathToggle();
    }
  } else {
    // Reset if no profile or emphasis is selected
    recommendedSubjects = [];
    hideRecommendedPathToggle();
  }
}

function hideRecommendedPathToggle() {
  // Hide the recommended path toggle
  const toggleContainer = document.getElementById('recommendedPathToggleContainer');
  if (toggleContainer) {
    toggleContainer.style.display = 'none';
  }
  
  // Reset the flag
  showRecommendedPath = false;
}

function createRecommendedPathToggle() {
  // Check if the toggle already exists
  if (document.getElementById('recommendedPathToggleContainer')) {
    return;
  }
  
  // Create the toggle container
  const controlsContainer = document.querySelector('.additional-filters');
  if (!controlsContainer) return;
  
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'filter-group';
  toggleContainer.id = 'recommendedPathToggleContainer';
  
  // Create the toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'recommendedPathToggle';
  toggleButton.className = 'toggle-button';
  toggleButton.textContent = showRecommendedPath ? 'Ocultar Plan de Estudio Recomendado' : 'Mostrar Plan de Estudio Recomendado';
  if (showRecommendedPath) {
    toggleButton.classList.add('active');
  }
  toggleButton.addEventListener('click', toggleRecommendedPath);
  
  // Add to the DOM
  toggleContainer.appendChild(toggleButton);
  controlsContainer.appendChild(toggleContainer);
}

function toggleRecommendedPath() {
  showRecommendedPath = !showRecommendedPath;
  const button = document.getElementById('recommendedPathToggle');
  if (button) {
    if (showRecommendedPath) {
      button.classList.add('active');
      button.textContent = 'Ocultar Plan de Estudio Recomendado';
    } else {
      button.classList.remove('active');
      button.textContent = 'Mostrar Plan de Estudio Recomendado';
    }
  }
  renderGraph();
}

function handleProfileChange() {
  selectedPerfil = document.getElementById('perfil').value;
  const emphasisSelect = document.getElementById('emphasis');
  const tableViewLink = document.getElementById('table-view-link');
  
  // Clear emphasis selection
  emphasisSelect.innerHTML = '';
  selectedEmphasis = '';
  
  // Hide recommended path toggle and reset data
  hideRecommendedPathToggle();
  recommendedSubjects = [];
  
  // Show or hide table view link based on profile
  if (selectedPerfil === 'Ingeniería Biomédica') {
    tableViewLink.style.display = 'inline-block';
  } else {
    tableViewLink.style.display = 'none';
  }
  
  // Configure emphasis select options based on profile
  if (!selectedPerfil) {
    // No profile selected
    emphasisSelect.disabled = true;
    emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
  } else if (EMPHASIS_OPTIONS[selectedPerfil]) {
    // If profile has emphasis options, populate and enable the emphasis selector
    emphasisSelect.disabled = false;
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccione un énfasis';
    emphasisSelect.appendChild(defaultOption);
    
    // Add emphasis options
    EMPHASIS_OPTIONS[selectedPerfil].forEach(emphasis => {
      const option = document.createElement('option');
      option.value = emphasis;
      option.textContent = emphasis;
      emphasisSelect.appendChild(option);
    });
  } else {
    // If profile doesn't have emphasis options, disable the emphasis selector
    emphasisSelect.disabled = true;
    emphasisSelect.innerHTML = '<option value="">No aplica</option>';
    
    // For profiles without emphasis, automatically load the recommended path from profile
    if (selectedPerfil && profiles[selectedPerfil] && profiles[selectedPerfil].plan_recomendado) {
      // Handle recommended path for profiles without emphasis
      const profileData = profiles[selectedPerfil];
      
      if (profileData.plan_recomendado) {
        // Process plan_recomendado for this profile
        createRecommendedPathForProfile(profileData);
      }
    }
  }
  
  renderGraph();
}

function createRecommendedPathForProfile(profileData) {
  if (!profileData || !profileData.plan_recomendado) {
    recommendedSubjects = [];
    return;
  }
  
  // Convert plan_recomendado data to a structured format for visualization
  recommendedSubjects = [];
  let totalCreditsByPlan = 0;
  
  // Process each semester in the recommended plan
  for (const [semester, subjectCodes] of Object.entries(profileData.plan_recomendado)) {
    if (subjectCodes && subjectCodes.length > 0) {
      const semesterSubjects = [];
      let semesterCredits = 0;
      
      // Get details for each subject in this semester
      subjectCodes.forEach(code => {
        const subject = allSubjects.find(s => s.codigo === code);
        if (subject) {
          semesterSubjects.push(subject);
          semesterCredits += parseInt(subject.creditos) || 0;
        } else {
          console.warn(`Subject with code ${code} not found in allSubjects`);
          // Add a placeholder for the subject
          semesterSubjects.push({
            codigo: code,
            nombre: code,
            creditos: 0
          });
        }
      });
      
      // Add semester data to recommendedSubjects
      recommendedSubjects.push({
        semestre: parseInt(semester),
        materias: semesterSubjects,
        totalCreditos: semesterCredits
      });
      
      totalCreditsByPlan += semesterCredits;
    }
  }
  
  // Sort semesters in ascending order
  recommendedSubjects.sort((a, b) => a.semestre - b.semestre);
  
  // Create the recommended path toggle
  createRecommendedPathToggle();
  
  // Auto-enable recommended path view
  showRecommendedPath = true;
  const button = document.getElementById('recommendedPathToggle');
  if (button) {
    button.classList.add('active');
    button.textContent = 'Ocultar Plan de Estudio Recomendado';
  }
}

function renderGraph() {
  const treeContainer = document.getElementById('tree');
  
  if (!selectedPerfil) {
    treeContainer.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #5a6b7b;">
        Seleccione un perfil para visualizar el grafo de materias
      </div>`;
    return;
  }
  
  // Check if we should show the recommended path view
  if (showRecommendedPath && recommendedSubjects.length > 0) {
    renderRecommendedPath();
    return;
  }
  
  // Filter subjects for the selected profile and emphasis
  const filteredSubjects = filterSubjects();
  
  // Sort subjects by semester
  filteredSubjects.sort((a, b) => a.semestre - b.semestre);
  
  // Group subjects by semester
  const semesterGroups = {};
  filteredSubjects.forEach(subject => {
    if (subject && subject.semestre !== undefined) {
      const semester = subject.semestre;
      if (!semesterGroups[semester]) {
        semesterGroups[semester] = [];
      }
      semesterGroups[semester].push(subject);
    }
  });
  
  // Create the semester rows with styling and information
  let html = '';
  Object.keys(semesterGroups).sort((a, b) => Number(a) - Number(b)).forEach(semester => {
    html += `
    <div class="semester-row">
      <div class="semester-label">Semestre ${semester}</div>
      ${semesterGroups[semester].map(subject => {
        // Get the status class
        const status = getSubjectStatus(subject);
        let statusClass = status;
        
        // Get dictation semester text
        let dictationText = '';
        if (subject.dictation_semester) {
          if (subject.dictation_semester === 'both') {
            dictationText = 'Ambos sem.';
          } else if (subject.dictation_semester === '1') {
            dictationText = 'Sem. impar';
          } else if (subject.dictation_semester === '2') {
            dictationText = 'Sem. par';
          }
        }
        
        // Generate prerequisites info for tooltip
        let prereqInfo = '';
        if (subject.prerequisitos && subject.prerequisitos.length > 0) {
          const prereqsList = subject.prerequisitos.join(', ');
          prereqInfo = `Previas: ${prereqsList}`;
        }
        
        // Add special tags for profile courses
        const profileTags = [];
        if (profiles[selectedPerfil]) {
          const profileData = profiles[selectedPerfil];
          const isCoreSubject = profileData.materias_core && profileData.materias_core.includes(subject.codigo);
          const isOptionalSubject = profileData.materias_optativas && profileData.materias_optativas.includes(subject.codigo);
          
          if (isCoreSubject) {
            profileTags.push('<span class="tag-badge core-badge">C</span>');
          } else if (isOptionalSubject) {
            profileTags.push('<span class="tag-badge opcional-badge">O</span>');
          }
          
          // Add emphasis tags
          if (selectedEmphasis && profileData.emphasis) {
            const emphasisData = profileData.emphasis.find(e => e.nombre === selectedEmphasis);
            if (emphasisData) {
              const isEmphasisCore = emphasisData.materias_core && emphasisData.materias_core.includes(subject.codigo);
              const isEmphasisOptional = emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subject.codigo);
              
              if (isEmphasisCore) {
                profileTags.push('<span class="tag-badge emphasis-core-badge">EC</span>');
              } else if (isEmphasisOptional) {
                profileTags.push('<span class="tag-badge emphasis-opcional-badge">EO</span>');
              }
            }
          }
        }
        
        // Truncate the name for a more compact view
        const displayName = subject.nombre.length > 18 ? subject.nombre.substring(0, 16) + '...' : subject.nombre;
        
        return `
          <div 
            class="subject-btn ${statusClass}" 
            data-code="${subject.codigo}"
            onclick="toggleSubjectApproval('${subject.codigo}')"
            title="${subject.nombre} (${subject.creditos} créditos)${prereqInfo ? '\n' + prereqInfo : ''}"
          >
            <span class="code">${subject.codigo}</span>
            ${displayName}
            <span class="credits">${subject.creditos} cr.</span>
            ${dictationText ? `<span class="dictation">${dictationText}</span>` : ''}
            ${subject.exam_only ? `<span class="exam-only">L</span>` : ''}
            ${profileTags.join('')}
          </div>
        `;
      }).join('')}
    </div>`;
  });
  
  treeContainer.innerHTML = html;
  updateTotalCredits();
}

function getSubjectStatus(subject) {
  // Check if subject is exonerated
  if (exoneratedSubjects.has(subject.codigo)) {
    return 'exonerated';
  }
  
  // Check if subject is approved but not exonerated
  if (approvedSubjects.has(subject.codigo)) {
    return 'approved';
  }
  
  // Check if subject is available based on prerequisites
  if (!isSubjectAvailable(subject)) {
    return 'unavailable';
  }
  
  // Subject is not approved and is available
  return 'available';
}

function renderRecommendedPath() {
  const treeContainer = document.getElementById('tree');
  
  let html = `
    <div class="recommended-path-header">
      <h3>Plan de Estudio Recomendado - ${selectedPerfil}${selectedEmphasis ? `: Énfasis en ${selectedEmphasis}` : ''}</h3>
      <p class="muted">Este plan muestra la combinación recomendada de materias por semestre. Haz clic en las materias para marcarlas como aprobadas o exoneradas.</p>
    </div>
  `;
  
  // Add semester rows for each semester in the recommended path
  let totalPlanCredits = 0;
  
  recommendedSubjects.forEach(semesterData => {
    const semesterCredits = semesterData.totalCreditos || 
                           semesterData.materias.reduce((total, subject) => 
                             total + (parseInt(subject.creditos) || 0), 0);
    
    totalPlanCredits += semesterCredits;
    
    html += `
    <div class="semester-row recommended-semester">
      <div class="semester-label">Semestre ${semesterData.semestre} <span class="credits-total">${semesterCredits} cr.</span></div>
      <div class="recommended-subjects">
        ${semesterData.materias.map(subject => {
          // Get the status of this subject
          const status = getSubjectStatus(subject);
          
          return `
            <div 
              class="subject-btn recommended-subject ${status}" 
              data-code="${subject.codigo}"
              onclick="toggleSubjectApproval('${subject.codigo}')"
              title="${subject.nombre} (${subject.creditos} créditos)"
            >
              <span class="code">${subject.codigo}</span>
              ${subject.nombre.length > 18 ? subject.nombre.substring(0, 16) + '...' : subject.nombre}
              <span class="credits">${subject.creditos} cr.</span>
              ${subject.exam_only ? `<span class="exam-only">L</span>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>`;
  });
  
  // Add total credits at the bottom
  html += `
    <div class="recommended-path-footer">
      <p>Total de créditos del plan: <strong>${totalPlanCredits}</strong></p>
    </div>
  `;
  
  treeContainer.innerHTML = html;
  updateTotalCredits();
}

function filterSubjects() {
  // Filter subjects based on selected criteria
  return allSubjects.filter(subject => {
    // Skip exam-only subjects based on filter
    if (!showExamOnlySubjects && subject.exam_only) {
      return false;
    }
    
    // Match dictation semester
    let dictationMatch = true;
    if (selectedDictationSemester !== 'all') {
      if (!subject.dictation_semester) {
        // Default value if not specified
        const defaultDictation = subject.semestre % 2 === 1 ? '1' : '2';
        dictationMatch = selectedDictationSemester === 'both' ? false : selectedDictationSemester === defaultDictation;
      } else {
        // Check the actual dictation semester value
        if (selectedDictationSemester === 'both') {
          dictationMatch = subject.dictation_semester === 'both';
        } else {
          dictationMatch = subject.dictation_semester === selectedDictationSemester || subject.dictation_semester === 'both';
        }
      }
    }
    
    // Match credits filter
    let creditsMatch = true;
    if (selectedCreditFilter !== 'all') {
      creditsMatch = subject.creditos === parseInt(selectedCreditFilter);
    }
    
    // Match profile
    let profileMatch = !selectedPerfil; // If no profile selected, include all subjects
    
    if (selectedPerfil && profiles[selectedPerfil]) {
      const profileData = profiles[selectedPerfil];
      
      // Check if subject is in this profile
      const isCoreSubject = profileData.materias_core && profileData.materias_core.includes(subject.codigo);
      const isOptionalSubject = profileData.materias_optativas && profileData.materias_optativas.includes(subject.codigo);
      
      profileMatch = isCoreSubject || isOptionalSubject;
      
      // If emphasis is selected, also check emphasis
      if (selectedEmphasis && profileData.emphasis) {
        const emphasisData = profileData.emphasis.find(e => e.nombre === selectedEmphasis);
        if (emphasisData) {
          const isEmphasisCore = emphasisData.materias_core && emphasisData.materias_core.includes(subject.codigo);
          const isEmphasisOptional = emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subject.codigo);
          
          // Include subjects that are in the emphasis or the profile
          profileMatch = profileMatch || isEmphasisCore || isEmphasisOptional;
        }
      }
    }
    
    return dictationMatch && creditsMatch && profileMatch;
  });
}

// Function to calculate if a subject is available (all prerequisites are approved or exonerated)
function isSubjectAvailable(subject) {
  if (!subject.prerequisitos || subject.prerequisitos.length === 0) {
    return true;
  }
  
  return subject.prerequisitos.every(prereqCode => {
    return approvedSubjects.has(prereqCode) || exoneratedSubjects.has(prereqCode);
  });
}

// Function to toggle subject approval status
function toggleSubjectApproval(subjectCode) {
  const subject = allSubjects.find(s => s.codigo === subjectCode);
  if (!subject) return;
  
  // If subject is not available, do nothing (unless it's already approved/exonerated)
  if (!isSubjectAvailable(subject) && !approvedSubjects.has(subjectCode) && !exoneratedSubjects.has(subjectCode)) {
    return;
  }
  
  if (exoneratedSubjects.has(subjectCode)) {
    exoneratedSubjects.delete(subjectCode);
    approvedSubjects.delete(subjectCode);
  } else if (approvedSubjects.has(subjectCode)) {
    approvedSubjects.delete(subjectCode);
    exoneratedSubjects.add(subjectCode);
  } else {
    approvedSubjects.add(subjectCode);
  }
  
  updateTotalCredits();
  renderGraph();
}

// Function to update total credits
function updateTotalCredits() {
  totalCredits = 0;
  let approvedCount = 0;
  let exoneratedCount = 0;
  
  // Calculate credits and counts
  for (const subjectCode of approvedSubjects) {
    const subject = allSubjects.find(s => s.codigo === subjectCode);
    if (subject) {
      totalCredits += parseInt(subject.creditos) || 0;
      approvedCount++;
    }
  }
  
  for (const subjectCode of exoneratedSubjects) {
    const subject = allSubjects.find(s => s.codigo === subjectCode);
    if (subject) {
      totalCredits += parseInt(subject.creditos) || 0;
      exoneratedCount++;
    }
  }
  
  // Update the status panel
  document.getElementById('totalSubjects').textContent = approvedCount + exoneratedCount;
  document.getElementById('approvedSubjects').textContent = approvedCount;
  document.getElementById('exoneratedSubjects').textContent = exoneratedCount;
  document.getElementById('totalCredits').textContent = totalCredits;
}

// Add a global reference to the toggleSubjectApproval function
window.toggleSubjectApproval = toggleSubjectApproval;

// Load data when the page loads
document.addEventListener('DOMContentLoaded', load);
