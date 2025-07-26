# Materias de Eléctrica

Listado estático, filtrable y grafo interactivo de materias y prerrequisitos de Ingeniería Eléctrica de la UDELAR. Hosteable gratis (GitHub Pages / Netlify / Vercel).

## Características

- **Listado filtrable** de materias por nombre, semestre, créditos, perfil y énfasis.
- **Grafo interactivo** de materias organizadas por semestres.
- Visualización de prerrequisitos y dependencias entre materias.
- Seguimiento del progreso académico con conteo de créditos.
- Interfaz para marcar materias como aprobadas o exoneradas.
- Soporte para perfiles de especialización:
  - **Electrónica** (con énfasis en: Electrónica Biomédica, Sistemas Embebidos, Circuitos y Sistemas Electrónicos)
  - **Control** (con materias core, opcionales y sugeridas)
  - **Sistemas Eléctricos de Potencia**
  - **Ingeniería Biomédica** (con énfasis en: Electrónica, Ingeniería Clínica, Señales, Informática)

## Estructura

- `index.html`: Vista de listado filtrable de materias.
- `graph.html`: Vista del grafo interactivo de materias por semestre.
- `data/materias_with_prereqs.json`: Datos de todas las materias con sus perfiles, énfasis y prerequisitos.
- `data/materias.json`: Versión simplificada de los datos (para compatibilidad).
- `app.js`: Lógica para la vista de listado.
- `graph.js`: Lógica para la vista de grafo.
- `styles.css`: Estilos compartidos entre ambas vistas.
- `server.py`: Servidor HTTP simple para desarrollo local.

## Uso

### Ejecución local

1. Clona este repositorio
2. Ejecuta el servidor web local:

```bash
python server.py
```

O utiliza cualquier servidor web simple como:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

3. Abre [http://localhost:8000](http://localhost:8000) en tu navegador.

### En el grafo interactivo

1. Selecciona un perfil de especialización en el menú desplegable.
2. Para perfiles con énfasis (Electrónica o Ing. Biomédica), puedes seleccionar un énfasis específico.
3. Haz clic en una materia para marcarla como:
   - Sin marcar → Aprobada (curso) → Exonerada → Sin marcar (ciclo)
4. Verás estadísticas de tu progreso en el panel superior.
5. Filtros adicionales disponibles:
   - Semestre de dictado (par/impar)
   - Créditos (menos o más de 10)
   - Materias libres

### Perfiles especiales

- **Control**: Las materias se clasifican en:
  - Core (obligatorias del perfil)
  - Opcionales (optativas del perfil)
  - Sugeridas (recomendadas pero no obligatorias)

## Datos y Plan de Estudios

Los datos están basados en el Plan de Estudios de Ingeniería Eléctrica de la Facultad de Ingeniería (UDELAR).

## Contribuciones

Las contribuciones son bienvenidas. Puedes abrir issues o enviar pull requests para mejoras o correcciones.

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo LICENSE para más detalles.

