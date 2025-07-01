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
				class="animate-spin h-12 w-12 text-blue-600 mb-4"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
			</svg>
			<span class="text-white text-lg font-semibold">Mengirim feedback...</span>
		</div>
	</div>
{/if}

{#if $notification.show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
		<div
			class="px-6 py-3 rounded-lg shadow-lg font-semibold text-white text-center transition-all duration-300"
			class:bg-green-500={$notification.type === 'success'}
			class:bg-red-500={$notification.type === 'error'}
			class:animate-bounce={$notification.type === 'success'}
		>
			{$notification.message}
		</div>
	</div>
{/if}

<form
	on:submit={handleSubmit}
	class="p-8 space-y-6 bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto"
>
	<div>
		<h2 class="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center gap-1">
			Feedback Baru
			<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
		</h2>
		<textarea
			id="feedback"
			name="feedback"
			bind:value={feedback}
			rows="4"
			placeholder="Tuliskan feedback Anda di sini..."
			class="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 outline-none transition"
		></textarea>
	</div>
	<!-- Lampiran/Screenshot -->
	<div>
		<label for="photo_feedback" class="block font-semibold mb-2">Lampiran/Screenshot</label>
		<input
			id="photo_feedback"
			type="file"
			multiple
			on:change={(e) => {
				photo_feedback = Array.from(e.target.files);
			}}
			accept=".png, .jpg, .jpeg, .gif, .image, .webp, .svg"
			class="w-full px-4 py-2 border rounded-lg"
		/>
	</div>
	<div>
		<h2 class="text-lg font-semibold text-gray-700 border-b pb-2">Rating Website (Opsional)</h2>
		<select
			id="rating"
			name="rating"
			bind:value={rating}
			class="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition"
		>
			<option value="1">1 😢 Sangat Buruk</option>
			<option value="2">2 😔 Buruk</option>
			<option value="3">3 😐 Cukup Baik</option>
			<option value="4">4 😊 Baik</option>
			<option value="5">5 😍 Sangat Baik</option>
		</select>
	</div>
	<div>
		<h2 class="text-lg font-semibold text-gray-700 border-b pb-2">
			Halaman/URL Terkait (Opsional)
		</h2>
		<input
			type="text"
			id="url"
			name="url"
			bind:value={url}
			class="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none transition"
			placeholder="Masukkan URL"
		/>
	</div>
	
	<button
		type="submit"
		class="mt-8 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
		disabled={isLoading}
	>
		{#if isLoading}
			Mengirim...
		{:else}
			Kirim Feedback
		{/if}
	</button>
</form>
