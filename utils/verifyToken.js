
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => { // verifytoken ทำการตรวจ token จาก cookie 
    const token = req.cookies.accessToken;  // ชื่อ Token ที่ตั้งเพื่อที่จะเข้าถึง token ที่สร้างไว้กับตัว '/auth/login'  ถ้า token ถูกต้อง ข้อมูลผู้ใช้จะถูกเก็บใน const token 
 
    if (!token) {
        return res.status(401).json({ success: false, message: 'You are not authorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => { 
        if (err) {
            console.log('Token is invalid:', err); // เพิ่ม log เพื่อตรวจสอบว่า token ไม่ถูกต้อง
            return res.status(401).json({ success: false, message: 'Token is invalid' });    
        }
        req.user = user;
        next();
    });
};


export const verifyUser = (req, res, next) => { 
    verifyToken(req, res, () => { 
        if (req.user) { // แค่เช็คว่ามี user ที่ผ่านการตรวจสอบ token
            next();
        } else {
            console.log('User is not authorized'); // เพิ่ม log เพื่อตรวจสอบว่า user ไม่มีสิทธิ์
            return res.status(401).json({ success: false, message: "You are not authorized" });
        }
    });
};

export const verifyAdmin = (req, res, next) => { 
    verifyToken(req, res, () => {
        if (req.user.role === "admin") {
            next();
        } else {
            return res.status(401).json({ success: false, message: "You are not authenticated" });
        }
    });
};


