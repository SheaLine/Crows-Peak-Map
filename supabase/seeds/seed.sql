-- Test Database Seed Data
-- Populates the test database with dummy data for E2E testing
-- Run with: supabase db reset (after migrations are applied)

-- Clear existing data (TEST ENVIRONMENT ONLY!)
TRUNCATE TABLE public.types CASCADE;
TRUNCATE TABLE public.equipment CASCADE;
TRUNCATE TABLE public.service_logs CASCADE;
TRUNCATE TABLE public.attachments CASCADE;

-- Equipment Types
-- Using valid icon names from src/data/icons.tsx IconMap
INSERT INTO public.types (id, name, display_name, icon, color) VALUES
  (1, 'electrical', 'Electrical', 'Bolt', '#FFD700'),
  (2, 'water', 'Water', 'droplet', '#1E90FF'),
  (3, 'gas', 'Gas', 'flame', '#FF6347'),
  (4, 'wifi', 'WiFi', 'Wifi', '#32CD32'),
  (5, 'building', 'Building', 'building', '#808080');

-- Reset sequence for types table
SELECT setval('types_id_seq', (SELECT MAX(id) FROM types));

-- Equipment Records
-- Coordinates are within MapScrollBoundary bounds (lat: 38.515-38.525, lng: -123.090 to -123.067)
-- Metadata follows production patterns: JSONB with various field types
-- NOTE: Some equipment shares coordinates to create clusters for testing
INSERT INTO public.equipment (id, name, lat, lng, type_id, description, metadata, metadata_order, summary) VALUES
  -- MAIN BUILDING CLUSTER (38.520, -123.077) - 4 items clustered together
  (gen_random_uuid(), 'Main Building', 38.520, -123.077, 5,
   'Primary residential building',
   '{"sq_ft": "3500", "built": "1985", "stories": "2"}'::jsonb,
   ARRAY['sq_ft', 'built', 'stories'],
   'Main residence on property'),

  (gen_random_uuid(), 'Main Transformer', 38.520, -123.077, 1,
   'Primary electrical transformer',
   '{"voltage": "12.47kV", "manufacturer": "ABB", "install_date": "2018-03-15", "capacity": "500 kVA"}'::jsonb,
   ARRAY['voltage', 'capacity', 'manufacturer', 'install_date'],
   'Main transformer serving the entire property. Regular maintenance required quarterly.'),

  (gen_random_uuid(), 'Propane Tank', 38.520, -123.077, 3,
   '1000 gallon propane tank',
   '{"capacity": "1000 gallons", "last_fill": "2024-12-01", "vendor": "AmeriGas"}'::jsonb,
   ARRAY['capacity', 'last_fill', 'vendor'],
   'Main propane tank for heating'),

  (gen_random_uuid(), 'Main WiFi Access Point', 38.520, -123.077, 4,
   'Central WiFi AP',
   '{"model": "Ubiquiti UAP-AC-PRO", "ssid": "CrowsPeak", "channels": "1,6,11"}'::jsonb,
   ARRAY['model', 'ssid', 'channels'],
   'Main building WiFi access point'),

  -- EQUIPMENT BARN CLUSTER (38.522, -123.074) - 3 items clustered together
  (gen_random_uuid(), 'Equipment Barn', 38.522, -123.074, 5,
   'Storage and workshop',
   '{"sq_ft": "2000", "built": "1990"}'::jsonb,
   NULL,
   'Storage barn and workshop'),

  (gen_random_uuid(), 'North WiFi Extender', 38.522, -123.074, 4,
   'WiFi range extender',
   '{"model": "Ubiquiti UAP-AC-LITE", "coverage": "Barn area"}'::jsonb,
   ARRAY['model', 'coverage'],
   'Extends WiFi to barn area'),

  (gen_random_uuid(), 'Generator', 38.522, -123.074, 3,
   'Backup generator',
   '{"fuel_type": "Propane", "output_kw": "22", "runtime_hours": "487"}'::jsonb,
   ARRAY['fuel_type', 'output_kw', 'runtime_hours'],
   'Backup power generator. Tested monthly.'),

  -- WATER SYSTEM CLUSTER (38.519, -123.075) - 3 items clustered together
  (gen_random_uuid(), 'Main Well Pump', 38.519, -123.075, 2,
   'Primary water well',
   '{"depth": "350 feet", "flow_rate": "25 GPM", "pump_hp": "2.5"}'::jsonb,
   ARRAY['depth', 'flow_rate', 'pump_hp'],
   'Main well pump. Needs filter replacement every 6 months.'),

  (gen_random_uuid(), 'Pressure Tank', 38.519, -123.075, 2,
   'Pressure regulation tank',
   '{"psi_rating": "80", "volume": "120 gallons"}'::jsonb,
   ARRAY['psi_rating', 'volume'],
   'Maintains consistent water pressure'),

  (gen_random_uuid(), 'Filtration System', 38.519, -123.075, 2,
   'Whole property water filter',
   '{"filter_type": "Sand/Carbon", "last_service": "2024-11-01"}'::jsonb,
   NULL,
   'Whole property filtration system'),

  -- STANDALONE EQUIPMENT (spread across property)
  (gen_random_uuid(), 'South Transformer', 38.517, -123.078, 1,
   'Secondary transformer',
   '{"voltage": "12.47kV", "capacity": "250 kVA"}'::jsonb,
   NULL,
   'Secondary distribution transformer for south buildings'),

  (gen_random_uuid(), 'North Distribution Panel', 38.523, -123.082, 1,
   'Main distribution panel',
   '{"panel_type": "200A", "circuits": 24}'::jsonb,
   ARRAY['panel_type', 'circuits'],
   'Distribution panel for north buildings'),

  (gen_random_uuid(), 'Irrigation Pump', 38.521, -123.077, 2,
   'Irrigation system pump',
   '{"flow_rate": "15 GPM", "zone_coverage": "North vineyard"}'::jsonb,
   ARRAY['flow_rate', 'zone_coverage'],
   'Irrigation pump for vineyard. Seasonal operation.'),

  (gen_random_uuid(), 'Storage Tank', 38.518, -123.073, 2,
   'Water storage tank',
   '{"capacity": "5000 gallons", "material": "Steel"}'::jsonb,
   ARRAY['capacity', 'material'],
   'Water storage tank for property'),

  (gen_random_uuid(), 'South WiFi Extender', 38.516, -123.078, 4,
   'WiFi range extender',
   '{"model": "Ubiquiti UAP-AC-LITE"}'::jsonb,
   NULL,
   'WiFi extender for south area');

-- Service Logs (3 per equipment = 45 total)
-- Creates maintenance history for each equipment
-- Uses different dates to test pagination and date filtering
DO $$
DECLARE
  equip RECORD;
BEGIN
  FOR equip IN SELECT id, name FROM equipment LOOP
    INSERT INTO public.service_logs (equipment_id, title, body, happened_at) VALUES
      (equip.id,
       'Quarterly Inspection',
       'Checked all connections and systems for ' || equip.name || '. All systems nominal.',
       NOW() - INTERVAL '30 days'),

      (equip.id,
       'Routine Maintenance',
       'Performed routine maintenance tasks on ' || equip.name || '. No issues found.',
       NOW() - INTERVAL '60 days'),

      (equip.id,
       'Annual Service',
       'Complete annual service and testing for ' || equip.name || '. Passed all criteria.',
       NOW() - INTERVAL '90 days');
  END LOOP;
END $$;

-- Attachments (3 per equipment = 45 total)
-- Creates placeholder attachments (2 images + 1 document per equipment)
-- Using placeholder URLs - no actual files needed for E2E tests
-- Tests validate UI behavior, not actual file downloads
DO $$
DECLARE
  equip RECORD;
BEGIN
  FOR equip IN SELECT id, name FROM equipment LOOP
    INSERT INTO public.attachments (equipment_id, url, file_type, is_primary, label, sort_order) VALUES
      (equip.id,
       'equipment/placeholder/image-1.jpg',
       'image/jpeg',
       true,
       'Front View',
       1),

      (equip.id,
       'equipment/placeholder/image-2.jpg',
       'image/jpeg',
       false,
       'Side View',
       2),

      (equip.id,
       'equipment/placeholder/document.pdf',
       'application/pdf',
       false,
       'Manual',
       3);
  END LOOP;
END $$;

-- Summary Statistics
SELECT
  (SELECT COUNT(*) FROM types) as type_count,
  (SELECT COUNT(*) FROM equipment) as equipment_count,
  (SELECT COUNT(*) FROM service_logs) as service_log_count,
  (SELECT COUNT(*) FROM attachments) as attachment_count;
