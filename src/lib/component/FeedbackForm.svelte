<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import axios from 'axios';
	import { writable } from 'svelte/store';

	export let employee = null;

	let feedback = '';
	let rating = '1';
	let url = '';
	let photo_feedback = [];
	let isLoading = false; // Tambahkan state loading

	const dispatch = createEventDispatcher();

	const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	function getDirectusUrl(path) {
		return `${DIRECTUS_URL.replace(/\/$/, '')}${path}`;
	}

	let notification = writable({ show: false, type: '', message: '' });
	let notificationTimeout;

	function showNotification(type, message) {
		notification.set({ show: true, type, message });
		clearTimeout(notificationTimeout);
		notificationTimeout = setTimeout(() => {
			notification.set({ show: false, type: '', message: '' });
		}, 1000);
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});
	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});

	// Validate form data before submission
	function validateForm() {
		if (!feedback.trim()) {
			showNotification('error', 'Feedback tidak boleh kosong');
			return false;
		}
		
		if (!employee?.nama_karyawan) {
			showNotification('error', 'Data employee tidak ditemukan');
			return false;
		}
		
		return true;
	}

	// Debug network connectivity
	async function testConnection() {
		try {
			const response = await fetch(getDirectusUrl('/server/ping'), {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				}
			});
			console.log('Connection test:', response.status, response.statusText);
			return response.ok;
		} catch (error) {
			console.error('Connection test failed:', error);
			return false;
		}
	}

	// Handle form submission with better error handling
	const handleSubmit = async (event) => {
		event.preventDefault();
		
		// Validate required fields
		if (!validateForm()) {
			return;
		}
		
		console.log('Starting form submission...');
		console.log('Employee data:', employee);
		console.log('Directus URL:', getDirectusUrl('/items/FeedbackForm'));
		console.log('Token available:', !!DIRECTUS_TOKEN);
		
		isLoading = true;
		let photo_feedback_id = null;
		
		// Upload file if exists
		if (photo_feedback && photo_feedback.length > 0) {
			const formData = new FormData();
			formData.append('file', photo_feedback[0]);
			try {
				const uploadRes = await axios.post(getDirectusUrl('/files'), formData, {
					headers: {
						Authorization: `Bearer ${DIRECTUS_TOKEN}`,
						'Content-Type': 'multipart/form-data'
					}
				});
				photo_feedback_id = uploadRes.data.data.id;
			} catch (err) {
				console.error('File upload error:', err);
				showNotification('error', 'Gagal upload file lampiran');
				isLoading = false;
				return;
			}
		}
		const data = {
			name: employee?.nama_karyawan || '',
			division: employee?.divisi || '',
			email: employee?.email_company || '',
			feedback: feedback.trim(),
			rating: parseInt(rating),
			url: url.trim(),
			photo_feedback: photo_feedback_id
		};

		console.log('Payload yang dikirim:', data);

		try {
			const response = await axios.post(getDirectusUrl('/items/FeedbackForm'), data, {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`,
					'Content-Type': 'application/json'
				}
			});
			
			console.log('Response success:', response.data);
			showNotification('success', 'Feedback Anda telah terkirim. Terima kasih!');
			
			// Reset form
			feedback = '';
			rating = '1';
			url = '';
			photo_feedback = [];
			
			// Redirect ke dashboard setelah submit sukses
			setTimeout(() => {
				dispatch('submitted');
			}, 1000);
		} catch (error) {
			console.error('Submit error:', error);
			
			// Better error handling
			let errorMessage = 'Gagal mengirim feedback';
			if (error.response?.data?.errors) {
				errorMessage = error.response.data.errors[0]?.message || errorMessage;
			} else if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			showNotification('error', errorMessage);
			console.error('Directus error details:', {
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				config: {
					url: error.config?.url,
					method: error.config?.method,
					headers: error.config?.headers
				}
			});
		} finally {
			isLoading = false;
		}
	};

	export let onClose = undefined;

	function handleClose() {
		if (typeof onClose === 'function') onClose();
	}
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if isLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
		<div class="flex flex-col items-center">
			<svg
				class="animate-spin h-6 w-6 sm:h-12 sm:w-12 text-blue-600 mb-2 sm:mb-4"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
			</svg>
			<span class="text-white text-sm sm:text-lg font-semibold">Mengirim feedback...</span>
		</div>
	</div>
{/if}

{#if $notification.show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
		<div
			class="px-2 py-1 sm:px-6 sm:py-3 rounded shadow-lg font-semibold text-white text-center transition-all duration-300 text-xs sm:text-base"
			class:bg-green-500={$notification.type === 'success'}
			class:bg-red-500={$notification.type === 'error'}
			class:animate-bounce={$notification.type === 'success'}
		>
			{$notification.message}
		</div>
	</div>
{/if}

<div class="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-2 sm:p-4">
	<div class="w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto bg-white p-3 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-2xl relative overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
		<!-- Close button -->
		<button
			on:click={handleClose}
			aria-label="Tutup"
			class="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-500 text-lg sm:text-2xl font-bold z-50 focus:outline-none w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center bg-white rounded-full shadow-sm"
			>&times;</button
		>
		
		<form
			on:submit={handleSubmit}
			class="flex flex-col gap-2 sm:gap-6 w-full mt-6 sm:mt-0"
		>
			<div>
				<h2 class="text-sm sm:text-lg font-semibold text-gray-700 border-b pb-1 sm:pb-2 flex items-center gap-0.5">
					Feedback Baru
					<span class="text-red-500 text-sm sm:text-xl" title="Field wajib diisi">*</span>
				</h2>
				<textarea
					id="feedback"
					name="feedback"
					bind:value={feedback}
					rows="2"
					placeholder="Tuliskan feedback Anda di sini..."
					class="mt-1 sm:mt-3 w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-green-400 outline-none transition resize-none"
				></textarea>
			</div>
			<!-- Lampiran/Screenshot -->
			<div>
				<label for="photo_feedback" class="block font-medium text-xs sm:text-base mb-0.5 sm:mb-2">Lampiran/Screenshot</label>
				<input
					id="photo_feedback"
					type="file"
					multiple
					on:change={(e) => {
						photo_feedback = Array.from(e.target.files);
					}}
					accept=".png, .jpg, .jpeg, .gif, .image, .webp, .svg"
					class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
				/>
			</div>
			<div>
				<h2 class="text-sm sm:text-lg font-semibold text-gray-700 border-b pb-1 sm:pb-2">Rating Website (Opsional)</h2>
				<select
					id="rating"
					name="rating"
					bind:value={rating}
					class="mt-1 sm:mt-3 w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-yellow-400 outline-none transition"
				>
					<option value="1">1 😢 Sangat Buruk</option>
					<option value="2">2 😔 Buruk</option>
					<option value="3">3 😐 Cukup Baik</option>
					<option value="4">4 😊 Baik</option>
					<option value="5">5 😍 Sangat Baik</option>
				</select>
			</div>
			<div>
				<h2 class="text-sm sm:text-lg font-semibold text-gray-700 border-b pb-1 sm:pb-2">
					Halaman/URL Terkait (Opsional)
				</h2>
				<input
					type="text"
					id="url"
					name="url"
					bind:value={url}
					class="mt-1 sm:mt-3 w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-indigo-400 outline-none transition"
					placeholder="Masukkan URL"
				/>
			</div>
			
			<button
				type="submit"
				class="mt-2 sm:mt-8 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 sm:py-3 rounded font-medium text-xs sm:text-base shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
				disabled={isLoading}
			>
				{#if isLoading}
					Mengirim...
				{:else}
					Kirim Feedback
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	@media (max-width: 375px) {
		/* iPhone SE specific optimizations */
		.max-w-\[95vw\] {
			max-width: 95vw;
		}
	}
	@media (max-width: 639px) {
		/* General mobile optimizations */
		.max-w-\[95vw\] {
			max-width: 95vw;
		}
	}
</style>
