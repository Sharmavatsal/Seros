"""
Production migration: Add service_type to assets_master + projects,
create pre_rental_inspections, order_equipment, and upload_history tables.
Run once: python migration_production.py
"""
from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text

load_dotenv("E:/Project/dboard_vscode/.env")
url = os.getenv("DATABASE_URL")
engine = create_engine(url)

MIGRATION_SQL = [
    # 1. Add service_type to assets_master
    """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets_master' AND column_name='service_type') THEN
            ALTER TABLE assets_master ADD COLUMN service_type VARCHAR(50) DEFAULT 'rental';
            UPDATE assets_master SET service_type = 'rental' WHERE service_type IS NULL;
        END IF;
    END $$;
    """,
    # 2. Add service_type to projects
    """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='service_type') THEN
            ALTER TABLE projects ADD COLUMN service_type VARCHAR(50) DEFAULT 'rental';
            UPDATE projects SET service_type = 'rental' WHERE service_type IS NULL;
        END IF;
    END $$;
    """,
    # 3. Add billing_status to projects
    """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='billing_status') THEN
            ALTER TABLE projects ADD COLUMN billing_status VARCHAR(50) DEFAULT 'Pending';
        END IF;
    END $$;
    """,
    # 4. Create pre_rental_inspections table
    """
    CREATE TABLE IF NOT EXISTS pre_rental_inspections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inspection_date DATE NOT NULL,
        order_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        equipment_id UUID REFERENCES assets_master(id) ON DELETE SET NULL,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        duration_days INTEGER,
        rental_rate NUMERIC,
        inspection_status VARCHAR(50) DEFAULT 'Pending',
        checklist_equipment_condition VARCHAR(50),
        checklist_functionality VARCHAR(50),
        checklist_safety VARCHAR(50),
        inspection_notes TEXT,
        document_url VARCHAR(500),
        image_urls TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    # 5. Create order_equipment table
    """
    CREATE TABLE IF NOT EXISTS order_equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        equipment_id UUID REFERENCES assets_master(id) ON DELETE SET NULL,
        quantity_allocated INTEGER DEFAULT 1,
        rental_start_date DATE,
        rental_end_date DATE,
        rental_rate_per_month NUMERIC,
        total_rental_amount NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    # 6a. Add last_login to users
    """
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
            ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        END IF;
    END $$;
    """,
    # 6. Create upload_history table
    """
    CREATE TABLE IF NOT EXISTS upload_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255),
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        row_count INTEGER DEFAULT 0,
        rows_updated INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Success',
        error_message TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
]

with engine.connect() as conn:
    for i, sql in enumerate(MIGRATION_SQL, 1):
        try:
            conn.execute(text(sql))
            conn.commit()
            print(f"[{i}/{len(MIGRATION_SQL)}] OK")
        except Exception as e:
            print(f"[{i}/{len(MIGRATION_SQL)}] FAILED: {e}")
            conn.rollback()

print("\nMigration complete.")
