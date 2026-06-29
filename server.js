require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// يسمح للواجهة بالتحدث مع الخادم
app.use(cors({ origin: 'http://localhost:3000' }));

// يفهم البيانات القادمة من المتصفح
app.use(express.json());
app.use(express.static(__dirname));

// الاتصال بقاعدة البيانات
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'luxstay'
});

db.connect((err) => {
    if (err) {
        console.log('خطأ في الاتصال بقاعدة البيانات:', err);
        return;
    }
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
});
// عرض الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hotel_booking.html'));
});

// API الأول — جلب جميع الفنادق
app.get('/api/hotels', (req, res) => {
    db.query('SELECT * FROM hotels', (err, results) => {
        if (err) {
            res.json({ error: err.message });
            return;
        }
        res.json(results);
    });
});
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'غير مصرح: لا يوجد رمز دخول' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

        if (err) {
            return res.status(401).json({ error: 'انتهت صلاحية الجلسة' });
        }
        req.user = decoded;
        next();
    });
}

// تسجيل مستخدم جديد
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hash],
        (err, result) => {
            if (err) return res.json({ error: 'البريد مستخدم مسبقاً' });
            res.json({ message: 'تم التسجيل بنجاح!' });
        }
    );
});

// تسجيل الدخول
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!results.length) {
            return res.status(401).json({ error: 'المستخدم غير موجود' });
        }

        const match = await bcrypt.compare(password, results[0].password);
        if (!match) {
            return res.status(401).json({ error: 'كلمة المرور خاطئة' });
        }   

        const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            token,
            id: results[0].id,
            name: results[0].name,
            email: results[0].email
        });
    });
});

// إضافة حجز جديد
app.post('/api/bookings', authenticateToken, (req, res) => {
    const { room_id, checkin, checkout, total } = req.body;
    const user_id = req.user && req.user.id;

    if (!user_id || !room_id || !checkin || !checkout || total == null) {
        return res.status(400).json({ error: 'بيانات الحجز غير مكتملة' });
    }

    db.query(
        'INSERT INTO bookings (user_id, room_id, checkin, checkout, total) VALUES (?, ?, ?, ?, ?)',
        [user_id, room_id, checkin, checkout, total],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            return res.json({ message: 'تم الحجز بنجاح!', id: result.insertId });
        }
    );
});

// جلب حجوزات مستخدم معين
app.get('/api/bookings/:user_id', (req, res) => {
    db.query(
        'SELECT bookings.*, hotels.name, hotels.location FROM bookings JOIN rooms ON bookings.room_id = rooms.id JOIN hotels ON rooms.hotel_id = hotels.id WHERE bookings.user_id = ?',
        [req.params.user_id],
        (err, results) => {
            if (err) return res.json({ error: err.message });
            res.json(results);
        }
    );
});
app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
    db.query(
        'UPDATE bookings SET status = ? WHERE id = ? AND user_id = ?',
        ['cancelled', req.params.id, req.user.id],
        (err, result) => {
            if(err) return res.json({ error: err.message });
            res.json({ message: 'تم الإلغاء بنجاح' });
        }
    );
});
// تشغيل الخادم على المنفذ 3000
app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 الخادم يعمل على http://localhost:3000');
});