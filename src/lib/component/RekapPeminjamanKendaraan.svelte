<script>
	import { onMount } from 'svelte';
	import axios from 'axios';
	import jsPDF from 'jspdf';

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	let showRekapPeminjamanModal = false;
	let isLoadingRekap = false;
	let selectedMonth = new Date().getMonth() + 1; // Current month (1-12)
	let selectedYear = new Date().getFullYear();
	let rekapData = [];
	let totalPeminjaman = 0;
	let availableYears = [];
	let statistikData = {
		kendaraanTerfavorit: {},
		peminjamTerbanyak: {},
		peminjamPerDivisi: {},
		peminjamPerHari: {}
	};

	// Generate available years from 2025 to 2050
	function generateAvailableYears() {
		availableYears = [];
		for (let year = 2025; year <= 2050; year++) {
			availableYears.push(year);
		}
	}

	// Internal function to check if user is HRD or General Manager
	function isHrdOrGm() {
		if (typeof window !== 'undefined') {
			try {
				const userData = JSON.parse(localStorage.getItem('userData') || '{}');
				console.log('RekapPeminjamanKendaraan - User data:', userData);
				
				const userEmail = userData.email?.toLowerCase();
				const userDepartment = userData.department?.toLowerCase();
				
				console.log('RekapPeminjamanKendaraan - Email validation for peminjaman kendaraan access:', userEmail);
				console.log('RekapPeminjamanKendaraan - Department validation for peminjaman kendaraan access:', userDepartment);
				
				const isValidUser = 
					['hrd@eltama.com', 'hrdex@eltama.com'].includes(userEmail) || 
					userDepartment === 'hrd' ||
					userDepartment === 'general manager';
				
				console.log('RekapPeminjamanKendaraan - Has access to peminjaman kendaraan recap:', isValidUser);
				return isValidUser;
			} catch (error) {
				console.error('RekapPeminjamanKendaraan - Error checking user permissions:', error);
				return false;
			}
		}
		return false;
	}

	// Public function to open modal (called from TicketList)
	export function openRekapPeminjamanModal() {
		if (!isHrdOrGm()) {
			alert('Akses ditolak. Hanya HRD dan General Manager yang dapat melihat rekapitulasi ini.');
			return;
		}
		
		// Set current month and year
		const now = new Date();
		selectedMonth = now.getMonth() + 1;
		selectedYear = now.getFullYear();
		
		console.log('Opening Rekap Peminjaman Modal for:', selectedMonth, '/', selectedYear);
		
		generateAvailableYears();
		showRekapPeminjamanModal = true;
		fetchRekapData();
	}

	async function fetchRekapData() {
		if (!selectedMonth || !selectedYear) return;

		isLoadingRekap = true;
		try {
			console.log(`Fetching rekap data for ${selectedMonth}/${selectedYear} using date_created field`);

			// Format month to 2 digits
			const monthStr = selectedMonth.toString().padStart(2, '0');

			// Create date range for the selected month
			const startDate = `${selectedYear}-${monthStr}-01`;
			const endDate = `${selectedYear}-${monthStr}-31`;

			// Use date_created as primary reference for vehicle loan timing
			const filter = {
				_and: [
					{ category: { _eq: 'Peminjaman Kendaraan' } },
					{ date_created: { _gte: startDate } },
					{ date_created: { _lte: endDate } }
				]
			};

			console.log('Filter being used (date_created based):', JSON.stringify(filter, null, 2));

			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
				params: {
					filter,
					sort: ['-date_created'],
					limit: 1000
				}
			});

			console.log('API Response:', response.data);

			if (response.data && response.data.data) {
				rekapData = response.data.data;
				totalPeminjaman = rekapData.length;
				calculateStatistik();
				console.log(`Found ${totalPeminjaman} peminjaman records for ${selectedMonth}/${selectedYear}`);
				console.log('Sample data:', rekapData.slice(0, 3)); // Debug: show first 3 records
			} else {
				rekapData = [];
				totalPeminjaman = 0;
				console.log('No data found in response');
			}
		} catch (error) {
			console.error('Error fetching rekap data:', error);
			alert('Gagal mengambil data rekapitulasi');
			rekapData = [];
			totalPeminjaman = 0;
		} finally {
			isLoadingRekap = false;
		}
	}

	function calculateStatistik() {
		// Reset statistik
		statistikData = {
			kendaraanTerfavorit: {},
			peminjamTerbanyak: {},
			peminjamPerDivisi: {},
			peminjamPerHari: {}
		};

		rekapData.forEach(item => {
			// Kendaraan terfavorit
			const kendaraan = item.vehicle_type || 'Tidak Diketahui';
			statistikData.kendaraanTerfavorit[kendaraan] = (statistikData.kendaraanTerfavorit[kendaraan] || 0) + 1;

			// Peminjam terbanyak
			const peminjam = item.name || 'Tidak Diketahui';
			statistikData.peminjamTerbanyak[peminjam] = (statistikData.peminjamTerbanyak[peminjam] || 0) + 1;

			// Peminjam per divisi
			const divisi = item.division || 'Tidak Diketahui';
			statistikData.peminjamPerDivisi[divisi] = (statistikData.peminjamPerDivisi[divisi] || 0) + 1;

			// Peminjaman per hari (using date_created)
			if (item.date_created) {
				const date = new Date(item.date_created);
				const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
				const dayName = dayNames[date.getDay()];
				statistikData.peminjamPerHari[dayName] = (statistikData.peminjamPerHari[dayName] || 0) + 1;
			}
		});
	}

	function formatDate(dateStr) {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '-';
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatDateWithDay(dateStr) {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '-';
		const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
		const dayName = dayNames[date.getDay()];
		return `${dayName}, ${formatDate(dateStr)}`;
	}

	function formatDateCreated(dateStr) {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '-';
		return date.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function closeRekapPeminjamanModal() {
		showRekapPeminjamanModal = false;
		rekapData = [];
		totalPeminjaman = 0;
		statistikData = {
			kendaraanTerfavorit: {},
			peminjamTerbanyak: {},
			peminjamPerDivisi: {},
			peminjamPerHari: {}
		};
	}

	async function handleMonthYearChange() {
		await fetchRekapData();
	}

	onMount(() => {
		generateAvailableYears();
	});
</script>

<!-- Modal Rekapitulasi Peminjaman Kendaraan -->
{#if showRekapPeminjamanModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeRekapPeminjamanModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeRekapPeminjamanModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-8xl w-full mx-4 shadow-2xl max-h-[70vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="rekap-peminjaman-title"
		>
			<h3 id="rekap-peminjaman-title" class="text-2xl font-bold mb-6 text-gray-800 text-center">
				� Rekapitulasi Peminjaman Kendaraan
			</h3>

			<!-- Filter Section -->
			<div class="mb-6 flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
				<div class="flex items-center gap-2">
					<label for="month-select" class="text-sm font-medium text-gray-700">Bulan:</label>
					<select
						id="month-select"
						bind:value={selectedMonth}
						on:change={handleMonthYearChange}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
						disabled={isLoadingRekap}
					>
						<option value={1}>Januari</option>
						<option value={2}>Februari</option>
						<option value={3}>Maret</option>
						<option value={4}>April</option>
						<option value={5}>Mei</option>
						<option value={6}>Juni</option>
						<option value={7}>Juli</option>
						<option value={8}>Agustus</option>
						<option value={9}>September</option>
						<option value={10}>Oktober</option>
						<option value={11}>November</option>
						<option value={12}>Desember</option>
					</select>
				</div>

				<div class="flex items-center gap-2">
					<label for="year-select" class="text-sm font-medium text-gray-700">Tahun:</label>
					<select
						id="year-select"
						bind:value={selectedYear}
						on:change={handleMonthYearChange}
						class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
						disabled={isLoadingRekap}
					>
						{#each availableYears as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>

				<div class="flex items-center gap-2 ml-auto">
					<span class="text-sm font-medium text-gray-700">Total: {totalPeminjaman} peminjaman</span>
				</div>
			</div>

			{#if isLoadingRekap}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Memuat data...</span>
				</div>
			{:else if totalPeminjaman === 0}
				<div class="text-center py-8">
					<p class="text-gray-500 text-lg">Tidak ada data peminjaman kendaraan untuk periode ini</p>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<h4 class="font-semibold text-blue-800 mb-2">🚗 Total Peminjaman</h4>
						<p class="text-2xl font-bold text-blue-600">{totalPeminjaman}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg border border-green-200">
						<h4 class="font-semibold text-green-800 mb-2">📅 Periode</h4>
						<p class="text-2xl font-bold text-green-600">
							{['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][selectedMonth]} {selectedYear}
						</p>
					</div>
				</div>

				<!-- Main Content Grid -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<!-- Data Table -->
					<div class="lg:col-span-2">
						<h4 class="text-lg font-semibold text-gray-800 mb-4">📅 Data Peminjaman</h4>
						<div class="overflow-x-auto bg-white border border-gray-200 rounded-lg">
							<table class="w-full table-auto">
								<thead class="bg-gray-100">
									<tr>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">No</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Tanggal</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Hari</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Peminjam</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Divisi</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Kendaraan</th>
										<th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Tujuan</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData as item, index}
										<tr class="border-b border-gray-100 hover:bg-gray-50">
											<td class="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
											<td class="px-4 py-3 text-sm text-gray-800">{formatDateCreated(item.date_created)}</td>
											<td class="px-4 py-3 text-sm text-gray-600">{formatDateWithDay(item.date_created).split(',')[0]}</td>
											<td class="px-4 py-3 text-sm text-gray-800 font-medium">{item.name || '-'}</td>
											<td class="px-4 py-3 text-sm text-gray-600">{item.division || '-'}</td>
											<td class="px-4 py-3 text-sm text-gray-800">{item.vehicle_type || '-'}</td>
											<td class="px-4 py-3 text-sm text-gray-600">{item.destination || item.purpose || '-'}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Statistics Panel -->
					<div class="space-y-6">
						<!-- Kendaraan Terfavorit -->
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h5 class="text-md font-semibold text-blue-800 mb-3">🚗 Kendaraan Terfavorit</h5>
							<div class="space-y-2">
								{#each Object.entries(statistikData.kendaraanTerfavorit).sort(([,a], [,b]) => b - a).slice(0, 5) as [kendaraan, count]}
									<div class="flex justify-between items-center">
										<span class="text-sm text-blue-700 truncate flex-1 mr-2">{kendaraan}</span>
										<span class="text-sm font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded">{count}x</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Peminjam Terbanyak -->
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<h5 class="text-md font-semibold text-green-800 mb-3">👤 Peminjam Terbanyak</h5>
							<div class="space-y-2">
								{#each Object.entries(statistikData.peminjamTerbanyak).sort(([,a], [,b]) => b - a).slice(0, 5) as [peminjam, count]}
									<div class="flex justify-between items-center">
										<span class="text-sm text-green-700 truncate flex-1 mr-2">{peminjam}</span>
										<span class="text-sm font-medium text-green-800 bg-green-100 px-2 py-1 rounded">{count}x</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Peminjam per Divisi -->
						<div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
							<h5 class="text-md font-semibold text-purple-800 mb-3">🏢 Per Divisi</h5>
							<div class="space-y-2">
								{#each Object.entries(statistikData.peminjamPerDivisi).sort(([,a], [,b]) => b - a) as [divisi, count]}
									<div class="flex justify-between items-center">
										<span class="text-sm text-purple-700 truncate flex-1 mr-2">{divisi}</span>
										<span class="text-sm font-medium text-purple-800 bg-purple-100 px-2 py-1 rounded">{count}x</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- Peminjaman per Hari -->
						<div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
							<h5 class="text-md font-semibold text-orange-800 mb-3">📅 Per Hari</h5>
							<div class="space-y-2">
								{#each Object.entries(statistikData.peminjamPerHari).sort(([,a], [,b]) => b - a) as [hari, count]}
									<div class="flex justify-between items-center">
										<span class="text-sm text-orange-700">{hari}</span>
										<span class="text-sm font-medium text-orange-800 bg-orange-100 px-2 py-1 rounded">{count}x</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Close Button -->
			<div class="text-center mt-6">
				<button
					type="button"
					class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
					on:click={closeRekapPeminjamanModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
