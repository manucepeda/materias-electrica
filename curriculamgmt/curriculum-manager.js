/**
 * Curriculum Manager - Gestión de Unidades Curriculares
 * Maneja la carga, edición y guardado de unidades curriculares con prerequisitos complejos
 */

class CurriculumManager {
    /**
     * Exporta el JSON actualizado (descarga el archivo con los cambios en memoria)
     */
    exportJson() {
        const dataStr = JSON.stringify(this.subjects, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ucs-migrated.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showModal('Exportación exitosa', 'El archivo JSON actualizado se ha descargado. Si deseas que los cambios sean permanentes, reemplaza el archivo original en el servidor.');
    }

    /**
     * Guarda o actualiza una materia en el array subjects
     */
    saveSubject(subjectData) {
        try {
            if (this.currentEditingSubject) {
                // Editar existente
                const idx = this.subjects.findIndex(s => s.codigo === this.currentEditingSubject.codigo);
                if (idx !== -1) {
                    this.subjects[idx] = subjectData;
                }
            } else {
                // Agregar nueva
                this.subjects.push(subjectData);
            }
            this.updateStatusInfo();
            
            // Guardar al servidor automáticamente
            this.saveToServer().then(() => {
                this.showModal('Guardado exitoso', 'La materia se ha guardado correctamente en el servidor.', () => {
                    this.showSearchView();
                });
            }).catch(error => {
                this.showModal('Error', 'La materia se guardó localmente pero no se pudo sincronizar con el servidor: ' + error.message);
            });
        } catch (error) {
            this.showModal('Error', 'Ocurrió un error al guardar la materia.');
        }
    }

    /**
     * Guarda todos los datos al servidor
     */
    async saveToServer() {
        try {
            const response = await fetch('/api/subjects/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.subjects)
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const result = await response.json();
            console.log('Datos guardados en servidor:', result);
            return result;
        } catch (error) {
            console.error('Error guardando en servidor:', error);
            throw error;
        }
    }

    /**
     * Elimina una materia del array subjects
     */
    deleteSubject(codigo) {
        this.showModal(
            'Confirmar eliminación',
            `¿Estás seguro de que deseas eliminar la materia "${codigo}"? Esta acción no se puede deshacer.`,
            () => {
                this.subjects = this.subjects.filter(s => s.codigo !== codigo);
                this.updateStatusInfo();
                this.renderSearchResults();
                this.showModal('Eliminado', 'La materia ha sido eliminada.');
            }
        );
    }

    /**
     * Modal reutilizable para mensajes y confirmaciones
     */
    showModal(title, message, onConfirm) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('active');
        // Botón de confirmación solo si hay callback
        const footer = overlay.querySelector('.modal-footer');
        footer.innerHTML = '';
        if (onConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn btn-danger';
            confirmBtn.textContent = 'Confirmar';
            confirmBtn.onclick = () => {
                overlay.classList.remove('active');
                onConfirm();
            };
            footer.appendChild(confirmBtn);
        }
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.onclick = () => overlay.classList.remove('active');
        footer.appendChild(cancelBtn);
    }

    // ...existing code...
    constructor() {
        this.subjects = [];
        this.originalData = [];
        this.currentEditingSubject = null;
        this.prerequisiteCounter = 0;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateStatusInfo();
    }

    setupEventListeners() {
        // Botones de navegación
        document.getElementById('btn-add-new').addEventListener('click', () => this.showAddNewForm());
        document.getElementById('btn-search').addEventListener('click', () => this.showSearchView());
        document.getElementById('btn-load-json').addEventListener('click', () => this.loadJsonFile());
        document.getElementById('btn-export-json').addEventListener('click', () => this.exportJson());

        // Búsqueda
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('btn-clear-search').addEventListener('click', () => this.clearSearch());

        // Formulario
        document.getElementById('subject-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // File input para cargar JSON
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileLoad(e));

        // Acciones rápidas del welcome
        window.showAddNewForm = () => this.showAddNewForm();
        window.showSearchView = () => this.showSearchView();
        window.loadJsonFile = () => this.loadJsonFile();
        window.showWelcomeView = () => this.showWelcomeView();
        window.resetForm = () => this.resetForm();
        window.closeModal = () => this.closeModal();

        // Funciones para prerequisitos
        window.addAndGroup = () => this.addPrerequisiteGroup('AND');
        window.addOrGroup = () => this.addPrerequisiteGroup('OR');
        window.addSimplePrerequisite = () => this.addSimplePrerequisite();
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/subjects');
            if (response.ok) {
                const data = await response.json();
                this.subjects = data.filter(subject => subject && subject.codigo); // Filtrar elementos inválidos
                this.originalData = JSON.parse(JSON.stringify(this.subjects));
                console.log('Datos cargados:', this.subjects.length, 'materias');
            } else {
                console.warn('No se pudo cargar datos del servidor, iniciando con datos vacíos');
                this.subjects = [];
                this.originalData = [];
            }
        } catch (error) {
            console.warn('Error cargando datos iniciales:', error);
            this.subjects = [];
            this.originalData = [];
        }
    }

    updateStatusInfo() {
        document.getElementById('total-subjects').textContent = this.subjects.length;
        document.getElementById('last-modified').textContent = new Date().toLocaleString();
    }

    // === NAVEGACIÓN ===
    showWelcomeView() {
        this.hideAllViews();
        document.getElementById('welcome-view').classList.add('active');
    }

    showSearchView() {
        this.hideAllViews();
        document.getElementById('search-view').classList.add('active');
        this.renderSearchResults();
        document.getElementById('search-input').focus();
    }

    showAddNewForm() {
        this.currentEditingSubject = null;
        this.hideAllViews();
        document.getElementById('form-view').classList.add('active');
        document.getElementById('form-title').innerHTML = '<i class="fas fa-plus"></i> Agregar Nueva Materia';
        this.resetForm();
    }

    showEditForm(subject) {
        this.currentEditingSubject = subject;
        this.hideAllViews();
        document.getElementById('form-view').classList.add('active');
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editar Materia: ' + subject.codigo;
        this.populateForm(subject);
    }

    hideAllViews() {
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    }

    // === BÚSQUEDA ===
    handleSearch(query) {
        this.renderSearchResults(query);
    }

    clearSearch() {
        document.getElementById('search-input').value = '';
        this.renderSearchResults();
    }

    renderSearchResults(query = '') {
        const resultsContainer = document.getElementById('search-results');
        
        let filteredSubjects = this.subjects;
        if (query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredSubjects = this.subjects.filter(subject => 
                subject.codigo.toLowerCase().includes(searchTerm) ||
                subject.nombre.toLowerCase().includes(searchTerm)
            );
        }

        if (filteredSubjects.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>${query ? 'No se encontraron materias que coincidan con: ' + query : 'No hay materias registradas'}</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = filteredSubjects.map(subject => `
            <div class="search-result-item">
                <div class="subject-info">
                    <div class="subject-header">
                        <h4>${subject.codigo}</h4>
                        <span class="credits">${subject.creditos} créditos</span>
                    </div>
                    <p class="subject-name">${subject.nombre}</p>
                    <div class="subject-details">
                        <span class="semester">Semestre ${subject.semestre}</span>
                        <span class="dictation">Dictado: ${this.formatDictationSemester(subject.dictation_semester)}</span>
                        ${subject.exam_only ? '<span class="exam-only">Solo examen</span>' : ''}
                        ${subject.prerequisites && subject.prerequisites.length > 0 ? '<span class="has-prereq">Tiene prerequisitos</span>' : ''}
                    </div>
                </div>
                <div class="subject-actions">
                    <button class="btn btn-primary btn-sm" onclick="curriculumManager.showEditForm(curriculumManager.getSubjectByCode('${subject.codigo}'))">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="curriculumManager.deleteSubject('${subject.codigo}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatDictationSemester(dictation) {
        switch(dictation) {
            case 'both': return 'Ambos';
            case '1': return 'Primer semestre';
            case '2': return 'Segundo semestre';
            default: return dictation;
        }
    }

    getSubjectByCode(codigo) {
        return this.subjects.find(s => s.codigo === codigo);
    }

    // === FORMULARIO ===
    resetForm() {
        document.getElementById('subject-form').reset();
        this.clearPrerequisites();
        this.prerequisiteCounter = 0;
    }

    populateForm(subject) {
        document.getElementById('codigo').value = subject.codigo || '';
        document.getElementById('nombre').value = subject.nombre || '';
        document.getElementById('creditos').value = subject.creditos || '';
        document.getElementById('semestre').value = subject.semestre || '';
        document.getElementById('dictation_semester').value = subject.dictation_semester || '';
        document.getElementById('exam_only').checked = subject.exam_only || false;

        this.clearPrerequisites();
        if (subject.prerequisites && subject.prerequisites.length > 0) {
            this.loadPrerequisites(subject.prerequisites);
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const subjectData = {
            codigo: formData.get('codigo').trim().toUpperCase(),
            nombre: formData.get('nombre').trim(),
            creditos: parseInt(formData.get('creditos')),
            semestre: parseInt(formData.get('semestre')),
            dictation_semester: formData.get('dictation_semester'),
            exam_only: formData.has('exam_only'),
            prerequisites: this.collectPrerequisites()
        };

        // Validaciones
        const validation = this.validateSubjectData(subjectData);
        if (!validation.valid) {
            this.showModal('Error de validación', validation.message);
            return;
        }

        this.saveSubject(subjectData);
    }

    validateSubjectData(data) {
        // Validar campos obligatorios
        if (!data.codigo) return { valid: false, message: 'El código es obligatorio' };
        if (!data.nombre) return { valid: false, message: 'El nombre es obligatorio' };
        if (!data.creditos || data.creditos < 1) return { valid: false, message: 'Los créditos deben ser un número mayor a 0' };
        if (!data.semestre || data.semestre < 1 || data.semestre > 8) return { valid: false, message: 'El semestre debe estar entre 1 y 8' };
        if (!data.dictation_semester) return { valid: false, message: 'Debe seleccionar el semestre de dictado' };

        // Validar que el código no exista (solo para nuevas materias)
        if (!this.currentEditingSubject) {
            const existingSubject = this.subjects.find(s => s.codigo === data.codigo);
            if (existingSubject) {
                return { valid: false, message: `Ya existe una materia con el código ${data.codigo}` };
            }
        }

        // Validar prerequisitos
        const prereqValidation = this.validatePrerequisites(data.prerequisites);
        if (!prereqValidation.valid) {
            return prereqValidation;
        }

        return { valid: true };
    }

    validatePrerequisites(prerequisites) {
        for (let prereq of prerequisites) {
            if (prereq.tipo === 'SIMPLE') {
                if (!this.subjectExists(prereq.codigo)) {
                    return { valid: false, message: `La materia prerequisito "${prereq.codigo}" no existe` };
                }
            } else if (prereq.tipo === 'AND' || prereq.tipo === 'OR') {
                for (let condition of prereq.condiciones || prereq.opciones || []) {
                    if (condition.codigo && !this.subjectExists(condition.codigo)) {
                        return { valid: false, message: `La materia prerequisito "${condition.codigo}" no existe` };
                    }
                    // Validación recursiva para opciones complejas
                    if (condition.condiciones) {
                        for (let subCondition of condition.condiciones) {
                            if (subCondition.codigo && !this.subjectExists(subCondition.codigo)) {
                                return { valid: false, message: `La materia prerequisito "${subCondition.codigo}" no existe` };
                            }
                        }
                    }
                }
            }
        }
        return { valid: true };
    }

    subjectExists(codigo) {
        return this.subjects.some(s => s.codigo === codigo);
    }

    saveSubject(subjectData) {
        try {
            if (this.currentEditingSubject) {
                // Actualizar materia existente
                const index = this.subjects.findIndex(s => s.codigo === this.currentEditingSubject.codigo);
                if (index !== -1) {
                    this.subjects[index] = subjectData;
                    this.showModal('Éxito', 'Materia actualizada correctamente', () => {
                        this.showSearchView();
                    });
                }
            } else {
                // Agregar nueva materia
                this.subjects.push(subjectData);
                this.showModal('Éxito', 'Materia agregada correctamente', () => {
                    this.resetForm();
                });
            }
            
            this.updateStatusInfo();
        } catch (error) {
            console.error('Error guardando materia:', error);
            this.showModal('Error', 'Ocurrió un error al guardar la materia');
        }
    }

    deleteSubject(codigo) {
        this.showModal(
            'Confirmar eliminación',
            `¿Estás seguro de que deseas eliminar la materia "${codigo}"? Esta acción no se puede deshacer.`,
            () => {
                this.subjects = this.subjects.filter(s => s.codigo !== codigo);
                this.updateStatusInfo();
                this.renderSearchResults();
                
                // Guardar al servidor automáticamente
                this.saveToServer().then(() => {
                    this.showModal('Eliminación exitosa', 'La materia se ha eliminado correctamente.');
                }).catch(error => {
                    this.showModal('Error', 'La materia se eliminó localmente pero no se pudo sincronizar con el servidor: ' + error.message);
                });
                
                this.closeModal();
            }
        );
    }

    // === PREREQUISITOS ===
    clearPrerequisites() {
        document.getElementById('prerequisites-container').innerHTML = '';
    }

    addPrerequisiteGroup(type) {
        const container = document.getElementById('prerequisites-container');
        const groupId = `prereq-group-${++this.prerequisiteCounter}`;
        
        const groupHtml = `
            <div class="prerequisite-group" data-type="${type}" data-id="${groupId}">
                <div class="group-header">
                    <h4>
                        <i class="fas ${type === 'AND' ? 'fa-check-double' : 'fa-list-ul'}"></i>
                        ${type === 'AND' ? 'DEBE TENER TODAS' : 'DEBE TENER ALGUNA'}
                    </h4>
                    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="group-description">
                    <input type="text" placeholder="Descripción del grupo (opcional)" class="form-control group-desc-input">
                </div>
                <div class="group-conditions" data-group-id="${groupId}">
                    <!-- Las condiciones se agregarán aquí -->
                </div>
                <div class="group-actions">
                    <button type="button" class="btn btn-outline btn-sm" onclick="curriculumManager.addConditionToGroup('${groupId}', 'simple')">
                        <i class="fas fa-plus"></i> Agregar Condición Simple
                    </button>
                    ${type === 'OR' ? `
                        <button type="button" class="btn btn-outline btn-sm" onclick="curriculumManager.addConditionToGroup('${groupId}', 'complex')">
                            <i class="fas fa-plus"></i> Agregar Opción Compleja
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', groupHtml);
    }

    addSimplePrerequisite() {
        const container = document.getElementById('prerequisites-container');
        const prereqId = `simple-prereq-${++this.prerequisiteCounter}`;
        
        const prereqHtml = `
            <div class="simple-prerequisite" data-id="${prereqId}">
                <div class="prereq-header">
                    <h4><i class="fas fa-bookmark"></i> Prerequisito Simple</h4>
                    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="prereq-config">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Código de la materia:</label>
                            <input type="text" class="form-control prereq-codigo" placeholder="Ej: P1, CDIV, etc.">
                        </div>
                        <div class="form-group">
                            <label>Descripción:</label>
                            <input type="text" class="form-control prereq-description" placeholder="Ej: Salvar curso Programación 1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" class="prereq-curso" checked>
                                <span class="checkmark"></span>
                                Requiere haber cursado
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" class="prereq-examen">
                                <span class="checkmark"></span>
                                Requiere exoneración
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', prereqHtml);
    }

    addConditionToGroup(groupId, type) {
        const groupConditions = document.querySelector(`[data-group-id="${groupId}"]`);
        const conditionId = `condition-${++this.prerequisiteCounter}`;
        
        if (type === 'simple') {
            const conditionHtml = `
                <div class="group-condition" data-id="${conditionId}">
                    <div class="condition-header">
                        <span><i class="fas fa-bookmark"></i> Condición</span>
                        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="condition-config">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Código:</label>
                                <input type="text" class="form-control condition-codigo" placeholder="Ej: P1">
                            </div>
                            <div class="form-group">
                                <label>Descripción:</label>
                                <input type="text" class="form-control condition-description" placeholder="Descripción">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" class="condition-curso" checked>
                                    <span class="checkmark"></span>
                                    Requiere curso
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" class="condition-examen">
                                    <span class="checkmark"></span>
                                    Requiere exoneración
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            groupConditions.insertAdjacentHTML('beforeend', conditionHtml);
        } else if (type === 'complex') {
            // Para opciones complejas (dentro de un grupo OR)
            const conditionHtml = `
                <div class="complex-condition" data-id="${conditionId}">
                    <div class="condition-header">
                        <span><i class="fas fa-list"></i> Opción Compleja (Y)</span>
                        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="condition-config">
                        <div class="form-group">
                            <label>Descripción de la opción:</label>
                            <input type="text" class="form-control option-description" placeholder="Ej: Exonerar P3 y Salvar P4">
                        </div>
                        <div class="sub-conditions" data-condition-id="${conditionId}">
                            <!-- Sub-condiciones se agregarán aquí -->
                        </div>
                        <button type="button" class="btn btn-outline btn-sm" onclick="curriculumManager.addSubCondition('${conditionId}')">
                            <i class="fas fa-plus"></i> Agregar Sub-condición
                        </button>
                    </div>
                </div>
            `;
            groupConditions.insertAdjacentHTML('beforeend', conditionHtml);
        }
    }

    addSubCondition(conditionId) {
        const subConditionsContainer = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const subConditionId = `sub-condition-${++this.prerequisiteCounter}`;
        
        const subConditionHtml = `
            <div class="sub-condition" data-id="${subConditionId}">
                <div class="sub-condition-header">
                    <span><i class="fas fa-arrow-right"></i> Sub-condición</span>
                    <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Código:</label>
                        <input type="text" class="form-control sub-condition-codigo" placeholder="Ej: P3">
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <input type="text" class="form-control sub-condition-description" placeholder="Descripción">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" class="sub-condition-curso">
                            <span class="checkmark"></span>
                            Requiere curso
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" class="sub-condition-examen">
                            <span class="checkmark"></span>
                            Requiere exoneración
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        subConditionsContainer.insertAdjacentHTML('beforeend', subConditionHtml);
    }

    collectPrerequisites() {
        const prerequisites = [];
        
        // Prerequisitos simples
        document.querySelectorAll('.simple-prerequisite').forEach(prereqEl => {
            const codigo = prereqEl.querySelector('.prereq-codigo').value.trim();
            const description = prereqEl.querySelector('.prereq-description').value.trim();
            const requiere_curso = prereqEl.querySelector('.prereq-curso').checked;
            const requiere_exoneracion = prereqEl.querySelector('.prereq-examen').checked;
            
            if (codigo) {
                prerequisites.push({
                    requirement_id: `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: description || `Prerequisito ${codigo}`,
                    tipo: 'SIMPLE',
                    codigo: codigo.toUpperCase(),
                    requiere_curso,
                    requiere_exoneracion
                });
            }
        });
        
        // Grupos de prerequisitos
        document.querySelectorAll('.prerequisite-group').forEach(groupEl => {
            const type = groupEl.dataset.type;
            const groupDescription = groupEl.querySelector('.group-desc-input').value.trim();
            const groupId = groupEl.dataset.id;
            
            const groupPrereq = {
                requirement_id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                description: groupDescription || `Grupo ${type}`,
                tipo: type
            };
            
            if (type === 'AND') {
                groupPrereq.condiciones = [];
                
                groupEl.querySelectorAll('.group-condition').forEach(conditionEl => {
                    const codigo = conditionEl.querySelector('.condition-codigo').value.trim();
                    const description = conditionEl.querySelector('.condition-description').value.trim();
                    const requiere_curso = conditionEl.querySelector('.condition-curso').checked;
                    const requiere_exoneracion = conditionEl.querySelector('.condition-examen').checked;
                    
                    if (codigo) {
                        groupPrereq.condiciones.push({
                            codigo: codigo.toUpperCase(),
                            description: description || `Condición ${codigo}`,
                            requiere_curso,
                            requiere_exoneracion
                        });
                    }
                });
                
            } else if (type === 'OR') {
                groupPrereq.opciones = [];
                
                // Condiciones simples en el grupo OR
                groupEl.querySelectorAll('.group-condition').forEach(conditionEl => {
                    const codigo = conditionEl.querySelector('.condition-codigo').value.trim();
                    const description = conditionEl.querySelector('.condition-description').value.trim();
                    const requiere_curso = conditionEl.querySelector('.condition-curso').checked;
                    const requiere_exoneracion = conditionEl.querySelector('.condition-examen').checked;
                    
                    if (codigo) {
                        groupPrereq.opciones.push({
                            opcion_id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            description: description || `Opción ${codigo}`,
                            tipo: 'SIMPLE',
                            codigo: codigo.toUpperCase(),
                            requiere_curso,
                            requiere_exoneracion
                        });
                    }
                });
                
                // Opciones complejas en el grupo OR
                groupEl.querySelectorAll('.complex-condition').forEach(complexEl => {
                    const optionDescription = complexEl.querySelector('.option-description').value.trim();
                    const option = {
                        opcion_id: `complex_option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        description: optionDescription || 'Opción compleja',
                        tipo: 'AND',
                        condiciones: []
                    };
                    
                    complexEl.querySelectorAll('.sub-condition').forEach(subEl => {
                        const codigo = subEl.querySelector('.sub-condition-codigo').value.trim();
                        const description = subEl.querySelector('.sub-condition-description').value.trim();
                        const requiere_curso = subEl.querySelector('.sub-condition-curso').checked;
                        const requiere_exoneracion = subEl.querySelector('.sub-condition-examen').checked;
                        
                        if (codigo) {
                            option.condiciones.push({
                                codigo: codigo.toUpperCase(),
                                description: description || `Sub-condición ${codigo}`,
                                requiere_curso,
                                requiere_exoneracion
                            });
                        }
                    });
                    
                    if (option.condiciones.length > 0) {
                        groupPrereq.opciones.push(option);
                    }
                });
            }
            
            // Solo agregar el grupo si tiene condiciones/opciones
            const hasContent = (groupPrereq.condiciones && groupPrereq.condiciones.length > 0) ||
                              (groupPrereq.opciones && groupPrereq.opciones.length > 0);
            
            if (hasContent) {
                prerequisites.push(groupPrereq);
            }
        });
        
        return prerequisites;
    }

    loadPrerequisites(prerequisites) {
        prerequisites.forEach(prereq => {
            if (prereq.tipo === 'SIMPLE') {
                this.addSimplePrerequisite();
                const lastSimple = document.querySelector('.simple-prerequisite:last-child');
                lastSimple.querySelector('.prereq-codigo').value = prereq.codigo || '';
                lastSimple.querySelector('.prereq-description').value = prereq.description || '';
                lastSimple.querySelector('.prereq-curso').checked = prereq.requiere_curso || false;
                lastSimple.querySelector('.prereq-examen').checked = prereq.requiere_exoneracion || false;
                
            } else if (prereq.tipo === 'AND' || prereq.tipo === 'OR') {
                this.addPrerequisiteGroup(prereq.tipo);
                const lastGroup = document.querySelector('.prerequisite-group:last-child');
                lastGroup.querySelector('.group-desc-input').value = prereq.description || '';
                
                const groupId = lastGroup.dataset.id;
                
                if (prereq.tipo === 'AND' && prereq.condiciones) {
                    prereq.condiciones.forEach(condition => {
                        this.addConditionToGroup(groupId, 'simple');
                        const lastCondition = lastGroup.querySelector('.group-condition:last-child');
                        lastCondition.querySelector('.condition-codigo').value = condition.codigo || '';
                        lastCondition.querySelector('.condition-description').value = condition.description || '';
                        lastCondition.querySelector('.condition-curso').checked = condition.requiere_curso || false;
                        lastCondition.querySelector('.condition-examen').checked = condition.requiere_exoneracion || false;
                    });
                    
                } else if (prereq.tipo === 'OR' && prereq.opciones) {
                    prereq.opciones.forEach(opcion => {
                        if (opcion.tipo === 'SIMPLE') {
                            this.addConditionToGroup(groupId, 'simple');
                            const lastCondition = lastGroup.querySelector('.group-condition:last-child');
                            lastCondition.querySelector('.condition-codigo').value = opcion.codigo || '';
                            lastCondition.querySelector('.condition-description').value = opcion.description || '';
                            lastCondition.querySelector('.condition-curso').checked = opcion.requiere_curso || false;
                            lastCondition.querySelector('.condition-examen').checked = opcion.requiere_exoneracion || false;
                            
                        } else if (opcion.tipo === 'AND' && opcion.condiciones) {
                            this.addConditionToGroup(groupId, 'complex');
                            const lastComplex = lastGroup.querySelector('.complex-condition:last-child');
                            lastComplex.querySelector('.option-description').value = opcion.description || '';
                            
                            const conditionId = lastComplex.dataset.id;
                            opcion.condiciones.forEach(subCondition => {
                                this.addSubCondition(conditionId);
                                const lastSub = lastComplex.querySelector('.sub-condition:last-child');
                                lastSub.querySelector('.sub-condition-codigo').value = subCondition.codigo || '';
                                lastSub.querySelector('.sub-condition-description').value = subCondition.description || '';
                                lastSub.querySelector('.sub-condition-curso').checked = subCondition.requiere_curso || false;
                                lastSub.querySelector('.sub-condition-examen').checked = subCondition.requiere_exoneracion || false;
                            });
                        }
                    });
                }
            }
        });
    }

    // === ARCHIVO JSON ===
    loadJsonFile() {
        document.getElementById('file-input').click();
    }

    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.subjects = data.filter(subject => subject && subject.codigo);
                    this.updateStatusInfo();
                    this.showModal('Éxito', `Archivo cargado correctamente. ${this.subjects.length} materias importadas.`);
                } else {
                    throw new Error('El archivo debe contener un array de materias');
                }
            } catch (error) {
                console.error('Error cargando archivo:', error);
                this.showModal('Error', 'Error al cargar el archivo JSON. Verifica que sea un archivo válido.');
            }
        };
        reader.readAsText(file);
        
        // Limpiar el input para permitir cargar el mismo archivo nuevamente
        event.target.value = '';
    }

    exportJson() {
        try {
            const dataStr = JSON.stringify(this.subjects, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `ucs-migrated-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showModal('Éxito', 'Archivo exportado correctamente');
        } catch (error) {
            console.error('Error exportando archivo:', error);
            this.showModal('Error', 'Error al exportar el archivo JSON');
        }
    }

    // === MODAL ===
    showModal(title, message, onConfirm = null) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-overlay').style.display = 'flex';
        
        const confirmBtn = document.getElementById('modal-confirm');
        
        // Limpiar listeners anteriores
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        if (onConfirm) {
            newConfirmBtn.addEventListener('click', onConfirm);
        } else {
            newConfirmBtn.addEventListener('click', () => this.closeModal());
        }
    }

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.curriculumManager = new CurriculumManager();
});
