<script>
	import { createEventDispatcher } from 'svelte';
	import axios from 'axios';
	export let tickets = [];
	export let isAdmin = false; // <-- tambahkan ini
	export let showNames = true;
	export let showPriority = true;
	export let showDate = true;
	export let showDivisions = true;
	export let showDepartments = false; // tambahkan prop baru
	export let ticketUpdates = [];

	const dispatch = createEventDispatcher();

	let showDetailModal = false;
	let selectedTicket = null;
	let detailFields = [];
	let updatingStatusId = null;
	let statusFilter = 'All';
	let isLoading = false;

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	let showImageModal = false;
	let imageUrl = '';
	let showSuccess = false;

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
		if (s === 'rejected') return 'bg-red-200 text-red-800';
		return 'bg-gray-300 text-gray-700';
	}
	function getStatusBtn(ticket) {
		return (tempStatus[ticket.id] || ticket.status || '').toLowerCase();
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
<<<<<<< Updated upstream
				['Detail Deskripsi', ticket.desc],
				['prioritas', ticket.priority],
=======
				['Judul Deskripsi', ticket.desc],
>>>>>>> Stashed changes
				['detail', ticket.ticket],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
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

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======

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

			updatingTicket.status = updateForm.status;
			updatingTicket.pic = updateForm.pic;
			dispatch('statusUpdated', { id: updatingTicket.id, status: updateForm.status });

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
			}, 1500); // animasi hilang setelah 2 detik
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

	let showUpdateDetailModal = false;
	let selectedTicketUpdates = [];

	// Tambahkan state/modal untuk gambar update tiket
	let showUpdateImageModal = false;
	let updateImageUrl = '';
	function openUpdateImageModal(url) {
		updateImageUrl = url;
		showUpdateImageModal = true;
		// Dispatch ke parent (dashboard user)
		dispatch('openUpdateImage', { url });
	}
	function closeUpdateImageModal() {
		showUpdateImageModal = false;
		updateImageUrl = '';
	}

	function openTicketUpdateDetail(ticketRawId) {
		// Bandingkan update.ticketId dengan ticketRawId (keduanya hasil mapping)
		selectedTicketUpdates = ticketUpdates.filter((u) => String(u.ticketId) === String(ticketRawId));
		showUpdateDetailModal = true;
		// Dispatch ke parent (dashboard user)
		dispatch('openUpdateDetail', { updates: selectedTicketUpdates });
	}

	function closeTicketUpdateDetail() {
		showUpdateDetailModal = false;
		selectedTicketUpdates = [];
	}

	let tempStatus = {};
>>>>>>> Stashed changes
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
			<option value="Rejected">Rejected</option>
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
<<<<<<< Updated upstream
				{#if showDivisions}
					<th class="text-center">Divisi</th>
				{/if}
				<th class="text-center">Tanggal</th>
				<th class="text-center">Kategori</th>
				<th class="text-center">Lampiran</th>
=======
				{#if showDepartments}
					<th class="text-center">Departemen</th>
				{/if}
				{#if showDivisions}
					<th class="text-center">Division</th>
				{/if}
				{#if showPriority}
					<th class="text-center">Prioritas</th>
				{/if}
				{#if showDate}
					<th class="text-center">Tanggal</th>
				{/if}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
					{#if showDivisions}
						<td class="text-center">{ticket.division}</td>
					{/if}
					<td class="text-center p-3">{ticket.date}</td>
					<td class="text-center">{ticket.category}</td>
=======
					{#if showDepartments}
						<td class="text-center">{ticket.target_department}</td>
					{/if}
					{#if showDivisions}
						<td class="text-center">{ticket.division}</td>
					{/if}
					{#if showPriority}
						<td class="text-center">{ticket.priority}</td>
					{/if}
					{#if showDate}
						<td class="text-center">{formatDate(ticket.date)}</td>
					{/if}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
								{#if getStatusBtn(ticket) === 'done'}
									Done
								{:else if getStatusBtn(ticket) === 'rejected'}
									Rejected
								{:else}
									Update
								{/if}
							</button>
>>>>>>> Stashed changes
						{:else}
							<span
								class={`inline-block px-3 py-1 rounded font-semibold text-s ${getStatusColor(ticket.status)}`}
							>
								{ticket.status}
							</span>
						{/if}
					</td>
					<td class="text-center">
						{#if isAdmin}
							<button
								class="text-blue-500 hover:underline font-bold transition"
								on:click={() => openDetail(ticket)}
							>
								Detail
							</button>
						{:else}
							<button
								class="text-blue-500 hover:underline font-bold transition"
								on:click={() => openTicketUpdateDetail(ticket.id)}
							>
								Detail
							</button>
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

<<<<<<< Updated upstream
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
=======
{#if showDetailModal}
	<!-- Modal Detail Tiket -->
	<div class="fixed inset-0 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-xl font-semibold">Detail Tiket</h2>
				<button class="text-gray-500 hover:text-gray-700" on:click={closeDetail}> &times; </button>
			</div>
			<div class="grid grid-cols-2 gap-4">
				{#each detailFields as [label, value]}
					<div>
						<span class="font-semibold">{label}:</span>
						{value}
					</div>
				{/each}
>>>>>>> Stashed changes
			</div>
		</div>
	</div>
{/if}
<<<<<<< Updated upstream
=======

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
				<label class="block text-sm font-medium text-gray-700 mb-1"> Tanggal </label>
				<input
					type="date"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.date}
				/>
			</div>
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1"> Deskripsi </label>
				<textarea
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.description}
				></textarea>
			</div>
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1"> Lampiran </label>
				<input
					type="file"
					class="border rounded px-3 py-2 w-full text-sm"
					accept="image/*"
					on:change={(e) => (updateForm.attachment = e.target.files[0])}
				/>
			</div>
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1"> PIC </label>
				<input
					type="text"
					class="border rounded px-3 py-2 w-full text-sm"
					bind:value={updateForm.pic}
				/>
			</div>
			<div class="mb-4">
				<label class="block text-sm font-medium text-gray-700 mb-1"> Status </label>
				<select class="border rounded px-3 py-2 w-full text-sm" bind:value={updateForm.status}>
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

{#if showUpdateDetailModal}
	<div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
		<div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 relative animate-fade-in-up">
			<button
				class="absolute top-4 right-6 text-2xl text-gray-400 hover:text-red-500 transition"
				on:click={closeTicketUpdateDetail}
				aria-label="Tutup"
			>
				&times;
			</button>
			<h2 class="text-xl font-extrabold mb-6 text-blue-700 text-center drop-shadow">
				Track Ticket
			</h2>
			{#if selectedTicketUpdates.length > 0}
				<ul class="space-y-6 max-h-96 overflow-y-auto pr-2">
					{#each [...selectedTicketUpdates].sort((a, b) => new Date(b.date) - new Date(a.date)) as update, idx}
						<li class="pb-4 border-b last:border-b-0">
							<div class="grid grid-cols-2 gap-x-4 gap-y-1">
								<div class="font-semibold text-blue-800">Tanggal</div>
								<div class="text-gray-700">{formatDate(update.date)}</div>
								<div class="font-semibold text-blue-800">Status</div>
								<div class="text-gray-700">{update.status}</div>
								<div class="font-semibold text-blue-800">PIC</div>
								<div class="text-gray-700">{update.pic}</div>
								<div class="font-semibold text-blue-800">Deskripsi</div>
								<div class="text-gray-700">{update.description}</div>
								{#if update.attachment}
									<div class="font-semibold text-blue-800">Lampiran</div>
									<div>
										<button
											class="text-blue-500 underline hover:text-blue-700 font-bold"
											on:click={() =>
												openUpdateImageModal(
													`https://directus.eltamaprimaindo.com/assets/${update.attachment}`
												)}
										>
											Lihat File
										</button>
									</div>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="text-center text-gray-500 text-base py-8">
					Tidak ada riwayat update untuk tiket ini.
				</div>
			{/if}
			<div class="flex justify-end mt-8">
				<button
					class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
					on:click={closeTicketUpdateDetail}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showUpdateImageModal}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[70vh]"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeUpdateImageModal}>&times;</button
			>
			<h3 class="text-lg font-bold mb-4 text-blue-700">Lampiran Update Tiket</h3>
			<img src={updateImageUrl} alt="Lampiran" class="max-h-[60vh] max-w-full rounded border" />
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
>>>>>>> Stashed changes

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
