#!/usr/bin/env python3
"""
extraer_protocolo.py
--------------------
Lee el PDF del Tomo de Protocolo del Dr. Romero Mora y extrae:
  - Número de escritura
  - Nombre(s) de comparecientes
  - Cédula(s)
  - Tipo de acto (vehículo, propiedad, contrato)
  - Placa (si es vehículo)
  - Número de finca (si es propiedad)
  - Fecha

Genera un CSV listo para importar en la app.

Uso:
    pip install pdfplumber pandas
    python extraer_protocolo.py protocolo.pdf

Salida: protocolo_extraido.csv
"""

import re
import sys
import csv
import json
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Instalando pdfplumber...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "pdfplumber", "pandas"], check=True)
    import pdfplumber

import pandas as pd


# ── HELPERS ──────────────────────────────────────────────────────────────────

NUMEROS = {
    'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
    'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
    'diez': '10',
}

def numero_a_digito(texto):
    """Convierte 'uno - cero dos tres' → '1-023' para cédulas escritas en palabras."""
    # Reemplazar palabras de números por dígitos
    resultado = texto.lower()
    for palabra, digito in NUMEROS.items():
        resultado = re.sub(r'\b' + palabra + r'\b', digito, resultado)
    # Limpiar separadores
    resultado = re.sub(r'\s*[-–—]\s*', '-', resultado)
    resultado = re.sub(r'\s+', '', resultado)
    return resultado

def normalizar_cedula(raw):
    """Intenta convertir cédula en palabras a formato numérico."""
    # Ya es numérica con guiones
    if re.match(r'^\d[\d\-]+\d$', raw.strip()):
        return raw.strip()
    return numero_a_digito(raw)

def extraer_fecha_texto(texto):
    """Extrae fecha de texto como 'diecisiete de marzo del año dos mil veinticinco'."""
    MESES = {
        'enero':'01','febrero':'02','marzo':'03','abril':'04','mayo':'05',
        'junio':'06','julio':'07','agosto':'08','septiembre':'09',
        'octubre':'10','noviembre':'11','diciembre':'12'
    }
    patron = r'(\w+)\s+(?:del?\s+mes\s+de\s+)?(\w+)\s+del?\s+(?:año\s+)?(.+?)[\.\,]'
    m = re.search(patron, texto.lower())
    if m:
        mes_txt = m.group(2)
        mes = MESES.get(mes_txt, '01')
        anio_txt = m.group(3).strip()
        anio = numero_a_digito(anio_txt.replace('dos mil veinticinco', '2025')
                                       .replace('dos mil veinticuatro', '2024')
                                       .replace('dos mil veintitres', '2023'))
        try:
            anio = int(anio)
        except:
            anio = 2025
        return f"{anio}-{mes}-01"
    return ''

# ── TIPOS DE ACTO ─────────────────────────────────────────────────────────────

def detectar_tipo(texto):
    t = texto.lower()
    if 'placa' in t or 'vehículo' in t or 'vehiculo' in t or 'motocicleta' in t or 'marca de motor' in t:
        return 'vehicle'
    if 'finca' in t or 'matrícula' in t or 'matricula' in t or 'terreno' in t or 'inmobiliaria' in t or 'propiedad' in t:
        return 'property'
    if 'contrato' in t or 'arrendamiento' in t or 'préstamo' in t or 'prestamo' in t:
        return 'contract'
    return 'other'

def extraer_placa(texto):
    # Formato: "PLACAS: MOT cinco uno cuatro ocho siete" → "MOT-51487"
    m = re.search(r'placas?:\s*([A-Z]{2,4})\s+([\w\s]+?)(?:,|\.|\n|marca)', texto, re.IGNORECASE)
    if m:
        prefijo = m.group(1).upper()
        nums_raw = m.group(2).strip()
        nums = numero_a_digito(nums_raw).replace('-', '')
        return f"{prefijo}-{nums}"
    # Formato directo: "ABC-123"
    m2 = re.search(r'\b([A-Z]{2,4}[-\s]\d{3,6})\b', texto)
    if m2:
        return m2.group(1).replace(' ', '-')
    return ''

def extraer_finca(texto):
    m = re.search(r'matr[ií]cula\s+([\d\s\-]+)', texto, re.IGNORECASE)
    if m:
        return m.group(1).strip().replace(' ', '')
    m2 = re.search(r'finca\s+(?:n[uú]mero\s+)?([\d\-]+)', texto, re.IGNORECASE)
    if m2:
        return m2.group(1).strip()
    return ''

# ── PARSER PRINCIPAL ──────────────────────────────────────────────────────────

def extraer_comparecientes(bloque):
    """
    Extrae lista de (nombre, cedula) del bloque de texto de una escritura.
    Patrón: nombre en negritas seguido de cédula en palabras.
    """
    comparecientes = []

    # Patrón: "Nombre Apellido Apellido, ... cédula NUM – NUM – NUM"
    patron_cedula = (
        r'(?:c[eé]dula(?:\s+de\s+identidad)?(?:\s+n[uú]mero)?|'
        r'c[eé]dula\s+jur[ií]dica)\s+'
        r'((?:uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|cero|diez|'
        r'[\d\s\-–—]+)+)'
    )

    # Encontrar todos los nombres (asumimos están antes de cada cédula)
    segmentos = re.split(
        r'c[eé]dula(?:\s+de\s+identidad)?(?:\s+n[uú]mero)?|c[eé]dula\s+jur[ií]dica',
        bloque, flags=re.IGNORECASE
    )

    for i in range(1, len(segmentos)):
        cedula_raw = re.match(r'\s*([\w\s\d\-–—]+?)(?:,|\.|\n|quien|con\s+domicilio)', segmentos[i])
        if not cedula_raw:
            continue
        cedula = normalizar_cedula(cedula_raw.group(1).strip())

        # Buscar nombre antes: último segmento en mayúsculas/negrita
        texto_previo = segmentos[i-1]
        nombres = re.findall(
            r'(?:comparecen?\s+|Y\s+|y\s+)'
            r'([A-ZÁÉÍÓÚÑÜ][A-Za-záéíóúñüÁÉÍÓÚÑÜ]+(?:\s+[A-ZÁÉÍÓÚÑÜ][A-Za-záéíóúñüÁÉÍÓÚÑÜ]+){1,5})',
            texto_previo
        )
        nombre = nombres[-1].strip() if nombres else ''

        if nombre or cedula:
            comparecientes.append({'nombre': nombre, 'cedula': cedula})

    return comparecientes


def procesar_escritura(numero_str, bloque):
    """Genera una o más filas a partir de un bloque de escritura."""
    tipo       = detectar_tipo(bloque)
    placa      = extraer_placa(bloque) if tipo == 'vehicle' else ''
    finca      = extraer_finca(bloque) if tipo == 'property' else ''
    fecha      = extraer_fecha_texto(bloque)
    comparec   = extraer_comparecientes(bloque)

    # Número de escritura en palabras → dígito
    escritura_num = numero_a_digito(numero_str).replace('-', '')

    filas = []
    if comparec:
        for c in comparec:
            filas.append({
                'nombre':          c['nombre'],
                'tipo_doc':        'cedula',
                'cedula':          c['cedula'],
                'escritura':       escritura_num,
                'fecha_escritura': fecha,
                'tipo':            tipo,
                'placa':           placa,
                'finca':           finca,
                'factura':         '',
                'monto':           '',
                'notas':           bloque[:120].replace('\n', ' '),
            })
    else:
        # Sin comparecientes detectados, guardar igualmente con datos parciales
        filas.append({
            'nombre':          '',
            'tipo_doc':        'cedula',
            'cedula':          '',
            'escritura':       escritura_num,
            'fecha_escritura': fecha,
            'tipo':            tipo,
            'placa':           placa,
            'finca':           finca,
            'factura':         '',
            'monto':           '',
            'notas':           bloque[:120].replace('\n', ' '),
        })

    return filas


# ── MAIN ──────────────────────────────────────────────────────────────────────

def main(pdf_path: str):
    path = Path(pdf_path)
    if not path.exists():
        print(f"❌  Archivo no encontrado: {pdf_path}")
        sys.exit(1)

    print(f"📄  Leyendo {path.name}...")
    texto_total = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                texto_total.append(t)

    texto = '\n'.join(texto_total)
    print(f"   {len(texto):,} caracteres extraídos de {len(pdf.pages)} páginas")

    # Dividir por escrituras: "NUMERO DOS:", "NUMERO TRES:", etc.
    patron_escritura = r'(?:NUMERO|N[ÚU]MERO)\s+([\w\s]+?):'
    partes = re.split(patron_escritura, texto, flags=re.IGNORECASE)

    escrituras = []
    for i in range(1, len(partes), 2):
        numero_str = partes[i].strip()
        bloque     = partes[i+1] if i+1 < len(partes) else ''
        escrituras.append((numero_str, bloque))

    print(f"   {len(escrituras)} escrituras encontradas")

    todas_las_filas = []
    for num_str, bloque in escrituras:
        filas = procesar_escritura(num_str, bloque)
        todas_las_filas.extend(filas)

    df = pd.DataFrame(todas_las_filas)
    out_path = path.parent / f"{path.stem}_extraido.csv"
    df.to_csv(out_path, index=False, encoding='utf-8-sig')

    print(f"\n✅  {len(todas_las_filas)} filas generadas → {out_path}")
    print(f"\nPrimeras 5 filas:")
    print(df.head().to_string())

    print(f"\n📥  Ahora vaya a la sección 'Importar datos' de la app y suba {out_path.name}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python extraer_protocolo.py <ruta_al_pdf>")
        print("Ejemplo: python extraer_protocolo.py 'Tomo 4 Protocolo.pdf'")
        sys.exit(1)
    main(sys.argv[1])
