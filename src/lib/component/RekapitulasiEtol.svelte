<script>
	import { createEventDispatcher } from 'svelte';
	import axios from 'axios';

	const dispatch = createEventDispatcher();

	// Props dari parent component
	export let showRekapEtolModal = false;
	export let isHrdOrGm = false;

	// State variables
	let isLoading = false;
	let rekapData = {
		monthlyTotal: [],
		etolTotal: [],
		totalNominal: 0,
		totalTopUp: 0
	};

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	// Format currency function
	function formatCurrency(value) {
		if (!value) return '-';
		return 'Rp ' + parseFloat(value).toLocaleString('id-ID');
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

	// Function to open rekap modal
	export async function openRekapEtolModal() {
		if (!isHrdOrGm) {
			alert('Fitur ini hanya dapat diakses oleh HRD dan General Manager.');
			return;
		}

		isLoading = true;
		showRekapEtolModal = true;

		try {
			// Fetch all E-Tol tickets
			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: {
					Authorization: `Bearer ${DIRECTUS_TOKEN}`
				},
				params: {
					filter: {
						category: { _eq: 'Pengajuan E-Tol' }
					},
					limit: -1, // Get all records
					sort: ['-date_created']
				}
			});

			if (response.data && response.data.data) {
				const etolTickets = response.data.data;
				console.log('E-Tol tickets loaded:', etolTickets);
				calculateRekapData(etolTickets);
			}
		} catch (error) {
			console.error('Error fetching E-Tol data for rekap:', error);
			alert('Gagal mengambil data untuk rekapitulasi E-Tol');
		} finally {
			isLoading = false;
		}
	}

	function calculateRekapData(etolTickets) {
		// Calculate monthly totals
		const monthlyData = {};
		const etolData = {};
		let totalNominal = 0;
		let totalTopUp = 0;

		etolTickets.forEach((ticket) => {
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
					tickets: []
				};
			}
			monthlyData[monthKey].count++;

			const nominal = parseFloat(ticket.etol_submission_amount) || 0;
			monthlyData[monthKey].totalAmount += nominal;
			monthlyData[monthKey].tickets.push(ticket);
			totalNominal += nominal;
			totalTopUp += nominal;

			// E-Tol totals
			const etolNumber = ticket.no_etol || 'Tidak Diketahui';
			if (!etolData[etolNumber]) {
				etolData[etolNumber] = {
					etol: etolNumber,
					count: 0,
					totalAmount: 0
				};
			}
			etolData[etolNumber].count++;
			etolData[etolNumber].totalAmount += nominal;
		});

		// Convert to arrays and sort
		const monthlyTotal = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
		const etolTotal = Object.values(etolData).sort((a, b) => b.count - a.count);

		rekapData = {
			monthlyTotal,
			etolTotal,
			totalNominal,
			totalTopUp
		};
	}

	function closeRekapEtolModal() {
		showRekapEtolModal = false;
		rekapData = {
			monthlyTotal: [],
			etolTotal: [],
			totalNominal: 0,
			totalTopUp: 0
		};
		dispatch('close');
	}
</script>

<!-- Modal Rekapitulasi E-Tol (hanya untuk HRD dan General Manager) -->
{#if showRekapEtolModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeRekapEtolModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeRekapEtolModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-8xl w-full mx-4 shadow-2xl max-h-[70vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="rekap-etol-title"
		>
			<h3 id="rekap-etol-title" class="text-2xl font-bold mb-6 text-gray-800 text-center">
				🎫 Rekapitulasi Pengajuan E-Tol
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
						<h4 class="font-semibold text-green-800 mb-2">🎫 Total Top Up E-Tol</h4>
						<p class="text-2xl font-bold text-green-600">
							{formatCurrency(rekapData.totalTopUp)}
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
														<th class="border border-gray-300 px-2 py-1 text-left">No E-Tol</th>
														<th class="border border-gray-300 px-2 py-1 text-left">Tujuan</th>
														<th class="border border-gray-300 px-2 py-1 text-right">Nominal</th>
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
																{ticket.no_etol || '-'}
															</td>
															<td class="border border-gray-300 px-2 py-1">
																{ticket.etol_destination || ticket.destination || '-'}
															</td>
															<td class="border border-gray-300 px-2 py-1 text-right font-mono">
																{formatCurrency(ticket.etol_submission_amount)}
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
						<p class="text-gray-500 text-center py-4">Tidak ada data pengajuan E-Tol</p>
					{/if}
				</div>

				<!-- E-Tol Summary -->
				<div class="mb-8">
					<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
						🎫 Rekapitulasi Per No E-Tol
					</h4>
					{#if rekapData.etolTotal.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse border border-gray-300">
								<thead>
									<tr class="bg-gray-100">
										<th class="border border-gray-300 px-4 py-2 text-left">No E-Tol</th>
										<th class="border border-gray-300 px-4 py-2 text-center">Jumlah Pengajuan</th>
										<th class="border border-gray-300 px-4 py-2 text-right">Total Nominal</th>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.etolTotal as etol}
										<tr class="hover:bg-gray-50">
											<td class="border border-gray-300 px-4 py-2 font-medium">
												{etol.etol}
											</td>
											<td class="border border-gray-300 px-4 py-2 text-center">
												{etol.count} kali
											</td>
											<td class="border border-gray-300 px-4 py-2 text-right font-mono">
												{formatCurrency(etol.totalAmount)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="text-gray-500 text-center py-4">Tidak ada data E-Tol</p>
					{/if}
				</div>
			{/if}

			<div class="flex justify-end mt-6">
				<button
					type="button"
					class="px-4 py-2 bg-gray-500 text-gray-200 rounded-lg hover:bg-gray-400 transition"
					on:click={closeRekapEtolModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}
