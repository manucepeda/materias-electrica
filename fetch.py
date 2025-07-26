# fetch_materias.py
import requests, pdfplumber, re, json

# 1) Bajamos el PDF del Plan de Estudios (Mayo 2021)
URL = 'https://www.fing.edu.uy/sites/default/files/102%20%282018-2020%29%20PEstudios%20IngEl%C3%A9ctrica%20-%20Vesri%C3%B3n%20MAYO%202021.pdf'
resp = requests.get(URL)
with open('plan_el.pdf','wb') as f:
    f.write(resp.content)

# 2) Abrimos con pdfplumber y extraemos texto
materias = []
with pdfplumber.open('plan_el.pdf') as pdf:
    # suponemos que las materias están en las páginas 8–15
    for p in range(7, 15):
        text = pdf.pages[p].extract_text() or ''
        # regex: busca EL#### seguido de nombre (hasta salto de línea)
        for code, name in re.findall(r'(EL\d{4})\s+([A-ZÁÉÍÓÚÑ][^\n]+)', text):
            materias.append({
                "codigo": code,
                "nombre": name.strip(),
                "semestre": None,
                "creditos": None,
                "docentes": [],
                "prerrequisitos": [],
                "tags": [],
                "links": {},
                "descripcion": ""
            })

# 3) Volcamos a JSON
with open('data/materias.json','w', encoding='utf-8') as f:
    json.dump(materias, f, ensure_ascii=False, indent=2)

print(f"Extraídas {len(materias)} materias. JSON en data/materias.json")
