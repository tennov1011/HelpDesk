# Export PDF - Surat Izin Keluar

## 📋 Overview
Fitur Export PDF memungkinkan pengguna (baik admin maupun user) untuk mengunduh surat izin keluar dalam format PDF yang formal dan dapat dicetak.

## ✨ Features

### 1. **Automatic PDF Generation**
- Generate surat izin keluar dalam format PDF professional
- Template formal dengan header perusahaan
- Layout yang rapi dan mudah dibaca

### 2. **Complete Information**
- Data lengkap karyawan (nama, divisi, email)
- Detail izin keluar (jam keluar, estimasi kembali, keperluan)
- Kolom tanda tangan untuk approval
- Dokumen ID dan timestamp

### 3. **User-Friendly Interface**
- **Admin**: Tombol "PDF" di samping "Detail" untuk kategori Izin Keluar
- **User**: Icon download PDF di samping tombol lainnya
- Tooltip informatif untuk setiap tombol
- Mobile-responsive design

## 🎯 How to Use

### For Admin:
1. Buka list tiket di dashboard admin
2. Cari tiket dengan kategori "Izin Keluar"
3. Klik tombol **"PDF"** di kolom aksi
4. PDF akan otomatis ter-download

### For User:
1. Buka dashboard user
2. Lihat tiket dengan kategori "Izin Keluar"
3. Klik icon **download PDF** (📄) di kolom aksi
4. PDF akan otomatis ter-download dengan nama file yang descriptive

## 📄 PDF Content Structure

```
SURAT IZIN KELUAR
PT. ELTAMA PRIMA INDO
────────────────────────────────

Yang bertanda tangan di bawah ini:

Nama               : [Nama Karyawan]
Divisi             : [Divisi]
Email              : [Email]

Dengan ini mengajukan izin keluar dengan rincian:

Jam Keluar         : [HH:MM]
Estimasi Jam Kembali : [HH:MM]
Keperluan          : [Detail Keperluan]

Hormat kami,

Yang Mengajukan,    Atasan Divisi,    HRD,            Security,
    
([Nama Depan])     (..............)   (..............) (..............)
Karyawan           Menyetujui         Mengetahui      Pemeriksaan

────────────────────────────────
Dokumen ID: [Ticket ID]
Dicetak pada: [Timestamp]
```

## 🔧 Technical Implementation

### Dependencies
```bash
npm install jspdf
```

### File Structure
```
src/lib/component/TicketList.svelte
├── Import jsPDF library
├── exportExitPermitPDF() function
├── PDF generation logic
└── UI buttons for export
```

### Key Functions

#### `exportExitPermitPDF(ticket)`
- **Input**: Ticket object dengan kategori "Izin Keluar"
- **Output**: PDF file dengan nama `Izin_Keluar_[Nama_Depan]_[TicketID].pdf`
- **Features**: 
  - Validation kategori
  - Professional layout dengan font size yang lebih kecil
  - Complete data mapping
  - Empat kolom tanda tangan (Karyawan, Atasan Divisi, HRD, Security)
  - Nama depan pada kolom tanda tangan karyawan
  - Error handling

## 🎨 UI Elements

### Admin Interface
```html
<button class="text-green-600 hover:text-green-800">
  PDF
</button>
```

### User Interface
```html
<button class="text-green-600 hover:text-green-800">
  <svg><!-- Download icon --></svg>
</button>
```

## 📱 Mobile Responsiveness
- Responsive button sizing
- Touch-friendly interface
- Optimized for small screens
- Clear visual indicators

## ⚡ Performance Features
- **Client-side generation** - No server processing required
- **Instant download** - PDF generated in browser
- **Lightweight** - Minimal library footprint
- **Error handling** - Graceful fallback for errors

## 🔐 Security & Validation
- ✅ Category validation (only for "Izin Keluar")
- ✅ Data sanitization
- ✅ Error handling for missing data
- ✅ Client-side processing (no data sent to external servers)

## 📊 Use Cases

### 1. **Administrative Purpose**
- Formal documentation untuk izin keluar
- Archive dan record keeping
- Approval workflow documentation

### 2. **Employee Self-Service**
- Karyawan dapat download surat izin sendiri
- Tidak perlu request ke admin
- Immediate access setelah submit

### 3. **Compliance & Audit**
- Trail dokumentasi yang jelas
- Standardized format
- Timestamp dan tracking

## 🚀 Future Enhancements

### Potential Improvements:
1. **Email Integration** - Auto-send PDF via email
2. **Digital Signature** - Electronic signature support
3. **Template Customization** - Multiple PDF templates
4. **Bulk Export** - Export multiple permits at once
5. **QR Code** - Add QR code for verification
6. **Enhanced Signature System** - Allow atasan dan HRD untuk menyetujui secara digital

## 📋 Testing Checklist

- [x] PDF generates correctly for "Izin Keluar" category
- [x] All data fields populate correctly
- [x] File downloads with proper naming
- [x] Mobile responsiveness works
- [x] Error handling for invalid categories
- [x] Both admin and user interfaces work
- [x] PDF layout is professional and readable

---

**Status**: ✅ **IMPLEMENTED AND READY**
**Compatibility**: Chrome, Firefox, Safari, Edge
**Mobile Support**: ✅ Fully responsive
**Library**: jsPDF (lightweight, reliable)
