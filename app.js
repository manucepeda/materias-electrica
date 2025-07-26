let materias = [];

async function load() {
  try {
    // Try to load the new format first (with prerequisites)
    let res = await fetch('data/materias_with_prereqs.json');
    
    // If new format fails, fall back to old format
    if (!res.ok) {
      res = await fetch('data/materias.json');
    }
    
    materias = await res.json();
    render();
  } catch (e) {
    console.error('Error cargando datos de materias', e);
    document.getElementById('grid').innerHTML = `
      <p style="color:#b91c1c;">No se pudieron cargar los datos de materias. ¿Están los archivos y los paths correctos?</p>`;
  }
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const semestre = document.getElementById('semestre').value;
  const creditos = document.getElementById('creditos').value;
  const perfil = document.getElementById('perfil').value;

  const filtered = materias.filter(m => {
    const matchQ = !q || m.nombre.toLowerCase().includes(q);
    const matchSem = !semestre || String(m.semestre) === semestre;
    const matchCred = !creditos || String(m.creditos) === creditos;
    const matchPerfil = !perfil || m.perfiles.includes(perfil);

    return matchQ && matchSem && matchCred && matchPerfil;
  });

  const grid = document.getElementById('grid');
  grid.innerHTML = filtered.map(m => `
    <article>
      <h2 style="margin:0;font-size:1.05rem;font-weight:700;">
        ${m.nombre}
      </h2>

      <div class="muted">
        <span style="margin-right:.75rem;">Semestre: <b>${m.semestre}</b></span>
        <span>Créditos: <b>${m.creditos}</b></span>
      </div>

      <div style="margin-top:0.5rem;">
        ${m.perfiles.map(p => `<span class="tag perfil-tag">${p}</span>`).join(' ')}
      </div>
    </article>
  `).join('');

  document.getElementById('count').textContent = `${filtered.length} materia(s)`;
}

// Add event listeners to all filters
['search', 'semestre', 'creditos', 'perfil'].forEach(id => {
  document.getElementById(id).addEventListener('input', render);
});

load();