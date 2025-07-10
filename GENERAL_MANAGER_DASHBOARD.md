# Dashboard General Manager - Akses Semua Tiket

## 📊 Overview
Dashboard General Manager telah diupgrade untuk memberikan akses penuh terhadap semua tiket dari seluruh departemen dalam organisasi. Fitur ini memungkinkan General Manager untuk melakukan monitoring dan oversight yang komprehensif terhadap semua aktivitas helpdesk.

## 🔐 Akses Khusus General Manager

### Email yang Memiliki Akses
- **Email**: `general.manager@eltama.com`
- **Role**: `admin`
- **Department**: `Management`
- **Privilege**: **Super Admin Access** - dapat melihat semua tiket dari semua departemen

## 🎯 Fitur Dashboard General Manager

### 1. **Banner Informasi Akses Khusus**
```
ℹ️ General Manager Access: Anda dapat melihat semua tiket, feedback, dan survey dari seluruh departemen.
```
- Banner biru informatif yang muncul di bagian atas dashboard
- Memberitahu user bahwa mereka memiliki akses khusus sebagai General Manager

### 2. **List Tiket (Semua Departemen)**
- **Judul**: "List Tiket (Semua Departemen)" *(khusus untuk General Manager)*
- **Konten**: Menampilkan SEMUA tiket dari seluruh departemen:
  - IT
  - HRD  
  - Finance
  - Procurement
  - Inventory
  - Produksi
  - Project
  - Marketing
  - Maintenance
  - Direktur

### 3. **Filter Departemen**
- **Dropdown Filter**: General Manager dapat memfilter tiket berdasarkan departemen tertentu
- **Pilihan Filter**:
  - "Semua Departemen" (default) - menampilkan semua tiket
  - Daftar departemen yang tersedia berdasarkan tiket yang ada
- **Counter Real-time**: Menampilkan jumlah tiket yang terfilter "(X tiket)"
- **Responsive**: Filter otomatis mengupdate tampilan saat pilihan berubah

### 4. **Kolom Departemen Visible**
General Manager dapat melihat kolom **Department** di tabel tiket yang menunjukkan:
- Departemen tujuan setiap tiket
- Memudahkan identifikasi dan kategorisasi tiket berdasarkan departemen
- Kolom ini HANYA terlihat untuk General Manager
- **Mobile Responsive**: Kolom departemen juga tampil di mobile dengan optimasi tampilan (text ellipsis untuk teks panjang)

### 5. **Statistik Komprehensif**
Dashboard menampilkan statistik untuk:
- **Total tiket** dari semua departemen
- **Status tiket** (Pending, In Progress, Completed, dll.)
- **Distribusi tiket per departemen**
- **Feedback** dari semua departemen
- **Survey** dari semua departemen

## 🔄 Perbandingan dengan Admin Departemen Biasa

| Fitur | Admin Departemen | General Manager |
|-------|------------------|-----------------|
| **Lihat Tiket** | Hanya departemen sendiri | SEMUA departemen |
| **Filter Departemen** | ❌ Tidak ada | ✅ Dropdown filter dengan counter |
| **Kolom Department** | ❌ Tidak terlihat | ✅ Terlihat (Desktop & Mobile) |
| **Banner Khusus** | ❌ Tidak ada | ✅ Ada |
| **Judul List** | "List Tiket" | "List Tiket (Semua Departemen)" |
| **Feedback** | Semua feedback | Semua feedback |
| **Survey** | Semua survey | Semua survey |

## 📋 Contoh Tampilan Dashboard

### A. Header Dashboard
```
🏢 Dashboard Admin

ℹ️ General Manager Access: Anda dapat melihat semua tiket, feedback, dan survey dari seluruh departemen.
    Gunakan filter departemen untuk memfokuskan tampilan pada departemen tertentu.

[Tiket Baru] [Kelola Pertanyaan]
```

### B. Statistik Tiket
```
📊 Statistik Tiket
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Total: 150 │ Pending: 25 │Progress: 45 │Complete: 80 │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### C. List Tiket (Semua Departemen) dengan Filter
```
📋 List Tiket (Semua Departemen)                    Filter Departemen: [Semua Departemen ▼] (150 tiket)

┌────────┬──────────────┬─────────────┬────────────┬──────────┬────────────┐
│ ID     │ Nama         │ Divisi      │ Department │ Priority │ Status     │
├────────┼──────────────┼─────────────┼────────────┼──────────┼────────────┤
│ TK001  │ John Doe     │ Engineering │ IT         │ High     │ Progress   │
│ TK002  │ Jane Smith   │ Recruitment │ HRD        │ Medium   │ Pending    │
│ TK003  │ Bob Wilson   │ Accounting  │ Finance    │ Low      │ Complete   │
│ TK004  │ Alice Brown  │ Purchasing  │ Procurement│ High     │ Progress   │
│ TK005  │ Mike Davis   │ Warehouse   │ Inventory  │ Medium   │ Pending    │
└────────┴──────────────┴─────────────┴────────────┴──────────┴────────────┘

Contoh Filter IT Saja:
📋 List Tiket (Semua Departemen)                    Filter Departemen: [IT ▼] (25 tiket)

┌────────┬──────────────┬─────────────┬────────────┬──────────┬────────────┐
│ ID     │ Nama         │ Divisi      │ Department │ Priority │ Status     │
├────────┼──────────────┼─────────────┼────────────┼──────────┼────────────┤
│ TK001  │ John Doe     │ Engineering │ IT         │ High     │ Progress   │
│ TK015  │ Sarah Lee    │ Development │ IT         │ Medium   │ Pending    │
│ TK032  │ Tom Chen     │ Support     │ IT         │ Low      │ Complete   │
└────────┴──────────────┴─────────────┴────────────┴──────────┴────────────┘
```

### D. Feedback & Survey
```
📝 List Feedback
- Menampilkan semua feedback dari seluruh departemen
- Kolom divisi tetap terlihat untuk identifikasi

📊 List Survey  
- Menampilkan semua survey dari seluruh departemen
- Target department terlihat untuk setiap survey
```

## 🛠️ Implementasi Teknis

### 1. **Logika Filtering**
```javascript
// Admin biasa: hanya tiket departemen sendiri
$: filteredTickets = tickets.filter(
    (t) => t.department?.toLowerCase() === adminDepartment?.toLowerCase()
);

// General Manager: semua tiket dengan filter opsional
$: filteredTickets = isGeneralManager($userEmail) 
    ? (selectedDepartmentFilter === 'all' 
        ? tickets // Show all tickets if 'all' is selected
        : tickets.filter(t => t.department?.toLowerCase() === selectedDepartmentFilter.toLowerCase())
    ) 
    : tickets.filter(/* filter departemen */);
```

### 2. **Filter State Management**
```javascript
// Filter state for General Manager
let selectedDepartmentFilter = 'all';
let availableDepartments = [];

// Extract available departments from tickets
$: if (tickets.length > 0 && isGeneralManager($userEmail)) {
    const departments = [...new Set(tickets
        .map(t => t.department)
        .filter(dept => dept && dept.trim() !== '')
        .map(dept => dept.trim())
    )].sort();
    availableDepartments = departments;
}
```

### 2. **Helper Function**
```javascript
export function isGeneralManager(email) {
  return email && email.toLowerCase() === 'general.manager@eltama.com';
}
```

### 3. **Filter UI Component**
```svelte
{#if isGeneralManager($userEmail) && availableDepartments.length > 0}
    <div class="flex items-center gap-2">
        <label>Filter Departemen:</label>
        <select bind:value={selectedDepartmentFilter}>
            <option value="all">Semua Departemen</option>
            {#each availableDepartments as dept}
                <option value={dept}>{dept}</option>
            {/each}
        </select>
        <div class="text-sm text-gray-600">
            ({filteredTickets.length} tiket)
        </div>
    </div>
{/if}
```

## 🔍 Debugging & Monitoring

Dashboard menyediakan console logs untuk debugging:
```javascript
console.log('adminDepartment:', adminDepartment);
console.log('userEmail:', $userEmail);
console.log('Is general manager:', isGeneralManager($userEmail));
console.log('Selected department filter:', selectedDepartmentFilter);
console.log('Total tickets:', tickets.length);
console.log('Filtered tickets:', filteredTickets.length);
console.log('Available departments:', availableDepartments);
```

## 📈 Manfaat untuk Organisasi

### 1. **Centralized Oversight**
- General Manager dapat memonitor performa semua departemen
- Identifikasi departemen dengan beban kerja tinggi
- Analisis distribusi tiket lintas departemen

### 2. **Strategic Decision Making**
- Data komprehensif untuk pengambilan keputusan strategis
- Monitoring SLA dan response time per departemen
- Resource allocation yang lebih efektif

### 3. **Quality Assurance**
- Oversight terhadap kualitas penanganan tiket
- Monitoring feedback dan survey satisfaction
- Identifikasi area improvement

## 🚀 Cara Penggunaan

1. **Login** menggunakan email `general.manager@eltama.com`
2. **Navigate** ke Dashboard Admin
3. **Lihat banner** konfirmasi akses khusus
4. **Gunakan filter departemen** untuk fokus pada departemen tertentu:
   - Pilih "Semua Departemen" untuk melihat semua tiket
   - Pilih departemen spesifik untuk filter tiket
   - Perhatikan counter jumlah tiket yang terfilter
5. **Monitor** tiket di "List Tiket (Semua Departemen)"
6. **Analisis** statistik dan tren lintas departemen
7. **Review** feedback dan survey dari semua departemen

## 🔒 Security & Access Control

- ✅ Akses khusus hanya untuk email `general.manager@eltama.com`
- ✅ Admin departemen lain tetap terbatas pada departemen mereka
- ✅ Tidak ada perubahan pada permission feedback dan survey
- ✅ Logging dan audit trail tetap berjalan normal

---

**Update Terbaru - Filter Departemen**: 
Fitur ini sekarang dilengkapi dengan dropdown filter departemen yang memungkinkan General Manager untuk dengan mudah memfokuskan tampilan pada departemen tertentu sambil tetap mempertahankan akses penuh ke semua data. Filter ini responsif dengan real-time counter dan UI yang user-friendly.

**Note**: Fitur ini memberikan General Manager kontrol penuh untuk monitoring dan oversight operasional helpdesk di seluruh organisasi sambil mempertahankan segmentasi akses untuk admin departemen lainnya.
