<!-- src/lib/components/AuthGuard.svelte -->
<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { isAuthenticated } from '$lib/services/firebaseConfig';
    
    export let requireAuth = true;
    
    let isLoading = true;
    let authenticated = false;
    
    // Subscribe to authentication state
    const unsubscribe = isAuthenticated.subscribe(value => {
      authenticated = value;
      isLoading = false;
    });
    
    onMount(async () => {
      if (!browser) return;
      
      // Check authentication state
      const authState = await new Promise((resolve) => {
        const unsubscribe = isAuthenticated.subscribe(value => {
          unsubscribe();
          resolve(value);
        });
      });
      
      // If authentication is required but user is not authenticated
      if (requireAuth && !authState) {
        goto('/login');
        return;
      }
      
      // If user is authenticated but on login page
      if (authState && window.location.pathname === '/login') {
        goto('/');
        return;
      }
      
      isLoading = false;
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  </script>
  
  {#if isLoading}
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Memeriksa autentikasi...</p>
      </div>
    </div>
  {:else if !requireAuth || authenticated}
    <slot />
  {:else}
    <!-- This should not be reached due to redirect, but just in case -->
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <p class="text-red-600">Akses ditolak. Silakan login terlebih dahulu.</p>
      </div>
    </div>
  {/if}