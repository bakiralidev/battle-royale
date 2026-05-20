# ⚔️ Battle Royale Arena - Real-Time Multiplayer Web Game

Ushbu loyiha JavaScript (HTML5 Canvas) va Node.js (Express + Socket.IO) yordamida yaratilgan real-time multiplayer 2D Battle Royale o'yini hisoblanadi.

---

## 🎮 O'yin Xususiyatlari
- **Xonalar (Rooms) Tizimi**: O'yinchi o'yin xonasi yaratishi va 4 xonali noyob kod orqali sheriklarini o'yinga taklif qilishi mumkin.
- **Botlarni Sozlash**: Xona yaratishda botlar qo'shilsinmi yoki yo'q va ularning sonini (0 dan 11 tagacha) tanlash mumkin.
- **Real-Time Jang**: Barcha harakatlar, to'qnashuvlar va hujumlar serverda hisoblanib, barcha ulanishgan o'yinchilarga sinxron uzatiladi.
- **Xavfsiz Zona (Safe Zone / Storm)**: Vaqt o'tishi bilan o'yin xaritasi qisqaradi va tashqarida qolgan o'yinchilar zarar ko'radi.
- **Spectator Rejimi**: Halok bo'lgan o'yinchilar tirik qolganlarni tomosha qila olishadi.

---

## 🚀 Ishga Tushirish Yo'riqnomasi

### 1. Zarruriy Shartlar
Kompyuteringizda [Node.js](https://nodejs.org/) o'rnatilgan bo'lishi kerak.

### 2. Kutubxonalarni O'rnatish
Loyiha papkasiga o'tib, terminalda quyidagi buyruqni ishga tushiring:
```bash
cd backend
npm install
```

### 3. Serverni Ishga Tushirish
O'yinni ishga tushirish uchun quyidagi buyruqni bosing:
```bash
npm start
```

Server ishga tushgach, brauzeringizda **`http://localhost:3000`** manziliga kiring.

---

## 🛠 Ishlatilgan Texnologiyalar
- **Frontend**: HTML5, Canvas API, Vanilla CSS, ES6 JavaScript.
- **Backend**: Node.js (Express), Socket.IO (WebSockets).
