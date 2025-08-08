# Dokumentasi Folder `src/lib`

## 📋 Overview

Folder `src/lib` merupakan jantung dari aplikasi HelpDesk yang berisi semua komponen reusable, services, utilities, dan logika bisnis. Struktur ini mengikuti best practices SvelteKit untuk organisasi kode yang modular dan maintainable.

## 📁 Struktur Lengkap

```
src/lib/
├── index.js                    # Export utama library
├── component/                  # Komponen Svelte
│   ├── ETolManager.svelte
│   ├── FeedbackForm.svelte
│   ├── FeedbackList.svelte
│   ├── Footer.svelte
│   ├── Header.svelte
│   ├── Notification.svelte
│   ├── QuestionManager.svelte
│   ├── RekapitulasiBBM.svelte
│   ├── RekapitulasiEtol.svelte
│   ├── RekapPeminjamanKendaraan.svelte
│   ├── Sidebar.svelte
│   ├── SurveyForm.svelte
│   ├── SurveyList.svelte
│   ├── TicketingForm.svelte
│   ├── TicketList.svelte
│   ├── TicketStats.svelte
│   ├── UserHeader.svelte
│   └── VehicleManager.svelte
├── services/                   # Business logic & API
│   ├── api.js
│   ├── employee.js
│   └── firebaseConfig.js
└── utils/                      # Utilities & helpers
    ├── routeGuard.js
    └── simpleRouteGuard.js
```

## 🧩 Komponen Utama (`src/lib/component/`)

### 1. **ETolManager.svelte**
**Fungsi**: Manajemen database kartu E-Tol untuk admin HRD/GM
```svelte
Fitur:
- CRUD operations untuk kartu E-Tol
- Tambah kartu baru dengan nomor dan saldo
- Edit data kartu existing
- Hapus kartu yang tidak digunakan
- Validasi nomor kartu unik
- Status tracking (Aktif/Nonaktif)

Props:
- Tidak ada props eksternal (standalone component)

State Management:
- etols: Array data kartu E-Tol
- showModal: Boolean untuk modal add/edit
- editingETol: Object kartu yang sedang diedit
- etolNumber, etolBalance: Form fields
- isLoading: Loading state untuk operations
```

### 2. **FeedbackForm.svelte**
**Fungsi**: Form untuk user submit feedback/saran
```svelte
Fitur:
- Form input feedback dengan text area
- Upload foto/screenshot pendukung
- Pilihan departemen target
- URL reference (jika feedback terkait website/app)
- Validasi form sebelum submit
- Integration dengan Directus API

Props:
- employee: Object data employee yang login

Form Fields:
- name: Nama user (auto-filled dari employee)
- division: Divisi user (auto-filled)
- feedback: Text feedback
- url: URL reference (optional)
- photo_feedback: File upload (optional)

Flow:
1. User mengisi form feedback
2. Upload foto jika ada
3. Submit ke Directus API
4. Notifikasi sukses/error
5. Reset form setelah submit berhasil
```

### 3. **FeedbackList.svelte**
**Fungsi**: Tampilan daftar feedback untuk admin
```svelte
Fitur:
- List semua feedback dengan pagination
- Filter berdasarkan status (Open/Resolved)
- Search berdasarkan nama/divisi
- Update status feedback
- View detail feedback dengan foto
- Export ke PDF (untuk reporting)

Props:
- feedbacks: Array data feedback
- isAdmin: Boolean status admin
- adminDepartment: Department admin yang login

Admin Functions:
- Mark feedback as resolved
- Add admin response/comment
- Assign feedback to specific PIC
- Generate monthly feedback reports
```

### 4. **Header.svelte**
**Fungsi**: Navigation header untuk user dashboard
```svelte
Fitur:
- Logo dan branding perusahaan
- User profile dropdown
- Logout functionality
- Notification indicator
- Responsive mobile menu

Components:
- User avatar/initial
- Dropdown menu dengan profile info
- Notification bell dengan badge count
- Mobile hamburger menu
```

### 5. **QuestionManager.svelte**
**Fungsi**: CRUD management pertanyaan survey per departemen
```svelte
Fitur:
- Tambah pertanyaan baru untuk departemen tertentu
- Edit pertanyaan existing
- Hapus pertanyaan yang tidak relevan
- Preview pertanyaan dalam konteks survey
- Validasi pertanyaan tidak kosong

Props:
- adminDept: Department admin yang mengelola

Question Structure:
- id: Unique identifier
- department: Target department
- question: Text pertanyaan
- date_created: Timestamp pembuatan

Admin Flow:
1. Pilih departemen target
2. Tambah/edit pertanyaan
3. Preview dalam format survey
4. Publish untuk digunakan user
```

### 6. **RekapitulasiBBM.svelte**
**Fungsi**: Laporan komprehensif pengajuan BBM (HRD/GM only)
```svelte
Fitur:
- Rekapitulasi per bulan/tahun
- Total nominal pengajuan BBM
- Total kilometer perjalanan
- Breakdown per kendaraan
- Detail per pengajuan dengan status
- Export ke PDF report
- Filter berdasarkan periode
- Statistik penggunaan

Access Control:
- Hanya HRD admin dan General Manager
- Validasi email dan department

Data Analysis:
- Monthly totals dengan trend
- Vehicle usage statistics
- Cost per kilometer analysis
- Most active users/departments

Report Format:
- Summary cards (total nominal, total km)
- Monthly breakdown table
- Vehicle utilization table
- Detailed transaction list per month
```

### 7. **RekapitulasiEtol.svelte**
**Fungsi**: Laporan pengajuan top-up E-Tol (HRD/GM only)
```svelte
Fitur:
- Total top-up per periode
- Breakdown per nomor E-Tol
- Monthly usage summaries
- Cost tracking per card
- Usage frequency analysis
- Export functionality

E-Tol Analytics:
- Card utilization rates
- Most used E-Tol numbers
- Cost efficiency analysis
- Department usage patterns

Access Control:
- Same as BBM - HRD/GM only
- Email validation for access
```

### 8. **RekapPeminjamanKendaraan.svelte**
**Fungsi**: Laporan peminjaman kendaraan (HRD/GM only)
```svelte
Fitur:
- Total peminjaman per periode
- Statistik per kendaraan
- Peminjam terbanyak analysis
- Breakdown per divisi
- Analisis per hari dalam minggu
- Vehicle availability tracking

Statistics Generated:
- kendaraanTerfavorit: Most borrowed vehicles
- peminjamTerbanyak: Most active borrowers
- peminjamPerDivisi: Department usage
- peminjamPerHari: Day-of-week analysis

Report Features:
- Filter by month/year
- Detailed borrowing history
- Vehicle utilization rates
- Department comparison
```

### 9. **Sidebar.svelte**
**Fungsi**: Navigation sidebar untuk admin dashboard
```svelte
Fitur:
- Menu navigasi admin
- Role-based menu items
- Active page highlighting
- Collapse/expand functionality
- Department-specific options

Menu Structure:
- Dashboard (semua admin)
- Ticket Management (semua admin)
- Feedback Management (semua admin)
- Survey Management (semua admin)
- Question Manager (departmental)
- Vehicle Manager (HRD/GM only)
- E-Tol Manager (HRD/GM only)
- Reports & Analytics (based on role)

Conditional Menus:
- General Manager: Akses semua menu
- HRD Admin: Tambahan vehicle & E-Tol management
- Department Admin: Menu sesuai departemen
```

### 10. **SurveyForm.svelte**
**Fungsi**: Form untuk user mengisi survey departemen
```svelte
Fitur:
- Dynamic questions berdasarkan departemen target
- Rating system (1-5 stars)
- Additional comments
- Departemen selection
- Form validation
- Progress indicator

Survey Structure:
- name: User name
- target_department: Department being surveyed
- division: User's division
- rating: Overall rating (1-5)
- questions: Dynamic Q&A responses
- additional: Additional comments

Dynamic Loading:
1. User selects target department
2. System loads questions for that department
3. User answers each question
4. Overall rating submission
5. Additional comments (optional)
```

### 11. **SurveyList.svelte**
**Fungsi**: Tampilan daftar survey untuk admin analysis
```svelte
Fitur:
- List semua survey responses
- Filter berdasarkan departemen target
- Search berdasarkan nama responden
- View detailed responses
- Analytics & statistics
- Export survey results

Admin Analytics:
- Average ratings per department
- Response distribution
- Question-by-question analysis
- Trend analysis over time
- Department comparison

Export Options:
- PDF summary reports
- Detailed response data
- Statistical analysis
```

### 12. **TicketingForm.svelte**
**Fungsi**: Form utama pembuatan tiket (multi-category)
```svelte
Fitur:
- Dynamic form berdasarkan kategori
- File upload untuk attachments
- Auto-fill user data dari employee
- Form validation per kategori
- Priority selection
- Department routing

Categories & Fields:
1. Request System/Aplikasi:
   - app_type, url_name_app, browser
   
2. Request Infrastruktur/Perangkat:
   - device, label, location
   
3. Peminjaman Kendaraan:
   - vehicle_type, date_used, departure_time, estimated_return_time
   
4. Izin Keluar:
   - departure_time, estimated_return_time, destination
   
5. Pengajuan BBM:
   - vehicle_type, initial_kilometer, submission_amount, destination
   
6. Pengajuan E-Tol:
   - no_etol, initial_balance, etol_submission_amount, destination

Dynamic Form Logic:
- Category selection triggers field visibility
- Validation rules per category
- Auto-population from external data (vehicles, E-Tol)
- File handling for screenshots/photos
```

### 13. **TicketList.svelte**
**Fungsi**: Komponen kompleks untuk display & management tiket
```svelte
Fitur User:
- View personal tickets
- Filter by status/category/date
- Search functionality
- Mobile-responsive table
- Ticket detail modal
- Status tracking

Fitur Admin:
- View departmental/all tickets (based on role)
- Update ticket status
- Assign PIC (Person in Charge)
- Add comments & attachments
- Bulk operations
- Advanced filtering
- Export functionality

Special Admin Features (HRD/GM):
- Access rekapitulasi functions
- Cross-department visibility
- Edit nominal for BBM/E-Tol submissions
- Advanced analytics access

Mobile Optimization:
- Touch-friendly interface
- Swipe gestures
- Responsive columns
- Mobile search
- Condensed view options

Search & Filter:
- Global search across all fields
- Category-specific filters
- Date range filtering
- Status-based filtering
- Department filtering (for GM)
- Priority filtering
```

### 14. **TicketStats.svelte**
**Fungsi**: Dashboard statistics dan analytics
```svelte
Fitur:
- Real-time ticket counters
- Status distribution charts
- Category breakdown
- Performance metrics
- Trend analysis
- Department comparison (for GM)

Statistics Displayed:
- Total tickets (all time & current period)
- Pending vs Resolved ratio
- Average resolution time
- Category distribution
- Department performance
- Monthly trends

Visual Elements:
- Progress bars untuk status distribution
- Color-coded cards untuk quick overview
- Responsive grid layout
- Interactive charts (if charts library added)
```

### 15. **UserHeader.svelte**
**Fungsi**: Header khusus untuk user dashboard
```svelte
Fitur:
- Simplified navigation untuk user
- Profile display
- Notification center
- Quick actions
- Logout functionality

User-specific Features:
- Personal ticket count
- Recent activity summary
- Quick ticket creation
- Profile settings access
```

### 16. **VehicleManager.svelte**
**Fungsi**: CRUD management database kendaraan (HRD/GM only)
```svelte
Fitur:
- Tambah kendaraan baru
- Edit data kendaraan
- Update status kendaraan
- Hapus kendaraan
- Track ketersediaan
- Maintenance scheduling

Vehicle Fields:
- nama: Nama/brand kendaraan
- jenis: Mobil, Motor, Bus, Truk, etc.
- plat_nomor: License plate
- status: Tersedia, Service, Rusak, Dipinjam

Status Management:
- Automatic status updates during borrowing
- Manual status updates for maintenance
- Status history tracking
- Availability calendar

Admin Functions:
- Fleet overview
- Maintenance reminders
- Usage statistics
- Cost tracking integration
```

## 🔧 Services Layer (`src/lib/services/`)

### 1. **api.js**
**Fungsi**: Wrapper untuk Directus API calls
```javascript
Features:
- Axios instance dengan base configuration
- Error handling interceptors
- Authentication headers
- Response standardization
- Retry logic untuk failed requests

Core Functions:
- getRoleAndDivisionByEmail(): Role lookup
- isAdminByEmail(): Admin verification
- Generic CRUD operations
- File upload handling
- Batch operations

Configuration:
- Base URL: directus.eltamaprimaindo.com
- Authorization: Bearer token
- Content-Type: application/json
- Request/Response interceptors
```

### 2. **employee.js**
**Fungsi**: Employee data management
```javascript
Features:
- Fetch employee data from Directus
- Employee lookup by email
- Department validation
- Profile information management

Functions:
- fetchEmployees(): Get all employees
- getEmployeeByEmail(): Individual lookup
- validateEmployeeAccess(): Permission checking
- updateEmployeeData(): Profile updates

Data Structure:
- id: Unique identifier
- companyEmail: Primary email
- personalEmail: Secondary email (optional)
- name: Full name
- department: Department assignment
- createdAt/updatedAt: Timestamps
```

### 3. **firebaseConfig.js**
**Fungsi**: Authentication & role management core
```javascript
Features:
- Firebase Auth initialization
- Role-based access control
- User session management
- Permission verification
- Svelte stores untuk reactive state

Key Functions:
- login(email, password): Authentication
- logout(): Session termination
- isGeneralManager(): GM check
- isHrdAdmin(): HRD admin check
- canUserApprove(): Permission validation

Stores:
- isAuthenticated: Boolean auth state
- userRole: Current user role
- userDepartment: User department
- userName: Display name
- userEmail: User email
- authError: Error messages

Role Definitions:
- 50+ predefined user roles
- Department mappings
- Admin vs user permissions
- Special roles (GM, multi-department managers)

Security Features:
- Persistent authentication
- Role validation
- Department access control
- Session management
```

## 🛠️ Utilities (`src/lib/utils/`)

### 1. **routeGuard.js**
**Fungsi**: Route protection untuk authenticated users
```javascript
Features:
- Authentication verification
- Role-based redirects
- Session validation
- Unauthorized access prevention

Implementation:
- Check authentication status
- Validate user permissions
- Redirect to appropriate dashboard
- Handle authentication errors
```

### 2. **simpleRouteGuard.js**
**Fungsi**: Simplified route protection
```javascript
Features:
- Basic authentication check
- Simple redirect logic
- Lightweight validation
- Fast execution

Use Cases:
- Public pages with optional auth
- Basic protection needs
- Performance-critical routes
```

## 🔄 Component Communication Patterns

### 1. **Parent-Child Props**
```svelte
<!-- Parent component -->
<TicketList 
  tickets={tickets}
  isAdmin={true}
  adminDepartment="IT"
  on:ticketUpdate={handleTicketUpdate}
/>

<!-- Child component receives props -->
export let tickets = [];
export let isAdmin = false;
export let adminDepartment = '';
```

### 2. **Event Dispatching**
```svelte
// Child component
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function handleSubmit() {
  dispatch('ticketCreated', { ticketData });
}

// Parent component
<TicketingForm on:ticketCreated={refreshTickets} />
```

### 3. **Svelte Stores (Global State)**
```javascript
// firebaseConfig.js
export const userRole = writable(null);
export const isAuthenticated = writable(false);

// Component usage
import { userRole } from '$lib/services/firebaseConfig';
$: isAdmin = $userRole === 'admin';
```

## 📱 Responsive Design Patterns

### 1. **Mobile-First Approach**
```svelte
<!-- Mobile optimization in TicketList -->
{#if isMobile}
  <div class="mobile-card-view">
    <!-- Condensed mobile layout -->
  </div>
{:else}
  <table class="desktop-table">
    <!-- Full desktop table -->
  </table>
{/if}
```

### 2. **Touch Handling**
```svelte
<!-- Touch gestures untuk mobile -->
<div 
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  class="touch-enabled"
>
```

## 🎯 Performance Optimizations

### 1. **Lazy Loading**
```svelte
<!-- Conditional component loading -->
{#if showRekapModal}
  <RekapitulasiBBM bind:this={rekapitulasiBBM} />
{/if}
```

### 2. **Pagination**
```svelte
<!-- Large dataset handling -->
let currentPage = 1;
let rowsPerPage = 10;
$: paginatedTickets = tickets.slice(
  (currentPage - 1) * rowsPerPage,
  currentPage * rowsPerPage
);
```

### 3. **Reactive Statements**
```svelte
<!-- Efficient filtering -->
$: filteredTickets = tickets.filter(ticket => {
  return ticket.status === selectedStatus &&
         ticket.category.includes(searchQuery);
});
```

## 🔐 Security Implementations

### 1. **Access Control**
```svelte
<!-- Role-based UI -->
{#if isHrdAdmin}
  <button on:click={openRekapModal}>
    Lihat Rekapitulasi
  </button>
{/if}
```

### 2. **Input Validation**
```svelte
<!-- Form validation -->
$: isFormValid = 
  email.includes('@') && 
  password.length >= 6 &&
  description.trim().length > 0;
```

### 3. **XSS Prevention**
```svelte
<!-- Svelte auto-escapes by default -->
<p>{userInput}</p> <!-- Safe -->
<p>{@html sanitizedHTML}</p> <!-- Use with caution -->
```

## 🚀 Best Practices Implemented

### 1. **Component Modularity**
- Single responsibility principle
- Reusable components
- Clear prop interfaces
- Event-driven communication

### 2. **State Management**
- Centralized auth state
- Local component state
- Reactive updates
- Minimal prop drilling

### 3. **Error Handling**
- Try-catch blocks
- User-friendly error messages
- Graceful degradation
- Loading states

### 4. **Code Organization**
- Logical folder structure
- Clear naming conventions
- Consistent coding style
- Documentation comments

---

**Total Components**: 16 komponen utama
**Total Services**: 3 service modules  
**Total Utilities**: 2 utility functions
**Architecture**: Modular, reactive, dan scalable
**Performance**: Optimized dengan lazy loading dan pagination
**Security**: Multi-level access control dengan role-based permissions
