# User Experience (UX) Flow - HelpDesk System

## 📋 Overview

Dokumentasi ini menjelaskan secara detail pengalaman pengguna (User Experience) dalam menggunakan sistem HelpDesk PT Eltama Prima Indo, mulai dari perspektif User biasa hingga Admin dengan berbagai level akses (Admin Departemen, HRD Admin, dan General Manager).

## 👤 USER EXPERIENCE FLOW

### 🚀 1. Login & Initial Access

#### User Journey - Login Process
```
1. User akses domain helpdesk
   ↓
2. Auto-redirect ke /login
   ↓
3. Input email & password perusahaan
   ↓
4. Firebase authentication
   ↓
5. Role determination dari roleDefinitions
   ↓
6. Redirect berdasarkan role:
   - Admin → /admin/dashboard
   - User → /user/dashboard
```

#### Login Experience Details
**Visual Elements**:
- Logo PT Eltama Prima Indo
- Clean, professional login form
- Email & password fields dengan validation
- Show/hide password toggle
- Loading spinner saat authentication
- Error messages yang jelas

**User Interactions**:
1. **Email Input**: Auto-complete domain @eltama.com
2. **Password Input**: Secure field dengan visibility toggle
3. **Login Button**: Loading state dengan spinner
4. **Forgot Password**: Link ke reset password flow
5. **Remember Me**: Persistent session (Firebase handles this)

### 📊 2. User Dashboard Experience (`/user/dashboard`)

#### Dashboard Overview
```
User Dashboard Layout:
┌─────────────────────────────────────┐
│ Header: Logo | Profile | Notifications│
├─────────────────────────────────────┤
│ Welcome Message & Quick Stats       │
├─────────────────────────────────────┤
│ Quick Actions (Prominent Buttons)   │
├─────────────────────────────────────┤
│ My Recent Tickets                   │
├─────────────────────────────────────┤
│ Personal Analytics                  │
└─────────────────────────────────────┘
```

#### User Interface Elements

**1. Header Section**
- **User Profile**: Foto/initial, nama, department
- **Notification Bell**: Counter untuk updates
- **Logout Button**: Dengan confirmation

**2. Quick Actions (Hero Section)**
```
[🎫 Buat Tiket Baru]  [📝 Kirim Feedback]  [📊 Isi Survey]
     (Primary CTA)        (Secondary)        (Secondary)
```

**3. Personal Statistics Cards**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 📋 My Tickets│ │ ⏱️ Avg Time │ │ ✅ Resolved │
│     12       │ │   2.5 days  │ │     85%     │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 🎫 3. Create Ticket Flow (User)

#### Step 1: Category Selection
```
User clicks "Buat Tiket Baru"
↓
Modal/Page dengan category selection:

┌─────────────────────────────────────┐
│        Pilih Kategori Tiket         │
├─────────────────────────────────────┤
│ 🖥️  Request System/Aplikasi        │
│ 🔧  Request Infrastruktur/Perangkat │
│ 🚗  Peminjaman Kendaraan           │
│ 🚪  Izin Keluar                    │
│ ⛽  Pengajuan BBM                  │
│ 🛣️  Pengajuan E-Tol               │
└─────────────────────────────────────┘
```

#### Step 2: Dynamic Form Based on Category

**A. Request System/Aplikasi**
```
Form Fields:
├── Nama (auto-filled dari employee data)
├── Divisi (auto-filled)
├── Email (auto-filled)
├── Nomor HP (required input)
├── Jenis Aplikasi (dropdown: ERP, Web App, Mobile App, Lainnya)
├── URL/Nama Aplikasi (text input)
├── Browser (dropdown: Chrome, Firefox, Edge, Safari)
├── Deskripsi Masalah (textarea, required)
├── Priority (dropdown: Low, Medium, High)
├── Upload Screenshot (file input, optional)
└── [Submit Button]

User Experience:
1. Auto-filled fields memberikan convenience
2. Dropdown options memudahkan selection
3. Required field validation real-time
4. File upload dengan preview
5. Submit dengan loading state
```

**B. Request Infrastruktur/Perangkat**
```
Form Fields:
├── Data Personal (auto-filled)
├── Jenis Perangkat (dropdown: PC, Laptop, Printer, Server, dll)
├── Label/Serial Number Perangkat (text input)
├── Lokasi Perangkat (text input)
├── Deskripsi Masalah (textarea, required)
├── Priority Level
├── Upload Foto Masalah (file input)
└── [Submit Button]

UX Considerations:
- Device dropdown dengan search functionality
- Location dengan suggestions (based on company locations)
- Photo upload dengan multiple file support
- Priority auto-suggestion based on device type
```

**C. Peminjaman Kendaraan**
```
Form Fields:
├── Data Personal (auto-filled)
├── Jenis Kendaraan (dropdown dari database kendaraan aktif)
├── Tanggal Penggunaan (date picker)
├── Waktu Berangkat (time picker)
├── Estimasi Waktu Kembali (time picker)
├── Tujuan Perjalanan (text input, required)
├── Keperluan (textarea, required)
└── [Submit Button]

UX Features:
- Vehicle availability checker real-time
- Date picker dengan disabled past dates
- Time picker dengan 30-minute intervals
- Destination autocomplete dengan history
- Form validation untuk business hours
```

**D. Pengajuan BBM**
```
Form Fields:
├── Data Personal (auto-filled)
├── Jenis Kendaraan (dropdown)
├── Kilometer Awal (number input)
├── Nominal Pengajuan (currency input)
├── Tujuan Perjalanan (text input)
├── Bahan Bakar Awal (text input)
├── Keperluan (textarea)
└── [Submit Button]

UX Enhancements:
- Currency formatter untuk nominal
- Kilometer dengan validation (reasonable range)
- Destination dengan Google Maps integration (future)
- Auto-calculation suggestions based on distance
```

**E. Pengajuan E-Tol**
```
Form Fields:
├── Data Personal (auto-filled)
├── Nomor E-Tol (dropdown dari database E-Tol cards)
├── Saldo Awal (auto-filled from selected card)
├── Nominal Top Up (currency input)
├── Tujuan Perjalanan (text input)
├── Keperluan (textarea)
└── [Submit Button]

UX Features:
- E-Tol card selection dengan current balance display
- Top-up amount dengan predefined options (50k, 100k, 200k)
- Balance checker integration
- Cost estimation per route
```

#### Step 3: Form Submission Experience
```
User fills form → Client validation → Submit button click
                      ↓
              Loading state (spinner)
                      ↓
              File upload (if any)
                      ↓
              API call to Directus
                      ↓
              Success/Error response
                      ↓
┌─────────────────────────────────────┐
│ ✅ Tiket berhasil dibuat!           │
│ ID Tiket: TK001                    │
│ Status: Pending                     │
│ Target Department: IT               │
│                                     │
│ [Lihat Tiket] [Buat Lagi]          │
└─────────────────────────────────────┘
```

### 📝 4. Feedback Submission Flow (User)

#### Feedback Form Experience
```
User clicks "Kirim Feedback"
↓
Feedback Form Modal:

┌─────────────────────────────────────┐
│           Kirim Feedback            │
├─────────────────────────────────────┤
│ Nama: [Auto-filled]                 │
│ Divisi: [Auto-filled]               │
│ Target Departemen: [Dropdown]       │
│ URL Terkait: [Optional text input]  │
│ Feedback: [Large textarea]          │
│ Upload Screenshot: [File input]     │
│                                     │
│ [Batal] [Kirim Feedback]           │
└─────────────────────────────────────┘
```

#### UX Flow Details
1. **Department Selection**: Dropdown dengan semua departemen
2. **URL Field**: Optional, untuk feedback terkait website/app
3. **Feedback Textarea**: Rich text dengan character counter
4. **File Upload**: Drag & drop atau click to browse
5. **Submit Process**: Loading → Success notification → Form reset

### 📊 5. Survey Participation Flow (User)

#### Survey Selection Experience
```
User clicks "Isi Survey"
↓
Department Selection:

┌─────────────────────────────────────┐
│        Survey Departemen            │
├─────────────────────────────────────┤
│ Pilih departemen yang ingin Anda    │
│ berikan feedback:                   │
│                                     │
│ 🏢 IT Department                   │
│ 👥 HRD                             │
│ 💰 Finance                         │
│ 📢 Marketing                       │
│ 🏭 Produksi                        │
│ 📦 Inventory                       │
│ [More departments...]               │
└─────────────────────────────────────┘
```

#### Dynamic Survey Form
```
User selects department (e.g., IT)
↓
System loads questions for IT department
↓
Survey Form:

┌─────────────────────────────────────┐
│       Survey: IT Department         │
├─────────────────────────────────────┤
│ Overall Rating:                     │
│ ⭐⭐⭐⭐⭐ (interactive stars)      │
│                                     │
│ Questions:                          │
│                                     │
│ 1. Bagaimana responsivitas tim IT?  │
│    ⭐⭐⭐⭐⭐                     │
│                                     │
│ 2. Apakah masalah diselesaikan      │
│    dengan baik?                     │
│    ⭐⭐⭐⭐⭐                     │
│                                     │
│ [Dynamic questions loaded...]       │
│                                     │
│ Additional Comments:                │
│ [Large textarea]                    │
│                                     │
│ [Submit Survey]                     │
└─────────────────────────────────────┘
```

#### Survey UX Features
- **Star Rating System**: Interactive 1-5 stars
- **Progress Indicator**: Shows question progress
- **Auto-save**: Saves progress as user fills
- **Validation**: Required questions highlighted
- **Thank You Page**: Post-submission appreciation

### 📱 6. Mobile User Experience

#### Mobile-First Design
```
Mobile Layout (< 768px):
┌─────────────────┐
│ [☰] HelpDesk [👤]│ Header
├─────────────────┤
│ Quick Actions   │
│ [🎫 New Ticket] │ Full-width buttons
│ [📝 Feedback]   │
│ [📊 Survey]     │
├─────────────────┤
│ My Tickets      │ Card-based layout
│ ┌─────────────┐ │
│ │ TK001       │ │ Swipeable cards
│ │ Pending     │ │
│ └─────────────┘ │
└─────────────────┘
```

#### Touch-Friendly Interactions
- **Tap Targets**: Minimum 44px for buttons
- **Swipe Gestures**: Swipe ticket cards for actions
- **Pull to Refresh**: Dashboard content refresh
- **Touch Scrolling**: Smooth scrolling lists
- **Modal Handling**: Full-screen modals on mobile

---

## 👨‍💼 ADMIN EXPERIENCE FLOW

### 🏢 1. Admin Dashboard Overview

#### General Layout Structure
```
Admin Dashboard Layout:
┌─────────────────────────────────────┐
│ Header: Logo | Breadcrumb | Profile │
├─────┬───────────────────────────────┤
│ Side│ Main Content Area             │
│ bar │ ┌─────────────────────────────┐│
│     │ │ Statistics Cards            ││
│ 📊  │ ├─────────────────────────────┤│
│ 🎫  │ │ Ticket Management           ││
│ 📝  │ ├─────────────────────────────┤│
│ 👥  │ │ Quick Actions               ││
│ 🚗  │ ├─────────────────────────────┤│
│ ⚙️  │ │ Recent Activities           ││
│     │ └─────────────────────────────┘│
└─────┴───────────────────────────────┘
```

### 🎯 2. Admin Types & Access Levels

#### A. **Department Admin (Standard)**
```
Access Level: Departmental
Visible Data: Own department tickets only
Example: IT Admin sees only IT tickets

Dashboard Features:
├── Department Statistics
├── Departmental Ticket Queue
├── Team Performance Metrics
├── Department Resources
└── Basic Reporting

Limitations:
- Cannot see other department tickets
- Limited to departmental analytics
- No cross-department assignment
```

#### B. **General Manager (Cross-Department)**
```
Access Level: Global
Visible Data: ALL department tickets
Special Features: Cross-department analytics

Dashboard Features:
├── Global Statistics (all departments)
├── All Tickets Queue
├── Department Comparison Analytics
├── Cross-Department Assignment
├── Executive Reporting
└── Global Resource Management

Unique Elements:
┌─────────────────────────────────────┐
│ 🏢 Department Filter                │
│ [All Depts ▼] [IT] [HRD] [Finance] │
├─────────────────────────────────────┤
│ Cross-Department Analytics          │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ IT  │ │ HRD │ │ FIN │ │ MKT │    │
│ │ 15  │ │ 8   │ │ 12  │ │ 6   │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
└─────────────────────────────────────┘
```

#### C. **HRD Admin (Special Privileges)**
```
Access Level: HRD + Special Features
Special Access: Vehicle, E-Tol, BBM Management

HRD-Specific Features:
├── Standard HRD ticket management
├── 🚗 Vehicle Database Management
├── 🛣️ E-Tol Card Management
├── 📊 BBM Rekapitulasi
├── 📊 E-Tol Rekapitulasi
├── 📊 Vehicle Loan Reports
└── Employee Data Management

Special Menu Items (HRD Only):
┌─────────────────────────────────────┐
│ Sidebar Menu                        │
├─────────────────────────────────────┤
│ 📊 Dashboard                       │
│ 🎫 Tickets                         │
│ 📝 Feedback                        │
│ 📊 Surveys                         │
│ ❓ Questions                       │
│ ═══════════════════════════════════ │
│ 🚗 Kelola Kendaraan  [HRD ONLY]   │
│ 🛣️ Kelola E-Tol     [HRD ONLY]   │
│ 📊 Rekapitulasi      [HRD ONLY]   │
│   ├── BBM Reports                  │
│   ├── E-Tol Reports                │
│   └── Vehicle Reports              │
└─────────────────────────────────────┘
```

### 🎫 3. Ticket Management Flow (Admin)

#### Incoming Ticket Processing
```
New Ticket Arrives → Admin Dashboard Notification
                              ↓
Admin views ticket queue:

┌─────────────────────────────────────┐
│ 🔔 Pending Tickets (3 new)         │
├─────────────────────────────────────┤
│ TK001 │ System Request │ High │ 2h │
│ TK002 │ Hardware       │ Med  │ 1h │
│ TK003 │ Vehicle        │ Low  │ 5m │
├─────────────────────────────────────┤
│ [View All] [Assign Bulk] [Export]  │
└─────────────────────────────────────┘
```

#### Ticket Detail & Processing
```
Admin clicks on ticket → Detail Modal:

┌─────────────────────────────────────┐
│ 📋 Ticket Detail - TK001           │
├─────────────────────────────────────┤
│ Requester: John Doe (IT Dept)      │
│ Category: System Request            │
│ Priority: High                      │
│ Created: 2 hours ago                │
│                                     │
│ Description:                        │
│ "Login system tidak bisa diakses    │
│ sejak pagi, error 500..."           │
│                                     │
│ Attachments: [screenshot.png]       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Admin Actions                   │ │
│ │ Status: [Pending ▼]             │ │
│ │ Assign PIC: [Select Staff ▼]    │ │
│ │ Add Comment: [Text area]        │ │
│ │ Upload File: [Browse...]        │ │
│ │                                 │ │
│ │ [Update] [Close] [Forward]      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Status Update Flow
```
Admin updates status: Pending → On Progress
                        ↓
System sends notification to user
                        ↓
Ticket moves to "In Progress" queue
                        ↓
Admin adds progress comments
                        ↓
Final resolution: On Progress → Done
                        ↓
User receives completion notification
                        ↓
Ticket archived with resolution notes
```

### 🚗 4. HRD Admin - Vehicle Management

#### Vehicle Database Interface
```
HRD Admin → Sidebar → "Kelola Kendaraan"
                            ↓
Vehicle Management Dashboard:

┌─────────────────────────────────────┐
│ 🚗 Manajemen Kendaraan              │
├─────────────────────────────────────┤
│ [+ Tambah Kendaraan Baru]           │
├─────────────────────────────────────┤
│ Vehicle List:                       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Toyota Avanza - B1234XYZ       │ │
│ │ Status: Tersedia               │ │
│ │ [Edit] [Delete] [Set Service]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Honda Beat - B5678ABC           │ │
│ │ Status: Dipinjam (John Doe)     │ │
│ │ [View Details] [Contact User]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Mitsubishi L300 - B9999XYZ      │ │
│ │ Status: Service                 │ │
│ │ [Edit] [Mark Available]         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Add New Vehicle Flow
```
HRD clicks "+ Tambah Kendaraan Baru"
                    ↓
Add Vehicle Modal:

┌─────────────────────────────────────┐
│ ➕ Tambah Kendaraan Baru            │
├─────────────────────────────────────┤
│ Nama Kendaraan: [Text input]        │
│ Jenis: [Dropdown: Mobil,Motor,dll]  │
│ Plat Nomor: [Text input]            │
│ Status: [Dropdown: Tersedia,dll]    │
│                                     │
│ [Batal] [Simpan Kendaraan]         │
└─────────────────────────────────────┘
                    ↓
Validation → Database Save → Success Notification
                    ↓
Vehicle appears in main list with "Tersedia" status
```

#### Vehicle Status Management
```
Status Options:
├── ✅ Tersedia (Available for booking)
├── 🔧 Service (Under maintenance)
├── ❌ Rusak (Broken, needs repair)
└── 🚗 Dipinjam (Currently borrowed)

HRD can manually change status:
Vehicle Card → [Edit] → Status Dropdown → Save
                           ↓
Auto-notification to users about availability
```

### 🛣️ 5. HRD Admin - E-Tol Management

#### E-Tol Card Database
```
HRD Admin → Sidebar → "Kelola E-Tol"
                         ↓
E-Tol Management Interface:

┌─────────────────────────────────────┐
│ 🛣️ Manajemen Kartu E-Tol           │
├─────────────────────────────────────┤
│ [+ Tambah Kartu E-Tol]              │
├─────────────────────────────────────┤
│ E-Tol Card List:                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Kartu #001234567               │ │
│ │ Saldo: Rp 85,000               │ │
│ │ Status: Aktif                  │ │
│ │ Last Used: 2 hari lalu         │ │
│ │ [Edit] [Top Up] [Deactivate]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Kartu #001234568               │ │
│ │ Saldo: Rp 25,000               │ │
│ │ Status: Aktif                  │ │
│ │ Last Used: 1 minggu lalu       │ │
│ │ [Edit] [Top Up] [Deactivate]   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### E-Tol Card Management Features
1. **Add New Card**: Input nomor kartu & saldo awal
2. **Update Balance**: Manual balance updates
3. **Card Status**: Aktif/Nonaktif toggle
4. **Usage Tracking**: Integration dengan submission data
5. **Balance Alerts**: Low balance notifications

### 📊 6. HRD Admin - Rekapitulasi Features

#### Rekapitulasi Menu
```
HRD Sidebar → "Rekapitulasi" → Submenu:

┌─────────────────────────────────────┐
│ 📊 Rekapitulasi & Laporan          │
├─────────────────────────────────────┤
│ ⛽ Rekapitulasi BBM                 │
│ 🛣️ Rekapitulasi E-Tol              │
│ 🚗 Rekapitulasi Peminjaman Kendaraan │
└─────────────────────────────────────┘
```

#### A. BBM Rekapitulasi Experience
```
HRD clicks "Rekapitulasi BBM"
               ↓
BBM Report Interface:

┌─────────────────────────────────────┐
│ ⛽ Rekapitulasi Pengajuan BBM       │
├─────────────────────────────────────┤
│ 📅 Filter Periode:                 │
│ [Januari 2025 ▼] [2025 ▼] [Apply]  │
├─────────────────────────────────────┤
│ 📊 Summary Cards:                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │💰Total  │ │🛣️Total │ │📈Rata²  ││
│ │ Nominal │ │   KM   │ │ per KM  ││
│ │2.5M     │ │ 1,250  │ │ Rp2K    ││
│ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────┤
│ 📋 Detailed Monthly Report:        │
│ [Expandable month sections]         │
│                                     │
│ ▼ Januari 2025 (15 pengajuan)      │
│   ┌─────────────────────────────┐   │
│   │ Date │ User │ Vehicle │ Amt │   │
│   │ 1/15 │ John │ Avanza  │ 200K│   │
│   │ 1/18 │ Jane │ Beat    │ 50K │   │
│   └─────────────────────────────┘   │
│                                     │
│ [📄 Export PDF] [📊 Export Excel]   │
└─────────────────────────────────────┘
```

#### B. Vehicle Loan Rekapitulasi
```
Vehicle Report Features:
├── 📅 Monthly/Yearly filters
├── 🚗 Vehicle usage statistics
├── 👥 Most active borrowers
├── 🏢 Department breakdown
├── 📊 Day-of-week analysis
├── 📈 Utilization trends
└── 📄 Comprehensive PDF reports

Statistical Analysis:
- Kendaraan terfavorit
- Peminjam terbanyak
- Usage per divisi
- Peak borrowing times
- Vehicle availability rates
```

### 🎛️ 7. General Manager - Global Dashboard

#### GM-Specific Interface Elements
```
General Manager Dashboard:

┌─────────────────────────────────────┐
│ 🏢 Executive Dashboard              │
├─────────────────────────────────────┤
│ 🌐 Global Filter Controls:          │
│ [All Depts ▼] [This Month ▼] [⚙️]   │
├─────────────────────────────────────┤
│ 📊 Cross-Department Analytics:      │
│                                     │
│ Department Performance:             │
│ ┌─────┬─────┬─────┬─────┬─────┐    │
│ │ IT  │ HRD │ FIN │ MKT │ PRD │    │
│ │ 95% │ 88% │ 92% │ 85% │ 90% │    │ SLA
│ │ 2.1 │ 3.2 │ 2.8 │ 4.1 │ 3.5 │    │ Avg Days
│ └─────┴─────┴─────┴─────┴─────┘    │
│                                     │
│ 🎯 Executive Actions:               │
│ [📊 Generate Executive Report]      │
│ [👥 Department Comparison]          │
│ [📈 Trend Analysis]                 │
│ [⚡ Escalate Issues]                │
└─────────────────────────────────────┘
```

#### GM Decision Support Features
1. **Resource Allocation**: Cross-department workload balancing
2. **Performance Monitoring**: Department SLA compliance
3. **Cost Analysis**: Resource utilization & cost effectiveness
4. **Strategic Planning**: Trend analysis for decision making
5. **Issue Escalation**: High-priority problem identification

### 📱 8. Admin Mobile Experience

#### Mobile Admin Interface
```
Mobile Admin Layout (< 768px):
┌─────────────────┐
│ [☰] Admin [👤]  │ Collapsible menu
├─────────────────┤
│ 🔔 Alerts (3)   │ Priority notifications
├─────────────────┤
│ Quick Actions   │
│ [📋 Tickets]    │ Large touch targets
│ [👥 Assign]     │
│ [📊 Reports]    │
├─────────────────┤
│ Recent Tickets  │ Swipeable cards
│ ┌─────────────┐ │
│ │ TK001 [>]   │ │ Swipe for actions
│ │ High | 2h   │ │
│ └─────────────┘ │
└─────────────────┘
```

#### Mobile Admin Actions
- **Swipe Gestures**: Swipe right to assign, left to update status
- **Quick Update**: Tap to change status without full modal
- **Voice Notes**: Voice-to-text for admin comments
- **Push Notifications**: Real-time ticket alerts
- **Offline Capability**: Basic ticket viewing when offline

---

## 🎯 UX Design Principles Applied

### 1. **User-Centered Design**
- **Task-oriented interfaces**: Each user type gets relevant tools
- **Progressive disclosure**: Complex features hidden until needed
- **Contextual help**: Tooltips and guidance where needed

### 2. **Accessibility**
- **Keyboard navigation**: Full keyboard support
- **Screen reader friendly**: Proper ARIA labels
- **Color contrast**: WCAG 2.1 AA compliance
- **Font sizing**: Responsive text scales

### 3. **Performance UX**
- **Loading states**: Clear progress indicators
- **Optimistic updates**: Immediate UI feedback
- **Error recovery**: Graceful error handling
- **Offline indicators**: Network status awareness

### 4. **Mobile-First Responsive**
- **Touch-friendly**: 44px minimum touch targets
- **Thumb-zone optimization**: Important actions within reach
- **Swipe interactions**: Natural mobile gestures
- **Progressive enhancement**: Desktop features added progressively

### 5. **Feedback Loops**
- **Immediate feedback**: Real-time validation
- **Progress tracking**: Clear status communication
- **Success confirmation**: Completion acknowledgment
- **Error prevention**: Validation before submission

---

**User Types Covered**: 4 user types (User, Department Admin, HRD Admin, GM)
**Core Flows**: 8 major user journeys
**Mobile Optimization**: Touch-first design dengan gesture support
**Accessibility**: WCAG 2.1 AA compliant
**Performance**: Optimized loading & response times
