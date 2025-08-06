<script>
	import { createEventDispatcher } from 'svelte';
	import axios from 'axios';

	const dispatch = createEventDispatcher();

	// Props dari parent component
	export let showRekapModal = false;

	// State variables
	let isLoading = false;
	let rekapData = {
		monthlyTotal: [],
		vehicleTotal: [],
		totalNominal: 0,
		totalKilometer: 0
	};

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	// Format currency function
	function formatCurrency(value) {
		if (!value) return '-';
		return 'Rp ' + parseFloat(value).toLocaleString('id-ID');
	}

	// Format kilometer function
	function formatKilometer(value) {
		if (!value) return '-';
		return parseInt(value).toLocaleString('id-ID');
	}

	// Format date function
	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	// Helper function to check if user is HRD or General Manager
	function isHrdOrGm() {
		if (typeof window !== 'undefined') {
			const userData = JSON.parse(localStorage.getItem('userData') || '{}');
			const userEmail = userData.email;
			const userDepartment = userData.department;

			console.log('Current user email:', userEmail); // Debug log
			console.log('Current user department:', userDepartment); // Debug log
			console.log('Full userData:', userData); // Debug log

			// Check by email first (more reliable)
			const hrdEmails = ['hrd@eltama.com', 'hrdex@eltama.com'];
			const gmEmails = ['general.manager@eltama.com'];

			const isHrdByEmail =
				userEmail && hrdEmails.some((email) => email.toLowerCase() === userEmail.toLowerCase());
			const isGmByEmail =
				userEmail && gmEmails.some((email) => email.toLowerCase() === userEmail.toLowerCase());

			// Also check by department as fallback
			const isHrdByDept = userDepartment && userDepartment.toUpperCase() === 'HRD';
			const isGmByDept =
				userDepartment &&
				(userDepartment.toUpperCase() === 'MANAGEMENT' ||
					userDepartment.toUpperCase() === 'GENERAL MANAGER' ||
					userDepartment.toUpperCase() === 'GM');

			const isHrd = isHrdByEmail || isHrdByDept;
			const isGm = isGmByEmail || isGmByDept;

			console.log('Is HRD (by email):', isHrdByEmail, 'Is HRD (by dept):', isHrdByDept); // Debug log
			console.log('Is GM (by email):', isGmByEmail, 'Is GM (by dept):', isGmByDept); // Debug log
			console.log('Final - Is HRD:', isHrd, 'Is GM:', isGm); // Debug log

			return isHrd || isGm;
		}
		return false;
	}

	// Function to open rekap modal
	export async function openRekapModal() {
		if (!isHrdOrGm()) {
			alert('Fitur ini hanya dapat diakses oleh HRD dan General Manager.');
			return;
		}

		isLoading = true;
		showRekapModal = true;

		try {
			// Fetch all BBM tickets
			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				},
				params: {
					filter: {
						category: { _eq: 'Pengajuan BBM' }
					},
					limit: -1, // Get all records
					sort: ['-date_created']
				}
			});

			if (response.data && response.data.data) {
				const bbmTickets = response.data.data;
				console.log('BBM tickets loaded:', bbmTickets);
				calculateRekapData(bbmTickets);
			}
		} catch (error) {
			console.error('Error fetching BBM data for rekap:', error);
			alert('Gagal mengambil data untuk rekapitulasi');
		} finally {
			isLoading = false;
		}
	}

	function calculateRekapData(bbmTickets) {
		// Calculate monthly totals
		const monthlyData = {};
		const vehicleData = {};
		let totalNominal = 0;
		let totalKilometer = 0;

		bbmTickets.forEach((ticket) => {
			const date = new Date(ticket.date_created || ticket.date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const monthName = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

			// Monthly totals
			if (!monthlyData[monthKey]) {
				monthlyData[monthKey] = {
					month: monthKey,
					monthName: monthName,
					count: 0,
					totalAmount: 0,
					totalKilometer: 0,
					tickets: []
				};
			}
			monthlyData[monthKey].count++;

			const nominal = parseFloat(ticket.submission_amount) || 0;
			const kilometer = parseFloat(ticket.initial_kilometer) || 0;
			monthlyData[monthKey].totalAmount += nominal;
			monthlyData[monthKey].totalKilometer += kilometer;
			monthlyData[monthKey].tickets.push(ticket);
			totalNominal += nominal;
			totalKilometer += kilometer;

			// Vehicle totals
			const vehicleInfo = ticket.vehicle_type || 'Tidak Diketahui';
			if (!vehicleData[vehicleInfo]) {
				vehicleData[vehicleInfo] = {
					vehicle: vehicleInfo,
					count: 0,
					totalAmount: 0,
					totalKilometer: 0
				};
			}
			vehicleData[vehicleInfo].count++;
			vehicleData[vehicleInfo].totalAmount += nominal;
			vehicleData[vehicleInfo].totalKilometer += kilometer;
		});

		// Convert to arrays and sort
		const monthlyTotal = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
		const vehicleTotal = Object.values(vehicleData).sort((a, b) => b.count - a.count);

		rekapData = {
			monthlyTotal,
			vehicleTotal,
			totalNominal,
			totalKilometer
		};
	}

	function closeRekapModal() {
		showRekapModal = false;
		rekapData = {
			monthlyTotal: [],
			vehicleTotal: [],
			totalNominal: 0,
			totalKilometer: 0
		};
		dispatch('close');
	}
</script>

<!-- Modal Rekapitulasi BBM (hanya untuk HRD dan General Manager) -->
{#if showRekapModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeRekapModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeRekapModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-8xl w-full mx-4 shadow-2xl max-h-[70vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="rekap-title"
		>
			<h3 id="rekap-title" class="text-2xl font-bold mb-6 text-gray-800 text-center">
				📊 Rekapitulasi Pengajuan BBM
			</h3>

			{#if isLoading}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Memuat data...</span>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<h4 class="font-semibold text-blue-800 mb-2">💰 Total Nominal Pengajuan</h4>
						<p class="text-2xl font-bold text-blue-600">{formatCurrency(rekapData.totalNominal)}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg border border-green-200">
						<h4 class="font-semibold text-green-800 mb-2">🛣️ Total Kilometer</h4>
						<p class="text-2xl font-bold text-green-600">
							{formatKilometer(rekapData.totalKilometer)} km
						</p>
					</div>
				</div>

				<!-- Monthly Summary -->
				<div class="mb-8">
					<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
						📅 Rekapitulasi Per Bulan
					</h4>
					{#if rekapData.monthlyTotal.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse border border-gray-300">
								<thead>
									<tr class="bg-gray-100">
										<th class="border border-gray-300 px-4 py-2 text-left">Bulan</th>
										<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Pengajuan</th>
										<th class="border border-gray-300 px-4 py-2 text-right">Total Nominal</th>
										<th class="border border-gray-300 px-4 py-2 text-right">Total Kilometer</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.monthlyTotal as month}
										<tr class="hover:bg-gray-50">
											<td class="border border-gray-300 px-4 py-2 font-medium">
												{month.monthName}
											</td>
											<td class="border border-gray-300 px-4 py-2 text-center">
												{month.count} pengajuan
											</td>
											<td class="border border-gray-300 px-4 py-2 text-right font-mono">
												{formatCurrency(month.totalAmount)}
											</td>
											<td class="border border-gray-300 px-4 py-2 text-right font-mono">
												{formatKilometer(month.totalKilometer)} km
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot>
									<tr class="bg-blue-100 font-bold">
										<td class="border border-gray-300 px-4 py-2">Total</td>
										<td class="border border-gray-300 px-4 py-2 text-center">
											{rekapData.monthlyTotal.reduce((sum, month) => sum + month.count, 0)} pengajuan
										</td>
										<td class="border border-gray-300 px-4 py-2 text-right font-mono">
											{formatCurrency(rekapData.totalNominal)}
										</td>
										<td class="border border-gray-300 px-4 py-2 text-right font-mono">
											{formatKilometer(rekapData.totalKilometer)} km
										</td>
									</tr>
								</tfoot>
							</table>
						</div>

						<!-- Detail pengajuan per bulan -->
						<div class="mt-6">
							<h5 class="text-md font-semibold mb-3 text-gray-700">
								📋 Detail Pengajuan Per Bulan
							</h5>
							{#each rekapData.monthlyTotal as month}
								<div class="mb-4 border border-gray-200 rounded-lg">
									<div class="bg-gray-50 px-4 py-2 rounded-t-lg border-b border-gray-200">
										<h6 class="font-semibold text-gray-800">
											{month.monthName} - {month.count} pengajuan ({formatCurrency(month.totalAmount)})
										</h6>
									</div>
									<div class="p-4">
										<div class="overflow-x-auto">
											<table class="w-full text-sm">
												<thead>
													<tr class="bg-gray-100">
														<th class="border border-gray-300 px-2 py-1 text-left">Tanggal</th>
														<th class="border border-gray-300 px-2 py-1 text-left">Nama</th>
														<th class="border border-gray-300 px-2 py-1 text-left">Kendaraan</th>
														<th class="border border-gray-300 px-2 py-1 text-left">Tujuan</th>
														<th class="border border-gray-300 px-2 py-1 text-right">Nominal</th>
														<th class="border border-gray-300 px-2 py-1 text-right">Kilometer</th>
														<th class="border border-gray-300 px-2 py-1 text-center">Status</th>
													</tr>
												</thead>
												<tbody>
													{#each month.tickets as ticket}
														<tr class="hover:bg-gray-50">
															<td class="border border-gray-300 px-2 py-1">
																{formatDate(ticket.date_created)}
															</td>
															<td class="border border-gray-300 px-2 py-1">
																{ticket.name}
															</td>
															<td class="border border-gray-300 px-2 py-1">
																{ticket.vehicle_type || '-'}
															</td>
															<td class="border border-gray-300 px-2 py-1">
																{ticket.destination || '-'}
															</td>
															<td class="border border-gray-300 px-2 py-1 text-right font-mono">
																{formatCurrency(ticket.submission_amount)}
															</td>
															<td class="border border-gray-300 px-2 py-1 text-right font-mono">
																{formatKilometer(ticket.initial_kilometer)} km
															</td>
															<td class="border border-gray-300 px-2 py-1 text-center">
																<span
																	class="px-2 py-1 rounded-full text-xs font-semibold"
																	class:bg-yellow-200={ticket.status?.toLowerCase() === 'pending'}
																	class:text-yellow-800={ticket.status?.toLowerCase() === 'pending'}
																	class:bg-blue-200={ticket.status?.toLowerCase() === 'on progress'}
																	class:text-blue-800={ticket.status?.toLowerCase() === 'on progress'}
																	class:bg-green-200={ticket.status?.toLowerCase() === 'done'}
																	class:text-green-800={ticket.status?.toLowerCase() === 'done'}
																	class:bg-red-200={ticket.status?.toLowerCase() === 'rejected'}
																	class:text-red-800={ticket.status?.toLowerCase() === 'rejected'}
																>
																	{ticket.status || 'Pending'}
																</span>
															</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 text-center py-4">Tidak ada data pengajuan BBM</p>
					{/if}
				</div>

				<!-- Vehicle Summary -->
				<div class="mb-8">
					<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
						🚗 Rekapitulasi Per Kendaraan
					</h4>
					{#if rekapData.vehicleTotal.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse border border-gray-300">
								<thead>
									<tr class="bg-gray-100">
										<th class="border border-gray-300 px-4 py-2 text-left">Kendaraan</th>
										<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Pengajuan</th>
										<th class="border border-gray-300 px-4 py-2 text-right">Total Nominal</th>
										<th class="border border-gray-300 px-4 py-2 text-right">Total Kilometer</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.vehicleTotal as vehicle}
										<tr class="hover:bg-gray-50">
											<td class="border border-gray-300 px-4 py-2 font-medium">
												{vehicle.vehicle}
											</td>
											<td class="border border-gray-300 px-4 py-2 text-center">
												{vehicle.count} kali
											</td>
											<td class="border border-gray-300 px-4 py-2 text-right font-mono">
												{formatCurrency(vehicle.totalAmount)}
											</td>
											<td class="border border-gray-300 px-4 py-2 text-right font-mono">
												{formatKilometer(vehicle.totalKilometer)} km
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-gray-500 text-center py-4">Tidak ada data kendaraan</p>
					{/if}
				</div>
			{/if}

			<div class="flex justify-end mt-6">
				<button
					type="button"
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
					on:click={closeRekapModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
