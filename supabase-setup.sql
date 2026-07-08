-- Santa Market — Setup Database Schema

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: stock
CREATE TABLE IF NOT EXISTS stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto TEXT NOT NULL,
    modelo TEXT NOT NULL,
    talla TEXT NOT NULL,
    cantidad_inicial INT DEFAULT 0 NOT NULL,
    cantidad_actual INT DEFAULT 0 NOT NULL,
    UNIQUE (producto, modelo, talla)
);

-- Table: cierres
CREATE TABLE IF NOT EXISTS cierres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha DATE UNIQUE NOT NULL,
    efectivo_contado NUMERIC(10,2) NOT NULL,
    tarjeta_datafono NUMERIC(10,2) NOT NULL,
    total_ventas_sistema NUMERIC(10,2) NOT NULL,
    diferencia NUMERIC(10,2) NOT NULL,
    efectivo_acumulado NUMERIC(10,2) NOT NULL,
    cerrado_por TEXT NOT NULL
);

-- Table: ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    producto TEXT NOT NULL,
    modelo TEXT NOT NULL,
    talla TEXT NOT NULL,
    cantidad INT NOT NULL,
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('CASH', 'TARJETA')),
    precio NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    worker_name TEXT NOT NULL,
    cierre_id UUID REFERENCES cierres(id) ON DELETE SET NULL
);

-- Table: gastos
CREATE TABLE IF NOT EXISTS gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    concepto TEXT NOT NULL,
    importe NUMERIC(10,2) NOT NULL,
    categoria TEXT NOT NULL, -- e.g., 'Stand', 'Costes varios', 'Producto', 'Nóminas', 'IVA'
    mes TEXT NOT NULL, -- e.g., 'Julio', 'Agosto'
    pagado BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ventas_cierre_id ON ventas(cierre_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_gastos_mes ON gastos(mes);

-- Disable Row Level Security (RLS) or add standard policies to make it easy to start
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE cierres DISABLE ROW LEVEL SECURITY;
ALTER TABLE ventas DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
