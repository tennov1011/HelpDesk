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
		selectedTicket = ticket;
		selectedPic = ticket.pic || '';
		// Tentukan field detail berdasarkan kategori
		if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'sistem'
		) {
			detailFields = [
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
			detailFields = [
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
			detailFields = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['Detail Deskripsi', ticket.desc],
				['prioritas', ticket.priority],
				['detail', ticket.ticket],
				['PIC', ticket.pic]
			];
		} else {
			// Tampilkan semua field selain photo_ticket
			detailFields = Object.entries(ticket).filter(([key]) => key !== 'photo_ticket');
		}
		showDetailModal = true;
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

			// Kirim notifikasi ke user
			await axios.post(
				`${DIRECTUS_URL}/items/Notifications`,
				{
					email: ticket.email,
					title: 'Status Tiket Diupdate',
					message: `Status tiket Anda telah diubah menjadi ${newStatus}`,
					read: 0,
					date: new Date().toISOString()
				},
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);
		} catch (e) {
			alert('Gagal update status');
		} finally {
			updatingStatusId = null;
		}
	}

	async function updatePic() {
		if (!selectedTicket) return;
		try {
			await axios.patch(
				`${DIRECTUS_URL}/items/TicketForm/${selectedTicket.rawId}`,
				{ pic: selectedPic },
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);
			selectedTicket.pic = selectedPic;
			alert('PIC berhasil di-assign');
			closeDetail();
		} catch (e) {
			alert('Gagal assign PIC');
		}
	}

	async function deleteTicket() {
		if (!selectedTicket) return;
		if (!confirm('Yakin ingin menghapus tiket ini?')) return;
		try {
			await axios.delete(`${DIRECTUS_URL}/items/TicketForm/${selectedTicket.rawId}`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
			});
			alert('Ticket berhasil dihapus');
			dispatch('deleted');
			closeDetail();
		} catch (e) {
			alert('Gagal menghapus tiket');
		}
	}

	function openImageModal(url) {
		imageUrl = url;
		showImageModal = true;
		window.addEventListener('keydown', handleImageModalEsc);
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
				{#if showDivisions}
					<th class="text-center">Divisi</th>
				{/if}
				<th class="text-center">Tanggal</th>
				<th class="text-center">Kategori</th>
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
					{#if showDivisions}
						<td class="text-center">{ticket.division}</td>
					{/if}
					<td class="text-center p-3">{ticket.date}</td>
					<td class="text-center">{ticket.category}</td>
					<td class="text-center">
						{#if ticket.photo_ticket}
							<div
								class="bg-blue-100 border border-blue-200 rounded w-max max-w-[120px] px-1 py-0.5 mx-auto font-semibold text-blue-700"
							>
								<button
									type="button"
									class="text-blue-600 text-s font-bold"
									on:click={() =>
										openImageModal(
											`https://directus.eltamaprimaindo.com/assets/${ticket.photo_ticket}`
										)}
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

{#if showDetailModal && selectedTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 rounded-2xl shadow-2xl p-8 max-w-xl w-full h-[40vh] overflow-y-auto relative animate-fade-in-up"
		>
			<button
				class="absolute top-3 right-5 text-2xl text-gray-400 hover:text-red-500 transition"
				on:click={closeDetail}>&times;</button
			>
			<h2 class="text-xl font-extrabold mb-6 text-blue-700 drop-shadow">Detail Tiket</h2>
			<table class="w-full text-left mb-4 border-separate border-spacing-y-1">
				<tbody class="space-y-2">
					{#each detailFields as [key, value], idx}
						<tr class={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
							<td class="font-semibold pr-4 py-2 capitalize text-blue-900 w-1/3"
								>{key.replace(/_/g, ' ')}</td
							>
							<td class="py-2 text-gray-700 break-words">
								{#if key.toLowerCase() === 'detail'}
									<button
										class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-xs font-bold"
										type="button"
										on:click={() => {
											ticketDetailText = value;
											showTicketDetailModal = true;
										}}
									>
										Lihat Detail
									</button>
								{:else if Array.isArray(value)}
									{value.join(', ')}
								{:else}
									{value}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if isAdmin}
				<div class="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
					<label class="block text-sm font-semibold text-blue-700 mb-2">Assign PIC:</label>
					<input
						type="text"
						class="block w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
						bind:value={selectedPic}
						placeholder="Masukkan nama PIC"
					/>
					<div class="flex gap-2 mt-4">
						<button
							class="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold shadow"
							on:click={updatePic}
						>
							Assign PIC
						</button>
						<button
							class="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition font-semibold shadow"
							on:click={deleteTicket}
						>
							Hapus Tiket
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showImageModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
		<div class="bg-white rounded-lg shadow-xl fixed inset-0 z-50 flex items-center justify-center">
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeImageModal}>&times;</button
			>
			<img src={imageUrl} alt="Lampiran" class="max-w-[80vw] max-h-[80vh] rounded shadow" />
		</div>
	</div>
{/if}

{#if showTicketDetailModal}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full h-[40vh] relative flex flex-col items-center overflow-y-auto animate-fade-in-up"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={() => {
					showTicketDetailModal = false;
					ticketDetailText = '';
				}}>&times;</button
			>
			<h3 class="text-lg font-bold mb-4 text-blue-700">Detail Informasi Tiket</h3>
			<div
				class="overflow-y-scroll max-w-3xl w-full max-h-[50vh] border rounded p-4 bg-blue-50 text-gray-800 whitespace-pre-line"
			>
				{ticketDetailText}
			</div>
		</div>
	</div>
{/if}

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
