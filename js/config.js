/**
 * Módulo de configuración para la aplicación Materias Eléctrica
 * Centraliza toda la configuración de perfiles y carga dinámica de perfiles
 */

// Configuración de perfiles con capacidades de carga dinámica
export const PROFILE_CONFIG = {
  'Electrónica': {
    file: 'data/profiles/electronica.json',
    hasEmphasis: true,
    emphasis: ['Electrónica Biomédica', 'Sistemas Embebidos', 'Circuitos y Sistemas Electrónicos'],
    hasTableView: false,
    hasNotes: false
  },
  'Control': {
    file: 'data/profiles/control.json',
    hasEmphasis: false,
    hasTableView: false,
    hasNotes: false
  },
  'Sistemas Eléctricos de Potencia': {
    file: 'data/profiles/potencia.json',
    hasEmphasis: false,
    hasTableView: false,
    hasNotes: true
  },
  'Ingeniería Biomédica': {
    file: 'data/profiles/biomedica.json',
    hasEmphasis: true,
    emphasis: ['Electrónica', 'Ingeniería Clínica', 'Señales', 'Informática'],
    hasTableView: true,
    hasNotes: false
  },
  'Señales y Aprendizaje Automático': {
    file: 'data/profiles/senales.json',
    hasEmphasis: false,
    hasTableView: false,
    hasNotes: true
  }
};

// Get all profile names
export function getProfileNames() {
  return Object.keys(PROFILE_CONFIG);
}

// Get profile configuration
export function getProfileConfig(profileName) {
  return PROFILE_CONFIG[profileName] || null;
}

// Check if profile has emphasis options
export function profileHasEmphasis(profileName) {
  const config = getProfileConfig(profileName);
  return config ? config.hasEmphasis : false;
}

// Get emphasis options for a profile
export function getProfileEmphasis(profileName) {
  const config = getProfileConfig(profileName);
  return config && config.hasEmphasis ? config.emphasis : [];
}

// Check if profile supports table view
export function profileHasTableView(profileName) {
  const config = getProfileConfig(profileName);
  return config ? config.hasTableView : false;
}

// Check if profile has special notes
export function profileHasNotes(profileName) {
  const config = getProfileConfig(profileName);
  return config ? config.hasNotes : false;
}

// Get file path for profile
export function getProfileFilePath(profileName) {
  const config = getProfileConfig(profileName);
  return config ? config.file : null;
}

// Subject note mapping for profiles with notes
export const SUBJECT_NOTE_MAPPING = {
  'Sistemas Eléctricos de Potencia': {
    'MI': 'matematica_inicial',
    'Tallerine': 'tallerine',
    'Pas': 'pasantia',
    'CTS': 'ingenieria_sociedad',
    'Ec': 'ingenieria_sociedad',
    'OpIyS': 'ingenieria_sociedad',
    'OpInd': 'ingenieria_industrial',
    'OP8': 'opcionales_potencia',
    'TEP': 'opcionales_potencia',
    'TEE': 'opcionales_potencia',
    'CDIV': 'fisica_matematicas',
    'CDIVV': 'fisica_matematicas',
    'GAL1': 'fisica_matematicas',
    'GAL2': 'fisica_matematicas',
    'PyE': 'fisica_matematicas',
    'CVec': 'fisica_matematicas',
    'EcuDif': 'fisica_matematicas',
    'F1': 'formacion_basica',
    'F2': 'formacion_basica',
    'F3': 'formacion_basica',
    'ElecMag': 'formacion_basica',
    'FVC': 'formacion_basica'
  },
  'Señales y Aprendizaje Automático': {
    'MI': 'matematica_inicial',
    'Tallerine': 'tallerine',
    'Pas': 'pasantia',
    'CTS': 'ingenieria_sociedad',
    'Ec': 'ingenieria_sociedad',
    'OpIyS': 'ingenieria_sociedad',
    'OpInd': 'ingenieria_industrial',
    'SalMod': 'opcionales_senales',
    'PDS': 'opcionales_senales',
    'COD': 'opcionales_senales',
    'ProcImag': 'opcionales_senales',
    'FAAPRP': 'opcionales_aprendizaje',
    'OpAA': 'opcionales_aprendizaje',
    'OpTelec': 'opcionales_telecomunicaciones',
    'CDIV': 'fisica_matematicas',
    'CDIVV': 'fisica_matematicas',
    'GAL1': 'fisica_matematicas',
    'GAL2': 'fisica_matematicas',
    'PyE': 'fisica_matematicas',
    'CVec': 'fisica_matematicas',
    'EcuDif': 'fisica_matematicas',
    'F1': 'formacion_basica',
    'F2': 'formacion_basica',
    'F3': 'formacion_basica',
    'ElecMag': 'formacion_basica',
    'FVC': 'formacion_basica'
  }
};

// Get subject note class for a profile
export function getSubjectNoteClass(profileName, subjectCode) {
  const mapping = SUBJECT_NOTE_MAPPING[profileName];
  return mapping && mapping[subjectCode] ? `subject-note-${mapping[subjectCode]}` : '';
}

// Validation function for new profiles
export function validateProfileData(profileData) {
  const requiredFields = ['nombre', 'descripcion', 'materias_core', 'materias_optativas'];
  
  for (const field of requiredFields) {
    if (!profileData.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (!Array.isArray(profileData.materias_core)) {
    throw new Error('materias_core must be an array');
  }
  
  if (!Array.isArray(profileData.materias_optativas)) {
    throw new Error('materias_optativas must be an array');
  }
  
  return true;
}
