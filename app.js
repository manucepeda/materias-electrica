// Global variables
let allSubjects = []; // All subjects from ucs.json
let profiles = {}; // All profile data from profile JSON files
let currentProfile = null; // Currently selected profile data

// Static definition of profile emphasis options - keep in sync with graph.js
const EMPHASIS_OPTIONS = {
  'Electrónica': ['Electrónica Biomédica', 'Sistemas Embebidos', 'Circuitos y Sistemas Electrónicos'],
  'Ingeniería Biomédica': ['Electrónica', 'Ingeniería Clínica', 'Señales', 'Informática']
};

// Profile file mapping
const PROFILE_FILES = {
  'Electrónica': 'data/profiles/electronica.json',
  'Control': 'data/profiles/control.json',
  'Sistemas Eléctricos de Potencia': 'data/profiles/potencia.json',
  'Ingeniería Biomédica': 'data/profiles/biomedica.json',
  'Señales y Aprendizaje Automático': 'data/profiles/senales.json'
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
    
    // Initialize all filters
    document.getElementById('search').addEventListener('input', render);
    document.getElementById('semestre').addEventListener('input', render);
    document.getElementById('creditos').addEventListener('input', render);
    document.getElementById('perfil').addEventListener('change', handlePerfilChange);
    document.getElementById('dictationSemester').addEventListener('change', render);
    
    // Set up the emphasis selector
    const emphasisSelect = document.getElementById('emphasis');
    if (emphasisSelect) {
      emphasisSelect.addEventListener('change', render);
    }
    
    render();
  } catch (e) {
    console.error('Error loading data:', e);
    document.getElementById('grid').innerHTML = `
      <p style="color:#b91c1c;">No se pudieron cargar los datos. ¿Están los archivos y los paths correctos?</p>`;
  }
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const semestre = document.getElementById('semestre').value;
  const creditos = document.getElementById('creditos').value;
  const perfilName = document.getElementById('perfil').value;
  const enfasis = document.getElementById('emphasis')?.value;
  const dictationSemester = document.getElementById('dictationSemester').value;
  
  // Filter subjects based on selected criteria
  const filtered = allSubjects.filter(subject => {
    // Match search query (in name or code)
    const matchQ = !q || 
                  subject.nombre.toLowerCase().includes(q) || 
                  (subject.codigo && subject.codigo.toLowerCase().includes(q));
    
    // Match semester
    const matchSem = !semestre || String(subject.semestre) === semestre;
    
    // Match credits
    const matchCred = !creditos || String(subject.creditos) === creditos;
    
    // Match dictation semester
    let dictationMatch = true;
    if (dictationSemester !== 'all') {
      if (!subject.dictation_semester) {
        // Default value if not specified (backward compatibility)
        const defaultDictation = subject.semestre % 2 === 1 ? '1' : '2';
        dictationMatch = dictationSemester === 'both' ? false : dictationSemester === defaultDictation;
      } else {
        // Check the actual dictation semester value
        if (dictationSemester === 'both') {
          dictationMatch = subject.dictation_semester === 'both';
        } else {
          dictationMatch = subject.dictation_semester === dictationSemester || subject.dictation_semester === 'both';
        }
      }
    }
    
    // Match profile and emphasis
    let matchProfile = !perfilName; // If no profile selected, include all subjects
    let matchEmphasis = !enfasis; // If no emphasis selected, include all subjects
    
    if (perfilName && profiles[perfilName]) {
      currentProfile = profiles[perfilName];
      
      // Check if subject is in this profile
      const isCoreSubject = currentProfile.materias_core && currentProfile.materias_core.includes(subject.codigo);
      const isOptionalSubject = currentProfile.materias_optativas && currentProfile.materias_optativas.includes(subject.codigo);
      
      // If emphasis is selected, also check emphasis
      if (enfasis && currentProfile.emphasis) {
        const emphasisData = currentProfile.emphasis.find(e => e.nombre === enfasis);
        if (emphasisData) {
          const isEmphasisCore = emphasisData.materias_core && emphasisData.materias_core.includes(subject.codigo);
          const isEmphasisOptional = emphasisData.materias_optativas && emphasisData.materias_optativas.includes(subject.codigo);
          
          // A subject matches the emphasis if it's in core or optional for the emphasis
          matchEmphasis = isEmphasisCore || isEmphasisOptional;
          
          // A subject matches the profile+emphasis filter if it matches both or at least the emphasis
          matchProfile = (isCoreSubject || isOptionalSubject || matchEmphasis);
        }
      } else {
        // No emphasis selected, match by profile only
        matchProfile = isCoreSubject || isOptionalSubject;
      }
    }

    return matchQ && matchSem && matchCred && matchProfile && matchEmphasis && dictationMatch;
  });

  // Sort by semester then by name
  filtered.sort((a, b) => {
    if (a.semestre !== b.semestre) {
      return a.semestre - b.semestre;
    }
    return a.nombre.localeCompare(b.nombre);
  });

  renderSubjectCards(filtered, perfilName, enfasis);
}

function renderSubjectCards(filtered, perfilName, enfasisName) {
  const grid = document.getElementById('grid');
  
  grid.innerHTML = filtered.map(subject => {
    // Get dictation semester text
    let dictationText = '';
    if (subject.dictation_semester) {
      if (subject.dictation_semester === 'both') {
        dictationText = '<span class="dictation-tag">Ambos semestres</span>';
      } else if (subject.dictation_semester === '1') {
        dictationText = '<span class="dictation-tag">Semestre impar</span>';
      } else if (subject.dictation_semester === '2') {
        dictationText = '<span class="dictation-tag">Semestre par</span>';
      }
    }
    
    // Create profile and emphasis tags
    const profileTags = [];
    const emphasisTags = [];
    
    // Find which profiles this subject belongs to
    Object.entries(profiles).forEach(([profileName, profileData]) => {
      const isCoreSubject = profileData.materias_core && profileData.materias_core.includes(subject.codigo);
      const isOptionalSubject = profileData.materias_optativas && profileData.materias_optativas.includes(subject.codigo);
      
      if (isCoreSubject || isOptionalSubject) {
        profileTags.push(`<span class="tag perfil-tag" title="Perfil: ${profileName}">${profileName}</span>`);
        
        // Add tags for core or optional
        if (profileName === perfilName) {
          if (isCoreSubject) {
            profileTags.push('<span class="tag core-tag">Core</span>');
          } else if (isOptionalSubject) {
            profileTags.push('<span class="tag opcional-tag">Opcional</span>');
          }
        }
        
        // Check if subject is in any emphasis of this profile
        if (profileData.emphasis) {
          profileData.emphasis.forEach(emphasis => {
            const isEmphasisCore = emphasis.materias_core && emphasis.materias_core.includes(subject.codigo);
            const isEmphasisOptional = emphasis.materias_optativas && emphasis.materias_optativas.includes(subject.codigo);
            
            if (isEmphasisCore || isEmphasisOptional) {
              emphasisTags.push(`<span class="tag enfasis-tag" title="Énfasis: ${emphasis.nombre} (${profileName})">${emphasis.nombre}</span>`);
            }
          });
        }
      }
    });
    
    // Generate prerequisites info if available
    let prereqInfo = '';
    if (subject.prerequisitos && subject.prerequisitos.length > 0) {
      const prereqsList = subject.prerequisitos.join(', ');
      prereqInfo = `<div class="prereq-info">Previas: ${prereqsList}</div>`;
    }
    
    // Table view link for Ingeniería Biomédica
    let tableViewButton = '';
    if (perfilName === 'Ingeniería Biomédica' && enfasisName) {
      tableViewButton = `<a href="table-view.html?highlight=${subject.codigo}&emphasis=${enfasisName}" class="table-link" title="Ver en tabla de plan recomendado">📋</a>`;
    }
    
    return `
      <article>
        <h2 style="margin:0;font-size:1.05rem;font-weight:700;">
          <span class="codigo">${subject.codigo || ''}</span> ${subject.nombre} ${tableViewButton}
        </h2>

        <div class="muted">
          <span style="margin-right:.75rem;">Semestre: <b>${subject.semestre}</b></span>
          <span>Créditos: <b>${subject.creditos}</b></span>
          ${subject.exam_only ? '<span class="exam-only-tag">Libre</span>' : ''}
          ${dictationText}
        </div>

        <div style="margin-top:0.5rem;">
          ${profileTags.join(' ')}
          ${emphasisTags.join(' ')}
        </div>
        
        ${prereqInfo}
      </article>
    `;
  }).join('');

  document.getElementById('count').textContent = `${filtered.length} materia(s)`;
  
  // Show message if no results
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #6b7280;">
        No se encontraron materias con los filtros seleccionados.
      </div>`;
  }
}

// Handles profile change to update the emphasis options
function handlePerfilChange() {
  const perfilSelect = document.getElementById('perfil');
  const selectedPerfil = perfilSelect.value;
  const emphasisSelect = document.getElementById('emphasis');
  const tableViewLink = document.getElementById('table-view-link');
  
  // Reset the emphasis options
  emphasisSelect.innerHTML = '';
  
  // Show or hide table view link based on profile
  if (selectedPerfil === 'Ingeniería Biomédica') {
    tableViewLink.style.display = 'inline-block';
  } else {
    tableViewLink.style.display = 'none';
  }
  
  if (!selectedPerfil) {
    // No profile selected
    emphasisSelect.innerHTML = '<option value="">Seleccione un perfil primero</option>';
    emphasisSelect.disabled = true;
    emphasisSelect.style.display = 'none';
  } else if (EMPHASIS_OPTIONS[selectedPerfil]) {
    // Profile has emphasis options
    emphasisSelect.disabled = false;
    
    // Add default "All emphasis" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los énfasis';
    emphasisSelect.appendChild(defaultOption);
    
    // Add emphasis options
    EMPHASIS_OPTIONS[selectedPerfil].forEach(emphasis => {
      const option = document.createElement('option');
      option.value = emphasis;
      option.textContent = emphasis;
      emphasisSelect.appendChild(option);
    });
    
    emphasisSelect.style.display = 'inline-block';
  } else {
    // Profile has no emphasis options
    emphasisSelect.innerHTML = '<option value="">No hay énfasis para este perfil</option>';
    emphasisSelect.disabled = true;
    emphasisSelect.style.display = 'none';
  }
  
  render();
}

// Load data when the page loads
document.addEventListener('DOMContentLoaded', load);
