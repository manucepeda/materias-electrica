// Global variables
let subjectsData = [];
let biomedicalEmphases = null;
let selectedEmphasis = 'Electrónica'; // Default emphasis
let highlightedSubjectCode = null;

// Initialize on page load
async function init() {
  try {
    // Get highlighted subject code and emphasis from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    highlightedSubjectCode = urlParams.get('highlight');
    const emphasisParam = urlParams.get('emphasis');
    
    if (emphasisParam) {
      selectedEmphasis = emphasisParam;
    }
    
    // Load the main data
    await Promise.all([
      loadSubjectsData(),
      loadEmphasisData()
    ]);
    
    // Set up event listeners for tabs
    setupTabListeners();
    
    // Activate the correct tab
    if (selectedEmphasis) {
      const tabs = document.querySelectorAll('.emphasis-tab');
      tabs.forEach(tab => {
        if (tab.dataset.emphasis === selectedEmphasis) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }
    
    // Render the default table
    renderTable(selectedEmphasis);
    
    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Failed to initialize table view:', error);
    document.getElementById('loading').textContent = 'Error cargando datos. Intente refrescar la página.';
  }
}

// Load subjects data
async function loadSubjectsData() {
  try {
    const res = await fetch('data/materias_with_prereqs.json');
    if (!res.ok) {
      throw new Error('Failed to load subjects data');
    }
    const data = await res.json();
    subjectsData = data;
  } catch (err) {
    console.error('Error loading subjects data:', err);
    throw err;
  }
}

// Load emphasis data
async function loadEmphasisData() {
  try {
    // Load the emphasis data
    const res = await fetch('data/biomedical_emphases.json');
    if (!res.ok) {
      throw new Error('Failed to load emphasis data');
    }
    
    const rawData = await res.json();
    
    // Check if the data is in the expected format
    if (rawData["Ingeniería Biomédica"]) {
      // Convert from the existing format to our needed format
      biomedicalEmphases = {};
      
      // Process each emphasis
      Object.keys(rawData["Ingeniería Biomédica"]).forEach(emphasis => {
        const emphasisData = rawData["Ingeniería Biomédica"][emphasis];
        
        // Create the new format structure
        biomedicalEmphases[emphasis] = {
          name: `Énfasis en ${emphasis}`,
          semesters: {}
        };
        
        // Convert each semester's data
        emphasisData.forEach(semesterData => {
          const semesterNumber = semesterData.semestre.toString();
          
          // Map the subjects to the new format
          biomedicalEmphases[emphasis].semesters[semesterNumber] = 
            semesterData.materias.map(materia => ({
              code: materia.codigo,
              credits: materia.creditos
            }));
        });
      });
    } else {
      // Data is already in the expected format
      biomedicalEmphases = rawData;
    }
    
    console.log('Loaded emphasis data:', biomedicalEmphases);
  } catch (err) {
    console.error('Error loading emphasis data:', err);
    
    // Fallback if loading fails
    biomedicalEmphases = {
      "Electrónica": {
        "name": "Énfasis en Electrónica Biomédica",
        "semesters": {}
      },
      "Ingeniería Clínica": {
        "name": "Énfasis Clínica",
        "semesters": {}
      },
      "Señales": {
        "name": "Énfasis Señales",
        "semesters": {}
      },
      "Informática": {
        "name": "Énfasis Informática",
        "semesters": {}
      }
    };
  }
}

// Setup event listeners for emphasis tabs
function setupTabListeners() {
  const tabs = document.querySelectorAll('.emphasis-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update selected emphasis and render table
      selectedEmphasis = tab.dataset.emphasis;
      renderTable(selectedEmphasis);
    });
  });
}

// Render table for a specific emphasis
function renderTable(emphasis) {
  const tableView = document.getElementById('table-view');
  
  if (!biomedicalEmphases || !biomedicalEmphases[emphasis]) {
    tableView.innerHTML = '<div class="error-message">No se encontraron datos para este énfasis.</div>';
    return;
  }
  
  const emphasisData = biomedicalEmphases[emphasis];
  
  // Create table structure
  let tableHTML = `
    <h3>${emphasisData.name}</h3>
    <table class="emphasis-table">
      <thead>
        <tr>
          <th>Semestre</th>
  `;
  
  // Find the maximum number of subjects in any semester
  let maxSubjects = 0;
  for (const semester in emphasisData.semesters) {
    const semesterData = emphasisData.semesters[semester];
    if (semesterData) {
      const subjectsCount = semesterData.length;
      maxSubjects = Math.max(maxSubjects, subjectsCount);
    }
  }
  
  // Add column headers
  for (let i = 0; i < maxSubjects; i++) {
    tableHTML += `<th>Materia ${i + 1}</th>`;
  }
  
  tableHTML += `<th>Total Créditos</th></tr></thead><tbody>`;
  
  // Add semester rows
  let cumulativeCredits = 0;
  
  for (let semester = 1; semester <= 10; semester++) {
    const semesterData = emphasisData.semesters[semester.toString()] || [];
    
    let semesterCredits = 0;
    semesterData.forEach(subject => {
      semesterCredits += parseInt(subject.credits) || 0;
    });
    
    cumulativeCredits += semesterCredits;
    
    tableHTML += `
      <tr class="semester-row">
        <td class="semester-number">${semester}</td>
    `;
    
    // Add subject cells
    for (let i = 0; i < maxSubjects; i++) {
      if (i < semesterData.length) {
        const subject = semesterData[i];
        const subjectDetails = findSubjectByCode(subject.code);
        
        // Check if this subject should be highlighted
        const isHighlighted = subject.code === highlightedSubjectCode;
        const highlightClass = isHighlighted ? 'highlighted-subject' : '';
        
        tableHTML += `
          <td>
            <div class="subject-cell ${highlightClass}" data-code="${subject.code}">
              <div class="subject-name">${subjectDetails ? subjectDetails.name : subject.code}</div>
              <div class="subject-code">${subject.code}</div>
              <div class="subject-credits">${subject.credits} créditos</div>
            </div>
          </td>
        `;
      } else {
        tableHTML += '<td class="empty-cell">-</td>';
      }
    }
    
    // Add semester credits total
    tableHTML += `
        <td class="credits-total">${semesterCredits} (${cumulativeCredits})</td>
      </tr>
    `;
  }
  
  tableHTML += '</tbody></table>';
  tableView.innerHTML = tableHTML;
  
  // Scroll to highlighted subject if exists
  if (highlightedSubjectCode) {
    setTimeout(() => {
      const highlightedElement = document.querySelector(`.subject-cell[data-code="${highlightedSubjectCode}"]`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

// Helper function to find subject details by code
function findSubjectByCode(code) {
  return subjectsData.find(subject => subject.code === code);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
