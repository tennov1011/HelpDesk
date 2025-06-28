<script>
	import TicketList from '$lib/component/TicketList.svelte';
	import FeedbackList from '$lib/component/FeedbackList.svelte';
	import TicketingForm from '$lib/component/TicketingForm.svelte';
	import FeedbackForm from '$lib/component/FeedbackForm.svelte';
	import Notification from '$lib/component/Notification.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated, userRole, userEmail } from '$lib/services/firebaseConfig';
	import axios from 'axios';
	import { fetchEmployees } from '$lib/services/employee.js';

	let tickets = [];
	let feedbacks = [];
	let employees = [];
	let ticketUpdates = [];
	let selectedTicket = null;
	let showTicketModal = false;
	let showFeedbackModal = false;
	let showDetailModal = false;
	let authReady = false;
	let roleReady = false;
	let currentRole = undefined;
	let isLoggedIn = false;
	let showNotifDropdown = false; // Tambahkan ini
	let notifDropdownEl;

	export let myEmployee;

	// Fetch semua data tiket dari API Directus
	async function fetchTickets() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/TicketForm', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			// Sort sebelum mapping agar data terbaru di urutan pertama
			tickets = res.data.data
				.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
				.map((t) => ({
					id: `TK${t.id}`,
					rawId: t.id,
					date: t.date_created,
					name: t.name,
					email: t.email,
					division: t.division,
					contactPhone: t.contactPhone,
					category: t.category,
					desc: t.desc,
					photo_ticket: t.photo_ticket,
					ticket: t.ticket,
					device: t.device,
					url_name_app: t.url_name_app,
					priority: t.priority,
					browser: t.browser,
					label: t.label,
					location: t.location,
					problem_type: t.problem_type,
					app_type: t.app_type,
					status: t.status,
					target_department: t.target_department
				}));
		} catch (e) {
			console.error('Gagal mengambil tiket:', e);
		}
	}

	// Fetch semua data feedback dari API Directus
	async function fetchFeedback() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/FeedbackForm', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			feedbacks = res.data.data
				.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
				.map((fb, idx) => ({
					id: `F${String(fb.id).padStart(3, '0')}`,
					rawId: fb.id, // Tambahkan rawId untuk referensi
					date: fb.date_created ? fb.date_created.slice(0, 10) : '',
					text: fb.feedback,
					division: fb.division,
					name: fb.name,
					email: fb.email,
					file: fb.photo_feedback || '',
					photo_feedback: fb.photo_feedback,
					status: fb.status
				}));
		} catch (e) {
			console.error('Gagal mengambil feedback:', e);
		}
	}

	// Fetch semua data update tiket dari API Directus
	async function fetchTicketUpdates() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/TicketUpdate', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			ticketUpdates = res.data.data;
			ticketUpdates = ticketUpdates.map((update) => {
				console.log('DEBUG TicketUpdate:', {
					id: `TU00${update.id}`,
					rawId: update.id,
					ticketId: update.ticket_id,
					type_id: typeof update.id,
					type_ticketId: typeof update.ticket_id
				});
				return {
					id: `TU00${update.id}`,
					rawId: update.id,
					ticketId: update.ticket_id,
					date: update.date,
					status: update.status,
					pic: update.pic,
					description: update.description,
					attachment: update.attachment || ''
				};
			});
		} catch (e) {
			console.error('Gagal mengambil TicketUpdates:', e);
		}
	}

	// Format tanggal ke format Indonesia
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

	// Buka modal form feedback baru
	function openFeedbackModal() {
		showFeedbackModal = true;
	}
	// Tutup modal form feedback
	function closeFeedbackModal() {
		showFeedbackModal = false;
	}
	// Buka modal form tiket baru
	function openTicketModal() {
		showTicketModal = true;
	}
	// Tutup modal form tiket
	function closeTicketModal() {
		showTicketModal = false;
		selectedTicket = null; // Reset selected ticket
	}
	// Buka modal detail tiket
	function openDetailModal(ticket) {
		selectedTicket = ticket;
		showDetailModal = true;
	}
	// Tutup modal detail tiket
	function closeDetailModal() {
		showDetailModal = false;
		selectedTicket = null;
	}

	// Modal untuk detail feedback
	let showImageModalFeedback = false;
	let imageUrlFeedback = '';
	// Handler untuk buka modal gambar feedback
	function handleOpenImageFeedback(e) {
		imageUrlFeedback = e.detail.url;
		showImageModalFeedback = true;
	}
	// Tutup modal gambar feedback
	function closeImageFeedback() {
		showImageModalFeedback = false;
		imageUrlFeedback = '';
	}

	// Modal untuk detail feedback
	let showDetailModalFeedback = false;
	let detailTextFeedback = '';
	// Handler untuk buka modal detail text feedback
	function handleOpenDetailFeedback(e) {
		detailTextFeedback = e.detail.text;
		showDetailModalFeedback = true;
	}
	// Tutup modal detail text feedback
	function closeDetailModalFeedback() {
		showDetailModalFeedback = false;
		detailTextFeedback = '';
	}

	// Tambahkan state/modal untuk update detail dan image
	let showUpdateDetailModal = false;
	let selectedTicketUpdates = [];
	let showUpdateImageModal = false;
	let updateImageUrl = '';

	// Handler untuk buka modal riwayat update tiket
	function handleOpenUpdateDetail(e) {
		console.log('openUpdateDetail event:', e.detail);
		selectedTicketUpdates = e.detail.updates;
		showUpdateDetailModal = true;
	}
	// Tutup modal riwayat update tiket
	function closeTicketUpdateDetail() {
		showUpdateDetailModal = false;
		selectedTicketUpdates = [];
	}
	// Handler untuk buka modal gambar lampiran update
	function handleOpenUpdateImage(e) {
		updateImageUrl = e.detail.url;
		showUpdateImageModal = true;
	}
	// Tutup modal gambar lampiran update
	function closeUpdateImageModal() {
		showUpdateImageModal = false;
		updateImageUrl = '';
	}

	// Handler setelah tiket berhasil di-submit
	function handleTicketSubmitted() {
		closeTicketModal();
		fetchTickets(); // refresh data tiket
	}
	// Handler setelah feedback berhasil di-submit
	function handleFeedbackSubmitted() {
		closeFeedbackModal();
		fetchFeedback(); // refresh data feedback
	}

	let unsubAuth, unsubRole;

	// Setup Firebase authentication listeners
	onMount(() => {
		unsubAuth = isAuthenticated.subscribe((auth) => {
			if (auth === undefined) return;
			authReady = true;
			isLoggedIn = !!auth;
			if (!auth) goto('/login');
		});
		unsubRole = userRole.subscribe((role) => {
			if (role === undefined) return;
			roleReady = true;
			currentRole = role;
			if (role !== 'user') goto('/login');
			// fetch data hanya jika sudah siap dan role benar
			if (authReady && roleReady && isLoggedIn && currentRole === 'user') {
				fetchTickets();
				fetchFeedback();
				fetchTicketUpdates(); // Tambahkan ini
				fetchEmployees().then((data) => {
					// Tambahkan ini
					employees = data || [];
				});
			}
		});
	});
	// Cleanup Firebase subscriptions
	onDestroy(() => {
		if (unsubAuth) unsubAuth();
		if (unsubRole) unsubRole();
	});

	// Handler untuk menutup dropdown notifikasi ketika klik di luar
	function handleClickOutside(event) {
		if (showNotifDropdown && notifDropdownEl && !notifDropdownEl.contains(event.target)) {
			showNotifDropdown = false;
		}
	}
	// Setup event listener untuk click outside
	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	// Reactive: Cari data karyawan yang cocok dengan email user
	$: myEmployee = employees.find(
		(e) =>
			e.email_company && e.email_company.trim().toLowerCase() === $userEmail?.trim().toLowerCase()
	);
	// Reactive: Filter tiket yang dibuat oleh user yang sedang login
	$: userTickets = myEmployee
		? tickets.filter(
				(t) => t.email?.trim().toLowerCase() === myEmployee.email_company?.trim().toLowerCase()
			)
		: [];
	// Reactive: Filter feedback yang dibuat oleh user yang sedang login
	$: userFeedbacks = myEmployee
		? feedbacks.filter(
				(fb) => fb.email?.trim().toLowerCase() === myEmployee.email_company?.trim().toLowerCase()
			)
		: [];
</script>

<svelte:head>
	<title>Dashboard User</title>
	<meta
		name="description"
		content="Dashboard untuk User dengan fleksibilitas membuat form ticket atau feedback baru."
	/>
</svelte:head>
<!-- Conditional: Loading state saat autentikasi atau role checking belum selesai -->
{#if !authReady || !roleReady}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">Loading...</div>
<!-- Conditional: Loading state saat data karyawan belum tersedia -->
{:else if !myEmployee}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">
		Memuat data karyawan...
	</div>
{:else}
	<div class="p-4 max-w-6xl mx-auto animate-fade-in">
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-xl font-bold drop-shadow text-blue-800">
				Halo {myEmployee.nama_karyawan}, what is your needs ?
			</h1>
		</div>

		<!-- Quick Actions -->
		<div class="flex items-center gap-4 mb-6">
			<div class="flex justify-center">
				<Notification
					userEmail={myEmployee.email_company}
					token="JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz"
				/>
			</div>
			<!-- Tombol Feedback & Tiket Baru -->
			<div class="grid grid-cols-2 gap-4 flex-1">
				<button
					on:click={openFeedbackModal}
					class="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl text-center shadow-lg w-full font-semibold transition transform hover:scale-105 animate-fade-in-up"
					>Feedback Baru</button
				>
				<button
					on:click={openTicketModal}
					class="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl text-center shadow-lg w-full font-semibold transition transform hover:scale-105 animate-fade-in-up"
					>Tiket Baru</button
				>
			</div>
		</div>

		<!-- Tiket Saya -->
		<div class="bg-white p-4 rounded-xl shadow-lg mb-6 animate-fade-in-up">
			<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">Tiket Saya</h2>
			<!-- Conditional: Empty state jika belum ada tiket -->
			{#if userTickets.length === 0}
				<div class="text-center text-gray-500 py-8">Belum ada tiket yang dibuat.</div>
			{:else}
				<TicketList
					tickets={userTickets}
					isAdmin={false}
					showActions={true}
					showNames={false}
					showDivisions={false}
					showPriority={false}
					showDate={false}
					showDepartments={true}
					showDescription={true}
					{ticketUpdates}
					on:detail={(e) => openDetailModal(e.detail.ticket)}
					on:openUpdateDetail={handleOpenUpdateDetail}
					on:openUpdateImage={handleOpenUpdateImage}
				/>
			{/if}
		</div>

		<!-- Feedback Saya -->
		<div class="bg-white p-4 rounded-xl shadow-lg mb-6 animate-fade-in-up">
			<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">Feedback Saya</h2>
			<!-- Conditional: Empty state jika belum ada feedback -->
			{#if userFeedbacks.length === 0}
				<div class="text-center text-gray-500 py-8">Belum ada feedback.</div>
			{:else}
				<FeedbackList
					feedbacks={userFeedbacks}
					showDivision={false}
					showName={false}
					showEdit={false}
					statusEditable={false}
					on:openImageFeedback={handleOpenImageFeedback}
					on:openDetailFeedback={handleOpenDetailFeedback}
				/>
			{/if}
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk form feedback baru -->
{#if showFeedbackModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
	>
		<div class="bg-white rounded-lg shadow-xl p-0 max-w-2xl w-full relative animate-fade-in-up">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
				on:click={closeFeedbackModal}>&times;</button
			>
			<FeedbackForm
				onClose={closeFeedbackModal}
				on:submitted={handleFeedbackSubmitted}
				employee={myEmployee}
			/>
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk form tiket baru -->
{#if showTicketModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
	>
		<div class="bg-white rounded-lg shadow-xl p-0 max-w-2xl w-full relative animate-fade-in-up">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
				on:click={closeTicketModal}>&times;</button
			>
			<TicketingForm
				onClose={closeTicketModal}
				on:submitted={handleTicketSubmitted}
				employee={myEmployee}
			/>
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk detail tiket -->
{#if showDetailModal && selectedTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative animate-fade-in-up max-h-[90vh] overflow-y-auto"
		>
			<button
				class="absolute top-4 right-6 text-2xl text-gray-400 hover:text-red-500 transition"
				on:click={closeDetailModal}
				aria-label="Tutup"
			>
				&times;
			</button>
			<h2 class="text-xl font-extrabold mb-6 text-blue-700 text-center drop-shadow">
				Detail Tiket - {selectedTicket.id}
			</h2>
			<div class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
					<div class="font-semibold text-gray-600">Nama:</div>
					<div class="text-gray-800">{selectedTicket.name}</div>

					<div class="font-semibold text-gray-600">Kategori:</div>
					<div class="text-gray-800">{selectedTicket.category}</div>

					<div class="font-semibold text-gray-600">Departemen Tujuan:</div>
					<div class="text-gray-800">{selectedTicket.target_department}</div>

					<div class="font-semibold text-gray-600">Status:</div>
					<div class="text-gray-800">{selectedTicket.status}</div>

					<div class="font-semibold text-gray-600">Tanggal Dibuat:</div>
					<div class="text-gray-800">{new Date(selectedTicket.date).toLocaleString('id-ID')}</div>
				</div>

				<div class="mt-4">
					<div class="font-semibold text-gray-600 mb-2">Deskripsi Masalah:</div>
					<div class="text-gray-800 whitespace-pre-line bg-gray-50 p-3 rounded border">
						{selectedTicket.ticket}
					</div>
				</div>

				<!-- Conditional: Tampilkan lampiran jika ada -->
				{#if selectedTicket.photo_ticket}
					<div class="mt-4">
						<div class="font-semibold text-gray-600 mb-2">Lampiran:</div>
						<img
							src="https://directus.eltamaprimaindo.com/assets/{selectedTicket.photo_ticket}"
							alt="Lampiran tiket"
							class="max-w-full h-auto rounded border cursor-pointer"
							on:click={() => {
								window.open(
									`https://directus.eltamaprimaindo.com/assets/${selectedTicket.photo_ticket}`,
									'_blank'
								);
							}}
						/>
					</div>
				{/if}
			</div>

			<div class="flex justify-end mt-8">
				<button
					class="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
					on:click={closeDetailModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk riwayat update tiket -->
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
			<!-- Conditional: Tampilkan daftar update atau empty state -->
			{#if selectedTicketUpdates.length > 0}
				<div class="space-y-6 max-h-96 overflow-y-auto pr-2">
					{#each [...selectedTicketUpdates].sort((a, b) => new Date(b.date) - new Date(a.date)) as update, idx}
						<div class="border-b pb-4">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-2">
								<div class="font-semibold text-gray-600">Tanggal Update:</div>
								<div class="text-gray-800">{formatDate(update.date)}</div>

								<div class="font-semibold text-gray-600">Deskripsi:</div>
								<div class="text-gray-800">{update.description}</div>

								<div class="font-semibold text-gray-600">PIC:</div>
								<div class="text-gray-800">{update.pic}</div>

								<div class="font-semibold text-gray-600">Status:</div>
								<div class="text-gray-800">{update.status}</div>

								<div class="font-semibold text-gray-600">Lampiran:</div>
								<div class="text-gray-800">
									<!-- Conditional: Tampilkan link file atau pesan tidak ada -->
									{#if update.attachment}
										<button
											class="text-blue-600 text-s font-semibold mt-1"
											on:click={() => {
												let url = update.attachment;
												if (url && !url.startsWith('http')) {
													url = `https://directus.eltamaprimaindo.com/assets/${url}`;
												}
												handleOpenUpdateImage({ detail: { url } });
											}}
										>
											Lihat File
										</button>
									{:else}
										<span class="text-gray-500">Tidak ada lampiran</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
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

<!-- Conditional: Modal untuk gambar lampiran update -->
{#if showUpdateImageModal}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[70vh]"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeUpdateImageModal}>&times;</button
			>
			<h3 class="text-lg font-bold mb-4 text-blue-700">Lampiran</h3>
			<img src={updateImageUrl} alt="Lampiran" class="max-h-[60vh] max-w-full rounded border" />
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk detail text feedback -->
{#if showDetailModalFeedback}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-lg shadow-lg p-6 relative w-[90vw] max-w-4xl overflow-y-scroll flex flex-col items-center animate-fade-in-up"
			style="max-height: 50vh"
		>
			<button
				class="absolute top-4 right-6 text-gray-500 hover:text-red-600 text-3xl font-bold"
				on:click={closeDetailModalFeedback}>&times;</button
			>
			<h2 class="text-xl font-bold mb-4 text-blue-700">Detail Feedback</h2>
			<p class="text-gray-800 whitespace-pre-line text-justify">{detailTextFeedback}</p>
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk gambar lampiran feedback -->
{#if showImageModalFeedback}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[70vh]"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeImageFeedback}>&times;</button
			>
			<h3 class="text-lg font-bold mb-4 text-blue-700">Lampiran Feedback</h3>
			<img src={imageUrlFeedback} alt="Lampiran" class="max-h-[60vh] max-w-full rounded border" />
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.animate-fade-in {
		animation: fade-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
	}
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
</style>
