# Materias de Ingeniería Eléctrica y Biomédica - Visualizador de Planes de Estudio

Esta aplicación web permite visualizar, explorar y filtrar las materias de los planes de estudio de Ingeniería Eléctrica y Biomédica de la FING, UdelaR. Incluye vistas por perfil, énfasis, listado y tabla recomendada, con filtros avanzados y navegación intuitiva.

---

## 🚀 ¿Qué hace esta aplicación?

- **Visualiza el plan de estudios** de Ingeniería Eléctrica y Biomédica, mostrando materias organizadas por semestre, perfil y énfasis.
- **Permite filtrar materias** por créditos, semestre de dictado, modalidad (libre/curso), etc.
- **Muestra el plan recomendado** para cada perfil y énfasis, tanto en formato de grafo como en tabla.
- **Navegación entre vistas**: listado, grafo interactivo y tabla recomendada.
- **Carga dinámica de perfiles** y énfasis desde archivos JSON.
- **Sin dependencias externas**: solo JavaScript, HTML y CSS.

---

## 📁 Estructura del Proyecto

```
materias-electrica/
├── index.html                # Vista principal (grafo por perfil/énfasis)
├── listado.html              # Listado filtrable de materias
├── table-view.html           # Vista de tabla recomendada por énfasis
├── table-view.js             # Lógica de la tabla recomendada
├── styles.css                # Estilos principales
├── table-styles.css          # Estilos para la tabla recomendada
├── data/
│   ├── ucs.json              # Materias y sus datos
│   └── profiles/
│       ├── biomedica.json    # Perfil Ingeniería Biomédica
│       ├── electronica.json  # Perfil Electrónica
│       ├── control.json      # Perfil Control
│       ├── potencia.json     # Perfil Potencia
│       └── senales.json      # Perfil Señales
└── js/
    ├── app-tree.js           # Lógica de grafo interactivo
    ├── ...                   # Otros módulos JS (según arquitectura modular)
```

---

## 🎯 Funcionalidades principales

- **Vista de grafo**: muestra materias por semestre, con colores según estado (aprobada, exonerada, disponible, etc.).
- **Vista de tabla**: plan recomendado por énfasis, con créditos por semestre y acumulados.
- **Listado filtrable**: búsqueda y filtros por créditos, semestre, modalidad, etc.
- **Perfiles y énfasis**: selección dinámica, cada uno con su plan y materias específicas.
- **Leyendas y ayudas visuales**: para interpretar colores, estados y tipos de materias.
- **Navegación rápida** entre vistas (listado, grafo, tabla).

---

## 🛠️ ¿Cómo usar?

1. **Abrir `index.html`** para ver el grafo interactivo por perfil/énfasis.
2. **Abrir `listado.html`** para buscar y filtrar materias.
3. **Abrir `table-view.html`** para ver el plan recomendado en formato tabla (por énfasis).
4. Usar los enlaces de navegación para cambiar entre vistas.
5. Filtrar, buscar y explorar según tus intereses.

---

## 📦 Datos y Perfiles

- Los datos de materias están en `data/ucs.json`.
- Cada perfil (y sus énfasis) tiene su archivo en `data/profiles/`.
- Los planes recomendados se definen por semestre y código de materia.
- Puedes agregar nuevos perfiles/énfasis creando un archivo JSON y enlazándolo en la configuración JS.

---

## 💡 Lógica y arquitectura

- **Carga dinámica**: Los datos se cargan vía `fetch` desde los archivos JSON.
- **Renderizado flexible**: Las vistas se generan dinámicamente según el perfil/énfasis seleccionado.
- **Filtros avanzados**: Se aplican en el frontend, sin recargar la página.
- **Código modular**: Separación clara entre lógica de datos, UI y estilos.
- **Accesibilidad**: Navegación sencilla y responsive.

---

## 👩‍💻 Para desarrolladores

- **Agregar un perfil nuevo**: crea un JSON en `data/profiles/` siguiendo el formato de los existentes.
- **Actualizar la lógica**: modifica los módulos JS según sea necesario.
- **Personalizar estilos**: edita `styles.css` y `table-styles.css`.

---

## 📄 Licencia

MIT. Uso libre para fines educativos y de mejora del software académico.

---

**Desarrollado para la comunidad de Ingeniería Eléctrica y Biomédica de la FING, UdelaR.**

