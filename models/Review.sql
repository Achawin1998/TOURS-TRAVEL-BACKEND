CREATE TABLE tour_reviews (
    id SERIAL PRIMARY KEY,                      -- คีย์หลัก, ค่าอัตโนมัติ
    tour_id INTEGER REFERENCES tours(id),       -- คีย์ต่างประเทศอ้างอิงถึงตาราง tours
    username VARCHAR(255) NOT NULL,             -- ชื่อผู้ใช้
    review_text TEXT NOT NULL,                  -- ข้อความรีวิว
    rating DOUBLE PRECISION NOT NULL CHECK (rating >= 0 AND rating <= 5),  -- คะแนนรีวิว (0-5)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- เวลาที่สร้าง
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP   -- เวลาที่อัปเดตล่าสุด
);