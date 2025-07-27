// Profile notes tooltip handling
document.addEventListener('DOMContentLoaded', function() {
  // Track the currently active note
  let activeNoteId = null;
  
  // Set up event delegation for note cards
  document.body.addEventListener('click', function(event) {
    const noteCard = event.target.closest('.note-card');
    if (noteCard) {
      const noteId = noteCard.dataset.noteId;
      
      // Toggle highlighting if clicking the same note
      if (activeNoteId === noteId) {
        // Remove highlighting
        clearHighlighting();
        activeNoteId = null;
        
        // Remove active class from all note cards
        document.querySelectorAll('.note-card').forEach(card => {
          card.classList.remove('active-note');
        });
      } else {
        // Highlight new selection
        highlightRelatedSubjects(noteId);
        activeNoteId = noteId;
        
        // Update active classes
        document.querySelectorAll('.note-card').forEach(card => {
          card.classList.remove('active-note');
        });
        noteCard.classList.add('active-note');
      }
      
      // Scroll to the first related subject
      const firstRelatedSubject = document.querySelector(`.subject-note-${noteId}`);
      if (firstRelatedSubject) {
        // Smooth scroll to bring the first highlighted element into view
        firstRelatedSubject.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  });
  
  // Function to clear all highlighting
  function clearHighlighting() {
    document.querySelectorAll('.subject-btn').forEach(btn => {
      btn.classList.remove('highlighted-subject');
    });
  }
  
  // Function to highlight subjects related to a note
  function highlightRelatedSubjects(noteId) {
    // First remove all highlights
    clearHighlighting();
    
    // Add highlights to related subjects
    const relatedSubjects = document.querySelectorAll(`.subject-note-${noteId}`);
    
    // If no subjects found, show a tooltip
    if (relatedSubjects.length === 0) {
      showTemporaryMessage(`No se encontraron materias relacionadas con esta nota.`);
      return;
    }
    
    // Add highlight class and animate each subject
    relatedSubjects.forEach((subject, index) => {
      subject.classList.add('highlighted-subject');
      
      // Add a staggered animation effect
      setTimeout(() => {
        subject.animate(
          [
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0, 51, 102, 0)' },
            { transform: 'scale(1.08)', boxShadow: '0 0 0 6px rgba(0, 51, 102, 0.4)' },
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(0, 51, 102, 0)' }
          ], 
          { 
            duration: 1200,
            iterations: 2,
            easing: 'ease-in-out'
          }
        );
      }, index * 150); // Stagger the animations
    });
    
    // Show a counter of how many subjects were highlighted
    showTemporaryMessage(`${relatedSubjects.length} materia${relatedSubjects.length !== 1 ? 's' : ''} relacionada${relatedSubjects.length !== 1 ? 's' : ''}`);
  }
  
  // Function to show a temporary message
  function showTemporaryMessage(message) {
    // Check if message container already exists
    let messageContainer = document.getElementById('temp-message');
    if (!messageContainer) {
      // Create message container
      messageContainer = document.createElement('div');
      messageContainer.id = 'temp-message';
      messageContainer.style.position = 'fixed';
      messageContainer.style.bottom = '20px';
      messageContainer.style.right = '20px';
      messageContainer.style.background = '#003366';
      messageContainer.style.color = 'white';
      messageContainer.style.padding = '10px 15px';
      messageContainer.style.borderRadius = '4px';
      messageContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      messageContainer.style.zIndex = '1000';
      messageContainer.style.opacity = '0';
      messageContainer.style.transform = 'translateY(20px)';
      messageContainer.style.transition = 'all 0.3s ease';
      document.body.appendChild(messageContainer);
    }
    
    // Update message content
    messageContainer.textContent = message;
    
    // Show message with animation
    setTimeout(() => {
      messageContainer.style.opacity = '1';
      messageContainer.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto-hide message after a delay
    setTimeout(() => {
      messageContainer.style.opacity = '0';
      messageContainer.style.transform = 'translateY(20px)';
      
      // Remove element after transition completes
      setTimeout(() => {
        if (messageContainer.parentNode) {
          messageContainer.parentNode.removeChild(messageContainer);
        }
      }, 300);
    }, 3000);
  }
  
  // Create tooltip for profile subject notes
  function createTooltips() {
    if (selectedPerfil === 'Sistemas Eléctricos de Potencia') {
      const tooltipMap = {
        'subject-note-matematica_inicial': {
          text: 'Curso fuertemente recomendado al comienzo de la carrera en función del resultado de la Prueba Diagnóstica al Ingreso.',
          icon: '➕'
        },
        'subject-note-tallerine': {
          text: 'Fuertemente recomendado en el semestre de ingreso. Se dicta en ambos semestres.',
          icon: '🛠️'
        },
        'subject-note-pasantia': {
          text: 'Actividad fuertemente recomendada, puede realizarse en cualquier semestre.',
          icon: '🏢'
        },
        'subject-note-ingenieria_sociedad': {
          text: 'Se deben cubrir al menos 5 créditos en el área de Ingeniería y Sociedad.',
          icon: '🌍'
        },
        'subject-note-ingenieria_industrial': {
          text: 'Se debe cubrir un mínimo de 5 créditos en la área de Ingeniería Industrial.',
          icon: '⚙️'
        },
        'subject-note-fisica_matematicas': {
          text: 'Prácticamente todas las asignaturas de Física y Matemáticas pueden cursarse en Facultad de Ciencias.',
          icon: '🧮'
        },
        'subject-note-formacion_basica': {
          text: 'Se deben cubrir al menos 160 créditos en áreas de formación básica (Física + Matemática + Química).',
          icon: '📚'
        },
        'subject-note-opcionales_potencia': {
          text: 'Opcionales específicas del perfil de Potencia.',
          icon: '⚡'
        }
      };
    } else if (selectedPerfil === 'Señales y Aprendizaje Automático') {
      const tooltipMap = {
        'subject-note-matematica_inicial': {
          text: 'Curso fuertemente recomendado al comienzo de la carrera en función del resultado de la Prueba Diagnóstica al Ingreso.',
          icon: '➕'
        },
        'subject-note-tallerine': {
          text: 'Fuertemente recomendado en el semestre de ingreso. Se dicta en ambos semestres.',
          icon: '🛠️'
        },
        'subject-note-pasantia': {
          text: 'Actividad fuertemente recomendada, puede realizarse en cualquier semestre.',
          icon: '🏢'
        },
        'subject-note-ingenieria_sociedad': {
          text: 'Se deben cubrir al menos 5 créditos en el área de Ingeniería y Sociedad.',
          icon: '🌍'
        },
        'subject-note-ingenieria_industrial': {
          text: 'Se debe cubrir un mínimo de 5 créditos en la área de Ingeniería Industrial.',
          icon: '⚙️'
        },
        'subject-note-fisica_matematicas': {
          text: 'Prácticamente todas las asignaturas de Física y Matemáticas pueden cursarse en Facultad de Ciencias.',
          icon: '🧮'
        },
        'subject-note-formacion_basica': {
          text: 'Se deben cubrir al menos 160 créditos en áreas de formación básica (Física + Matemática + Química).',
          icon: '📚'
        },
        'subject-note-procesamiento_senales': {
          text: 'Materias fundamentales para la especialización en Procesamiento de Señales: Señales Aleatorias y Modulación, Procesamiento de Señales, Codificación, Procesamiento de Imágenes.',
          icon: '📶'
        },
        'subject-note-aprendizaje_automatico': {
          text: 'Materias fundamentales para la especialización en Aprendizaje Automático: FAAPRP, Aprendizaje Automático, Computación Visual.',
          icon: '🤖'
        },
        'subject-note-optativa_senales': {
          text: 'Materias optativas recomendadas para complementar la formación en Señales y Aprendizaje Automático.',
          icon: '🔍'
        },
        'subject-note-opcionales_telecomunicaciones': {
          text: 'Opcionales de telecomunicaciones: Redes de datos 2, Comunicaciones Inalámbricas, Tecnologías de Redes, entre otras.',
          icon: '📡'
        }
      };
      
      // Add tooltips to subjects with note classes
      Object.keys(tooltipMap).forEach(className => {
        document.querySelectorAll(`.${className}`).forEach(element => {
          const originalTitle = element.getAttribute('title') || '';
          const tooltipInfo = tooltipMap[className];
          
          // Add enhanced tooltip with icon
          element.setAttribute('title', `${originalTitle}\n\n${tooltipInfo.icon} Nota: ${tooltipInfo.text}`);
          
          // Add hover effect
          element.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.03)';
            this.style.transition = 'transform 0.2s ease';
          });
          
          element.addEventListener('mouseleave', function() {
            this.style.transform = '';
          });
        });
      });
    }
  }
  
  // Add styling for note cards
  function addNoteCardEffects() {
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('mouseenter', function() {
        // Find all related subjects and add a subtle highlight
        const noteId = this.dataset.noteId;
        document.querySelectorAll(`.subject-note-${noteId}`).forEach(subject => {
          subject.style.boxShadow = '0 0 8px rgba(0, 51, 102, 0.3)';
          subject.style.transition = 'all 0.3s ease';
        });
      });
      
      card.addEventListener('mouseleave', function() {
        // Remove the highlight unless the card is active
        if (!this.classList.contains('active-note')) {
          const noteId = this.dataset.noteId;
          document.querySelectorAll(`.subject-note-${noteId}`).forEach(subject => {
            if (!subject.classList.contains('highlighted-subject')) {
              subject.style.boxShadow = '';
            }
          });
        }
      });
    });
  }
  
  // Call this function after rendering the graph
  const originalRenderGraph = window.renderGraph;
  window.renderGraph = function() {
    originalRenderGraph.apply(this, arguments);
    setTimeout(() => {
      createTooltips();
      addNoteCardEffects();
    }, 100); // Add a small delay to ensure DOM is updated
  };
  
  // Add CSS styles for active notes
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .active-note {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
      border-color: #003366 !important;
      background-color: #f8f9ff !important;
    }
    
    .active-note .note-icon {
      transform: scale(1.1);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    .active-note h5 {
      color: #003366 !important;
    }
    
    #temp-message {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      animation: fade-in 0.3s ease;
    }
    
    #temp-message::before {
      content: '💡';
      margin-right: 8px;
      font-size: 1.1rem;
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleElement);
});
