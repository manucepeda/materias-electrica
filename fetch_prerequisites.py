import json
import os
import sys

# This script is a placeholder for fetching prerequisites data from Bedelias
# In a real scenario, you would need to adjust this script to work with the actual Bedelias API

def fetch_prerequisites():
    print("Fetching prerequisites data from Bedelias of UDELAR...")
    
    # In a real scenario, this would actually fetch data from Bedelias
    # Here we're creating mock data as an example
    
    # Load existing subject data
    try:
        with open('data/materias.json', 'r', encoding='utf-8') as f:
            subjects = json.load(f)
    except:
        print("Error: Could not load data/materias.json")
        sys.exit(1)
    
    # Add code field and empty prerequisites array to each subject
    for subject in subjects:
        # Generate a code based on the name (in a real scenario, you'd get this from Bedelias)
        words = subject['nombre'].split()
        if len(words) > 1:
            code = ''.join([word[0] for word in words[:2]]).upper()
            if len(code) < 3:
                code += words[0][-1].upper()
        else:
            code = words[0][:4].upper()
        
        subject['codigo'] = code
        subject['prerequisitos'] = []
    
    # Add some example prerequisites based on semester progression
    # In a real scenario, these would come from the actual curriculum data
    for subject in subjects:
        # Skip first semester subjects (they have no prerequisites)
        if subject['semestre'] == 1:
            continue
        
        # Find potential prerequisites from previous semesters
        potential_prereqs = [s for s in subjects if s['semestre'] < subject['semestre']]
        
        # For each subject in semester 2+, add 1-2 prerequisites from previous semesters
        # This is just a simplification - in reality you'd get the exact prerequisites from Bedelias
        if potential_prereqs:
            # Add prerequisites from immediately previous semester when names match patterns
            # (this is just a simple heuristic for the example)
            prev_sem_subjects = [s for s in subjects if s['semestre'] == subject['semestre'] - 1]
            
            for prev in prev_sem_subjects:
                # If subject names suggest a sequence (like "Cálculo 1" and "Cálculo 2")
                if any(word in subject['nombre'] for word in ['2', 'II', 'Avanzado']) and \
                   any(prev_name_part in prev['nombre'] for prev_name_part in subject['nombre'].split()):
                    subject['prerequisitos'].append({
                        'codigo': prev['codigo'], 
                        'exonerar': True  # Assume exoneration required for sequential courses
                    })
    
    # Save the enhanced data
    output_file = 'data/materias_with_prereqs.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(subjects, f, ensure_ascii=False, indent=2)
    
    print(f"Data saved to {output_file}")
    print(f"Added prerequisite information for {sum(1 for s in subjects if s['prerequisitos'])} subjects")

if __name__ == "__main__":
    fetch_prerequisites()
