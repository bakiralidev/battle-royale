# ⚔️ Battle Royale Arena - Real-Time Multiplayer Web Game

Ushbu loyiha JavaScript (HTML5 Canvas) va Node.js (Express + Socket.IO) yordamida yaratilgan keng qamrovli real-time multiplayer 2D Battle Royale o'yini hisoblanadi.

---

## 🎮 O'yin Xususiyatlari
- **Foydalanuvchi Profillari (Auth)**: Ro'yxatdan o'tish, tizimga kirish va XP (tajriba) tizimi orqali levellarga (darajalarga) ko'tarilish.
- **Do'stlar Tizimi**: Boshqa o'yinchilarga do'stlik so'rovi yuborish, qabul qilish, do'stlar holatini (online/offline) real vaqtda ko'rish.
- **Smaylik Yaratish (Vector & Photo)**: Foydalanuvchilar o'zlarining shaxsiy smayliklarini vektorli muharrir orqali chizishlari yoki rasm yuklab kesib, profil rasmi/o'yin qahramoni sifatida ishlatishlari mumkin.
- **Xonalar (Rooms) Tizimi**: O'yinchi o'yin xonasi yaratishi va 4 xonali noyob kod orqali do'stlarini o'yinga taklif qilishi mumkin.
- **Botlarni Sozlash**: Xona yaratishda botlar qo'shilsinmi yoki yo'q va ularning sonini tanlash.
- **Real-Time Jang**: Barcha harakatlar, to'qnashuvlar va hujumlar serverda hisoblanib, barcha ulanishgan o'yinchilarga sinxron uzatiladi.
- **Xavfsiz Zona (Safe Zone / Storm)**: Vaqt o'tishi bilan o'yin xaritasi qisqaradi va tashqarida qolgan o'yinchilar zarar ko'radi.
- **Reyting Taxtasi (Leaderboard)**: Eng ko'p yutgan va XP to'plagan o'yinchilar ro'yxati.
- **O'yin Tarixi**: O'tkazilgan o'yinlar tarixi va akkauntga kirish seanslari ro'yxati.

---

## 🚀 Ishga Tushirish Yo'riqnomasi

### 1. Zarruriy Shartlar
Kompyuteringizda [Node.js](https://nodejs.org/) o'rnatilgan bo'lishi kerak.

### 2. Kutubxonalarni O'rnatish
Loyiha papkasiga o'tib, backend kutubxonalarini o'rnating:
```bash
cd backend
npm install
```

### 3. Muhit O'zgaruvchilari (Environment Variables)
Loyihada muhit o'zgaruvchilari uchun `.env` faylidan foydalanishingiz mumkin. `backend` papkasida faylni `.env` deb nomlab yarating va unga namunadagi `.env.example` kabi sozlamalarni kiriting. 

### 4. Serverni Ishga Tushirish
O'yinni ishga tushirish uchun quyidagi buyruqni bosing:
```bash
npm start
```
Server ishga tushgach, brauzeringizda **`http://localhost:3000`** manziliga kiring. O'yin avtomatik SQLite ma'lumotlar bazasini (`battle_royale.db`) yaratib oladi.

---

## 🛠 Ishlatilgan Texnologiyalar
- **Frontend**: HTML5, Canvas API, Vanilla CSS, ES6 JavaScript.
- **Backend**: Node.js (Express), Socket.IO (WebSockets), better-sqlite3 (Ma'lumotlar bazasi).
