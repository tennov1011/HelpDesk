<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import axios from 'axios';
	import { writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	let photo_ticket = [];
	let followUp = 'no';
	let contactPhone = '';
	let ticket = '';
	let desc = '';
	let priority = '';
	let category = '';
	let target_department = '';

	// System fields
	let app_type = '';
	let url_name_app = '';
	let browser = '';

	// Infrastructure fields
	let device = '';
	let label = '';
	let location = '';
	
	// Permission to Leave fields
	let departure_time = '';
	let estimated_return_time = '';
	
	export let employee = null;

	const departmentOptions = [
		'IT',
		'HRD',
		'Finance',
		'Marketing',
		'Procurement',
		'Produksi',
		'Inventory',
		'Management',
		'Project',
		'Maintenance'
	];
	const appTypeOptions = ['ERP', 'Web App', 'Mobile App', 'Lainnya'];
	const deviceTypeOptions = [
		// Perangkat Kantor / Indoor - Manufacturing & Office
		'PC',
		'Laptop',
		'Printer',
		'Scanner',
		'Monitor',
		'UPS',
		'Server',
		'Router',
		'Switch',
		'Access Point',
		'IP Camera',
		'Proyektor',
		'AC',
		'Smartphone',
		'Tablet',

		// Alat IT & Jaringan
		'Firewall',
		'NAS Storage',
		'Modem',
		'Network Printer',
		'Barcode Scanner',
		'RFID Reader',

		// Peralatan Lapangan - Contractor Cat & Surface Preparation
		'Sandblasting Machine',
		'Paint Sprayer',
		'Pressure Washer',
		'Grinder',
		'Air Compressor',
		'Moisture Meter',
		'Coating Thickness Gauge',
		'Thermometer',
		'Hygrometer',
		'Surface Profile Comparator',
		'Dew Point Meter',
		'Portable Power Generator',
		'LED Work Light',
		'Safety Helmet with Camera',
		'Gas Detector',
		'Infrared Thermometer',
		'Ultrasonic Cleaner',
		'Welding Machine',
		'Epoxy Mixing Machine',
		'Curing Lamp',

		// IoT Devices & Monitoring Tools
		'Environmental Sensor',
		'GPS Tracker',
		'Telematics Device',
		'Temperature Logger',
		'Vibration Sensor',
		'Asset Tracker',
		'Smart Safety Vest',
		'Drone',
		'Mobile Data Terminal (MDT)'
	];
	const priorityOptions = ['Rendah', 'Sedang', 'Tinggi', 'Darurat'];

	const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
	const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

	function getDirectusUrl(path) {
		if (!DIRECTUS_URL || !DIRECTUS_URL === 'undefined') {
			throw new Error('Directus URL belum diatur di .env');
		}
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

	let isLoading = false;

	const handleSubmit = async (event) => {
		event.preventDefault();
		isLoading = true;
		if (!priority) {
			priority = 'Rendah';
		}
		let photo_ticketIds = null;
		if (photo_ticket && photo_ticket.length > 0) {
			const formData = new FormData();
			formData.append('file', photo_ticket[0]);
			try {
				const uploadRes = await axios.post(getDirectusUrl('/files'), formData, {
					headers: {
						Authorization: `Bearer ${DIRECTUS_TOKEN}`,
						'Content-Type': 'multipart/form-data'
					}
				});
				photo_ticketIds = uploadRes.data.data.id;
			} catch (err) {
				alert('Gagal upload file lampiran');
				console.error(err);
				isLoading = false;
				return;
			}
		}
		const data = {
			name: employee?.nama_karyawan || '',
			email: employee?.email_company || '',
			division: employee?.divisi || '',
			target_department: target_department,
			contactPhone,
			category,
			photo_ticket: photo_ticketIds,
			ticket,
			desc,
			device,
			url_name_app,
			priority,
			browser,
			label,
			location,
			departure_time,
			estimated_return_time,
			app_type,
			date_created: new Date().toISOString()
		};

		console.log('Data yang akan dikirim:', data);
		if (!data.category) {
			showNotification('error', 'Kategori harus diisi');
			isLoading = false;
			return;
		}
		if (!data.target_department) {
			showNotification('error', 'Pilih Departemen harus diisi');
			isLoading = false;
			return;
		}

		// Handle time fields for "Izin Keluar" category
		if (data.category === 'Izin Keluar') {
			// Validate required time fields
			if (!data.departure_time) {
				showNotification('error', 'Jam Keluar harus diisi');
				isLoading = false;
				return;
			}
			if (!data.estimated_return_time) {
				showNotification('error', 'Jam Estimasi Kembali harus diisi');
				isLoading = false;
				return;
			}
			
			// Convert time strings to timestamp format for database
			const today = new Date().toISOString().split('T')[0];
			data.departure_time = `${today}T${data.departure_time}:00.000Z`;
			data.estimated_return_time = `${today}T${data.estimated_return_time}:00.000Z`;
		} else {
			// Remove time fields for other categories
			delete data.departure_time;
			delete data.estimated_return_time;
		}

		try {
			await axios.post(getDirectusUrl('/items/TicketForm'), data, {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				}
			});
			showNotification('success', 'Tiket Anda telah terkirim. Terima kasih!');
			// Reset form jika perlu
			target_department = '';
			ticket = '';
			desc = '';
			priority = '';
			category = '';
			app_type = '';
			url_name_app = '';
			browser = '';
			device = '';
			label = '';
			location = '';
			departure_time = '';
			estimated_return_time = '';
			contactPhone = '';
			photo_ticket = [];
			setTimeout(() => {
				dispatch('submitted');
			}, 1000);
		} catch (error) {
			showNotification('error', 'Gagal mengirim tiket');
			console.error(error.response?.data || error);
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

	let showProblemDropdown = false;

	function handleClickOutside(event) {
		if (showProblemDropdown && !event.target.closest('.problem-dropdown-container')) {
			showProblemDropdown = false;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('mousedown', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

{#if $notification.show}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
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
			<span class="text-white text-lg font-semibold">Mengirim ticket...</span>
		</div>
	</div>
{/if}

<div class="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
	<div
		class="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]"
	>
		<button
			on:click={handleClose}
			aria-label="Tutup"
			class="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-2xl font-bold z-50 focus:outline-none"
			>&times;</button
		>
		<form on:submit={handleSubmit} class="flex flex-col gap-4 w-full">
			<!-- Dropdown Main Category -->
			<div>
				<label class="block font-semibold mb-2 flex items-center gap-1">
					Kategori
					<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
				</label>
				<select bind:value={category} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Kategori</option>
					<option value="Sistem">Sistem</option>
					<option value="Asset">Asset</option>
					<option value="Izin Keluar">Izin Keluar</option>
					<option value="Lainnya">Lainnya</option>
				</select>
			</div>

			{#if category === 'Sistem'}
				<!-- System Inputs -->
				<div class="flex flex-col gap-4">
					<div>
						<label class="flex items-center gap-1">
							Jenis Aplikasi
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<select bind:value={app_type} class="w-full px-4 py-2 border rounded-lg">
							<option value="" disabled>Pilih Jenis Aplikasi</option>
							{#each appTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="flex items-center gap-1">
							Nama Aplikasi/URL
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<input
							type="text"
							bind:value={url_name_app}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Contoh: Odoo, SAP, Absensi Mobile"
						/>
					</div>
					<div>
						<label>Browser/Perangkat yang Digunakan</label>
						<input
							type="text"
							bind:value={browser}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Contoh: Chrome, Android 11"
						/>
					</div>
				</div>
			{:else if category === 'Asset'}
				<!-- Infrastructure Inputs -->
				<div class="flex flex-col gap-4">
					<div>
						<label class="flex items-center gap-1">
							Jenis Perangkat
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<select bind:value={device} class="w-full px-4 py-2 border rounded-lg">
							<option value="" disabled>Pilih Jenis Perangkat</option>
							{#each deviceTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label>Nomor/Label Aset (Jika ada ditambahkan)</label>
						<input
							type="text"
							bind:value={label}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Jika perangkat memiliki kode aset"
						/>
					</div>
					<div>
						<label class="flex items-center gap-1">
							Lokasi Perangkat
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<input
							type="text"
							bind:value={location}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Contoh: Kantor Pusat Lantai 2, Gudang A"
						/>
					</div>
				</div>
			{:else if category === 'Izin Keluar'}
				<!-- Permission to Leave Inputs -->
				<div class="flex flex-col gap-4">
					<div>
						<label class="flex items-center gap-1">
							Jam Keluar
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<input
							type="time"
							bind:value={departure_time}
							class="w-full px-4 py-2 border rounded-lg"
						/>
					</div>
					<div>
						<label class="flex items-center gap-1">
							Jam Estimasi Kembali
							<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
						</label>
						<input
							type="time"
							bind:value={estimated_return_time}
							class="w-full px-4 py-2 border rounded-lg"
						/>
					</div>
				</div>
			{/if}
			<div>
				<label class="flex items-center gap-1">
					{#if category === 'Izin Keluar'}
						Keperluan Izin
					{:else}
						Judul Deskripsi
					{/if}
					<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
				</label>
				<input
					type="text"
					class="w-full px-4 py-2 border rounded-lg"
					placeholder={category === 'Izin Keluar' ? 'Tuliskan keperluan izin Anda' : 'Tuliskan kategori lain'}
					bind:value={desc}
				/>
			</div>
			<div>
				<label class="flex items-center gap-1">
					Departemen Tujuan
					<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
				</label>
				<select bind:value={target_department} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Departemen Tujuan</option>
					{#each departmentOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Priority General -->
			<div>
				<label class="flex items-center gap-1">
					Prioritas
					<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
				</label>
				<select bind:value={priority} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Prioritas</option>
					{#each priorityOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Ticket Detail General -->
			<div>
				<label class="flex items-center gap-1">
					{#if category === 'Izin Keluar'}
						Detail Keperluan
					{:else}
						Detail Masalah
					{/if}
					<span class="text-red-500 text-xl" title="Field wajib diisi">*</span>
				</label>
				<textarea
					bind:value={ticket}
					class="w-full px-4 py-2 border rounded-lg"
					placeholder={category === 'Izin Keluar' ? 'Jelaskan detail keperluan izin Anda' : 'Jelaskan detail masalah yang Anda alami'}
				></textarea>
			</div>
			<!-- Attachment/Screenshot -->
			<div>
				<label>Lampiran/Screenshot (Opsional)</label>
				<input
					type="file"
					multiple
					on:change={(e) => {
						photo_ticket = Array.from(e.target.files);
					}}
					accept=".png, .jpg, .jpeg, .gif, .image, .webp, .svg"
					class="w-full px-4 py-2 border rounded-lg"
				/>
			</div>
			<!-- Follow Up -->
			<div>
				<label>Apakah Anda ingin follow up? (Opsional)</label>
				<div class="flex gap-4 mt-1">
					<label><input type="radio" bind:group={followUp} value="yes" /> Ya</label>
					<label><input type="radio" bind:group={followUp} value="no" /> Tidak</label>
				</div>
				{#if followUp === 'yes'}
					<input
						type="text"
						bind:value={contactPhone}
						class="w-full mt-2 px-4 py-2 border rounded-lg"
						placeholder="Masukkan nomor telepon: +62"
					/>
				{/if}
			</div>
			<!-- Submit Button -->
			<button
				type="submit"
				class="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
			>
				{#if isLoading}
					Mengirim...
				{:else}
					Kirim Tiket
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	@media (max-width: 639px) {
		.max-w-sm {
			max-width: 98vw;
		}
		.p-4,
		.sm\:p-6 {
			padding: 1rem !important;
		}
	}
	@media (min-width: 640px) and (max-width: 767px) {
		.max-w-md {
			max-width: 95vw;
		}
	}
	@media (min-width: 768px) and (max-width: 1023px) {
		.max-w-lg {
			max-width: 90vw;
		}
	}
	@media (min-width: 1024px) and (max-width: 1279px) {
		.max-w-2xl {
			max-width: 80vw;
		}
	}
	@media (min-width: 1280px) and (max-width: 1535px) {
		.max-w-3xl {
			max-width: 70vw;
		}
	}
	@media (min-width: 1536px) {
		.max-w-4xl {
			max-width: 60vw;
		}
	}
</style>
