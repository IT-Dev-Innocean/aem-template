# AEM Template

Repository template HTML untuk AEM dengan editor lokal berbasis VS Code theme.

## Struktur Folder

```
aem-template/
├── editor/     # Aplikasi editor (React + Vite)
├── hmid/       # Template HTML HMID
└── kia/        # Template HTML KIA
```

## Prasyarat

- [Node.js](https://nodejs.org/) v18 atau lebih baru
- npm (sudah termasuk dengan Node.js)

## Instalasi (Local)

1. Clone repository:

```bash
git clone git@github.com:IT-Dev-Innocean/aem-template.git
cd aem-template
```

2. Install dependency editor:

```bash
cd editor
npm install
```

3. Jalankan dev server:

```bash
npm run dev
```

4. Buka browser di **http://localhost:5173**

> Jika port 5173 sudah dipakai, stop proses lama atau jalankan:
> `lsof -ti :5173 | xargs kill`

## Cara Menggunakan Editor

### Buka & Edit File

1. Di sidebar **Explorer**, buka folder `hmid/` atau `kia/`
2. Klik file HTML untuk membukanya di tab editor
3. Edit kode di panel tengah (Monaco Editor)

### Preview

- **Split view** — editor dan preview tampil berdampingan (default)
- **Refresh** — reload preview setelah edit
- **Open Preview** — buka output HTML di tab/window baru
- Toggle layout lewat tombol **Editor / Split / Preview** di status bar bawah

### Simpan Perubahan

- Tekan `Cmd + S` (Mac) atau `Ctrl + S` (Windows)
- Atau klik tombol **Save** di status bar

Perubahan langsung tersimpan ke file asli di folder `hmid/` atau `kia/`.

### Search File

1. Klik ikon **Search** di activity bar kiri
2. Ketik nama file, lalu klik hasil pencarian

## Kelola File via GitHub

Tambah, hapus, atau rename file/folder dilakukan lewat **GitHub**, bukan dari editor.

Alur kerja yang disarankan:

```bash
git pull                  # ambil update terbaru
cd editor && npm run dev  # edit & preview
# ... edit & save di editor ...
git add .
git commit -m "Update template"
git push
```

## Script Lainnya

Jalankan dari folder `editor/`:

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan editor (development) |
| `npm run build` | Build production |
| `npm run preview` | Preview build production |

## Tech Stack Editor

React, TypeScript, Vite, Tailwind CSS, Radix UI, Magic UI, React Query, Monaco Editor
