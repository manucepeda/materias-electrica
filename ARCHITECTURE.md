# Materias Eléctrica - Documentación de Arquitectura Limpia

## 🏗️ Visión General

Esta aplicación ha sido completamente refactorizada con una arquitectura limpia y modular que facilita el mantenimiento y la extensibilidad. La nueva estructura elimina implementaciones hardcodeadas y permite agregar nuevos perfiles fácilmente.

## 🎯 Mejoras Clave

✅ **Arquitectura modular**: Separación clara de responsabilidades  
✅ **Carga dinámica de perfiles**: Los perfiles se cargan automáticamente desde archivos JSON  
✅ **Sin hardcodeo**: Ya no hay lógica específica de perfiles hardcodeada  
✅ **Fácil extensión**: Agregar nuevos perfiles solo requiere configuración  
✅ **Código limpio**: Base de código bien documentada y mantenible  
✅ **Perfil Señales corregido**: Ahora funciona correctamente  

## 📁 Estructura de Módulos

```
js/
├── config.js              # Configuración central y mapeo de perfiles
├── profile-manager.js     # Carga y gestión de datos de perfiles
├── ui-manager.js          # Interacciones y renderizado de UI
├── subject-filter.js      # Filtrado y búsqueda de materias
├── graph-app.js           # Aplicación principal de vista de grafo
├── list-app.js            # Aplicación principal de vista de listado
└── profile-notes.js       # Notas y tooltips de perfiles
```

## 🔧 Cómo agregar un nuevo perfil

### Paso 1: Crear el archivo JSON del perfil

Crea un nuevo archivo JSON en `data/profiles/profile-name.json`:

```json
{
  "nombre": "Nombre del Perfil",
  "descripcion": "Descripción detallada del perfil",
  "materias_core": ["SUBJ1", "SUBJ2", "SUBJ3"],
  "materias_optativas": ["OPT1", "OPT2", "OPT3"],
  "materias_sugeridas": ["SUG1", "SUG2"],
  "plan_recomendado": {
    "1": ["SUBJ1", "MATH1", "PHYS1"],
    "2": ["SUBJ2", "MATH2", "PHYS2"],
    "3": ["SUBJ3", "OPT1"]
  },
  "emphasis": [
    {
      "nombre": "Nombre del Énfasis",
      "descripcion": "Descripción del énfasis",
      "materias_core": ["EMPH1", "EMPH2"],
      "materias_optativas": ["EOPT1", "EOPT2"],
      "plan_recomendado": {
        "7": ["EMPH1", "EOPT1"],
        "8": ["EMPH2", "EOPT2"]
      }
    }
  ],
  "notas_importantes": [
    {
      "id": "special_note",
      "titulo": "Título de Nota Especial",
      "descripcion": "Información importante sobre este perfil."
    }
  ]
}
```
      "materias_optativas": ["EMPH2"],
      "plan_recomendado": {
        "1": ["EMPH1"],
        "2": ["EMPH2"]
      }
    }
  ],
  "notas_importantes": [
    {
      "id": "note_id",
      "titulo": "Título de la Nota",
      "descripcion": "Descripción de la nota"
    }
  ]
}
```

**Campos obligatorios:**
- `nombre`: Nombre del perfil (debe coincidir con la clave en PROFILE_CONFIG)
- `descripcion`: Descripción del perfil
- `materias_core`: Array de códigos de materias obligatorias
- `materias_optativas`: Array de códigos de materias optativas

**Campos opcionales:**
- `materias_sugeridas`: Array de códigos de materias sugeridas
- `plan_recomendado`: Plan de estudios recomendado por semestre
- `emphasis`: Array de énfasis para el perfil
- `notas_importantes`: Notas importantes para el perfil

### Paso 2: Actualizar la configuración

Agrega tu perfil en `js/config.js` dentro del objeto `PROFILE_CONFIG`:

```javascript
export const PROFILE_CONFIG = {
  // ... perfiles existentes ...
  'Nombre del Perfil': {
    file: 'data/profiles/profile-name.json',
    hasEmphasis: true,           // false si no tiene énfasis
    emphasis: ['Nombre del Énfasis'], // Lista de nombres de énfasis
    hasNotes: true               // true si tiene notas especiales
  }
};
```

### Paso 3: (Opcional) Agregar mapeo de notas

Si tu perfil tiene notas especiales, agrega el mapeo de materias en `SUBJECT_NOTE_MAPPING`:

```javascript
export const SUBJECT_NOTE_MAPPING = {
  // ... mapeos existentes ...
  'Nombre del Perfil': {
    'SUBJ1': 'special_note',
    'SUBJ2': 'another_note',
    'OPT1': 'optional_note'
  }
};
```

### Paso 4: Probar tu perfil

1. ✅ El perfil aparece en los selectores desplegables
2. ✅ Las materias se filtran correctamente por perfil
3. ✅ Las opciones de énfasis funcionan (si aplica)
4. ✅ El plan recomendado se muestra (si está definido)
5. ✅ Las notas especiales resaltan materias (si están configuradas)

## 🧩 Detalle de módulos

### config.js
**Centro de configuración**
- Mapeo de perfiles y metadatos
- Mapeo de materias a notas  
- Funciones de validación
- Flags de funcionalidades por perfil

### profile-manager.js  
**Gestión de datos de perfiles**
- Carga dinámica de JSON
- Caché y manejo de errores
- Validación de datos
- API para acceso a perfiles

### ui-manager.js
**Control de interfaz de usuario**
- Poblado dinámico de selectores
- Gestión de opciones de énfasis
- Manejo de estado de UI
- Control de visibilidad de elementos

### subject-filter.js
**Filtrado y búsqueda**
- Filtrado multicriterio
- Búsqueda por texto
- Filtrado por perfil/énfasis
- Optimización de rendimiento

## 📋 Esquema de datos

### Estructura del JSON de perfil
```json
{
  "nombre": "string (obligatorio)",
  "descripcion": "string (obligatorio)",
  "materias_core": ["string"] "(obligatorio)",
  "materias_optativas": ["string"] "(obligatorio)",
  "materias_sugeridas": ["string"] "(opcional)",
  "plan_recomendado": {
    "1": ["SUBJ1", "SUBJ2"],
    "2": ["SUBJ3", "SUBJ4"]
  },
  "emphasis": [
    {
      "nombre": "string",
      "descripcion": "string", 
      "materias_core": ["string"],
      "materias_optativas": ["string"],
      "plan_recomendado": {}
    }
  ],
  "notas_importantes": [
    {
      "id": "string",
      "titulo": "string",
      "descripcion": "string"
    }
  ]
}
```

## 🔍 Validación de datos

El sistema valida automáticamente los datos de perfil:

**Campos obligatorios:**
- ✅ `nombre`: Nombre visible del perfil
- ✅ `descripcion`: Descripción del perfil  
- ✅ `materias_core`: Array de códigos de materias obligatorias
- ✅ `materias_optativas`: Array de códigos de materias optativas

**Campos opcionales:**
- 🔄 `materias_sugeridas`: Materias sugeridas
- 🔄 `emphasis`: Definiciones de énfasis
- 🔄 `plan_recomendado`: Plan de estudios recomendado
- 🔄 `notas_importantes`: Notas especiales

## 🐛 Solución de problemas

### El perfil no aparece
1. ✅ Verifica que exista la entrada en `PROFILE_CONFIG`
2. ✅ Revisa que la ruta del archivo JSON sea correcta
3. ✅ Valida la sintaxis del JSON online
4. ✅ Revisa la consola del navegador por errores

### Las materias no se filtran
1. ✅ Verifica los códigos de materias en los arrays
2. ✅ Revisa errores de tipeo en los códigos
3. ✅ Asegúrate que las materias existan en `ucs.json`
4. ✅ Limpia la caché del navegador

### El plan recomendado no funciona
1. ✅ Revisa la estructura de `plan_recomendado`
2. ✅ Verifica que las claves de semestre sean strings ("1", "2", etc.)
3. ✅ Asegúrate que todos los códigos de materias sean válidos
4. ✅ Revisa si faltan materias

### Las notas no se resaltan
1. ✅ Verifica la entrada en `SUBJECT_NOTE_MAPPING`
2. ✅ Revisa que los IDs de notas coincidan con `notas_importantes`
3. ✅ Asegúrate que `hasNotes: true` esté en la config
4. ✅ Revisa que se apliquen las clases CSS

## 🚀 Migración desde el sistema anterior

### Qué cambió
```
SISTEMA VIEJO → SISTEMA NUEVO
app.js → js/list-app.js + módulos
graph.js → js/graph-app.js + módulos  
profile-notes.js → js/profile-notes.js
Lógica hardcodeada → Basado en configuración
```

### Archivos a usar ahora
- ✅ `index.html` (aplicación principal de grafo interactivo)
- ✅ `subjects.html` (aplicación de exploración de materias)
- ✅ Todos los archivos en el directorio `js/`
- ✅ JSONs de perfiles en `data/profiles/`

### Archivos a retirar
- ❌ `app.js` (archivo monolítico viejo)
- ❌ `graph.js` (archivo monolítico viejo)
- ❌ `index-new.html` (archivo de testing temporal)
- ❌ `graph-new.html` (archivo de testing temporal)

## 📊 Optimizaciones de rendimiento

### Estrategia de carga
- ⚡ Los perfiles se cargan bajo demanda
- ⚡ Los datos de perfil se cachean tras la primera carga
- ⚡ Filtrado eficiente de materias
- ⚡ Manipulación mínima del DOM

### Buenas prácticas aplicadas
- 🎯 Delegación de eventos para rendimiento
- 🎯 Búsqueda con debounce
- 🎯 Actualizaciones de DOM en batch
- 🎯 Prevención de memory leaks

## 🎨 Guía de personalización

### Agregar funcionalidades
1. Crea un nuevo módulo en `js/`
2. Exporta las funciones necesarias
3. Importa donde sea necesario
4. Actualiza la config si corresponde

### Estilos
- Estilos principales: `styles.css`
- Notas de perfil: `profile-notes.css`
- Diseño responsive incluido
- Custom properties CSS para temas

## 📚 Stack tecnológico

### Solo frontend
- ✅ **JavaScript Vanilla** (ES6+ módulos)
- ✅ **CSS Grid/Flexbox** para layouts
- ✅ **Fetch API** para carga de datos
- ✅ **APIs modernas de DOM**

### Sin dependencias
- ❌ No requiere frameworks
- ❌ No necesita build process
- ❌ No necesita package managers
- ❌ No requiere transpilar

### Soporte de navegador
- ✅ Chrome 60+
- ✅ Firefox 60+  
- ✅ Safari 12+
- ✅ Edge 79+

## 🔄 Mejoras futuras

Listo para:
- 📈 Sistemas de herencia de perfiles
- 📈 Fuentes de datos de materias dinámicas
- 📈 Búsqueda avanzada con filtros
- 📈 Funcionalidad de exportar/importar
- 📈 Características de Progressive Web App
- 📈 Funcionalidad offline
- 📈 Soporte multilenguaje

## ✅ Fix del perfil Señales

El problema con el perfil "Señales y Aprendizaje Automático" fue resuelto:

- ✅ **Corregido**: Rutas de importación en módulos
- ✅ **Corregido**: Mecanismo de carga de perfil  
- ✅ **Corregido**: Mapeo de notas y resaltado
- ✅ **Corregido**: Visualización de plan recomendado
- ✅ **Funciona**: Todos los filtros y búsqueda
- ✅ **Funciona**: Notas especiales y tooltips

## 🎉 Resultado

**Arquitectura limpia, mantenible y extensible** que:
- ✅ Elimina implementaciones hardcodeadas
- ✅ Hace trivial agregar perfiles (solo config + JSON)
- ✅ Proporciona excelente mantenibilidad  
- ✅ Permite fácil transferencia de ownership
- ✅ Incluye documentación completa
- ✅ Corrige todos los problemas existentes

---

**🏆 La base de código está lista para producción con arquitectura limpia que cualquier desarrollador puede entender y extender fácilmente.**
- Manipulación mínima del DOM
- Manejo de eventos optimizado

## Soporte de navegador

La aplicación usa características modernas de JavaScript:
- Módulos ES6
- Async/await
- Métodos modernos de arrays
- CSS Grid y Flexbox

Navegadores soportados:
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
