
CREATE TABLE tours (
    id SERIAL PRIMARY KEY,                      -- คีย์หลัก, ค่าอัตโนมัติ
    title VARCHAR(255) NOT NULL UNIQUE,         -- ชื่อทัวร์, ไม่ซ้ำกัน
    city VARCHAR(255) NOT NULL,                 -- ชื่อเมือง
    address TEXT NOT NULL,                      -- ที่อยู่
    distance DOUBLE PRECISION NOT NULL,         -- ระยะทาง
    photo VARCHAR(255) NOT NULL,                -- รูปภาพ URL
    description TEXT NOT NULL,                  -- คำอธิบาย
    price DOUBLE PRECISION NOT NULL,            -- ราคา
    maxgroupsize INTEGER NOT NULL,              -- ขนาดกลุ่มสูงสุด
    featured BOOLEAN DEFAULT FALSE,             -- เป็นทัวร์เด่นหรือไม่
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- เวลาที่สร้าง
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- เวลาที่อัปเดตล่าสุด
);

