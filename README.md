# Notaría Dr. Romero — Sistema de Expedientes

Aplicación web para gestión de expedientes notariales.  
**Stack:** React + Vite · Supabase (DB + Storage) · Vercel

---

## 🚀 Setup inicial (una sola vez)

### 1. Clonar el repositorio
```bash
git clone https://github.com/4peacenfreedom/dromeronotario.git
cd dromeronotario
npm install
```

### 2. Variables de entorno
Copiar `.env.example` a `.env.local` y completar:
```
VITE_SUPABASE_URL=https://nviwwfbzbchdshajfjga.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### 3. Configurar Supabase
1. Ir a **Supabase Dashboard → SQL Editor**
2. Ejecutar el contenido de `scripts/supabase_migration.sql`
3. Ir a **Storage → New bucket** y crear 3 buckets públicos:
   - `cedulas`
   - `referencias`
   - `facturas`

### 4. Correr localmente
```bash
npm run dev
# Abre http://localhost:5173
```

---

## ☁️ Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) → Import Git Repository
2. Seleccionar `dromeronotario`
3. En **Environment Variables** agregar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → cada push a `main` se despliega automáticamente

---

## 📥 Importar datos existentes

### Protocolo PDF
```bash
pip install pdfplumber pandas
python scripts/extraer_protocolo.py "Tomo 4 Protocolo.pdf"
# Genera: Tomo 4 Protocolo_extraido.csv
```
Luego subir el CSV en la sección **Importar datos** de la app.

### Facturas PDF (244 archivos)
Script adicional disponible próximamente.

---

## 📁 Estructura del proyecto
```
src/
  components/
    ExpedienteModal.jsx   ← Formulario nuevo/editar
  pages/
    Dashboard.jsx         ← Estadísticas y recientes
    Expedientes.jsx       ← Lista + búsqueda
    ExpedienteDetalle.jsx ← Vista completa de un expediente
    Importar.jsx          ← Importación masiva CSV
  lib/
    supabase.js           ← Cliente Supabase
    expedientes.js        ← Todas las queries a la BD
scripts/
  supabase_migration.sql  ← SQL para crear tablas
  extraer_protocolo.py    ← Extractor del PDF del protocolo
```

---

## 🔍 Campos buscables
- Cédula / pasaporte
- Nombre del cliente
- Placa del vehículo
- Número de factura electrónica
