# 🎓 Gestión de Curriculum - Editor de Unidades Curriculares

Una aplicación web intuitiva para gestionar unidades curriculares y sus prerequisitos complejos.

## 🌟 Características

### ✅ **Gestión Completa de Materias**
- Agregar nuevas unidades curriculares
- Editar materias existentes
- Eliminar materias con confirmación
- Búsqueda rápida por código o nombre

### 🔗 **Sistema de Prerequisitos Avanzado**
- **Prerequisitos Simples**: Una materia específica (curso o examen)
- **Grupos AND (Todas)**: Debe cumplir todas las condiciones
- **Grupos OR (Alguna)**: Debe cumplir al menos una opción
- **Combinaciones Complejas**: Múltiples niveles de agrupación

### 🛡️ **Validaciones Inteligentes**
- Verificación de códigos duplicados
- Validación de prerequisitos existentes
- Prevención de dependencias circulares
- Validación de formatos de datos

### 📁 **Gestión de Archivos**
- Importar desde JSON existente
- Exportar datos actualizados
- Compatibilidad con `ucs-migrated.json`

## 🚀 Inicio Rápido

### 1. Iniciar el Servidor

```bash
cd curriculamgmt
python3 server.py
```

### 2. Abrir en el Navegador

Visita: `http://localhost:8080/index.html`

## 📋 Uso de la Aplicación

### Agregar Nueva Materia

1. Haz clic en **"Agregar Nueva"** o usa la tarjeta de la vista principal
2. Completa la información básica:
   - **Código**: Identificador único (ej: P1, CDIV, GAL1)
   - **Nombre**: Nombre completo de la materia
   - **Créditos**: Cantidad de créditos (1-30)
   - **Semestre**: Semestre sugerido (1-8)
   - **Semestre de Dictado**: Cuándo se dicta (ambos, 1, 2)
   - **Solo Examen**: Si la materia solo tiene examen final

### Definir Prerequisitos

#### Prerequisito Simple
Para una materia que requiere una sola condición:
```
Código: P1
Tipo: Curso
```

#### Grupo AND (Todas las condiciones)
Para materias que requieren **todas** las condiciones:
```
DEBE TENER TODAS (AND)
├── P1 - Curso
├── P2 - Examen  
└── GAL1 - Curso
```

#### Grupo OR (Alguna opción)
Para materias que permiten **múltiples caminos**:
```
DEBE TENER ALGUNA (OR)
├── Opción 1: P3 - Examen
├── Opción 2: P4 - Curso
└── Opción 3: Tallerine - Curso
```

### Ejemplos de Prerequisitos Complejos

#### Caso Real: Taller de Programación
```
DEBE TENER ALGUNA (OR)
├── Opción 1: DEBE TENER TODAS (AND)
│   ├── P3 - Examen (Exonerar)
│   └── P4 - Curso (Salvar)
└── Opción 2: P4 - Examen (Exonerar)
```

#### Caso Real: Proyecto de Graduación
```
DEBE TENER TODAS (AND)
├── Créditos mínimos completados
├── DEBE TENER ALGUNA (OR)
│   ├── Todas las materias del perfil
│   └── 80% + autorización del coordinador
└── Seminario de Investigación - Curso
```

## 🔧 Estructura de Datos

### Formato JSON
```json
{
  "codigo": "TProg",
  "nombre": "Taller de Programación",
  "creditos": 15,
  "semestre": 4,
  "dictation_semester": "both",
  "exam_only": false,
  "prerequisites": [
    {
      "requirement_id": "tprog_req_1",
      "description": "Una de las siguientes opciones",
      "tipo": "OR",
      "opciones": [
        {
          "opcion_id": "tprog_opt_1",
          "description": "Exonerar P3 y Salvar P4",
          "tipo": "AND",
          "condiciones": [
            {
              "codigo": "P3",
              "requiere_exoneracion": true,
              "description": "Exonerar Programación 3"
            },
            {
              "codigo": "P4",
              "requiere_curso": true,
              "description": "Salvar curso Programación 4"
            }
          ]
        },
        {
          "opcion_id": "tprog_opt_2",
          "description": "Exonerar Programación 4",
          "tipo": "SIMPLE",
          "codigo": "P4",
          "requiere_exoneracion": true
        }
      ]
    }
  ]
}
```

## 🎯 Casos de Uso

### 1. Materias de Primer Semestre
```json
{
  "codigo": "P1",
  "nombre": "Programación 1",
  "prerequisites": []
}
```

### 2. Materias con Prerequisito Simple
```json
{
  "codigo": "P2",
  "prerequisites": [
    {
      "tipo": "SIMPLE",
      "codigo": "P1",
      "requiere_curso": true
    }
  ]
}
```

### 3. Materias con Múltiples Prerequisitos
```json
{
  "codigo": "BD1",
  "prerequisites": [
    {
      "tipo": "AND",
      "condiciones": [
        { "codigo": "P2", "requiere_curso": true },
        { "codigo": "GAL1", "requiere_exoneracion": true }
      ]
    }
  ]
}
```

## 🛠️ Funcionalidades Técnicas

### Validaciones Implementadas
- ✅ Códigos únicos
- ✅ Prerequisitos existentes
- ✅ No auto-referencia
- ✅ Formatos de datos correctos
- ✅ Dependencias circulares (básico)

### Características de la Interfaz
- 📱 Responsive design
- 🎨 Interfaz moderna y limpia
- ⚡ Búsqueda en tiempo real
- 🔄 Actualización automática de estadísticas
- 💾 Exportación/importación de datos

## 📂 Archivos del Proyecto

```
curriculamgmt/
├── index.html              # Interfaz principal
├── styles.css              # Estilos CSS
├── curriculum-manager.js   # Lógica de la aplicación
├── server.py              # Servidor de desarrollo
└── README.md              # Esta documentación
```

## 🔍 Solución de Problemas

### El servidor no inicia
```bash
# Verificar que Python3 esté instalado
python3 --version

# Si no está instalado (macOS)
brew install python3
```

### Error al cargar archivos JSON
- Verificar que el archivo sea un JSON válido
- Asegurar que contenga un array de objetos
- Verificar la estructura de cada materia

### Prerequisitos no se guardan
- Verificar que todos los campos obligatorios estén completos
- Asegurar que los códigos de prerequisitos existan
- Revisar la consola del navegador para errores

## 📧 Soporte

Para problemas o mejoras, revisar:
1. La consola del navegador (F12)
2. Los logs del servidor Python
3. La validación de datos en el formulario

## 🎯 Próximas Funcionalidades

- [ ] Visualización gráfica de prerequisitos
- [ ] Validación avanzada de dependencias circulares
- [ ] Historial de cambios
- [ ] Exportación a otros formatos
- [ ] Importación desde planillas Excel
- [ ] Sistema de perfiles de usuario
