# 🎮 Battle Royale - To'liq Test Qilish Yo'riqnomasi

Ushbu hujjat o'yinning barcha funksiyalarini qo'lda (manual) test qilib chiqish uchun mo'ljallangan vazifalar ro'yxatidir. Har bir qism to'liq ishlashiga ishonch hosil qilish uchun qadam-baqadam tekshirib chiqing.

## 1. 🔐 Avtorizatsiya va Profil Tizimi

- [ ] **Ro'yxatdan o'tish (Register)**: Yangi akkaunt ochib ko'ring (parol va login minimum talablarga javob berishini tekshiring).
- [ ] **Tizimga kirish (Login)**: Noto'g'ri parol bilan kirishga urinib xatolik xabarini ko'ring, so'ngra to'g'ri parol bilan kiring.
- [ ] **Sessiya (Auto-login)**: Tizimga kirgach, sahifani yangilab (F5) avtomat ravishda profil yuklanayotganini tasdiqlang.
- [ ] **Profil Sozlamalari**:
  - [ ] Profil nomini (Display name) o'zgartirib saqlang va navbar hamda lobbyda o'zgarganini tekshiring.
  - [ ] Tizimdan rang tanlab saqlang, o'yinchining rangi o'zgarishini tekshiring.
  - [ ] Avatar yuklab ko'ring (Rasmni yuklang va saqlang), avatar navbar, do'stlar ro'yxati va lobbyda ishlashiga ishonch hosil qiling.
- [ ] **Tizimdan chiqish (Logout)**: Hisobdan chiqib ketganda sessiya yakunlanishi va tizim asosiy oknoga qaytishini sinab ko'ring.

## 2. 🎨 Smaylik Yaratish Tizimi (Smiley Creator)

- [ ] **Vektorli Smaylik Yaratish**:
  - [ ] Turli dizaynlarni (ko'z, og'iz, rang, qosh, shlyapa) tanlab smaylik chizing.
  - [ ] Saqlash tugmasini bosganda, smaylik Profil Rasmi (Avatar) va O'yin qahramoni sifatida faollashishini tekshiring.
- [ ] **Rasm Yuklash orqali Smaylik (Photo)**:
  - [ ] Rasm yuklang, "Qirqib olish va faollashtirish" qiling. (10MB gacha xatoliksiz ishlashini tekshiring).
  - [ ] Saqlangan rasm ham Profil Rasmingizga, ham o'yin ichidagi qahramonga aylanishini tasdiqlang.
- [ ] **Saqlangan Smayliklar**: Eski yaratilgan smayliklarni qayta faollashtirib ko'ring. O'yin emojilari bilan smaylik qismlari konflikt qilmasligini tekshiring.

## 3. 👥 Do'stlar Tizimi

- [ ] **Do'st izlash**: Boshqa o'yinchini username yoki display name orqali qidirib topish.
- [ ] **So'rov yuborish**: Topilgan o'yinchiga do'stlik so'rovi yuborish. (Qarshi tarafda qizil bildirishnoma chiqishini tekshiring).
- [ ] **So'rovni qabul qilish/rad etish**: So'rov qabul qilinganda ikkala foydalanuvchida ham "Do'stlar" ro'yxatiga tushishi va real vaqt rejimida yangilanishini tekshirish.
- [ ] **Online Holat (Status)**: Do'stingiz tizimga kirganda oldidagi indikator yashil, chiqqanda qora/kulrang bo'lishini kuzatish.
- [ ] **Do'stlarni O'chirish**: Ro'yxatdan do'stni olib tashlash ishlashini sinash.

## 4. ⚔️ Lobby va O'yin Mexanikasi

- [ ] **Xona Yaratish (Host)**: 
  - [ ] Xona kodining to'g'ri yaratilishi (4 ta harf).
  - [ ] Botlar qo'shish tugmasi ishlashi va soni to'g'ri tanlanishi.
- [ ] **Xonaga Qo'shilish (Join)**:
  - [ ] Boshqa brauzer/oynadan do'stingizning kodini yozib xonaga muvaffaqiyatli qo'shilish.
  - [ ] Noto'g'ri kod bilan kirishga uringanda xatolik xabari chiqishi.
- [ ] **O'yinning Boshlanishi**: Xonaga kerakli o'yinchilar yig'ilganda host "O'yinni boshlash" bosganda barchaning bir vaqtda xaritaga tushishi.
- [ ] **Qurol va Zarar Tizimi**:
  - [ ] Pichoq, to'pponcha va snayperlarni olib, o'q uzib/zarba berib ko'rish.
  - [ ] Zarar ko'rganda (HP kamayganda) o'yinchi yuz ifodasi va smayligining o'zgarishi (Agar custom smaylik o'rnatilmagan bo'lsa).
- [ ] **Xavfsiz Zona (Safe Zone)**:
  - [ ] Hudud (ko'k xalqa) tashqarisiga chiqqanda HP ning kamayib borishi.
- [ ] **O'lim va Tomosha (Spectate)**: O'yinchi o'lganda tomoshabin rejimiga o'tishi va boshqalarni kuzata olishi.

## 5. 📈 Reyting va O'yin Tarixi

- [ ] **Leaderboard (Reyting taxtasi)**: O'yinda g'olib bo'lgach (XP va G'alaba soni oshgach) Leaderboard'da o'rningiz tepaga ko'tarilayotganini tekshiring.
- [ ] **O'yin Tarixi (History)**: O'yin tugagandan so'ng, profil menyusidan o'yin tarixini ko'rish. Unda oxirgi xonalar, qatnashchilar soni va natija chiqayotganligiga ishonch hosil qiling.
- [ ] **Seanslar (Sessions)**: Turli qurilma yoki brauzerlardan kirganda seanslar ro'yxati to'g'ri ko'rsatilayotganini tasdiqlash.

---

> **Eslatma**: Ushbu testlarni o'tkazishda 2 ta alohida brauzer yoki bittasida Incognito rejimini ochib, 2 ta o'yinchi kabi o'ynab ko'rish tavsiya etiladi. Barcha real-time amaliyotlar (do'stlar holati, xonalar va o'yin sinxronizatsiyasi) ayni paytda test qilinadi.
