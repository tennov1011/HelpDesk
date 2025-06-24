<script>
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import axios from 'axios';
	export let tickets = [];
	export let isAdmin = false; // <-- tambahkan ini
	export let showNames = true;
	export let showDivisions = true;

	const dispatch = createEventDispatcher();

	let showDetailModal = false;
	let selectedTicket = null;
	let detailFields = [];
	let updatingStatusId = null;
	let selectedPic = '';
	let showTicketDetailModal = false;
	let ticketDetailText = '';
	let statusFilter = 'All';

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
	const statusOptions = ['Pending', 'On Progress', 'Done'];

	let showImageModal = false;
	let imageUrl = '';

	let currentPage = 1;
	const rowsPerPage = 6;

	$: filteredTickets =
		statusFilter === 'All'
			? tickets
			: tickets.filter((t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase());

	$: totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
	$: paginatedTickets = filteredTickets.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	function handleStatusFilter(e) {
		statusFilter = e.target.value;
		currentPage = 1; // reset ke halaman pertama saat filter berubah
	}

	function nextPage() {
		if (currentPage < totalPages) currentPage += 1;
	}
	function prevPage() {
		if (currentPage > 1) currentPage -= 1;
	}

	function getStatusColor(status) {
		if (!status) return 'bg-gray-300 text-gray-700';
		const s = status.toLowerCase();
		if (s === 'pending') return 'bg-gray-300 text-gray-700';
		if (s === 'on progress') return 'bg-yellow-200 text-yellow-800';
		if (s === 'done') return 'bg-green-200 text-green-800';
		return 'bg-gray-300 text-gray-700';
	}

	function openDetail(ticket) {
		// Proses detailFields seperti biasa
		let detailFieldsLocal = [];
		if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'sistem'
		) {
			detailFieldsLocal = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['jenis aplikasi', ticket.app_type],
				['URL/Nama Aplikasi', ticket.url_name_app],
				['browser', ticket.browser],
				['prioritas', ticket.priority],
				['detail', ticket.ticket],
				['PIC', ticket.pic]
			];
		} else if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'infrastruktur'
		) {
			detailFieldsLocal = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['perangkat', ticket.device],
				['label', ticket.label],
				['lokasi', ticket.location],
				['tipe masalah', ticket.problem_type],
				['prioritas', ticket.priority],
				['detail', ticket.ticket],
				['PIC', ticket.pic]
			];
		} else if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'lainnya'
		) {
			detailFieldsLocal = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['Judul', ticket.desc],
				['prioritas', ticket.priority],
				['detail', ticket.ticket],
				['PIC', ticket.pic]
			];
		} else {
			detailFieldsLocal = Object.entries(ticket).filter(([key]) => key !== 'photo_ticket');
		}
		dispatch('openDetailTicket', { ticket, detailFields: detailFieldsLocal });
	}
	function closeDetail() {
		showDetailModal = false;
		selectedTicket = null;
		detailFields = [];
	}

	async function updateStatus(ticket, newStatus) {
		updatingStatusId = ticket.id;
		try {
			// Update status tiket di Directus
			await axios.patch(
				`${DIRECTUS_URL}/items/TicketForm/${ticket.rawId}`,
				{ status: newStatus },
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);
			ticket.status = newStatus;
			dispatch('statusUpdated', { id: ticket.id, status: newStatus });

			// Hanya admin yang membuat notifikasi ke database
			if (isAdmin && ticket.email) {
				await axios.post(
					`${DIRECTUS_URL}/items/Notifications`,
					{
						email: ticket.email,
						ticket_id: ticket.id,
						category: ticket.category,
						date: new Date().toISOString(),
						status: newStatus,
						read: false
					},
					{
						headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
					}
				);
			}
		} catch (e) {
			alert('Gagal update status');
		} finally {
			updatingStatusId = null;
		}
	}

	function openImageModal(url) {
		dispatch('openImage', { url });
	}

	function closeImageModal() {
		showImageModal = false;
		imageUrl = '';
		window.removeEventListener('keydown', handleImageModalEsc);
	}

	function handleImageModalEsc(e) {
		if (e.key === 'Escape') {
			closeImageModal();
		}
	}

	// Esc handler for Detail modal
	function handleDetailModalEsc(e) {
		if (e.key === 'Escape') {
			closeDetail();
		}
	}

	// Tambahkan event listener saat modal detail dibuka
	$: if (showDetailModal) {
		window.addEventListener('keydown', handleDetailModalEsc);
	} else {
		window.removeEventListener('keydown', handleDetailModalEsc);
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d)) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	}
</script>

<div class="overflow-x-auto">
	<div class="flex justify-end mb-1">
		<select
			class="border-2 rounded px-3 py-1 text-sm focus:ring focus:ring-blue-200 text-black-700 font-semibold"
			bind:value={statusFilter}
			on:change={handleStatusFilter}
		>
			<option value="All">Filter</option>
			<option value="Pending">Pending</option>
			<option value="On Progress">On Progress</option>
			<option value="Done">Done</option>
		</select>
	</div>
	<table
		class="w-full table-auto border-separate border-spacing-y-1 bg-white rounded-xl shadow-lg text-center"
	>
		<thead>
			<tr class="bg-blue-100">
				<th class="p-2 rounded-l text-center">ID</th>
				{#if showNames}
					<th class="text-center">Nama</th>
				{/if}
				<th class="text-center">Lampiran</th>
				<th class="text-center">Status</th>
				<th class="rounded-r text-center">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#each paginatedTickets as ticket, i}
				<tr
					class="border-b hover:bg-blue-50 transition duration-200 animate-fade-in-up text-center"
					style="animation-delay: {i * 60 + 200}ms; height: 50px;"
				>
					<td class="p-2 font-semibold text-blue-700 text-center">{ticket.id}</td>
					{#if showNames}
						<td class="text-center">{ticket.name}</td>
					{/if}
					<td class="text-center">
						{#if ticket.photo_ticket}
							<div
								class="bg-blue-100 border border-blue-200 rounded w-max max-w-[120px] px-1 py-0.5 mx-auto font-semibold text-blue-700"
							>
								<button
									class="text-blue-600 text-s font-bold"
									on:click={() => openImageModal(`https://directus.eltamaprimaindo.com/assets/${ticket.photo_ticket}`)}
								>
									Lihat File
								</button>
							</div>
						{:else}
							<div
								class="bg-gray-100 border border-gray-300 rounded w-max max-w-[120px] px-1 py-0.5 text-gray-500 mx-auto text-s font-semibold"
							>
								Nothing
							</div>
						{/if}
					</td>
					<td class="text-center">
						<div
							class={`inline-flex items-center gap-2 px-2 py-1 rounded ${getStatusColor(ticket.status)}`}
						>
							{#if isAdmin}
								<select
									class="bg-transparent outline-none border-none text-s text-center font-semibold"
									bind:value={ticket.status}
									disabled={updatingStatusId === ticket.id}
									style="cursor: pointer"
									on:change={(e) => updateStatus(ticket, e.target.value)}
								>
									{#each statusOptions as opt}
										<option value={opt}>{opt}</option>
									{/each}
								</select>
							{:else}
								<span class="font-semibold text-s">{ticket.status}</span>
							{/if}
						</div>
					</td>
					<td class="text-center">
						<button
							class="text-blue-500 hover:underline font-bold transition"
							on:click={() => openDetail(ticket)}
						>
							Detail
						</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<div class="flex justify-center items-center gap-2 mt-4">
	<button
		class="px-3 py-1 text-blue-700 rounded hover:bg-blue-100 transition disabled:opacity-50 font-bold"
		on:click={prevPage}
		disabled={currentPage === 1}
		style="background: none; border: none;"
	>
		Previous
	</button>
	<span class="text-gray-700 font-semibold text-sm font-bold">
		Page {currentPage} of {totalPages}
	</span>
	<button
		class="px-3 py-1 text-blue-700 rounded hover:bg-blue-100 transition disabled:opacity-50 font-bold"
		on:click={nextPage}
		disabled={currentPage === totalPages}
		style="background: none; border: none;"
	>
		Next
	</button>
</div>


<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in-up {
		animation: fade-in-up 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
	}
	select.bg-transparent {
		background: transparent;
	}
	select:disabled {
		cursor: default !important;
		background: transparent;
		color: inherit;
	}
</style>
