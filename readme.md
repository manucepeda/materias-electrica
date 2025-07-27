# Materias de Eléctrica

Aplicación web para visualizar y filtrar las materias de la carrera de Ingeniería Eléctrica de la FING, UdelaR.

## 🚀 Nueva Arquitectura Modular

La aplicación ha sido **completamente refactorizada** con una arquitectura limpia y modular que facilita el mantenimiento y la extensión.

### ✅ Características principales

- **Arquitectura modular** con separación clara de responsabilidades
- **Fácil extensión** para agregar nuevos perfiles (solo configuración + JSON)
- **Código limpio** y bien documentado
- **Perfil "Señales y Aprendizaje Automático"** totalmente funcional
- **Sistema dinámico** de carga de perfiles
- **Filtros avanzados** y búsqueda inteligente
- **Sin dependencias** - Vanilla JavaScript
- **Eliminación completa** de código hardcodeado

## 📁 Estructura del Proyecto

```
materias-electrica/
├── index.html              # Vista principal (grafo interactivo)
├── listado.html            # Vista de listado de materias
├── table-view.html         # Vista de tabla (para perfiles específicos)
├── js/                     # Módulos JavaScript
│   ├── config.js           # Configuración central de perfiles
│   ├── profile-manager.js  # Gestión de carga de perfiles
│   ├── ui-manager.js       # Manejo de interfaz de usuario
│   ├── subject-filter.js   # Filtros y búsqueda
│   ├── graph-new.js       # Aplicación principal (grafo)
│   ├── app-new.js         # Aplicación principal (listado)
│   └── profile-notes-new.js # Notas de perfiles
├── data/
│   ├── ucs.json           # Datos de materias
│   └── profiles/          # Perfiles de carrera
│       ├── electronica.json
│       ├── control.json
│       ├── potencia.json
│       ├── biomedica.json
│       └── senales.json
├── styles.css             # Estilos principales
├── styles-profile-notes.css # Estilos para notas
└── ARCHITECTURE.md        # Documentación técnica completa
```

## 🎯 Perfiles Disponibles

| Perfil | Énfasis | Notas Especiales | Plan Recomendado |
|--------|---------|------------------|------------------|
| **Electrónica** | ✅ (3 opciones) | ❌ | ✅ |
| **Control** | ❌ | ❌ | ✅ |
| **Sistemas Eléctricos de Potencia** | ❌ | ✅ | ✅ |
| **Ingeniería Biomédica** | ✅ (4 opciones) | ❌ | ✅ |
| **Señales y Aprendizaje Automático** | ❌ | ✅ | ✅ |

## 🛠️ Cómo Usar

### Vista Principal (Grafo)
1. Abrir `index.html`
2. Seleccionar un perfil
3. Seleccionar énfasis (si aplica)
4. Explorar el grafo interactivo
5. Hacer clic en materias para marcar aprobadas/exoneradas
6. Ver plan recomendado

### Vista de Listado
1. Abrir `listado.html`
2. Usar filtros múltiples
3. Buscar por texto
4. Ver detalles de materias

## 🔧 Para Desarrolladores

### Agregar un Nuevo Perfil

**Paso 1**: Crear archivo JSON en `data/profiles/nuevo-perfil.json`

```json
{
  "nombre": "Nuevo Perfil",
  "descripcion": "Descripción del nuevo perfil",
  "materias_core": ["CODIGO1", "CODIGO2"],
  "materias_optativas": ["OPT1", "OPT2"],
  "plan_recomendado": {
    "1": ["CODIGO1", "GAL1", "F1"],
    "2": ["CODIGO2", "GAL2", "F2"]
  },
  "notas_importantes": [
    {
      "id": "nota_especial",
      "titulo": "Nota Especial", 
      "descripcion": "Información importante para este perfil."
    }
  ]
}
```

**Paso 2**: Actualizar `js/config.js`

```javascript
export const PROFILE_CONFIG = {
  // ... perfiles existentes ...
  'Nuevo Perfil': {
    file: 'data/profiles/nuevo-perfil.json',
    hasEmphasis: false,
    hasTableView: false,
    hasNotes: true
  }
};
```

**Paso 3**: (Opcional) Agregar mapeo de notas

```javascript
export const SUBJECT_NOTE_MAPPING = {
  // ... mapeos existentes ...
  'Nuevo Perfil': {
    'CODIGO1': 'nota_especial'
  }
};
```

**¡Listo!** El perfil aparecerá automáticamente en la aplicación.

### Estructura de Datos

```json
{
  "nombre": "string (requerido)",
  "descripcion": "string (requerido)",
  "materias_core": ["array de códigos"],
  "materias_optativas": ["array de códigos"],
  "materias_sugeridas": ["array de códigos (opcional)"],
  "plan_recomendado": {
    "1": ["códigos del semestre 1"],
    "2": ["códigos del semestre 2"]
  },
  "emphasis": [
    {
      "nombre": "string",
      "materias_core": ["array"],
      "materias_optativas": ["array"],
      "plan_recomendado": {}
    }
  ],
  "notas_importantes": [
    {
      "id": "identificador",
      "titulo": "Título",
      "descripcion": "Descripción"
    }
  ]
}
```

## 🚨 Migración

### ✅ Usa Ahora
- `index.html` (actualizado con nueva arquitectura)
- `listado.html` (nueva vista de listado)
- Todos los archivos en `js/`
- Perfiles JSON en `data/profiles/`

### ❌ Archivos Obsoletos
- `app.js` (reemplazado por sistema modular)
- `graph.js` (reemplazado por `js/graph-new.js`)
- `profile-notes.js` (reemplazado por `js/profile-notes-new.js`)
- `index-new.html` y `graph-new.html` (archivos temporales)

## 🌐 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+
- ✅ Edge 79+

### Tecnologías
- ✅ **Vanilla JavaScript** (ES6+ modules)
- ✅ **CSS Grid/Flexbox**
- ✅ **Fetch API**
- ✅ **Sin build process**
- ✅ **Sin dependencias externas**

## 📊 Datos

Los datos de materias están en `data/ucs.json` y siguen el plan de estudios oficial de Ingeniería Eléctrica de FING, UdelaR.

Cada perfil tiene su archivo JSON independiente con:
- Materias core y optativas
- Planes recomendados por semestre
- Énfasis específicos (cuando aplica)
- Notas importantes

## 🤝 Contribuir

1. **Fork** el proyecto
2. **Crear** una rama para tu feature
3. **Agregar** tu perfil siguiendo la documentación
4. **Probar** la funcionalidad
5. **Enviar** un pull request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🎉 Beneficios de la Nueva Arquitectura

### Para Desarrolladores
- ✅ **Código modular** y fácil de entender
- ✅ **Documentación completa** en `ARCHITECTURE.md`
- ✅ **Estructura clara** de responsabilidades
- ✅ **Testing** simplificado
- ✅ **Extensión** trivial de funcionalidades

### Para Usuarios
- ✅ **Interfaz mejorada** y más responsive
- ✅ **Rendimiento optimizado**
- ✅ **Funcionalidades avanzadas** (filtros, búsqueda, etc.)
- ✅ **Todos los perfiles funcionando** correctamente
- ✅ **Experiencia consistente** entre vistas

### Para Mantenimiento
- ✅ **Transferencia de ownership** facilitada
- ✅ **Onboarding** de nuevos desarrolladores simplificado
- ✅ **Debugging** y troubleshooting mejorados
- ✅ **Escalabilidad** asegurada

---

**🏆 La aplicación está lista para producción con una arquitectura limpia que cualquier desarrollador puede entender y extender fácilmente.**

