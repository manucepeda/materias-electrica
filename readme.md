# Materias Ingeniería Eléctrica 📚⚡

Sistema web interactivo para visualizar y explorar el plan de estudios de Ingeniería Eléctrica de la FING, UdelaR.

## 🌟 Características Principales

- **Grafo Interactivo**: Visualización gráfica de prerrequisitos y relaciones entre materias
- **Listado Filtrable**: Búsqueda avanzada y exploración detallada de materias
- **Vista de Tabla**: Plan de estudios organizado por semestres
- **Perfiles Especializados**: Filtrado por perfiles de Control, Potencia, Electrónica, etc.
- **Diseño Responsive**: Optimizado para desktop, tablet y móvil

## 🚀 Acceso Rápido

### Vistas Disponibles
- **[Grafo Interactivo](index.html)** - Página principal con visualización de red
- **[Exploración de Materias](subjects.html)** - Búsqueda detallada con filtros

### Filtros Disponibles
- 🔍 Búsqueda por nombre o código
- 📊 Filtro por créditos
- 🎯 Filtro por perfil de especialización
- 📅 Filtro por semestre de dictado

## 📖 Guía de Uso

### Navegación por Teclado
- **`/`** - Enfocar campo de búsqueda
- **`Esc`** - Limpiar búsqueda
- **`Tab`** - Navegar entre elementos

### Estados de Materias (Grafo)
- 🟢 **Verde** - Materia disponible para cursar
- 🔴 **Rojo** - Prerrequisitos no cumplidos
- 🟡 **Amarillo** - Curso aprobado
- 🔵 **Azul** - Materia exonerada
- ⚪ **Gris** - No relevante para filtros actuales

### Filtros de Perfil
- **Biomédica** - Ingeniería biomédica y dispositivos médicos
- **Control** - Sistemas de control automático
- **Electrónica** - Sistemas electrónicos y microelectrónica
- **Potencia** - Sistemas de energía y alta tensión
- **Señales** - Procesamiento de señales y comunicaciones

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Diseño modular con custom properties
- **JavaScript ES6+** - Lógica de aplicación con modules
- **JSON** - Almacenamiento de datos
- **SVG** - Gráficos escalables para el grafo

## 🏗️ Arquitectura del Proyecto

```
├── css/
│   ├── main.css              # Archivo principal de estilos
│   ├── base/                 # Reset, tipografía, variables
│   ├── componentes/          # Elementos reutilizables
│   ├── utilidades/          # Clases auxiliares
│   └── vistas/              # Variaciones de visualización
├── data/
│   ├── ucs-migrated.json    # Datos de materias
│   └── profiles/            # Configuraciones de perfiles
├── js/
│   ├── graph.js             # Aplicación de grafo interactivo
│   ├── subjects.js          # Aplicación de exploración de materias
│   ├── config.js            # Configuración global
│   ├── profiles.js          # Gestión de perfiles
│   ├── ui.js                # Gestión de interfaz
│   ├── filters.js           # Filtrado de materias
│   └── *.js                 # Módulos especializados
├── curriculamgmt/           # Herramienta independiente de gestión
├── index.html               # Página principal (grafo interactivo)
└── subjects.html            # Vista de exploración de materias
```

## 🎯 Funcionalidades por Vista

### Grafo Interactivo (index.html)
- Visualización de red de prerrequisitos
- Simulación de progreso académico
- Filtros por perfil y características
- Estados visuales de materias
- Zoom y navegación del grafo

### Exploración de Materias (subjects.html)
- Tarjetas detalladas de materias
- Búsqueda en tiempo real
- Filtros múltiples combinables
- Información completa de prerrequisitos
- Clasificación por perfiles

## � Diseño Responsive

El sistema está optimizado para múltiples dispositivos:

- **Desktop** (1200px+) - Experiencia completa
- **Tablet** (768px-1199px) - Navegación adaptada
- **Mobile** (320px-767px) - Interfaz optimizada

## 🔧 Instalación Local

### Requisitos
- Servidor web (necesario para ES6 modules)
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)

### Opciones de Servidor

#### Python
```bash
python -m http.server 8000
```

#### Node.js
```bash
npx serve .
```

#### PHP
```bash
php -S localhost:8000
```

Luego acceder a `http://localhost:8000`

## 🗃️ Estructura de Datos

### Formato de Materias
Cada materia incluye:
- Código único y nombre
- Créditos y semestre sugerido
- Prerrequisitos con condiciones específicas
- Información de dictado
- Clasificación por perfiles

### Prerrequisitos Complejos
El sistema maneja:
- **Prerrequisitos simples**: Una materia específica
- **Condiciones OR**: Cualquiera de varias opciones
- **Tipos de aprobación**: Curso, examen, exoneración

## 🎨 Personalización

### Variables CSS
El sistema utiliza custom properties para fácil personalización:
```css
:root {
  --color-primary: #003366;
  --color-secondary: #0066cc;
  --space-unit: 0.5rem;
  --font-family-main: system-ui, sans-serif;
}
```

### Themes
- Soporte para modo claro/oscuro
- Colores personalizables por perfil
- Adaptación automática según preferencias del sistema

## 🤝 Contribución

### Cómo Contribuir
1. Fork del repositorio
2. Crear rama para nueva funcionalidad
3. Implementar cambios siguiendo convenciones
4. Enviar pull request

### Convenciones de Código
- **CSS**: Metodología BEM, mobile-first
- **JavaScript**: ES6+, módulos, comentarios en español
- **HTML**: Semántico, accesible

## � Soporte

Para reportar problemas o sugerir mejoras:
- Abrir issue en el repositorio
- Incluir pasos para reproducir
- Especificar navegador y dispositivo

## 📊 Datos del Plan de Estudios

Los datos están basados en:
- Plan de estudios oficial de Ingeniería Eléctrica FING
- Información actualizada de prerrequisitos
- Perfiles de especialización definidos por la facultad

---

## 📄 Información Adicional

**Universidad**: Universidad de la República (UdelaR)  
**Facultad**: Facultad de Ingeniería (FING)  
**Carrera**: Ingeniería Eléctrica  
**Última actualización**: 2024

---

*"Las nubes pasan, el azul queda" - 💙*

