// Global variables
let allSubjects = []; // All subjects from ucs.json
let biomedicalProfile = null; // Biomedical profile data
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
    
    // Load the data
    await Promise.all([
      loadSubjectsData(),
      loadBiomedicalProfileData()
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
    const res = await fetch('data/ucs.json');
    if (!res.ok) {
      throw new Error('Failed to load subjects data');
    }
    const data = await res.json();
    allSubjects = data;
  } catch (err) {
    console.error('Error loading subjects data:', err);
    throw err;
  }
}

// Load biomedical profile data
async function loadBiomedicalProfileData() {
  try {
    // Load the profile data
    const res = await fetch('data/profiles/biomedica.json');
    if (!res.ok) {
      throw new Error('Failed to load biomedical profile data');
    }
    
    biomedicalProfile = await res.json();
    console.log('Loaded biomedical profile data:', biomedicalProfile);
  } catch (err) {
    console.error('Error loading biomedical profile data:', err);
    throw err;
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
function renderTable(emphasisName) {
  const tableView = document.getElementById('table-view');
  
  if (!biomedicalProfile || !biomedicalProfile.emphasis) {
    tableView.innerHTML = '<div class="error-message">No se encontraron datos para énfasis.</div>';
    return;
  }
  
  // Find the emphasis data
  const emphasisData = biomedicalProfile.emphasis.find(e => e.nombre === emphasisName);
  
  if (!emphasisData || !emphasisData.plan_recomendado) {
    tableView.innerHTML = `<div class="error-message">No se encontraron datos para el énfasis ${emphasisName}.</div>`;
    return;
  }
  
  const recommendedPlan = emphasisData.plan_recomendado;
  
  // Create table structure
  let tableHTML = `
    <h3>Énfasis en ${emphasisData.nombre}</h3>
    <table class="emphasis-table">
      <thead>
        <tr>
          <th>Semestre</th>
  `;
  
  // Find the maximum number of subjects in any semester
  let maxSubjects = 0;
  for (const semester in recommendedPlan) {
    const semesterData = recommendedPlan[semester];
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
    const semesterData = recommendedPlan[semester.toString()] || [];
    
    let semesterCredits = 0;
    semesterData.forEach(code => {
      const subject = allSubjects.find(s => s.codigo === code);
      if (subject) {
        semesterCredits += parseInt(subject.creditos) || 0;
      }
    });
    
    cumulativeCredits += semesterCredits;
    
    tableHTML += `
      <tr class="semester-row">
        <td class="semester-number">${semester}</td>
    `;
    
    // Add subject cells
    for (let i = 0; i < maxSubjects; i++) {
      if (i < semesterData.length) {
        const code = semesterData[i];
        const subject = allSubjects.find(s => s.codigo === code);
        
        if (subject) {
          // Check if this subject should be highlighted
          const isHighlighted = code === highlightedSubjectCode;
          const highlightClass = isHighlighted ? 'highlighted-subject' : '';
          
          tableHTML += `
            <td>
              <div class="subject-cell ${highlightClass}" data-code="${code}">
                <div class="subject-name">${subject.nombre}</div>
                <div class="subject-code">${code}</div>
                <div class="subject-credits">${subject.creditos} créditos</div>
              </div>
            </td>
          `;
        } else {
          tableHTML += `
            <td>
              <div class="subject-cell">
                <div class="subject-code">${code}</div>
                <div class="subject-credits">? créditos</div>
              </div>
            </td>
          `;
        }
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
  return allSubjects.find(subject => subject.codigo === code);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
