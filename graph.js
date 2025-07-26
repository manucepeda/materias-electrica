let materias = [];
let selectedPerfil = '';
let selectedEmphasis = '';
let approvedSubjects = new Set(); // Subjects that are approved but not exonerated
let exoneratedSubjects = new Set(); // Subjects that are exonerated
let totalCredits = 0;
let showExamOnlySubjects = false;
let selectedDictationSemester = 'all';
let selectedCreditFilter = 'all';

// Map of emphasis options for each profile
const emphasisOptions = {
  'Telecomunicaciones': ['Comunicaciones Móviles', 'Comunicaciones Ópticas', 'Redes'],
  'Sistemas Eléctricos de Potencia': ['Energías Renovables', 'Redes Eléctricas', 'Sistemas de Potencia'],
  'Electrónica': ['Microelectrónica', 'Sistemas Embebidos', 'Electrónica de Potencia'],
  'Procesamiento de Señales y Aprendizaje Automático': ['Aprendizaje Profundo', 'Visión por Computadora', 'Procesamiento del Habla'],
  'Ingeniería Biomédica': ['Electrónica', 'Clínica', 'Señales', 'Informática']
};

async function load() {
  try {
    const res = await fetch('data/materias_with_prereqs.json');
    materias = await res.json();
    
    // Add event listeners to profile and emphasis selectors
    document.getElementById('perfil').addEventListener('change', handleProfileChange);
    document.getElementById('emphasis').addEventListener('change', renderGraph);
    
    // Add event listeners to the new filters
    document.getElementById('dictationSemester').addEventListener('change', handleDictationSemesterChange);
    document.getElementById('examOnlyFilter').addEventListener('click', toggleExamOnlyFilter);
    document.getElementById('creditFilter').addEventListener('change', handleCreditFilterChange);
    
    // Initialize the graph (empty)
    renderGraph();
  } catch (e) {
    console.error('Error loading materias_with_prereqs.json', e);
    document.getElementById('tree').innerHTML = `
      <p style="color:#b91c1c;">No se pudo cargar data/materias_with_prereqs.json. ¿Está el archivo y el path correcto?</p>`;
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

function handleProfileChange() {
  selectedPerfil = document.getElementById('perfil').value;
  const emphasisSelect = document.getElementById('emphasis');
  
  // Reset subject status when profile changes
  approvedSubjects.clear();
  exoneratedSubjects.clear();
  totalCredits = 0;
  
  // Update emphasis options based on selected profile
  if (selectedPerfil) {
    emphasisSelect.innerHTML = '<option value="">Seleccione Énfasis</option>';
    const options = emphasisOptions[selectedPerfil] || [];
    options.forEach(option => {
      const optElement = document.createElement('option');
      optElement.value = option;
      optElement.textContent = option;
      emphasisSelect.appendChild(optElement);
    });
    emphasisSelect.disabled = false;
  } else {
    emphasisSelect.innerHTML = '<option value="">Seleccione Énfasis (primero seleccione perfil)</option>';
    emphasisSelect.disabled = true;
  }
  
  selectedEmphasis = '';
  renderGraph();
}

function renderGraph() {
  const treeContainer = document.getElementById('tree');
  selectedEmphasis = document.getElementById('emphasis').value;
  
  if (!selectedPerfil) {
    treeContainer.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #5a6b7b;">
        Seleccione un perfil para visualizar el grafo de materias
      </div>`;
    return;
  }
  
  // Filter materias by selected profile and emphasis if selected
  let filteredMaterias = materias.filter(m => {
    // Basic filter by profile
    const profileMatch = m.perfiles.includes(selectedPerfil);
    
    // If emphasis is selected, check if subject belongs to that emphasis
    const emphasisMatch = !selectedEmphasis || 
                          !m.enfasis || 
                          m.enfasis.includes(selectedEmphasis);
    
    // Check dictation semester filter
    let dictationMatch = true;
    if (selectedDictationSemester !== 'all') {
      if (!m.dictation_semester) {
        // Default value if not specified (backward compatibility)
        // Odd-numbered semester subjects are taught in odd semesters, even in even semesters
        const defaultDictation = m.semestre % 2 === 1 ? '1' : '2';
        dictationMatch = selectedDictationSemester === 'both' ? false : selectedDictationSemester === defaultDictation;
      } else {
        // Check the actual dictation semester value
        if (selectedDictationSemester === 'both') {
          dictationMatch = m.dictation_semester === 'both';
        } else {
          dictationMatch = m.dictation_semester === selectedDictationSemester || m.dictation_semester === 'both';
        }
      }
    }
    
    // Check exam-only filter
    const examOnlyMatch = !showExamOnlySubjects || (m.exam_only === true);
    
    // Check credit filter
    let creditMatch = true;
    if (selectedCreditFilter !== 'all') {
      if (selectedCreditFilter === 'lt5') {
        creditMatch = m.creditos < 5;
      } else if (selectedCreditFilter === '5-10') {
        creditMatch = m.creditos >= 5 && m.creditos <= 10;
      } else if (selectedCreditFilter === 'gt10') {
        creditMatch = m.creditos > 10;
      }
    }
    
    return profileMatch && emphasisMatch && dictationMatch && examOnlyMatch && creditMatch;
  });
  
  // Group by semester
  const semesterGroups = {};
  filteredMaterias.forEach(m => {
    if (!semesterGroups[m.semestre]) {
      semesterGroups[m.semestre] = [];
    }
    semesterGroups[m.semestre].push(m);
  });
  
  // Create the semester rows with better styling and information
  let html = '';
  Object.keys(semesterGroups).sort((a, b) => Number(a) - Number(b)).forEach(semester => {
    html += `
    <div class="semester-row">
      <div class="semester-label">Semestre ${semester}</div>
      ${semesterGroups[semester].map(subject => {
        const status = getSubjectStatus(subject);
        let statusClass = '';
        
        if (status === 'exonerated') {
          statusClass = 'exonerated';
        } else if (status === 'approved') {
          statusClass = 'approved';
        } else if (status === 'unavailable') {
          statusClass = 'unavailable';
        }
        
        // Determine dictation semester display
        let dictationText = '';
        if (subject.dictation_semester) {
          if (subject.dictation_semester === '1') {
            dictationText = 'Sem Impar';
          } else if (subject.dictation_semester === '2') {
            dictationText = 'Sem Par';
          } else if (subject.dictation_semester === 'both') {
            dictationText = 'Ambos Sem';
          }
        } else {
          // Default based on semester number
          dictationText = subject.semestre % 2 === 1 ? 'Sem Impar' : 'Sem Par';
        }
        
        // Generate prerequisites info
        let prereqInfo = '';
        if (subject.prerequisitos && subject.prerequisitos.length > 0) {
          const prereqsList = subject.prerequisitos.map(p => {
            const requiresExoneration = p.requiere_exoneracion || false;
            const requiresCourse = p.requiere_curso || true;
            
            let reqType = '';
            if (requiresExoneration) {
              reqType = '(exon)';
            } else if (requiresCourse) {
              reqType = '(curso)';
            }
            
            return `${p.codigo}${reqType}`;
          }).join(', ');
          
          prereqInfo = `Previas: ${prereqsList}`;
        }
        
        return `
          <div 
            class="subject-btn ${statusClass}" 
            data-code="${subject.codigo}"
            onclick="toggleSubjectStatus('${subject.codigo}')"
            title="${subject.nombre} (${subject.creditos} créditos)${prereqInfo ? '\n' + prereqInfo : ''}"
          >
            <span class="code">${subject.codigo}</span>
            ${subject.nombre.length > 22 ? subject.nombre.substring(0, 20) + '...' : subject.nombre}
            <span class="credits">${subject.creditos} créditos</span>
            ${dictationText ? `<span class="dictation">${dictationText}</span>` : ''}
            ${subject.exam_only ? `<span class="exam-only">Libre</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>`;
  });
  
  treeContainer.innerHTML = html;
  updateStatusPanel();
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

function isSubjectAvailable(subject) {
  // If no prerequisites, subject is always available
  if (!subject.prerequisitos || subject.prerequisitos.length === 0) {
    return true;
  }
  
  // Check each prerequisite
  return subject.prerequisitos.every(prereq => {
    const requiresExoneration = prereq.requiere_exoneracion || false;
    const requiresCourse = prereq.requiere_curso !== false; // Default to true if not specified
    
    if (requiresExoneration) {
      // Needs exoneration
      return exoneratedSubjects.has(prereq.codigo);
    } else if (requiresCourse) {
      // Needs course approval (or exoneration)
      return approvedSubjects.has(prereq.codigo) || exoneratedSubjects.has(prereq.codigo);
    } else {
      // No specific requirement
      return true;
    }
  });
}

function toggleSubjectStatus(code) {
  const subject = materias.find(m => m.codigo === code);
  if (!subject) return;
  
  // Check if the subject is available before toggling status
  if (!exoneratedSubjects.has(code) && !approvedSubjects.has(code)) {
    if (!isSubjectAvailable(subject)) {
      alert('Esta materia no está disponible porque no cumple con los prerrequisitos');
      return;
    }
  }
  
  // Toggle status: none -> approved -> exonerated -> none
  if (exoneratedSubjects.has(code)) {
    // If exonerated, remove exonerated status
    exoneratedSubjects.delete(code);
    totalCredits -= subject.creditos;
  } else if (approvedSubjects.has(code)) {
    // If approved but not exonerated, set to exonerated
    approvedSubjects.delete(code);
    exoneratedSubjects.add(code);
    // Already counted credits for approved, so don't add again
  } else {
    // If not approved or exonerated, set to approved
    approvedSubjects.add(code);
    totalCredits += subject.creditos;
  }
  
  renderGraph();
}

function updateStatusPanel() {
  document.getElementById('approved-count').textContent = approvedSubjects.size;
  document.getElementById('exonerated-count').textContent = exoneratedSubjects.size;
  document.getElementById('total-credits').textContent = totalCredits;
  
  // Count available subjects based on current filters
  let availableCount = 0;
  materias.forEach(subject => {
    // Skip if already approved or exonerated
    if (exoneratedSubjects.has(subject.codigo) || approvedSubjects.has(subject.codigo)) {
      return;
    }
    
    // Check if subject meets basic availability requirements
    const isAvailable = isSubjectAvailable(subject);
    
    // Check if subject matches profile and emphasis
    const profileMatch = subject.perfiles.includes(selectedPerfil);
    const emphasisMatch = !selectedEmphasis || !subject.enfasis || subject.enfasis.includes(selectedEmphasis);
    
    // Check dictation semester filter
    let dictationMatch = true;
    if (selectedDictationSemester !== 'all') {
      if (!subject.dictation_semester) {
        // Default based on semester number
        const defaultDictation = subject.semestre % 2 === 1 ? '1' : '2';
        dictationMatch = selectedDictationSemester === 'both' ? false : selectedDictationSemester === defaultDictation;
      } else {
        if (selectedDictationSemester === 'both') {
          dictationMatch = subject.dictation_semester === 'both';
        } else {
          dictationMatch = subject.dictation_semester === selectedDictationSemester || subject.dictation_semester === 'both';
        }
      }
    }
    
    // Check exam-only filter
    const examOnlyMatch = !showExamOnlySubjects || (subject.exam_only === true);
    
    // Check credit filter
    let creditMatch = true;
    if (selectedCreditFilter !== 'all') {
      if (selectedCreditFilter === 'lt5') {
        creditMatch = subject.creditos < 5;
      } else if (selectedCreditFilter === '5-10') {
        creditMatch = subject.creditos >= 5 && subject.creditos <= 10;
      } else if (selectedCreditFilter === 'gt10') {
        creditMatch = subject.creditos > 10;
      }
    }
    
    if (isAvailable && profileMatch && emphasisMatch && dictationMatch && examOnlyMatch && creditMatch) {
      availableCount++;
    }
  });
  
  document.getElementById('available-subjects').textContent = availableCount;
}

// Add a link to the graph view in the original index.html
function addLinkToIndex() {
  const link = document.createElement('a');
  link.href = 'graph.html';
  link.className = 'link';
  link.style.display = 'block';
  link.style.marginTop = '20px';
  link.style.textAlign = 'center';
  link.textContent = 'Ver Grafo de Materias';
  
  const main = document.querySelector('main');
  if (main) {
    main.appendChild(link);
  }
}

// Load the data when the page loads
window.addEventListener('DOMContentLoaded', () => {
  load();
  
  // Check if we're on index.html and add the link if needed
  if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    addLinkToIndex();
  }
});
