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
	
	// Vehicle Borrowing field
	let vehicle_type = '';
	
	// Permission to Leave fields
	let departure_time = '';
	let estimated_return_time = '';
	
	// Fuel Submission fields
	let initial_fuel = '';
	let initial_kilometer = '';
	let submission_amount = '';
	let destination = '';
	
	export let employee = null;

	// Vehicles data from Directus
	let vehicles = [];
	let isLoadingVehicles = false;

	const departmentOptions = [
		'IT',
		'HRD',
		'Finance',
		'Marketing',
		'Digital Marketing',
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
		'Kamera',
		'Penghitung',
		'Televisi',
		'Telepon',
		'Fax',
		'Smart TV',
		'Speaker',
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
	// Legacy vehicle options as fallback
	const legacyVehicleTypeOptions = [
		'Mobil MUX B 1104 KJF',
		'Mobil Avanza B 2566 KVG',
		'Mobil Xenia F 1540 NE',
		'Mobil Luxio F 1227 FE',
		'Mobil Mazda B 9080 KUD',
		'TruckBox F 8817 MB',
		'Mobil Mitsubishi L300 F 8725 MB',
		'Truck Double F 8156 MC',
		'Motor'
	];
	const priorityOptions = ['Rendah', 'Sedang', 'Tinggi', 'Darurat'];

	const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL;
	const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN;

	function getDirectusUrl(path) {
		if (!DIRECTUS_URL || DIRECTUS_URL === 'undefined') {
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

	// Fetch vehicles from Directus
	async function fetchVehicles() {
		isLoadingVehicles = true;
		try {
			const res = await axios.get(getDirectusUrl('/items/Kendaraan'), {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				}
			});
			vehicles = res.data.data || [];
			console.log('Loaded vehicles:', vehicles);
		} catch (error) {
			console.error('Error fetching vehicles:', error);
			// Fallback to legacy options if API fails
			vehicles = legacyVehicleTypeOptions.map(name => ({
				nama: name,
				jenis: 'Legacy',
				plat_nomor: '',
				status: 'Tersedia'
			}));
		} finally {
			isLoadingVehicles = false;
		}
	}

	// Format vehicle option text
	function formatVehicleOption(vehicle) {
		return `${vehicle.jenis} ${vehicle.nama} ${vehicle.plat_nomor}`;
	}

	// Format vehicle status for display
	function formatVehicleStatus(vehicle) {
		return vehicle.status;
	}

	// Check if vehicle is available
	function isVehicleAvailable(vehicle) {
		return vehicle.status !== 'Service' && vehicle.status !== 'Rusak' && vehicle.status !== 'Dipinjam';
	}

	// Fungsi untuk mendapatkan status kendaraan
	function getVehicleStatus(vehicleOption) {
		const vehicle = vehicles.find(v => 
			formatVehicleOption(v) === vehicleOption
		);
		return vehicle ? vehicle.status : '';
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
			vehicle_type,
			url_name_app,
			priority,
			browser,
			label,
			location,
			departure_time,
			estimated_return_time,
			initial_fuel,
			initial_kilometer,
			submission_amount,
			destination,
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

		// Handle fuel submission fields for "Pengajuan BBM" category
		if (data.category === 'Pengajuan BBM') {
			// Validate required fuel submission fields
			if (!data.vehicle_type) {
				showNotification('error', 'Jenis Kendaraan harus diisi');
				isLoading = false;
				return;
			}
			if (!data.initial_fuel) {
				showNotification('error', 'Jumlah Awal Bensin harus diisi');
				isLoading = false;
				return;
			}
			if (!data.initial_kilometer) {
				showNotification('error', 'Kilometer Awal harus diisi');
				isLoading = false;
				return;
			}
			if (!data.submission_amount) {
				showNotification('error', 'Nominal Pengajuan harus diisi');
				isLoading = false;
				return;
			}
			if (!data.destination) {
				showNotification('error', 'Tujuan harus diisi');
				isLoading = false;
				return;
			}
		} else {
			// Remove fuel submission fields for other categories
			delete data.initial_fuel;
			delete data.initial_kilometer;
			delete data.submission_amount;
			delete data.destination;
		}

		if (data.category === 'Peminjaman Kendaraan' && !vehicle_type) {
			showNotification('error', 'Jenis Kendaraan harus diisi');
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
			vehicle_type = '';
			departure_time = '';
			estimated_return_time = '';
			initial_fuel = '';
			initial_kilometer = '';
			submission_amount = '';
			destination = '';
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
		
		// Fetch vehicles when component mounts
		if (category === 'Peminjaman Kendaraan' || category === 'Pengajuan BBM' || category === '') {
			fetchVehicles();
		}
	});

	// Watch category changes to fetch vehicles when needed
	$: if ((category === 'Peminjaman Kendaraan' || category === 'Pengajuan BBM') && vehicles.length === 0) {
		fetchVehicles();
	}

	// Watch category changes to set target_department for vehicle and fuel categories
	$: if (category === 'Peminjaman Kendaraan' || category === 'Pengajuan BBM') {
		target_department = 'HRD';
	}

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

{#if $notification.show}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
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
			<span class="text-white text-sm sm:text-lg font-semibold">Mengirim ticket...</span>
		</div>
	</div>
{/if}

<div class="">
	<div
		class="w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-2xl relative overflow-y-auto max-h-[95vh] sm:max-h-[90vh]"
	>
		<button
			on:click={handleClose}
			aria-label="Tutup"
			class="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-500 text-lg sm:text-2xl font-bold z-50 focus:outline-none w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center bg-white rounded-full shadow-sm"
			>&times;</button
		>
		<form on:submit={handleSubmit} class="flex flex-col gap-2 sm:gap-4 w-full mt-6 sm:mt-0">
			<!-- Dropdown Main Category -->
			<div>
				<label class="block font-medium mb-0 text-xs sm:text-base flex items-center gap-0.5" for="category-select">
					Kategori
					<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
				</label>
				<select id="category-select" bind:value={category} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
					<option value="" disabled>Pilih Kategori</option>
					<option value="Sistem">Sistem</option>
					<option value="Asset">Asset</option>
					<option value="Izin Keluar">Izin Keluar</option>
					<option value="Peminjaman Kendaraan">Peminjaman Kendaraan</option>
					<option value="Pengajuan BBM">Pengajuan BBM</option>
					<option value="Lainnya">Lainnya</option>
				</select>
			</div>

			{#if category === 'Sistem'}
				<!-- System Inputs -->
				<div class="flex flex-col gap-2 sm:gap-4">
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="app-type-select">
							Jenis Aplikasi
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<select id="app-type-select" bind:value={app_type} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
							<option value="" disabled>Pilih Jenis Aplikasi</option>
							{#each appTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="url-app-input">
							Nama Aplikasi/URL
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="url-app-input"
							type="text"
							bind:value={url_name_app}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: Odoo, SAP, Absensi Mobile"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium" for="browser-input">Browser/Perangkat yang Digunakan</label>
						<input
							id="browser-input"
							type="text"
							bind:value={browser}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: Chrome, Android 11"
						/>
					</div>
				</div>
			{:else if category === 'Asset'}
				<!-- Infrastructure Inputs -->
				<div class="flex flex-col gap-2 sm:gap-4">
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="device-select">
							Jenis Perangkat
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<select id="device-select" bind:value={device} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
							<option value="" disabled>Pilih Jenis Perangkat</option>
							{#each deviceTypeOptions as opt}
								<option value={opt}>{opt}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium" for="label-input">Nomor/Label Aset (Jika ada ditambahkan)</label>
						<input
							id="label-input"
							type="text"
							bind:value={label}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Jika perangkat memiliki kode aset"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="location-input">
							Lokasi Perangkat
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="location-input"
							type="text"
							bind:value={location}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: Kantor Pusat Lantai 2, Gudang A"
						/>
					</div>
				</div>
			{:else if category === 'Peminjaman Kendaraan'}
				<!-- Vehicle Borrowing Inputs -->
				<div class="flex flex-col gap-2 sm:gap-4">
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="vehicle-type-select">
							Jenis Kendaraan
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<select id="vehicle-type-select" bind:value={vehicle_type} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
							<option value="" disabled>
								{isLoadingVehicles ? 'Memuat data kendaraan...' : 'Pilih Jenis Kendaraan'}
							</option>
							
							{#if vehicles.length > 0}
								{#each vehicles as vehicle}
									<option 
										value={formatVehicleOption(vehicle)} 
										disabled={!isVehicleAvailable(vehicle)}
									>
										{formatVehicleOption(vehicle)} - {formatVehicleStatus(vehicle)}
									</option>
								{/each}
							{/if}
						</select>
						
						{#if vehicles.some(v => !isVehicleAvailable(v))}
							<p class="text-xs text-gray-500 mt-1">
								Kendaraan dengan status Service, Rusak, atau Dipinjam tidak dapat dipilih.
							</p>
						{/if}
					</div>
				</div>
			{:else if category === 'Izin Keluar'}
				<!-- Permission to Leave Inputs -->
				<div class="flex flex-col gap-2 sm:gap-4">
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="departure-time">
							Jam Keluar
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="departure-time"
							type="time"
							bind:value={departure_time}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="return-time">
							Jam Estimasi Kembali
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="return-time"
							type="time"
							bind:value={estimated_return_time}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
						/>
					</div>
				</div>
			{:else if category === 'Pengajuan BBM'}
				<!-- Fuel Submission Inputs -->
				<div class="flex flex-col gap-2 sm:gap-4">
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="vehicle-type-fuel-select">
							Jenis Kendaraan
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<select id="vehicle-type-fuel-select" bind:value={vehicle_type} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
							<option value="" disabled>
								{isLoadingVehicles ? 'Memuat data kendaraan...' : 'Pilih Jenis Kendaraan'}
							</option>
							
							{#if vehicles.length > 0}
								{#each vehicles as vehicle}
									<option value={formatVehicleOption(vehicle)}>
										{formatVehicleOption(vehicle)}
									</option>
								{/each}
							{/if}
						</select>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="initial-fuel">
							Jumlah Awal Bensin (Liter)
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="initial-fuel"
							type="string"
							step="0.1"
							min="0"
							bind:value={initial_fuel}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: 2 Strip"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="initial-kilometer">
							Kilometer Awal
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="initial-kilometer"
							type="number"
							min="0"
							bind:value={initial_kilometer}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: 120000"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="submission-amount">
							Nominal Pengajuan (Rp)
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="submission-amount"
							type="number"
							min="0"
							bind:value={submission_amount}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: 500000"
						/>
					</div>
					<div>
						<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="destination">
							Tujuan
							<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
						</label>
						<input
							id="destination"
							type="text"
							bind:value={destination}
							class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Contoh: PT. Trix Indonesia"
						/>
					</div>
				</div>
			{/if}
			<div>
				<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="desc-input">
					{#if category === 'Izin Keluar'}
						Keperluan Izin
					{:else if category === 'Pengajuan BBM'}
						Keterangan Pengajuan
					{:else}
						Judul Deskripsi
					{/if}
					<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
				</label>
				<input
					id="desc-input"
					type="text"
					class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
					placeholder={category === 'Izin Keluar' ? 'Tuliskan keperluan izin Anda' : category === 'Pengajuan BBM' ? 'Tuliskan keterangan pengajuan BBM' : 'Tuliskan kategori lain'}
					bind:value={desc}
				/>
			</div>
			<div>
				<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="department-select">
					Departemen Tujuan
					<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
				</label>
				<select id="department-select" bind:value={target_department} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
					<option value="" disabled>Pilih Departemen Tujuan</option>
					{#each departmentOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Priority General -->
			<div>
				<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="priority-select">
					Prioritas
					<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
				</label>
				<select id="priority-select" bind:value={priority} class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base">
					<option value="" disabled>Pilih Prioritas</option>
					{#each priorityOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
			<!-- Ticket Detail General -->
			<div>
				<label class="text-xs sm:text-base font-medium flex items-center gap-0.5" for="ticket-textarea">
					{#if category === 'Izin Keluar'}
						Detail Keperluan
					{:else if category === 'Pengajuan BBM'}
						Detail Pengajuan
					{:else}
						Detail Masalah
					{/if}
					<span class="text-red-500 text-xs" title="Field wajib diisi">*</span>
				</label>
				<textarea
					id="ticket-textarea"
					bind:value={ticket}
					rows="2"
					class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base resize-none"
					placeholder={category === 'Izin Keluar' ? 'Jelaskan detail keperluan izin Anda' : category === 'Pengajuan BBM' ? 'Jelaskan detail pengajuan BBM Anda' : 'Jelaskan detail masalah yang Anda alami'}
				></textarea>
			</div>
			<!-- Attachment/Screenshot -->
			<div>
				<label class="text-xs sm:text-base font-medium" for="file-input">Lampiran/Screenshot (Opsional)</label>
				<input
					id="file-input"
					type="file"
					multiple
					on:change={(e) => {
						// @ts-ignore
						if (e.target && e.target.files) {
							// @ts-ignore
							photo_ticket = Array.from(e.target.files);
						}
					}}
					accept=".png, .jpg, .jpeg, .gif, .image, .webp, .svg"
					class="w-full px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base file:mr-1 file:py-0.5 file:px-1 file:rounded file:border-0 file:text-xs file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
				/>
			</div>
			<!-- Follow Up -->
			<div>
				<fieldset>
					<legend class="text-xs sm:text-base font-medium">Apakah Anda ingin follow up? (Opsional)</legend>
					<div class="flex gap-2 sm:gap-3 mt-0.5">
						<label class="text-xs sm:text-base"><input type="radio" bind:group={followUp} value="yes" /> Ya</label>
						<label class="text-xs sm:text-base"><input type="radio" bind:group={followUp} value="no" /> Tidak</label>
					</div>
					{#if followUp === 'yes'}
						<input
							type="text"
							bind:value={contactPhone}
							class="w-full mt-0.5 sm:mt-1 px-2 py-1 sm:px-4 sm:py-2 border rounded text-xs sm:text-base"
							placeholder="Masukkan nomor telepon: +62"
						/>
					{/if}
				</fieldset>
			</div>
			<!-- Submit Button -->
			<button
				type="submit"
				class="mt-2 sm:mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 sm:py-3 rounded font-medium text-xs sm:text-base shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
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
