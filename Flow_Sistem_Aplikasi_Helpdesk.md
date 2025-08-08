# Flow Sistem Aplikasi Helpdesk

## 📋 Ringkasan Sistem

Aplikasi Helpdesk PT Eltama Prima Indo adalah sistem ticketing dan manajemen internal yang dikembangkan menggunakan SvelteKit dengan backend Directus CMS dan autentikasi Firebase. Sistem ini melayani berbagai kebutuhan operasional perusahaan mulai dari ticketing IT, feedback, survey, hingga manajemen kendaraan dan pengajuan BBM/E-Tol.

## 🏗️ Arsitektur Sistem

### Frontend Stack
- **Framework**: SvelteKit 5.0.0
- **Styling**: TailwindCSS 4.1.8
- **Build Tool**: Vite 6.2.6
- **Type Checking**: TypeScript 5.0.0

### Backend & Services
- **CMS/Database**: Directus (directus.eltamaprimaindo.com)
- **Authentication**: Firebase Auth
- **File Storage**: Directus File System
- **PDF Generation**: jsPDF 3.0.1

### Database Schema
- **Prisma ORM**: SQLite untuk development
- **Main Tables**: Employee, TicketForm, FeedbackForm, SurveyForm, Questions, Vehicles, ETol

## 🚀 Flow Aplikasi

### 1. Autentikasi & Authorization

#### Login Flow (`/login`)
```
1. User masuk ke halaman login (/login)
2. Input email dan password
3. Firebase Auth memvalidasi kredensial
4. Sistem memeriksa roleDefinitions untuk menentukan:
   - Role: admin/user
   - Department: IT, HRD, Finance, etc.
   - Permissions level
5. Redirect berdasarkan role:
   - Admin → /admin/dashboard
   - User → /user/dashboard
```

#### Role Management (`firebaseConfig.js`)
```javascript
roleDefinitions = [
  // Admin Departments
  { email: 'it@eltama.com', role: 'admin', department: 'IT' },
  { email: 'hrd@eltama.com', role: 'admin', department: 'HRD' },
  { email: 'general.manager@eltama.com', role: 'admin', department: 'Management' },
  
  // Regular Users  
  { email: 'tennov@eltama.com', role: 'admin', department: 'IT' },
  { email: 'mickael@eltama.com', role: 'user', department: 'IT' },
  // ... 50+ defined users
]
```

### 2. Dashboard User (`/user/dashboard`)

#### Fitur Utama:
- **Ticket Management**: Create, view, track tickets
- **Feedback System**: Submit feedback untuk improvement
- **Survey Participation**: Mengisi survey departemen
- **Personal Tracking**: Melihat status tiket pribadi

#### User Flow:
```
1. Dashboard Overview
   ├── Statistik personal tickets
   ├── Recent activities
   └── Quick actions
   
2. Create New Ticket
   ├── Select Category:
   │   ├── Request System/Aplikasi
   │   ├── Request Infrastruktur/Perangkat
   │   ├── Peminjaman Kendaraan
   │   ├── Izin Keluar
   │   ├── Pengajuan BBM
   │   └── Pengajuan E-Tol
   ├── Fill Form (dynamic based on category)
   ├── Upload attachments
   └── Submit to Directus API
   
3. Track Tickets
   ├── View ticket list
   ├── Filter by status/date
   ├── See updates from admin
   └── Receive notifications
```

### 3. Dashboard Admin (`/admin/dashboard`)

#### Access Control:
- **Departmental Admin**: Hanya melihat tiket departmennya
- **General Manager**: Akses semua tiket (cross-department)
- **HRD Special Access**: Rekapitulasi kendaraan, BBM, E-Tol

#### Admin Workflow:
```
1. Ticket Management
   ├── View incoming tickets
   ├── Assign PIC (Person in Charge)
   ├── Update status: Pending → On Progress → Done/Rejected
   ├── Add comments & attachments
   └── Generate reports
   
2. Content Management
   ├── Survey Questions (per department)
   ├── Vehicle Database
   ├── E-Tol Card Management
   └── Employee Data
   
3. Analytics & Reports
   ├── Department statistics
   ├── Response time metrics
   ├── Category breakdown
   └── Export capabilities
```

### 4. Ticket Categories & Forms

#### 1. Request System/Aplikasi
```
Fields:
- app_type: ERP, Web App, Mobile App
- url_name_app: URL aplikasi
- browser: Chrome, Firefox, etc.
- desc: Deskripsi masalah
- photo_ticket: Screenshot
- priority: Low, Medium, High
```

#### 2. Request Infrastruktur/Perangkat
```
Fields:
- device: PC, Laptop, Printer, Server, etc.
- label: Asset label/number
- location: Lokasi perangkat
- desc: Deskripsi masalah
- photo_ticket: Foto masalah
```

#### 3. Peminjaman Kendaraan
```
Fields:
- vehicle_type: Pilihan dari database kendaraan
- date_used: Tanggal penggunaan
- departure_time: Waktu berangkat
- estimated_return_time: Estimasi kembali
- destination: Tujuan perjalanan
- desc: Keperluan
```

#### 4. Pengajuan BBM
```
Fields:
- vehicle_type: Kendaraan yang digunakan
- initial_kilometer: Kilometer awal
- submission_amount: Nominal pengajuan
- destination: Tujuan perjalanan
- initial_fuel: Bahan bakar awal
```

#### 5. Pengajuan E-Tol
```
Fields:
- no_etol: Nomor kartu E-Tol
- initial_balance: Saldo awal
- etol_submission_amount: Nominal top up
- destination: Tujuan perjalanan
```

## 🔄 Data Flow Architecture

### 1. Ticket Creation Flow
```
User Input → Form Validation → File Upload (if any) → Directus API → Database
     ↓
Notification to Admin → Email/System Alert → Admin Dashboard Update
```

### 2. Ticket Processing Flow
```
Admin Receives → Assign PIC → Update Status → Add Comments → Notify User
     ↓
Status History → Tracking Updates → Final Resolution → Archive
```

### 3. Reporting Flow
```
Raw Data (Directus) → Filter & Process → Calculate Statistics → Generate Views
     ↓
Export Options → PDF Reports → Email Distribution → Archive
```

## 📊 Database Schema

### Core Tables

#### TicketForm (Directus)
```sql
- id: Primary key
- date_created: Timestamp
- name: User name
- email: User email
- division: User department
- category: Ticket category
- status: Pending/On Progress/Done/Rejected
- pic: Person in Charge
- target_department: Assigned department
- priority: Low/Medium/High
- desc: Description
- photo_ticket: Attachments
- [Category-specific fields...]
```

#### FeedbackForm (Directus)
```sql
- id: Primary key
- date_created: Timestamp
- name: User name
- email: User email
- division: Department
- feedback: Feedback text
- url: Related URL
- photo_feedback: Screenshot
- status: Open/Resolved
```

#### SurveyForm (Directus)
```sql
- id: Primary key
- date_created: Timestamp
- name: User name
- target_department: Surveyed department
- division: User department
- rating: Overall rating
- questions: JSON responses
- additional: Additional comments
```

#### Vehicles (Directus)
```sql
- id: Primary key
- nama: Vehicle name
- jenis: Vehicle type
- plat_nomor: License plate
- status: Tersedia/Service/Rusak/Dipinjam
```

#### Questions (Directus)
```sql
- id: Primary key
- department: Target department
- question: Question text
- date_created: Timestamp
```

## 🎯 Fitur Khusus

### 1. Multi-Level Access Control

#### Department-Based Access
```javascript
// Regular admin - hanya departemennya
if (adminDepartment === 'IT') {
  tickets = tickets.filter(t => t.target_department === 'IT')
}

// General Manager - semua departemen
if (isGeneralManager(email)) {
  tickets = allTickets // No filter
}

// HRD - akses khusus untuk rekapitulasi
if (isHrdAdmin(email, department)) {
  enableRekapFeatures = true
}
```

#### Role Hierarchy
```
1. General Manager
   - Akses semua tiket
   - Dashboard cross-department
   - Global analytics
   
2. Department Admin  
   - Tiket departemen mereka
   - Manage PIC assignment
   - Department analytics
   
3. Regular User
   - Create tickets
   - View personal tickets
   - Submit feedback/survey
```

### 2. Rekapitulasi System (HRD/GM Only)

#### BBM Rekapitulasi
```
- Filter by month/year
- Total nominal per bulan
- Total kilometer
- Breakdown per kendaraan
- Export ke PDF
- Detail per pengajuan
```

#### E-Tol Rekapitulasi  
```
- Total top up per periode
- Breakdown per nomor E-Tol
- Monthly summaries
- Usage statistics
```

#### Peminjaman Kendaraan
```
- Total peminjaman per periode
- Statistik per kendaraan
- Peminjam terbanyak
- Breakdown per divisi
- Analisis per hari
```

### 3. Dynamic Form System

#### Category-Based Fields
```javascript
// System request fields
if (category === 'Request System/Aplikasi') {
  showFields(['app_type', 'url_name_app', 'browser'])
}

// Infrastructure request fields  
if (category === 'Request Infrastruktur/Perangkat') {
  showFields(['device', 'label', 'location'])
}

// Vehicle borrowing fields
if (category === 'Peminjaman Kendaraan') {
  showFields(['vehicle_type', 'date_used', 'departure_time'])
}
```

### 4. Real-time Features

#### Status Updates
```
- Live status tracking
- Notification system
- Comment threads
- File attachments
- History logging
```

#### Dashboard Updates
```
- Real-time ticket counts
- Status distribution
- Recent activities
- Performance metrics
```

## 🔧 Technical Implementation

### 1. Svelte Components Structure

```
src/lib/component/
├── TicketingForm.svelte        # Main ticket creation
├── TicketList.svelte           # Ticket display & management
├── FeedbackForm.svelte         # Feedback submission
├── FeedbackList.svelte         # Feedback management
├── SurveyForm.svelte           # Survey participation
├── SurveyList.svelte           # Survey management
├── QuestionManager.svelte      # Survey questions CRUD
├── VehicleManager.svelte       # Vehicle database CRUD
├── ETolManager.svelte          # E-Tol card CRUD
├── RekapitulasiBBM.svelte      # BBM reports
├── RekapitulasiEtol.svelte     # E-Tol reports
├── RekapPeminjamanKendaraan.svelte # Vehicle loan reports
├── TicketStats.svelte          # Statistics dashboard
├── Header.svelte               # Navigation
├── Sidebar.svelte              # Admin sidebar
└── Notification.svelte         # Alert system
```

### 2. Services Layer

```
src/lib/services/
├── firebaseConfig.js           # Auth & role management
├── api.js                      # Directus API wrapper
└── employee.js                 # Employee data service
```

### 3. Route Structure

```
src/routes/
├── +page.svelte                # Root redirect to login
├── +layout.svelte              # Global layout
├── login/+page.svelte          # Authentication
├── forgot-password/+page.svelte # Password reset
├── reset-password/+page.svelte  # Password reset form
├── admin/
│   ├── +layout.svelte          # Admin layout
│   └── dashboard/+page.svelte  # Admin dashboard
└── user/
    └── dashboard/
        ├── +layout.svelte      # User layout
        └── +page.svelte        # User dashboard
```

## 🔐 Security & Permissions

### 1. Authentication Security
```javascript
// Firebase persistence
setPersistence(auth, browserLocalPersistence)

// Role-based routing guards
if (!isAuthenticated) redirect('/login')
if (role === 'admin') redirect('/admin/dashboard')
if (role === 'user') redirect('/user/dashboard')
```

### 2. API Security
```javascript
// Directus token-based auth
headers: {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`
}

// Input validation & sanitization
// XSS protection via Svelte
// File upload restrictions
```

### 3. Data Access Control
```javascript
// Department filtering
const userTickets = tickets.filter(ticket => 
  ticket.email === currentUser.email ||
  ticket.target_department === currentUser.department
)

// Special permissions
const canAccessRekap = isHrdAdmin || isGeneralManager
```

## 📈 Performance & Optimization

### 1. Data Loading
```javascript
// Pagination for large datasets
rowsPerPage = 10
currentPage = 1

// Lazy loading for images
// Cached API responses
// Optimistic UI updates
```

### 2. Mobile Optimization
```javascript
// Responsive design with Tailwind
// Touch gesture support
// Mobile-first approach
// Progressive enhancement
```

## 🚀 Deployment & Environment

### Development
```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview build
```

### Environment Variables
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_DIRECTUS_URL=https://directus.eltamaprimaindo.com
VITE_DIRECTUS_TOKEN=JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz
```

## 📱 User Experience Flow

### User Journey
```
1. Login dengan email perusahaan
2. Dashboard sesuai role (user/admin)
3. Create ticket dengan kategori yang sesuai
4. Upload attachment jika diperlukan
5. Submit dan receive confirmation
6. Track progress melalui dashboard
7. Receive notifications untuk updates
8. Complete feedback setelah resolved
```

### Admin Journey
```
1. Login sebagai admin departemen
2. Dashboard dengan pending tickets
3. Review dan assign PIC
4. Update status dengan comments
5. Upload resolution attachments
6. Mark as completed
7. Generate reports dan analytics
8. Manage department resources
```

## 🔄 Integration Points

### External Services
1. **Firebase Auth**: User authentication
2. **Directus CMS**: Data management & API
3. **Email Service**: Notifications (via Directus)
4. **File Storage**: Attachment handling

### Internal Modules
1. **Employee Management**: User data sync
2. **Vehicle Database**: Fleet management
3. **Survey System**: Satisfaction tracking
4. **Reporting Engine**: Analytics & exports

## 📊 Analytics & Monitoring

### Key Metrics
1. **Ticket Volume**: Daily/weekly/monthly
2. **Response Time**: Average resolution time
3. **Category Distribution**: Most common issues
4. **Department Performance**: SLA compliance
5. **User Satisfaction**: Survey scores
6. **Resource Utilization**: Vehicle/equipment usage

### Reports Available
1. **Ticket Reports**: Status, category, timeline
2. **Performance Reports**: Response time, resolution rate
3. **Resource Reports**: BBM, E-Tol, vehicle usage
4. **User Reports**: Activity, satisfaction scores

## 🎯 Business Value

### Operational Efficiency
- Centralized request management
- Automated routing & assignment
- Progress tracking & accountability
- Resource optimization

### Data-Driven Decisions
- Usage analytics
- Performance metrics
- Cost tracking
- Trend analysis

### User Satisfaction
- Self-service portal
- Transparent tracking
- Quick resolution
- Feedback loop

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Technology Stack**: SvelteKit + Directus + Firebase
**Target Users**: PT Eltama Prima Indo Internal Staff
