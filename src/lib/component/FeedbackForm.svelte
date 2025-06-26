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

	const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
	const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

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

	// Perubahan utama: handleSubmit upload file ke Directus
	const handleSubmit = async (event) => {
		event.preventDefault();
		isLoading = true;
		let photo_feedback_id = null;
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
				alert('Gagal upload file lampiran');
				console.error(err);
				isLoading = false;
				return;
			}
		}
		const data = {
			name: employee?.nama_karyawan || '',
			division: employee?.divisi || '',
			email: employee?.email_company || '',
			feedback,
			rating,
			url,
			photo_feedback: photo_feedback_id
		};

		console.log('Payload yang dikirim:', data); // Tambahkan baris ini

		try {
			await axios.post(getDirectusUrl('/items/FeedbackForm'), data, {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				}
			});
			showNotification('success', 'Feedback Anda telah terkirim. Terima kasih!');
			feedback = '';
			rating = '1';
			url = '';
			photo_feedback = [];
			// Tambahkan redirect ke dashboard setelah submit sukses
			setTimeout(() => {
				dispatch('submitted');
			}, 1000); // beri jeda agar notifikasi sempat tampil
		} catch (error) {
			showNotification('error', 'Gagal mengirim feedback');
			console.error('Directus error:', error.response?.data || error);
			alert(JSON.stringify(error.response?.data || error));
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
		<h2 class="text-lg font-semibold text-gray-700 border-b pb-2">Feedback Baru</h2>
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
		<label class="block font-semibold mb-2">Lampiran/Screenshot</label>
		<input
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
