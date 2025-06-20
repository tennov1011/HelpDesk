// src/hooks.client.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';

let isInitialized = false;
let authStore = null;
let redirectTimeout = null;

// Routes that don't require authentication
const publicRoutes = ['/login'];

// Function to check if current route requires authentication
function requiresAuth(pathname) {
  return !publicRoutes.some(route => pathname.startsWith(route));
}

// Force redirect to login
function forceRedirectToLogin() {
  console.log('🔄 Force redirecting to login...');
  if (browser) {
    window.location.href = '/login';
  }
}

// Lazy load the auth store to avoid SSR issues
async function getAuthStore() {
  if (!authStore) {
    try {
      const { isAuthenticated } = await import('$lib/services/firebaseConfig');
      authStore = isAuthenticated;
      return authStore;
    } catch (error) {
      console.error('Failed to load auth store:', error);
      // If auth store fails to load, redirect to login
      setTimeout(forceRedirectToLogin, 1000);
      return null;
    }
  }
  return authStore;
}

// Initialize authentication guard
export async function initAuthGuard() {
  if (!browser || isInitialized) return;
  
  isInitialized = true;
  
  console.log('Initializing auth guard...');
  
  // Get auth store
  const authStoreInstance = await getAuthStore();
  if (!authStoreInstance) {
    console.error('Failed to initialize auth guard - no auth store');
    return;
  }
  
  // Subscribe to authentication state changes
  authStoreInstance.subscribe((authenticated) => {
    if (!browser) return;
    
    // Clear any existing redirect timeout
    if (redirectTimeout) {
      clearTimeout(redirectTimeout);
    }
    
    // Use setTimeout to ensure page store is available
    redirectTimeout = setTimeout(() => {
      try {
        const currentPage = get(page);
        const pathname = currentPage?.url?.pathname || window.location.pathname;
        
        console.log('Auth state changed:', { authenticated, pathname });
        
        // If user is not authenticated and trying to access protected route
        if (!authenticated && requiresAuth(pathname)) {
          console.log('Redirecting to login - user not authenticated');
          goto('/login').catch(() => {
            // Fallback if goto fails
            forceRedirectToLogin();
          });
        }
        
        // If user is authenticated and on login page, redirect to dashboard
        if (authenticated && pathname === '/login') {
          console.log('Redirecting to dashboard - user already authenticated');
          goto('/').catch(() => {
            // Fallback if goto fails
            window.location.href = '/';
          });
        }
      } catch (error) {
        console.error('Error in auth state handler:', error);
        // If there's an error and user is on protected route, redirect to login
        const pathname = window.location.pathname;
        if (requiresAuth(pathname)) {
          forceRedirectToLogin();
        }
      }
    }, 100);
  });
  
  // Also check on page navigation
  page.subscribe(($page) => {
    if (!browser) return;
    
    setTimeout(async () => {
      try {
        const pathname = $page?.url?.pathname;
        const authStoreInstance = await getAuthStore();
        if (!authStoreInstance) return;
        
        const authenticated = get(authStoreInstance);
        
        if (!authenticated && requiresAuth(pathname)) {
          console.log('Page navigation blocked - redirecting to login');
          goto('/login').catch(() => {
            forceRedirectToLogin();
          });
        }
      } catch (error) {
        console.error('Error in page navigation handler:', error);
        // If there's an error, force redirect to login for protected routes
        const pathname = $page?.url?.pathname;
        if (pathname && requiresAuth(pathname)) {
          forceRedirectToLogin();
        }
      }
    }, 100);
  });
  
  // Set a fallback timeout to prevent indefinite loading
  setTimeout(() => {
    if (browser) {
      const pathname = window.location.pathname;
      if (requiresAuth(pathname)) {
        // Check if we're still on a protected route after 5 seconds
        // If so, force redirect to login
        const authStoreValue = authStore ? get(authStore) : false;
        if (!authStoreValue) {
          console.log('Auth guard timeout - forcing redirect to login');
          forceRedirectToLogin();
        }
      }
    }
  }, 5000);
}

// Auto-initialize when this module is imported in browser
if (browser) {
  initAuthGuard().catch(error => {
    console.error('Failed to initialize auth guard:', error);
    // If initialization fails completely, redirect to login after delay
    setTimeout(() => {
      const pathname = window.location.pathname;
      if (requiresAuth(pathname)) {
        forceRedirectToLogin();
      }
    }, 2000);
  });
}