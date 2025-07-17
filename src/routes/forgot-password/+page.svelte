<script lang="ts">
	import { goto } from '$app/navigation';
	
	let companyEmail = '';
	let loading = false;
	let message = '';
	let error = '';
	
	async function handleSubmit() {
		if (!companyEmail) {
			error = 'Email harus diisi';
			return;
		}
		
		// Validate that it's a company email
		if (!companyEmail.endsWith('@eltama.com')) {
			error = 'Masukkan email perusahaan (@eltama.com)';
			return;
		}
		
		loading = true;
		error = '';
		message = '';
		
		try {
			// Call API to send reset password email
			const response = await fetch('/api/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					companyEmail
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				message = 'Email reset password telah dikirim ke email pribadi Anda. Silakan cek inbox email Anda.';
				companyEmail = '';
			} else {
				error = data.error || 'Gagal mengirim email reset password. Silakan coba lagi.';
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
	<title>Lupa Password - Eltama Prima Indo</title>
	<link
		href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.16/dist/tailwind.min.css"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-500 to-blue-500 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-6 sm:space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Lupa Password</h2>
			<p class="mt-1 sm:mt-2 text-xs sm:text-sm text-white opacity-90">Masukkan email perusahaan (@eltama.com) untuk reset password</p>
		</div>
		
		<!-- Form -->
		<div class="bg-white py-6 sm:py-8 px-4 sm:px-6 shadow-xl rounded-xl">
			<form class="space-y-4 sm:space-y-6" on:submit|preventDefault={handleSubmit}>
				<!-- Success Message -->
				{#if message}
					<div class="bg-green-100 border-l-4 border-green-400 p-3 sm:p-4 rounded-r-lg">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-4 w-4 sm:h-5 sm:w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-2 sm:ml-3">
								<p class="text-xs sm:text-sm text-green-700">{message}</p>
							</div>
						</div>
					</div>
				{/if}
				
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
				
				<!-- Email Field -->
				<div>
					<label for="email" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
						Email Perusahaan
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
							<svg class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
							</svg>
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={companyEmail}
							disabled={loading}
							class="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
							placeholder="nama@eltama.com"
						/>
					</div>
				</div>
				
				<!-- Submit Button -->
				<div class="pt-2">
					<button
						type="submit"
						disabled={loading}
						class="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors touch-manipulation"
					>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span class="text-sm sm:text-base">Mengirim...</span>
						{:else}
							<svg class="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
							</svg>
							<span class="text-sm sm:text-base">Kirim Reset Link</span>
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
		</div>
	</div>
</div> 