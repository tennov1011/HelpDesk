# Dokumentasi Folder `src/routes`

## 📋 Overview

Folder `src/routes` merupakan sistem routing berbasis file dari SvelteKit yang mengatur navigasi dan halaman aplikasi HelpDesk. Setiap file dan folder dalam routes secara otomatis menjadi endpoint yang dapat diakses, mengikuti konvensi SvelteKit untuk file-based routing.

## 📁 Struktur Lengkap

```
src/routes/
├── +page.svelte                # Root page (/) - Auto redirect
├── +layout.svelte              # Global layout wrapper
├── login/
│   └── +page.svelte            # Login page (/login)
├── forgot-password/
│   └── +page.svelte            # Password reset request (/forgot-password)
├── reset-password/
│   └── +page.svelte            # Password reset form (/reset-password)
├── admin/
│   ├── +layout.svelte          # Admin layout wrapper
│   └── dashboard/
│       └── +page.svelte        # Admin dashboard (/admin/dashboard)
└── user/
    └── dashboard/
        ├── +layout.svelte      # User dashboard layout
        └── +page.svelte        # User dashboard (/user/dashboard)
```

## 🌐 Routing System

### SvelteKit File-Based Routing
```
File Path                    → URL Route
+page.svelte                → /
login/+page.svelte          → /login
admin/dashboard/+page.svelte → /admin/dashboard
user/dashboard/+page.svelte  → /user/dashboard
```

### Layout Hierarchy
```
Global Layout (+layout.svelte)
├── Auth Pages (login, forgot-password, reset-password)
├── Admin Layout (admin/+layout.svelte)
│   └── Admin Dashboard (admin/dashboard/+page.svelte)
└── User Layout (user/dashboard/+layout.svelte)
    └── User Dashboard (user/dashboard/+page.svelte)
```

## 📄 Halaman Detail

### 1. **Root Page (`+page.svelte`)**
**URL**: `/`
**Fungsi**: Auto-redirect ke login page

```svelte
<script>
import { goto } from '$app/navigation';
import { onMount } from 'svelte';

onMount(() => {
    goto('/login').catch(() => {
        window.location.href = '/login';
    });
});
</script>
```

**Purpose**:
- Landing page yang tidak menampilkan konten
- Otomatis redirect ke `/login`
- Fallback menggunakan `window.location` jika SvelteKit navigation gagal
- Memastikan user selalu diarahkan ke authentication

**User Flow**:
1. User akses domain utama (eltama-helpdesk.com)
2. Sistem otomatis redirect ke `/login`
3. Jika sudah login, sistem akan redirect sesuai role

### 2. **Global Layout (`+layout.svelte`)**
**Fungsi**: Wrapper layout untuk seluruh aplikasi

```svelte
<script>
    import '../app.css';
    let { children } = $props();
</script>

{@render children()}
```

**Features**:
- Import global CSS (TailwindCSS)
- Render child pages dengan slot system
- Minimal layout untuk maximum flexibility
- Applied ke semua routes secara otomatis

**Responsibilities**:
- Global styling import
- Font loading
- Base HTML structure
- Child page rendering

### 3. **Login Page (`login/+page.svelte`)**
**URL**: `/login`
**Fungsi**: Halaman autentikasi utama

```svelte
Features:
- Email & password input fields
- Firebase authentication integration
- Role-based redirect setelah login
- Show/hide password toggle
- Loading states during authentication
- Error handling & display
- Forgot password link
- Responsive design untuk mobile/desktop
```

**Authentication Flow**:
1. User input email & password
2. Validasi format email & password requirements
3. Firebase Auth verification
4. Role lookup dari roleDefinitions
5. Redirect based on role:
   - Admin → `/admin/dashboard`
   - User → `/user/dashboard`

**Error Handling**:
- Invalid credentials
- Network connectivity issues
- Account disabled/not found
- Too many failed attempts

**UI Components**:
- Company logo/branding
- Form validation indicators
- Loading spinner
- Error message display
- Responsive layout

**Security Features**:
- Password visibility toggle
- Secure form submission
- Session persistence
- CSRF protection (SvelteKit default)

### 4. **Forgot Password (`forgot-password/+page.svelte`)**
**URL**: `/forgot-password`
**Fungsi**: Request password reset

```svelte
Features:
- Email input untuk reset request
- Firebase password reset email
- Success/error message display
- Back to login navigation
- Email validation
- Rate limiting protection
```

**Reset Flow**:
1. User input email address
2. Validasi email format
3. Firebase sends reset email
4. Success confirmation
5. Redirect to login dengan informasi

**Form Fields**:
- Email address (required)
- Submit button dengan loading state
- Cancel/back to login link

**Validation**:
- Email format validation
- Email existence check
- Rate limiting untuk prevent spam

### 5. **Reset Password (`reset-password/+page.svelte`)**
**URL**: `/reset-password`
**Fungsi**: Form reset password dengan token

```svelte
Features:
- New password input fields
- Password confirmation
- Password strength indicator
- Token validation
- Success redirect to login
- Error handling
```

**Reset Process**:
1. User clicks link dari email
2. Token validation
3. New password input dengan confirmation
4. Password strength requirements
5. Firebase password update
6. Success message & redirect to login

**Password Requirements**:
- Minimum 6 characters
- Password confirmation match
- Secure input fields
- Show/hide password toggle

### 6. **Admin Layout (`admin/+layout.svelte`)**
**Fungsi**: Layout wrapper untuk admin area

```svelte
Features:
- Authentication guard
- Role validation (admin only)
- Admin header dengan navigation
- Sidebar integration
- Logout functionality
- Admin-specific styling
```

**Layout Structure**:
```svelte
<Header />
<div class="admin-container">
  <Sidebar />
  <main class="main-content">
    {@render children()}
  </main>
</div>
<Footer />
```

**Access Control**:
- Check authentication status
- Verify admin role
- Redirect non-admin users
- Session timeout handling

**Navigation Components**:
- Admin header dengan profile dropdown
- Sidebar dengan menu navigation
- Breadcrumb navigation
- Mobile-responsive menu

### 7. **Admin Dashboard (`admin/dashboard/+page.svelte`)**
**URL**: `/admin/dashboard`
**Fungsi**: Dashboard utama untuk admin

```svelte
Features:
- Ticket management interface
- Department-specific atau global view
- Statistics & analytics
- Quick actions toolbar
- Real-time updates
- Export capabilities
```

**Dashboard Sections**:

#### A. **Statistics Overview**
```svelte
- Total tickets (pending/in progress/resolved)
- Performance metrics (response time, resolution rate)
- Category distribution
- Department workload (for GM)
- Monthly trends
```

#### B. **Ticket Management**
```svelte
- Incoming ticket queue
- Assigned tickets
- Priority tickets
- Overdue tickets
- Recent activities
```

#### C. **Quick Actions**
```svelte
- Create new ticket (admin sebagai user)
- Bulk ticket operations
- Generate reports
- Export data
- System notifications
```

#### D. **Role-Based Features**

**General Manager Dashboard**:
```svelte
Features:
- Cross-department ticket view
- Global statistics
- Department comparison
- Advanced filtering options
- Executive reporting
- Department performance metrics

Access Control:
- View all departments
- Global analytics
- Cross-department assignment
- Executive reports
```

**Department Admin Dashboard**:
```svelte
Features:
- Department-specific tickets
- Team performance metrics
- Resource management
- Department reports

Limitations:
- Only see departmental tickets
- Department-specific analytics
- Limited cross-department access
```

**HRD Admin Special Features**:
```svelte
Additional Features:
- Vehicle management access
- E-Tol management
- BBM rekapitulasi
- E-Tol rekapitulasi
- Peminjaman kendaraan reports
- Employee data management

Special Buttons:
- "Kelola Kendaraan" → VehicleManager
- "Kelola E-Tol" → ETolManager  
- "Rekapitulasi BBM" → RekapitulasiBBM
- "Rekapitulasi E-Tol" → RekapitulasiEtol
- "Rekap Peminjaman" → RekapPeminjamanKendaraan
```

#### E. **Content Management (Conditional)**
```svelte
Survey Management:
- Question manager untuk departemen
- Survey results analysis
- Feedback management

Resource Management (HRD/GM):
- Vehicle database
- E-Tol card management
- Employee database
```

### 8. **User Dashboard Layout (`user/dashboard/+layout.svelte`)**
**Fungsi**: Layout wrapper untuk user area

```svelte
Features:
- User authentication guard
- User-specific header
- Simplified navigation
- User profile display
- Notification center
```

**Layout Features**:
- Clean, user-friendly interface
- Mobile-first responsive design
- Minimal navigation options
- Focus on ticket creation & tracking

**Access Control**:
- Verify user authentication
- User role validation
- Personal data security
- Session management

### 9. **User Dashboard (`user/dashboard/+page.svelte`)**
**URL**: `/user/dashboard`
**Fungsi**: Dashboard utama untuk end users

```svelte
Features:
- Personal ticket overview
- Quick ticket creation
- Recent activities
- Notification center
- Personal statistics
```

**Dashboard Sections**:

#### A. **Quick Actions**
```svelte
- Create New Ticket (prominent button)
- Submit Feedback
- Take Survey
- View Profile
```

#### B. **Personal Overview**
```svelte
- My active tickets
- Recent submissions
- Pending approvals
- Resolved tickets count
```

#### C. **Ticket Creation Shortcuts**
```svelte
Quick Category Buttons:
- 🖥️ System/App Issue
- 🔧 Hardware Problem  
- 🚗 Vehicle Request
- 🛣️ E-Tol Request
- ⛽ Fuel Request
- 📝 Feedback
- 📊 Survey
```

#### D. **Personal Analytics**
```svelte
- Ticket submission history
- Average resolution time
- Category usage patterns
- Satisfaction ratings given
```

#### E. **Recent Activities Feed**
```svelte
- Recent ticket updates
- Admin responses
- Status changes
- System notifications
```

## 🔐 Route Guards & Security

### 1. **Authentication Guards**
```svelte
// Admin routes
import { isAuthenticated, userRole } from '$lib/services/firebaseConfig';

$: if (!$isAuthenticated) {
    goto('/login');
} else if ($userRole !== 'admin') {
    goto('/user/dashboard');
}
```

### 2. **Role-Based Access**
```svelte
// Role verification per route
if ($userRole === 'admin') {
    // Allow admin dashboard access
} else if ($userRole === 'user') {
    // Allow user dashboard access
} else {
    // Redirect to login
}
```

### 3. **Department-Level Security**
```svelte
// Department access control
if (adminDepartment === 'HRD') {
    enableHRDFeatures = true;
}

if (isGeneralManager($userEmail)) {
    enableGlobalAccess = true;
}
```

## 🌊 Navigation Flow

### 1. **Initial Access Flow**
```
User Access → / → Auto Redirect → /login
                    ↓
        Authentication Success
                    ↓
             Role Check
            ↙        ↘
    Admin Role      User Role
         ↓              ↓
/admin/dashboard  /user/dashboard
```

### 2. **Admin Navigation Flow**
```
/admin/dashboard
├── Ticket Management
├── Feedback Management  
├── Survey Management
├── Content Management
│   ├── Question Manager
│   ├── Vehicle Manager (HRD/GM)
│   └── E-Tol Manager (HRD/GM)
└── Reports & Analytics
    ├── Department Reports
    ├── BBM Rekapitulasi (HRD/GM)
    ├── E-Tol Rekapitulasi (HRD/GM)
    └── Vehicle Reports (HRD/GM)
```

### 3. **User Navigation Flow**
```
/user/dashboard
├── Create Ticket
│   ├── System/App Request
│   ├── Hardware Request
│   ├── Vehicle Borrowing
│   ├── Fuel Request
│   └── E-Tol Request
├── My Tickets
├── Submit Feedback
├── Take Survey
└── Profile
```

## 📱 Responsive Design Implementation

### 1. **Mobile-First Approach**
```svelte
<!-- Responsive layout classes -->
<div class="
  min-h-screen 
  bg-gray-50 
  px-4 sm:px-6 lg:px-8
  py-4 sm:py-6 lg:py-8
">
```

### 2. **Conditional Layouts**
```svelte
<!-- Different layouts for mobile/desktop -->
{#if window.innerWidth < 768}
  <MobileLayout />
{:else}
  <DesktopLayout />
{/if}
```

### 3. **Touch-Friendly Interface**
```svelte
<!-- Mobile optimizations -->
<button class="
  px-4 py-3 
  text-base sm:text-sm
  touch-manipulation
  min-h-[44px]
">
```

## 🔄 Data Loading Patterns

### 1. **Server-Side Rendering (SSR)**
```svelte
<!-- Load data during route resolution -->
// +page.server.js (if needed for SEO)
export async function load({ fetch }) {
    // Pre-load critical data
}
```

### 2. **Client-Side Loading**
```svelte
<!-- Most common pattern in this app -->
onMount(async () => {
    await fetchTickets();
    await fetchFeedbacks();
    await fetchSurveys();
});
```

### 3. **Progressive Enhancement**
```svelte
<!-- Show skeleton while loading -->
{#if isLoading}
    <SkeletonLoader />
{:else}
    <ActualContent />
{/if}
```

## 🎯 Performance Optimizations

### 1. **Code Splitting**
```svelte
<!-- Lazy load admin components -->
{#if showAdminPanel}
    {#await import('$lib/component/AdminPanel.svelte')}
        Loading...
    {:then AdminPanel}
        <AdminPanel.default />
    {/await}
{/if}
```

### 2. **Route Pre-loading**
```svelte
<!-- SvelteKit auto-preloads routes on hover -->
<a href="/admin/dashboard" data-sveltekit-preload-data>
    Admin Dashboard
</a>
```

### 3. **Optimistic Navigation**
```svelte
<!-- Instant navigation with SvelteKit -->
import { goto } from '$app/navigation';
goto('/next-page', { replaceState: false });
```

## 🛡️ Security Considerations

### 1. **Client-Side Route Protection**
- Authentication state verification
- Role-based access control
- Automatic redirects untuk unauthorized access
- Session timeout handling

### 2. **CSRF Protection**
- SvelteKit built-in CSRF protection
- Secure form submissions
- Token validation

### 3. **XSS Prevention**
- Svelte auto-escaping
- Sanitized user input
- Safe HTML rendering

## 📊 SEO & Meta Tags

### 1. **Dynamic Meta Tags**
```svelte
<svelte:head>
    <title>HelpDesk - {pageTitle}</title>
    <meta name="description" content="{pageDescription}" />
</svelte:head>
```

### 2. **Structured Data**
```svelte
<!-- For search engine optimization -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "PT Eltama HelpDesk"
}
</script>
```

## 🔧 Development & Deployment

### 1. **Development Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type checking
```

### 2. **Route Testing**
```bash
# Test individual routes
curl http://localhost:5173/
curl http://localhost:5173/login
curl http://localhost:5173/admin/dashboard
```

### 3. **Build Output**
```
.svelte-kit/output/
├── client/          # Client-side assets
├── server/          # Server-side code
└── static/          # Static assets
```

---

**Total Routes**: 8 route endpoints
**Layout Hierarchy**: 3 levels (Global → Role-based → Page)
**Security**: Multi-level authentication & authorization
**Performance**: Optimized dengan lazy loading & code splitting
**Mobile Support**: Responsive design dengan touch optimization
**SEO**: Dynamic meta tags & structured data
