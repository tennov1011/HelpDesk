<!-- src/routes/login/+page.svelte -->
<script>
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import Footer from '$lib/component/Footer.svelte';
	import { goto } from '$app/navigation';
	import { userRole } from '$lib/services/firebaseConfig';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let isLoggedIn = false;

	// Store references
	let login = null;
	let authError = null;
	let isAuthenticated = null;

	// Subscription cleanup
	let unsubscribeAuth = null;
	let unsubscribeError = null;

	onMount(async () => {
		if (!browser) return;

		try {
			const authModule = await import('$lib/services/firebaseConfig');
			login = authModule.login;
			authError = authModule.authError;
			isAuthenticated = authModule.isAuthenticated;

			if (isAuthenticated) {
				unsubscribeAuth = isAuthenticated.subscribe((value) => {
					if (value) {
						// Tunggu userRole benar-benar terisi
						const unsubscribeRole = userRole.subscribe((roleValue) => {
							if (roleValue) {
								if (roleValue === 'admin') {
									goto('/admin/dashboard');
								} else{
									goto('/user/dashboard');
								}
								unsubscribeRole(); // Unsubscribe setelah redirect
							}
						});
					}
				});
			}

			// Subscribe to auth errors
			if (authError) {
				unsubscribeError = authError.subscribe((value) => {
					error = value || '';
				});
			}
		} catch (err) {
			console.error('Failed to initialize auth services:', err);
			error = 'Gagal menginisialisasi sistem autentikasi';
		}
	});

	// Cleanup subscriptions
	onDestroy(() => {
		if (unsubscribeAuth) unsubscribeAuth();
		if (unsubscribeError) unsubscribeError();
	});

	async function handleLogin() {
		if (!email || !password) {
			error = 'Email dan password harus diisi';
			return;
		}

		if (!login) {
			error = 'Sistem autentikasi belum siap, silakan coba lagi';
			return;
		}

		loading = true;
		error = '';

		try {
			await login(email, password);
			// Redirect will be handled by the onMount subscription
		} catch (e) {
			console.error('Login failed:', e);
			// Error is already set by the authError store
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>Login - Feedback Form</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<meta name="theme-color" content="#9333ea">
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
>
	<!-- Mobile Header - adjusted for mobile -->
	<div class="w-full text-center mb-6 sm:mb-8 lg:mb-12">
		<h1 class="typewriter text-2xl sm:text-4xl lg:text-6xl font-extrabold text-white px-2">
			Eltama Prima Indo
		</h1>
	</div>
	
	<!-- Main Content Container -->
	<div class="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-6 sm:space-y-8">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-white rounded-full flex items-center justify-center mb-4 sm:mb-6">
				<svg class="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
			</div>
			<h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Login Dulu</h2>
			<p class="mt-1 sm:mt-2 text-xs sm:text-sm text-white opacity-90">Form Feedback</p>
		</div>

		<!-- Login Form -->
		{#if !isLoggedIn}
			<div class="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl rounded-xl">
				<form class="space-y-4 sm:space-y-6" on:submit|preventDefault={handleLogin}>
					<!-- Error Message -->
					{#if error}
						<div class="bg-purple-100 border-l-4 border-purple-400 p-3 sm:p-4 rounded-r-lg">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<div class="ml-2 sm:ml-3">
									<p class="text-xs sm:text-sm text-purple-700">{error}</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Email Field -->
					<div>
						<label for="email" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
							Email
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
								<svg
									class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
									/>
								</svg>
							</div>
							<input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={email}
								on:keypress={handleKeyPress}
								disabled={loading}
								class="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
								placeholder="nama@eltama.com"
							/>
						</div>
					</div>

					<!-- Password Field -->
					<div>
						<label for="password" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
							Password
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
								<svg
									class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={password}
								on:keypress={handleKeyPress}
								disabled={loading}
								class="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
								placeholder="Masukkan password"
							/>
						</div>
					</div>

					<!-- Login Button -->
					<div class="pt-2">
						<button
							type="submit"
							disabled={loading || !login}
							class="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
						>
							{#if loading}
								<svg
									class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span class="text-sm sm:text-base">Mengirim...</span>
							{:else if !login}
								<svg class="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<span class="text-sm sm:text-base">Memuat...</span>
							{:else}
								<svg class="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
									/>
								</svg>
								<span class="text-sm sm:text-base">Masuk</span>
							{/if}
						</button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Footer -->
		<Footer />
	</div>
</div>

<style>
	/* Typewriter effect responsive */
	.typewriter {
		overflow: hidden;
		border-right: 0.15em solid #fff;
		white-space: nowrap;
		margin: 0 auto;
		letter-spacing: 0.05em;
		animation:
			typing 3s steps(19, end) infinite,
			blink-caret 1s step-end infinite;
	}

	/* Mobile typewriter */
	@media (max-width: 640px) {
		.typewriter {
			max-width: 16ch;
			letter-spacing: 0.03em;
			animation:
				typing-mobile 3s steps(16, end) infinite,
				blink-caret 1s step-end infinite;
		}
	}

	/* Tablet and up */
	@media (min-width: 641px) {
		.typewriter {
			max-width: 19ch;
		}
	}

	/* Desktop typing animation */
	@keyframes typing {
		from {
			max-width: 0;
		}
		to {
			max-width: 19ch;
		}
	}

	/* Mobile typing animation */
	@keyframes typing-mobile {
		from {
			max-width: 0;
		}
		to {
			max-width: 16ch;
		}
	}

	@keyframes blink-caret {
		from,
		to {
			border-color: transparent;
		}
		50% {
			border-color: #fff;
		}
	}

	/* Mobile-specific optimizations */
	@media (max-width: 640px) {
		/* Ensure forms are properly sized on mobile */
		input[type="email"],
		input[type="password"] {
			font-size: 16px; /* Prevents zoom on iOS */
		}
		
		/* Better touch targets */
		button {
			min-height: 44px;
		}
	}

	/* Landscape mobile optimization */
	@media (max-width: 896px) and (orientation: landscape) {
		.min-h-screen {
			min-height: 100vh;
			padding-top: 1rem;
			padding-bottom: 1rem;
		}
	}
</style>
