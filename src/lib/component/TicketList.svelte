<script>
	import { createEventDispatcher } from 'svelte';
	import axios from 'axios';
	export let tickets = [];
	export let isAdmin = false; // <-- tambahkan ini
	export let showNames = true;
	export let showPriority = true;
	export let showDate = true;
	export let showDivisions = true;
	export let showDescription = true;
	export let showDepartments = false; // tambahkan prop baru
	export let ticketUpdates = [];

	const dispatch = createEventDispatcher();

	let showDetailModal = false;
	let selectedTicket = null;
	let detailFields = [];
	let updatingStatusId = null;
	let statusFilter = 'All';
	let departmentFilter = 'All';
	let isLoading = false;
	let selectedPic = '';

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	let showSuccess = false;

	let currentPage = 1;
	const rowsPerPage = 6;

	function handleStatusFilter(e) {
		statusFilter = e.target.value;
		currentPage = 1; // reset ke halaman pertama saat filter berubah
	}

	function handleDepartmentFilter(e) {
		departmentFilter = e.target.value;
		currentPage = 1;
	}

	$: filteredStatus =
		statusFilter === 'All'
			? tickets
			: tickets.filter((t) => (t.status || '').toLowerCase() === statusFilter.toLowerCase());

	$: filteredDepartment =
		departmentFilter === 'All'
			? filteredStatus
			: filteredStatus.filter((t) => t.target_department === departmentFilter);

	$: filteredTickets = filteredDepartment;

	$: totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
	$: paginatedTickets = filteredTickets.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

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
		if (s === 'rejected') return 'bg-red-200 text-red-800';
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
				['detail', ticket.ticket],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
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
				['detail', ticket.ticket],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
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
				['detail', ticket.ticket],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
				['PIC', ticket.pic]
			];
		} else {
			// Tampilkan semua field selain photo_ticket
			detailFields = Object.entries(ticket).filter(([key]) => key !== 'photo_ticket');
		}
		if (isAdmin) {
			dispatch('openDetail', { ticket, detailFields });
		} else {
			showDetailModal = true;
		}
	}
	function closeDetail() {
		showDetailModal = false;
		selectedTicket = null;
		detailFields = [];
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

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d)) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

	// Tambahkan state untuk modal update
	let showUpdateModal = false;
	let updateForm = {
		id: '',
		date: '',
		description: '',
		attachment: null,
		pic: '',
		status: 'Pending'
	};
	let updatingTicket = null;

	// Fungsi buka modal update
	function openUpdateModal(ticket) {
		updatingTicket = ticket;
		updateForm = {
			id: ticket.id,
			date: new Date().toISOString(),
			description: '',
			attachment: null,
			pic: ticket.pic || '',
			status: ticket.status || 'Pending'
		};
		tempStatus[ticket.id] = ticket.status || 'Pending';
		showUpdateModal = true;
		window.addEventListener('keydown', handleUpdateModalEsc);
	}

	function getStatusBtn(ticket) {
		return (tempStatus[ticket.id] || ticket.status || '').toLowerCase();
	}

	// Fungsi tutup modal update
	function closeUpdateModal() {
		showUpdateModal = false;
		if (updatingTicket) tempStatus[updatingTicket.id] = updatingTicket.status;
		updatingTicket = null;
		updateForm = {
			id: '',
			date: '',
			description: '',
			attachment: null,
			pic: '',
			status: 'Pending'
		};
		window.removeEventListener('keydown', handleUpdateModalEsc);
	}

	// Esc handler untuk modal update
	function handleUpdateModalEsc(e) {
		if (e.key === 'Escape') {
			closeUpdateModal();
		}
	}

	// Fungsi submit update
	async function submitUpdateStatus() {
		isLoading = true;
		if (!updateForm.description || !updateForm.status) {
			alert('Deskripsi dan status wajib diisi');
			isLoading = false;
			return;
		}
		updatingStatusId = updatingTicket.id;
		try {
			// Upload lampiran jika ada
			let attachmentId = null;
			if (updateForm.attachment) {
				const formData = new FormData();
				formData.append('file', updateForm.attachment);
				const res = await axios.post(`${DIRECTUS_URL}/files`, formData, {
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				});
				attachmentId = res.data.data.id;
			}

			// Update status tiket
			await axios.patch(
				`${DIRECTUS_URL}/items/TicketForm/${updatingTicket.rawId}`,
				{
					status: updateForm.status,
					pic: updateForm.pic
				},
				{ headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
			);

			// Tambahkan ke tabel update log (misal: TicketUpdates)
			await axios.post(
				`${DIRECTUS_URL}/items/TicketUpdate`,
				{
					ticket_id: updatingTicket.id,
					date: new Date().toISOString(),
					description: updateForm.description,
					attachment: attachmentId,
					pic: updateForm.pic,
					status: updateForm.status
				},
				{ headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
			);

			// Update data tiket lokal
			updatingTicket.status = updateForm.status;
			updatingTicket.pic = updateForm.pic;

			// Dispatch event ke parent agar parent update tickets
			dispatch('ticketUpdated', { updatedTicket: { ...updatingTicket } });

			// Notifikasi ke user
			if (isAdmin && updatingTicket.email) {
				await axios.post(
					`${DIRECTUS_URL}/items/Notifications`,
					{
						email: updatingTicket.email,
						ticket_id: updatingTicket.id,
						category: updatingTicket.category,
						date: new Date().toISOString(),
						status: updateForm.status,
						read: false
					},
					{ headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
				);
			}
			// Update warna button setelah submit sukses
			tempStatus[updatingTicket.id] = updateForm.status;
			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
			}, 1500);
			closeUpdateModal();
		} catch (e) {
			alert('Gagal update status');
			console.error('Error updating status:', e);
			isLoading = false;
		} finally {
			updatingStatusId = null;
			isLoading = false;
		}
	}

	let tempStatus = {};
</script>

<div class="overflow-x-auto">
	<div class="flex justify-end mb-1 gap-2">
		<!-- Filter Status -->
		<select
			class="border-2 rounded px-3 py-1 text-sm focus:ring focus:ring-blue-200 text-black-700 font-semibold"
			bind:value={statusFilter}
			on:change={handleStatusFilter}
		>
			<option value="All">Status</option>
			<option value="Pending">Pending</option>
			<option value="On Progress">On Progress</option>
			<option value="Done">Done</option>
			<option value="Rejected">Rejected</option>
		</select>

		<!-- Filter Department -->
		{#if !isAdmin}
			<select
				class="border-2 rounded px-3 py-1 text-sm focus:ring focus:ring-blue-200 text-black-700 font-semibold"
				bind:value={departmentFilter}
				on:change={handleDepartmentFilter}
			>
				<option value="All">Departemen</option>
				{#each Array.from(new Set(tickets.map((t) => t.target_department).filter(Boolean))) as dept}
					<option value={dept}>{dept}</option>
				{/each}
			</select>
		{/if}
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
				{#if showDescription}
					<th class="text-center">Deskripsi</th>
				{/if}
				{#if showPriority}
					<th class="text-center">Prioritas</th>
				{/if}
				{#if showDate}
					<th class="text-center">Tanggal</th>
				{/if}
				{#if showDepartments}
					<th class="text-center">Departemen</th>
				{/if}
				<th class="text-center">Status</th>
				{#if isAdmin}
					<th class="rounded-r text-center">Aksi</th>
				{:else}
					<th class="rounded-r text-center">Tiket / Update</th>
				{/if}
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
					{#if showDescription}
						<td class="text-center">{ticket.desc}</td>
					{/if}
					{#if showPriority}
						<td class="text-center">{ticket.priority}</td>
					{/if}
					{#if showDate}
						<td class="text-center">{formatDate(ticket.date)}</td>
					{/if}
					{#if showDepartments}
						<td class="text-center">{ticket.target_department}</td>
					{/if}
					<!-- Kolom Status -->
					<td class="text-center">
						{#if isAdmin}
							<button
								class={`px-2 py-1 rounded font-semibold transition 
              					${getStatusColor(tempStatus[ticket.id] || ticket.status)}
                				${['done', 'rejected'].includes(getStatusBtn(ticket)) ? ' cursor-default' : ' cursor-pointer'}`}
								on:click={() => openUpdateModal(ticket)}
								disabled={updatingStatusId === ticket.id ||
									['done', 'rejected'].includes(getStatusBtn(ticket))}
							>
								{#if getStatusBtn(ticket) === 'done'}
									Done
								{:else if getStatusBtn(ticket) === 'rejected'}
									Rejected
								{:else}
									Update
								{/if}
							</button>
						{:else}
							<span
								class={`inline-block px-3 py-1 rounded font-semibold text-s ${getStatusColor(ticket.status)}`}
							>
								{ticket.status}
							</span>
						{/if}
					</td>
					<!-- Kolom Aksi -->
					<td class="text-center">
						{#if isAdmin}
							<button
								class="text-blue-500 font-bold transition text-x mr-2 hover:underline"
								on:click={() => openDetail(ticket)}
							>
								Detail
							</button>
						{:else}
							<!-- Container untuk 3 item: Detail, Separator, Update -->
							<div class="flex items-center justify-center gap-2">
								<!-- Button Detail -->
								<button
									class="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-full"
									on:click={() => dispatch('detail', { ticket })}
									title="Lihat Detail"
									aria-label="Lihat Detail Tiket"
								>
									<svg
										class="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2.5"
									>
										<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2.5"></circle>
										<path
											d="m21 21-4.35-4.35"
											stroke="currentColor"
											stroke-width="3"
											stroke-linecap="round"
										></path>
									</svg>
								</button>

								<!-- Separator -->
								<span class="text-gray-400 text-sm">/</span>

								<!-- Button Detail Update -->
								<button
									class="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-full"
									on:click={() => {
										// Debug tipe dan nilai id
										console.log(
											'DEBUG ticket.rawId:',
											ticket.rawId,
											typeof ticket.rawId,
											'ticketUpdates:',
											ticketUpdates.map((u) => u.ticketId + ' (' + typeof u.ticketId + ')')
										);
										const updates = ticketUpdates.filter((u) => u.ticketId === ticket.id);
										dispatch('openUpdateDetail', { updates });
									}}
									title="Detail Update"
									aria-label="Lihat Detail Update Tiket"
								>
									<svg
										class="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</button>
							</div>
						{/if}
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

{#if showSuccess}
	<div class="fixed inset-0 flex items-center justify-center z-[999]">
		<div
			class="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center animate-fade-in-up border-2 border-green-400"
		>
			<svg
				class="h-16 w-16 text-green-500 mb-4 animate-bounce"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-20" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
			</svg>
			<div class="text-green-700 font-bold text-xl mb-2">Update Berhasil!</div>
			<div class="text-gray-600 text-base">Status tiket berhasil diperbarui.</div>
		</div>
	</div>
{/if}

{#if showUpdateModal}
	<!-- Modal Update Tiket -->
	<div class="fixed inset-0 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold">Update Tiket</h2>
				<button class="text-gray-500 hover:text-gray-700" on:click={closeUpdateModal}>
					&times;
				</button>
			</div>
			<div class="mb-4">
				<label for="update-date" class="block text-sm font-medium text-gray-700 mb-1">
					Tanggal
				</label>
				<input
					id="update-date"
					type="date"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.date}
				/>
			</div>
			<div class="mb-4">
				<label for="update-description" class="block text-sm font-medium text-gray-700 mb-1">
					Deskripsi
				</label>
				<textarea
					id="update-description"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.description}
				></textarea>
			</div>
			<div class="mb-4">
				<label for="update-attachment" class="block text-sm font-medium text-gray-700 mb-1">
					Lampiran
				</label>
				<input
					id="update-attachment"
					type="file"
					class="border rounded px-3 py-2 w-full text-sm"
					accept="image/*"
					on:change={(e) => (updateForm.attachment = e.target.files[0])}
				/>
			</div>
			<div class="mb-4">
				<label for="update-pic" class="block text-sm font-medium text-gray-700 mb-1"> PIC </label>
				<input
					id="update-pic"
					type="text"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.pic}
				/>
			</div>
			<div class="mb-4">
				<label for="update-status" class="block text-sm font-medium text-gray-700 mb-1">
					Status
				</label>
				<select
					id="update-status"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.status}
				>
					<option value="Pending">Pending</option>
					<option value="On Progress">On Progress</option>
					<option value="Done">Done</option>
					<option value="Rejected">Rejected</option>
				</select>
			</div>
			<div class="flex justify-end gap-2">
				<button
					class="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
					on:click={submitUpdateStatus}
					disabled={isLoading}
				>
					{#if isLoading}
						Mengirim...
					{:else}
						Simpan Perubahan
					{/if}
				</button>
				<button
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded shadow hover:bg-gray-400 transition"
					on:click={closeUpdateModal}
					disabled={isLoading}
				>
					Batal
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isLoading}
	<div
		class="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50 rounded-lg"
	>
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
		<span class="text-white text-lg font-semibold">Update...</span>
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
