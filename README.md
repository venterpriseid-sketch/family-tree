# 🌳 Family Tree

PWA aplikasi silsilah keluarga. Bisa diinstall di iPad/HP, berjalan offline, dan data tersimpan lokal.

---

## 🚀 Deploy ke GitHub Pages (step by step)

### 1. Buat repo di GitHub
- Buka [github.com/new](https://github.com/new)
- Nama repo bebas, misal `family-tree`
- Set ke **Public** (wajib untuk GitHub Pages gratis)
- Klik **Create repository**

### 2. Upload file
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/family-tree.git
git push -u origin main
```

### 3. Aktifkan GitHub Pages
- Buka repo → **Settings** → **Pages**
- Source: pilih **Deploy from a branch**
- Branch: **main** / root (`/`)
- Klik **Save**
- Tunggu ~1 menit → app live di `https://USERNAME.github.io/family-tree/`

### 4. Aktifkan GitHub Actions (auto version bump)
- Buka repo → **Settings** → **Actions** → **General**
- Di bagian **Workflow permissions** → pilih **Read and write permissions**
- Klik **Save**

✅ Selesai! Setiap kali lu push ke `main`, version otomatis naik 0.01 dan cache iPad ikut update.

---

## 📁 Struktur Project

```
family-tree/
├── index.html              ← Markup utama
├── manifest.json           ← PWA config
├── sw.js                   ← Service worker (versioned cache)
├── version.json            ← { "version": "1.00" }
├── icon-192.png
├── icon-512.png
├── README.md
│
├── .github/
│   └── workflows/
│       └── version-bump.yml  ← Auto bump +0.01 on push
│
├── css/
│   ├── variables.css       ← CSS vars, colors, reset
│   ├── layout.css          ← Header, canvas, zoom, FAB
│   └── components.css      ← Node, popup, modal, form, toast
│
└── js/
    ├── store.js            ← Data CRUD + undo/redo + backup
    ├── utils.js            ← Toast + Confirm dialog
    ├── popup.js            ← Node context menu
    ├── layout.js           ← Tree positioning algorithm
    ├── renderer.js         ← Draw nodes + relation lines
    ├── canvas.js           ← Pan, zoom, pinch (iPad)
    ├── whiteboard.js       ← Apple Pencil drawing layer
    ├── form.js             ← Add/Edit person modal
    ├── export.js           ← PDF export + JSON backup
    ├── actions.js          ← Delete, bulk remove, undo/redo
    ├── search.js           ← Live search + highlight
    ├── version.js          ← Version check
    └── app.js              ← Entry point
```

---

## ✨ Fitur

| Fitur | Detail |
|---|---|
| Tree View | Visualisasi hierarki, pan & zoom, pinch iPad |
| Add Relation | Orang Tua (↑ upline), Anak (↓ downline), Pasangan (→ sameline) |
| Dot hijau | Anchor point koneksi antar node |
| Gender color | Pink = Perempuan, Biru = Laki-laki |
| Tindakan warna | Prospek🟢 Rekrut🔵 Followup🟣 Janji Temu🟡 Belum Ada⚪ |
| Search | Live highlight node by nama |
| Undo / Redo | 10 level, Cmd+Z / Cmd+Shift+Z |
| Whiteboard | Apple Pencil only, palm rejection, pensil & penghapus |
| Export PDF | Simple list, filter gender/pekerjaan/usia range |
| Backup JSON | Export & import data |
| Bulk Remove | Pilih banyak, confirmation dialog |
| Auto version | GitHub Actions bump +0.01 tiap push ke main |
| PWA | Install di iPad/HP, offline ready |

---

## 🛠 Local Development

Karena pakai Service Worker, butuh HTTPS atau localhost:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Buka `http://localhost:8000`
