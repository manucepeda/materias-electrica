# Materias Eléctrica - Clean Architecture Documentation

## 🏗️ Overview

This application has been completely refactored with a clean, modular architecture that facilitates maintenance and extensibility. The new structure eliminates hardcoded implementations and makes adding new profiles straightforward.

## 🎯 Key Improvements

✅ **Modular Architecture**: Clear separation of responsibilities  
✅ **Dynamic Profile Loading**: Profiles load automatically from JSON files  
✅ **Eliminated Hardcoding**: No more hardcoded profile-specific logic  
✅ **Easy Extension**: Adding new profiles requires only configuration  
✅ **Clean Code**: Well-documented, maintainable codebase  
✅ **Señales Profile Fixed**: Now working correctly  

## 📁 Module Structure

```
js/
├── config.js              # Central configuration and profile mapping
├── profile-manager.js     # Profile data loading and management
├── ui-manager.js          # UI interactions and rendering
├── subject-filter.js      # Filtering and searching functionality
├── graph-app.js          # Main graph view application
├── list-app.js           # Main list view application
└── profile-notes.js      # Profile notes and tooltips
```

## 🔧 How to Add a New Profile

### Step 1: Create the Profile JSON File

Create a new JSON file in `data/profiles/profile-name.json`:

```json
{
  "nombre": "Profile Name",
  "descripcion": "Detailed profile description",
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
      "nombre": "Emphasis Name",
      "descripcion": "Emphasis description",
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
      "titulo": "Special Note Title",
      "descripcion": "Important information about this profile."
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
      "titulo": "Note Title",
      "descripcion": "Note description"
    }
  ]
}
```

**Required fields:**
- `nombre`: Profile name (must match the key in PROFILE_CONFIG)
- `descripcion`: Profile description
- `materias_core`: Array of core subject codes
- `materias_optativas`: Array of optional subject codes

**Optional fields:**
- `materias_sugeridas`: Array of suggested subject codes
- `plan_recomendado`: Recommended study plan by semester
- `emphasis`: Array of emphasis options for the profile
- `notas_importantes`: Important notes for the profile

### Step 2: Update Configuration

Add your profile to `js/config.js` in the `PROFILE_CONFIG` object:

```javascript
export const PROFILE_CONFIG = {
  // ... existing profiles ...
  'Profile Name': {
    file: 'data/profiles/profile-name.json',
    hasEmphasis: true,           // Set to false if no emphasis options
    emphasis: ['Emphasis Name'], // List emphasis names
    hasTableView: false,         // Set to true if needs table view
    hasNotes: true              // Set to true if has special notes
  }
};
```

### Step 3: (Optional) Add Note Mappings

If your profile has special notes, add subject mappings in `SUBJECT_NOTE_MAPPING`:

```javascript
export const SUBJECT_NOTE_MAPPING = {
  // ... existing mappings ...
  'Profile Name': {
    'SUBJ1': 'special_note',
    'SUBJ2': 'another_note',
    'OPT1': 'optional_note'
  }
};
```

### Step 4: Test Your Profile

1. ✅ Profile appears in dropdown selectors
2. ✅ Subjects filter correctly by profile
3. ✅ Emphasis options work (if applicable)
4. ✅ Recommended plan displays (if provided)
5. ✅ Special notes highlight subjects (if configured)

## 🧩 Module Details

### config.js
**Central configuration hub**
- Profile mapping and metadata
- Subject-to-note mappings  
- Validation functions
- Feature flags per profile

### profile-manager.js  
**Profile data management**
- Dynamic JSON loading
- Caching and error handling
- Data validation
- API for profile access

### ui-manager.js
**User interface control**
- Dynamic selector population
- Emphasis option management
- UI state management
- Element visibility control

### subject-filter.js
**Filtering and search**
- Multi-criteria filtering
- Text-based search
- Profile/emphasis filtering
- Performance optimization

## 📋 Data Schema

### Profile JSON Structure
```json
{
  "nombre": "string (required)",
  "descripcion": "string (required)",
  "materias_core": ["string"] "(required)",
  "materias_optativas": ["string"] "(required)",
  "materias_sugeridas": ["string"] "(optional)",
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

## 🔍 Data Validation

The system automatically validates profile data:

**Required Fields:**
- ✅ `nombre`: Profile display name
- ✅ `descripcion`: Profile description  
- ✅ `materias_core`: Core subject codes array
- ✅ `materias_optativas`: Optional subject codes array

**Optional Fields:**
- 🔄 `materias_sugeridas`: Suggested subjects
- 🔄 `emphasis`: Emphasis definitions
- 🔄 `plan_recomendado`: Recommended study plan
- 🔄 `notas_importantes`: Special notes

## 🐛 Troubleshooting

### Profile Not Appearing
1. ✅ Check `PROFILE_CONFIG` entry exists
2. ✅ Verify JSON file path is correct
3. ✅ Validate JSON syntax online
4. ✅ Check browser console for errors

### Subjects Not Filtering
1. ✅ Verify subject codes in arrays
2. ✅ Check for typos in subject codes
3. ✅ Ensure subjects exist in `ucs.json`
4. ✅ Clear browser cache

### Recommended Plan Not Working
1. ✅ Check `plan_recomendado` structure
2. ✅ Verify semester keys are strings ("1", "2", etc.)
3. ✅ Ensure all subject codes are valid
4. ✅ Check for missing subjects

### Notes Not Highlighting
1. ✅ Check `SUBJECT_NOTE_MAPPING` entry
2. ✅ Verify note IDs match `notas_importantes`
3. ✅ Ensure `hasNotes: true` in config
4. ✅ Check CSS classes are applied

## 🚀 Migration from Old System

### What Changed
```
OLD SYSTEM → NEW SYSTEM
app.js → js/list-app.js + modules
graph.js → js/graph-app.js + modules  
profile-notes.js → js/profile-notes.js
Hardcoded logic → Configuration-driven
```

### Files to Use Now
- ✅ `index.html` (updated to use new modules)
- ✅ `graph.html` (updated to use new modules)
- ✅ All files in `js/` directory
- ✅ Profile JSONs in `data/profiles/`

### Files to Retire
- ❌ `app.js` (old monolithic file)
- ❌ `graph.js` (old monolithic file)
- ❌ `index-new.html` (temporary testing file)
- ❌ `graph-new.html` (temporary testing file)

## 📊 Performance Optimizations

### Loading Strategy
- ⚡ Profiles load on-demand
- ⚡ Profile data cached after first load
- ⚡ Efficient subject filtering
- ⚡ Minimal DOM manipulation

### Best Practices Applied
- 🎯 Event delegation for performance
- 🎯 Debounced search input
- 🎯 Batch DOM updates
- 🎯 Memory leak prevention

## 🎨 Customization Guide

### Adding Features
1. Create new module in `js/`
2. Export required functions
3. Import where needed
4. Update config if necessary

### Styling
- Main styles: `styles.css`
- Profile notes: `profile-notes.css`
- Responsive design included
- CSS custom properties for theming

## 📚 Technology Stack

### Frontend Only
- ✅ **Vanilla JavaScript** (ES6+ modules)
- ✅ **CSS Grid/Flexbox** for layouts
- ✅ **Fetch API** for data loading
- ✅ **Modern DOM APIs**

### No Dependencies
- ❌ No frameworks required
- ❌ No build process needed
- ❌ No package managers
- ❌ No transpilation required

### Browser Support
- ✅ Chrome 60+
- ✅ Firefox 60+  
- ✅ Safari 12+
- ✅ Edge 79+

## 🔄 Future Enhancements

Ready for:
- 📈 Profile inheritance systems
- 📈 Dynamic subject data sources
- 📈 Advanced search with filters
- 📈 Export/import functionality
- 📈 Progressive Web App features
- 📈 Offline functionality
- 📈 Multi-language support

## ✅ Señales Profile Fix

The "Señales y Aprendizaje Automático" profile issue has been resolved:

- ✅ **Fixed**: Import paths in modules
- ✅ **Fixed**: Profile loading mechanism  
- ✅ **Fixed**: Note mappings and highlighting
- ✅ **Fixed**: Plan recomendado display
- ✅ **Working**: All filtering and search features
- ✅ **Working**: Special notes and tooltips

## 🎉 Result

**Clean, maintainable, extensible architecture** that:
- ✅ Eliminates all hardcoded implementations
- ✅ Makes adding profiles trivial (just config + JSON)
- ✅ Provides excellent maintainability  
- ✅ Offers easy ownership transfer
- ✅ Includes comprehensive documentation
- ✅ Fixes all existing issues

---

**🏆 The codebase is now production-ready with clean architecture that any developer can understand and extend easily.**
- Minimal DOM manipulation
- Optimized event handling

## Browser Support

The application uses modern JavaScript features:
- ES6 modules
- Async/await
- Modern array methods
- CSS Grid and Flexbox

Supported browsers:
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+
