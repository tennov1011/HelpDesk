<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	let newPassword = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;
	let token = '';
	let email = '';
	
	onMount(() => {
		// Get token and email from URL parameters
		const urlParams = new URLSearchParams(window.location.search);
		const tokenParam = urlParams.get('oobCode');
		const emailParam = urlParams.get('email');
		
		token = tokenParam || '';
		email = emailParam || '';
		
		if (!token) {
			error = 'Token reset password tidak valid. Silakan minta link reset password baru.';
		}
	});
	
	async function handleSubmit() {
		if (!token) {
			error = 'Token reset password tidak valid. Silakan minta link reset password baru.';
			return;
		}
		
		if (!newPassword || !confirmPassword) {
			error = 'Semua field harus diisi';
			return;
		}
		
		if (newPassword !== confirmPassword) {
			error = 'Password tidak cocok';
			return;
		}
		
		if (newPassword.length < 6) {
			error = 'Password minimal 6 karakter';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			// Call API to reset password
			const response = await fetch('/api/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token,
					newPassword
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				success = true;
				newPassword = '';
				confirmPassword = '';
				setTimeout(() => {
					goto('/login');
				}, 3000);
			} else {
				error = data.error || 'Gagal mereset password';
			}
		} catch (e: unknown) {
			const err = e as Error;
			error = 'Terjadi kesalahan: ' + (err.message || 'Unknown error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Eltama Prima Indo</title>
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-6 sm:space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Reset Password</h2>
			<p class="mt-1 sm:mt-2 text-xs sm:text-sm text-white opacity-90">
				{#if email}
					Untuk akun: {email}
				{:else}
					Masukkan password baru Anda
				{/if}
			</p>
		</div>
		
		<!-- Form -->
		<div class="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl rounded-xl">
			{#if success}
				<div class="bg-green-100 border-l-4 border-green-400 p-3 sm:p-4 rounded-r-lg">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-4 w-4 sm:h-5 sm:w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
						</div>
						<div class="ml-2 sm:ml-3">
							<p class="text-xs sm:text-sm text-green-700">Password berhasil direset! Anda akan dialihkan ke halaman login...</p>
						</div>
					</div>
				</div>
			{:else}
				<form class="space-y-4 sm:space-y-6" on:submit|preventDefault={handleSubmit}>
					<!-- Error Message -->
					{#if error}
						<div class="bg-purple-100 border-l-4 border-purple-400 p-3 sm:p-4 rounded-r-lg">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
									</svg>
								</div>
								<div class="ml-2 sm:ml-3">
									<p class="text-xs sm:text-sm text-purple-700">{error}</p>
								</div>
							</div>
						</div>
					{/if}
					
					<!-- Password Field -->
					<div>
						<label for="password" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
							Password Baru
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
								<svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<input
								id="password"
								name="password"
								type="password"
								required
								bind:value={newPassword}
								disabled={loading || !token}
								class="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
								placeholder="Masukkan password baru"
							/>
						</div>
					</div>
					
					<!-- Confirm Password Field -->
					<div>
						<label for="confirm-password" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
							Konfirmasi Password
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
								<svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
							</div>
							<input
								id="confirm-password"
								name="confirm-password"
								type="password"
								required
								bind:value={confirmPassword}
								disabled={loading || !token}
								class="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
								placeholder="Konfirmasi password baru"
							/>
						</div>
					</div>
					
					<!-- Submit Button -->
					<div class="pt-2">
						<button
							type="submit"
							disabled={loading || !token}
							class="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
						>
							{#if loading}
								<svg class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								<span class="text-sm sm:text-base">Memproses...</span>
							{:else}
								<svg class="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
								</svg>
								<span class="text-sm sm:text-base">Reset Password</span>
							{/if}
						</button>
					</div>
					
					<!-- Back to Login -->
					<div class="flex justify-center">
						<a href="/login" class="mt-4 text-sm sm:text-base text-purple-600 hover:text-purple-700">
							Kembali ke Login
						</a>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
