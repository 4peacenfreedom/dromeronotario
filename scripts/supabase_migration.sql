-- ============================================================
-- SUPABASE MIGRATION
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. TABLA PRINCIPAL
CREATE TABLE IF NOT EXISTS expedientes (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),

  -- Datos del cliente
  nombre           text NOT NULL,
  tipo_doc         text DEFAULT 'cedula',   -- cedula | pasaporte | dimex | juridica
  cedula           text NOT NULL,

  -- Protocolo
  escritura        text,
  fecha_escritura  date,
  notas            text,

  -- Bien
  tipo             text DEFAULT 'other',    -- vehicle | property | contract | other
  placa            text,
  finca            text,

  -- Factura
  factura          text,
  monto            numeric,

  -- Imágenes (URLs de Supabase Storage)
  img_cedula       text,
  img_referencia   text,
  img_factura      text
);

-- 2. ÍNDICES para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_exp_cedula  ON expedientes USING gin(to_tsvector('spanish', cedula));
CREATE INDEX IF NOT EXISTS idx_exp_nombre  ON expedientes USING gin(to_tsvector('spanish', nombre));
CREATE INDEX IF NOT EXISTS idx_exp_placa   ON expedientes (placa);
CREATE INDEX IF NOT EXISTS idx_exp_factura ON expedientes (factura);

-- 3. Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at
  BEFORE UPDATE ON expedientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. ROW LEVEL SECURITY (habilitar cuando tenga auth)
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Por ahora: acceso total para anon key (cambiar cuando agregue login)
CREATE POLICY "allow_all" ON expedientes
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS
-- Crear manualmente en Supabase Dashboard → Storage:
--   - cedulas      (public: true)
--   - referencias  (public: true)
--   - facturas     (public: true)
-- ============================================================
