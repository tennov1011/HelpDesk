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
	let problem_type = '';
	let date_created = new Date().toISOString();
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
		'Project'
	];
	const appTypeOptions = ['ERP', 'Web App', 'Mobile App', 'Lainnya'];
	const deviceTypeOptions = ['PC', 'Printer', 'Scanner', 'Jaringan', 'Switch', 'Lainnya'];
	const problemTypeOptions = [
		'Komputer Tidak menyala',
		'Perangkat rusak fisik',
		'Wifi Putus jaringan',
		'Kabel bawah meja terlalu kusut atau tertarik',
		'Stop kontak rusak atau tidak mengalirkan listrik',
		'AC mati atau tidak dingin menyebabkan overheat perangkat',
		'Ruang server berdebu dan ventilasi buruk',
		'Kipas pendingin server atau komputer tidak berputar',
		'Tiupan angin kencang merobohkan tiang antena atau kabel',
		'Kabel terkubur longsor atau terkena alat berat',
		'Kotak panel atau enclosure terkena air hujan / banjir',
		'Vandalisme: kabel dicuri, bracket dilepas, atau perangkat dirusak',
		'Panel surya atau sensor lapangan tertutup debu atau lumpur',
		'Lainnya'
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
			problem_type,
			app_type,
			date_created
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
		if (!ticket || ticket.trim() === '') {
			showNotification('error', 'Detail Masalah harus diisi');
			isLoading = false;
			return;
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
			problem_type = [];
			contactPhone = '';
			photo_ticket = [];
			date_created = new Date().toISOString();
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
				<label class="block font-semibold mb-2">Kategori</label>
				<select bind:value={category} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Kategori</option>
					<option value="Sistem">Sistem</option>
					<option value="Infrastruktur">Infrastruktur</option>
					<option value="Lainnya">Lainnya</option>
				</select>
			</div>

			{#if category === 'Sistem'}
				<!-- System Inputs -->
				<div class="flex flex-col gap-4">
					<div>
						<label>Jenis Aplikasi</label>
						<select bind:value={app_type} class="w-full px-4 py-2 border rounded-lg">
							<option value="" disabled>Pilih Jenis Aplikasi</option>
							{#each appTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label>Nama Aplikasi/URL</label>
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
			{:else if category === 'Infrastruktur'}
				<!-- Infrastructure Inputs -->
				<div class="flex flex-col gap-4">
					<div>
						<label>Jenis Perangkat</label>
						<select bind:value={device} class="w-full px-4 py-2 border rounded-lg">
							<option value="" disabled>Pilih Jenis Perangkat</option>
							{#each deviceTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label>Nomor/Label Aset (jika ada)</label>
						<input
							type="text"
							bind:value={label}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Jika perangkat memiliki kode aset"
						/>
					</div>
					<div>
						<label>Lokasi Perangkat</label>
						<input
							type="text"
							bind:value={location}
							class="w-full px-4 py-2 border rounded-lg"
							placeholder="Contoh: Kantor Pusat Lantai 2, Gudang A"
						/>
					</div>
					<div>
						<label>Tipe Masalah Fisik</label>
						<!-- Dropdown multi-select dengan checkbox -->
						<div class="relative problem-dropdown-container">
							<button
								type="button"
								class="w-full px-4 py-2 border rounded-lg text-left bg-white"
								on:click={() => (showProblemDropdown = !showProblemDropdown)}
							>
								{problem_type.length > 0 ? problem_type.join(', ') : 'Pilih Tipe Masalah Fisik'}
								<span class="float-right">{showProblemDropdown ? '▲' : '▼'}</span>
							</button>
							{#if showProblemDropdown}
								<div
									class="absolute z-50 bg-white border rounded-lg shadow-lg mt-1 w-full max-h-60 overflow-y-auto"
								>
									{#each problemTypeOptions as opt}
										<label class="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer">
											<input
												type="checkbox"
												value={opt}
												checked={problem_type.includes(opt)}
												on:change={() => {
													if (problem_type.includes(opt)) {
														problem_type = problem_type.filter((x) => x !== opt);
													} else {
														problem_type = [...problem_type, opt];
													}
												}}
											/>
											<span class="ml-2">{opt}</span>
										</label>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{:else if category === 'Lainnya'}
				<div>
					<label>Judul Deskripsi</label>
					<input
						type="text"
						class="w-full px-4 py-2 border rounded-lg"
						placeholder="Tuliskan kategori lain"
						bind:value={desc}
					/>
				</div>
			{/if}
			<div>
				<label class="block font-semibold mb-2">Pilih Departemen</label>
				<select bind:value={target_department} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Departemen</option>
					{#each departmentOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Priority General -->
			<div>
				<label>Prioritas</label>
				<select bind:value={priority} class="w-full px-4 py-2 border rounded-lg">
					<option value="" disabled>Pilih Prioritas</option>
					{#each priorityOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Ticket Detail General -->
			<div>
				<label>Detail Masalah</label>
				<textarea
					bind:value={ticket}
					class="w-full px-4 py-2 border rounded-lg"
					placeholder="Jelaskan detail masalah yang Anda alami"
				></textarea>
			</div>
			<!-- Attachment/Screenshot -->
			<div>
				<label>Lampiran/Screenshot</label>
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
				<label>Apakah Anda ingin follow up?</label>
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
