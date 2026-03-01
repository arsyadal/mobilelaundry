# Mobile Laundry App

Aplikasi mobile laundry full-stack: Customer App + Admin Panel.

## Struktur Proyek

```
mobilelaundry/
├── backend/       # Node.js + Express + Prisma (SQLite)
└── mobile/        # React Native + Expo 55 + Expo Router v4
```

## Cara Menjalankan

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx ts-node prisma/seed.ts   # Seed admin + layanan awal
npm run dev                  # Start di port 3000
```

**Kredensial default:**
- Admin: `admin@laundry.com` / `admin123`
- Pelanggan: `pelanggan@example.com` / `customer123`

### Mobile

```bash
cd mobile
npm install
npx expo start
```

> **Penting:** Pastikan backend berjalan di port 3000. Jika menggunakan device fisik, update `BASE_URL` di `services/api.ts` dengan IP lokal Anda (cek dengan `ifconfig | grep "inet "`).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Mobile | React Native + Expo 55, Expo Router v4, TypeScript |
| Backend | Node.js + Express.js, TypeScript |
| Database | SQLite (dev) via Prisma ORM |
| Auth | JWT + bcryptjs |
| State Mobile | Zustand (auth) + React Query v5 (data) |
| HTTP | Axios + interceptor otomatis |
| Notifikasi | Expo Push Notifications |
| Upload | Multer (lokal) |

## Fitur

### Pelanggan
- Register & Login
- Buat order laundry (pilih layanan → alamat → pembayaran)
- Tracking status order real-time
- Upload bukti pembayaran transfer
- Riwayat order dengan filter status
- Notifikasi push saat status berubah
- Edit profil & ganti password

### Admin
- Dashboard statistik (order hari ini, revenue, breakdown status)
- Kelola semua order (update status, set berat aktual)
- Konfirmasi / tolak bukti pembayaran
- Manajemen layanan (tambah, edit, toggle aktif)
- Daftar pelanggan

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/me
POST /api/auth/expo-token
```

### Customer
```
GET  /api/services
POST /api/orders
GET  /api/orders/my
GET  /api/orders/my/:id
POST /api/payments/:orderId/proof
GET  /api/notifications
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
```

### Admin
```
GET  /api/admin/orders
GET  /api/admin/orders/:id
PUT  /api/admin/orders/:id/status
PUT  /api/admin/orders/:id/weight
PUT  /api/admin/payments/:id/confirm
PUT  /api/admin/payments/:id/reject
GET  /api/admin/users
GET  /api/admin/dashboard
POST /api/admin/services
PUT  /api/admin/services/:id
PATCH /api/admin/services/:id/toggle
```

## Deployment ke Production

### Backend
1. Ganti `DATABASE_URL` ke PostgreSQL di `.env`
2. Update `schema.prisma` provider ke `postgresql`
3. Update `JWT_SECRET` dengan nilai random yang kuat
4. Set `APP_URL` ke domain production Anda

### Mobile
Update `BASE_URL` di `services/api.ts` ke URL production backend.
# mobilelaundry
