<script>
	import TicketList from '$lib/component/TicketList.svelte';
	import FeedbackList from '$lib/component/FeedbackList.svelte';
	import TicketingForm from '$lib/component/TicketingForm.svelte';
	import FeedbackForm from '$lib/component/FeedbackForm.svelte';
	import SurveyForm from '$lib/component/SurveyForm.svelte';
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
	let showSurveyModal = false;
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
					target_department: t.target_department,
					departure_time: t.departure_time,
					estimated_return_time: t.estimated_return_time,
					vehicle_type: t.vehicle_type
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
					url: fb.url,
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
	// Buka modal form survey baru
	function openSurveyModal() {
		showSurveyModal = true;
	}
	// Tutup modal form survey
	function closeSurveyModal() {
		showSurveyModal = false;
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

	function handleOpenDetailFeedback(e) {
		const { feedback, photo_feedback, url } = e.detail;

		// Format konten untuk grid layout
		let detailContent = `Feedback:\n${feedback || 'Tidak Ada Feedback'}`;

		// Tambahkan URL dengan format yang sesuai untuk pemisahan di grid
		detailContent += `\n\nURL:\n${url || 'Tidak ada URL'}`;

		// Simpan untuk ditampilkan
		detailTextFeedback = detailContent;

		// Simpan URL gambar jika ada foto, atau set nilai untuk menunjukkan tidak ada lampiran
		if (photo_feedback) {
			imageUrlFeedback = `https://directus.eltamaprimaindo.com/assets/${photo_feedback}`;
		} else {
			imageUrlFeedback = ''; // Kosong untuk keperluan kondisi di tampilan
		}

		// Tampilkan modal detail
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
	// Handler setelah survey berhasil di-submit
	function handleSurveySubmitted() {
		closeSurveyModal();
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
	<div class="p-4 max-w-7xl mx-auto animate-fade-in">
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-xl font-bold drop-shadow text-blue-800">
				Halo {myEmployee.nama_karyawan}, ada yang bisa dibantu ?
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
			<div class="grid grid-cols-3 gap-4 flex-1">
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
				<button
					on:click={openSurveyModal}
					class="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl text-center shadow-lg w-full font-semibold transition transform hover:scale-105 animate-fade-in-up"
					>Survey Baru</button
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

<!-- Conditional: Modal untuk form survey baru -->
{#if showSurveyModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
	>
		<div class="bg-white rounded-lg shadow-xl p-0 max-w-2xl w-full relative animate-fade-in-up">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
				on:click={closeSurveyModal}>&times;</button
			>
			<SurveyForm
				onClose={closeSurveyModal}
				on:submitted={handleSurveySubmitted}
				employee={myEmployee}
			/>
		</div>
	</div>
{/if}

<!-- Conditional: Modal untuk detail tiket -->
{#if showDetailModal && selectedTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-2xl p-4 md:p-6 relative animate-fade-in-up max-h-[95vh] overflow-y-auto"
		>
			<button
				class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors duration-200"
				on:click={closeDetailModal}
				aria-label="Tutup"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					></path>
				</svg>
			</button>

			<div class="mb-6 text-center">
				<h2 class="text-xl md:text-2xl font-bold text-blue-700 mb-2">Detail Tiket</h2>
				<div
					class="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold"
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						></path>
					</svg>
					{selectedTicket.id}
				</div>
			</div>

			<!-- Grid Layout for better organization -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<!-- Informasi Dasar -->
				<div
					class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200"
				>
					<h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							></path>
						</svg>
						Informasi Dasar
					</h3>
					<div class="space-y-3">
						<div class="flex flex-col">
							<span class="text-sm font-medium text-blue-700 mb-1">Nama</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-blue-200 text-sm"
							>
								{selectedTicket.name || '-'}
							</span>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-blue-700 mb-1">Kategori</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-blue-200 text-sm"
							>
								{selectedTicket.category || '-'}
							</span>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-blue-700 mb-1">Departemen Tujuan</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-blue-200 text-sm"
							>
								{selectedTicket.target_department || '-'}
							</span>
						</div>
					</div>
				</div>

				<!-- Status & Tanggal -->
				<div
					class="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200"
				>
					<h3 class="text-lg font-semibold text-green-800 mb-3 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						Status & Waktu
					</h3>
					<div class="space-y-3">
						<div class="flex flex-col">
							<span class="text-sm font-medium text-green-700 mb-1">Status</span>
							<div class="bg-white px-3 py-2 rounded-lg border border-green-200">
								<span
									class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    {selectedTicket.status === 'completed'
										? 'bg-green-100 text-green-800'
										: selectedTicket.status === 'in_progress'
											? 'bg-yellow-100 text-yellow-800'
											: 'bg-gray-100 text-gray-800'}"
								>
									{selectedTicket.status || 'Pending'}
								</span>
							</div>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-green-700 mb-1">Tanggal Dibuat</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-green-200 text-sm"
							>
								{new Date(selectedTicket.date).toLocaleString('id-ID') || '-'}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Deskripsi Masalah -->
			<div
				class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200 mb-4"
			>
				<h3 class="text-lg font-semibold text-purple-800 mb-3 flex items-center">
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					Deskripsi Masalah
				</h3>
				<div
					class="bg-white rounded-lg border border-purple-200 p-4 max-h-[200px] overflow-y-auto custom-scrollbar"
				>
					<p class="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
						{selectedTicket.ticket || 'Tidak ada deskripsi masalah yang tersedia.'}
					</p>
				</div>
			</div>

			<!-- Lampiran -->
			{#if selectedTicket.photo_ticket}
				<div
					class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 mb-6"
				>
					<h3 class="text-lg font-semibold text-orange-800 mb-3 flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a2 2 0 000-2.828z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l6m0 0l6m-6 0v6"
							></path>
						</svg>
						Lampiran
					</h3>
					<div class="bg-white rounded-lg border border-orange-200 p-4">
						<div
							class="group relative overflow-hidden rounded-lg cursor-pointer"
							on:click={() => {
								window.open(
									`https://directus.eltamaprimaindo.com/assets/${selectedTicket.photo_ticket}`,
									'_blank'
								);
							}}
						>
							<img
								src="https://directus.eltamaprimaindo.com/assets/{selectedTicket.photo_ticket}"
								alt="Lampiran tiket"
								class="w-full h-auto rounded-lg transition-transform duration-200 ease-in-out
                                    group-hover:scale-105"
							/>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex justify-center mt-4 md:mt-6">
				<button
					class="px-6 md:px-8 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm md:text-base"
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
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-xl p-4 md:p-8 relative animate-fade-in-up"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 transition"
				on:click={closeTicketUpdateDetail}
				aria-label="Tutup"
			>
				&times;
			</button>
			<h2
				class="text-lg md:text-xl font-extrabold mb-4 md:mb-6 text-blue-700 text-center drop-shadow"
			>
				Track Ticket
			</h2>
			<!-- Conditional: Tampilkan daftar update atau empty state -->
			{#if selectedTicketUpdates.length > 0}
				<div class="space-y-4 md:space-y-6 max-h-[70vh] md:max-h-96 overflow-y-auto pr-2">
					{#each [...selectedTicketUpdates].sort((a, b) => new Date(b.date) - new Date(a.date)) as update, idx}
						<div class="border-b pb-3 md:pb-4">
							<div
								class="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-8 gap-y-1 md:gap-y-2 mb-2"
							>
								<div class="font-semibold text-gray-600 text-sm md:text-base">Tanggal Update:</div>
								<div class="text-gray-800 text-sm md:text-base">{formatDate(update.date)}</div>

								<div class="font-semibold text-gray-600 text-sm md:text-base">Deskripsi:</div>
								<div class="text-gray-800 text-sm md:text-base">{update.description}</div>

								<div class="font-semibold text-gray-600 text-sm md:text-base">PIC:</div>
								<div class="text-gray-800 text-sm md:text-base">{update.pic}</div>

								<div class="font-semibold text-gray-600 text-sm md:text-base">Status:</div>
								<div class="text-gray-800 text-sm md:text-base">{update.status}</div>

								<div class="font-semibold text-gray-600 text-sm md:text-base">Lampiran:</div>
								<div class="text-gray-800 text-sm md:text-base">
									<!-- Conditional: Tampilkan link file atau pesan tidak ada -->
									{#if update.attachment}
										<button
											class="text-blue-600 text-xs md:text-sm font-semibold mt-1 px-2 py-0.5 bg-blue-50 rounded hover:bg-blue-100"
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
										<span class="text-gray-500 text-xs md:text-sm">Tidak ada lampiran</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center text-gray-500 text-sm md:text-base py-4 md:py-8">
					Tidak ada riwayat update untuk tiket ini.
				</div>
			{/if}
			<div class="flex justify-end mt-4 md:mt-8">
				<button
					class="px-4 md:px-6 py-1.5 md:py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold text-sm md:text-base"
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
			class="bg-white rounded-xl shadow-2xl p-3 md:p-6 max-w-[95vw] md:max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[80vh] md:h-[70vh]"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-600 hover:text-red-600"
				on:click={closeUpdateImageModal}>&times;</button
			>
			<h3 class="text-base md:text-lg font-bold mb-2 md:mb-4 text-blue-700">Lampiran</h3>
			<img src={updateImageUrl} alt="Lampiran" class="max-h-[60vh] max-w-full rounded border" />
		</div>
	</div>
{/if}

<!-- Modal for feedback detail text display -->
{#if showDetailModalFeedback}
	<div class="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-3 md:p-6 max-w-[95vw] md:max-w-4xl w-full relative flex flex-col items-start animate-fade-in-up"
			style="max-height: 90vh; overflow-y:auto"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-600 hover:text-red-600"
				on:click={closeDetailModalFeedback}>&times;</button
			>
			<h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4 text-blue-700 self-center">
				Detail Feedback
			</h2>

			<!-- Grid layout untuk feedback dan URL -->
			<div class="w-full grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
				<!-- Feedback column with vertical scrolling -->
				<div class="bg-blue-100 rounded-lg p-2">
					<h4 class="font-semibold text-blue-700 mb-1 text-sm md:text-base">Feedback</h4>
					<div class="max-h-[150px] md:max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
						<p class="text-gray-800 whitespace-pre-line leading-relaxed text-sm md:text-base">
							{detailTextFeedback.split('\n\nURL:')[0].replace('Feedback:\n', '')}
						</p>
					</div>
				</div>

				<!-- URL column with vertical scrolling -->
				<div class="bg-blue-50 rounded-lg p-2">
					<h4 class="font-semibold text-blue-700 mb-1 text-sm md:text-base">URL</h4>
					<div class="max-h-[150px] md:max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
						<p
							class="text-gray-800 whitespace-pre-line leading-relaxed break-all text-sm md:text-base"
						>
							{detailTextFeedback.includes('URL:')
								? detailTextFeedback.split('URL:\n')[1]
								: 'Tidak ada URL'}
						</p>
					</div>
				</div>
			</div>

			<!-- Lampiran section -->
			<div class="w-full flex flex-col items-center mt-2 border-t pt-2">
				<h3 class="text-base md:text-lg font-semibold mb-1 md:mb-2 text-blue-700 mt-1 md:mt-2">
					Lampiran
				</h3>
				{#if imageUrlFeedback}
					<div class="p-2 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
						<img
							src={imageUrlFeedback}
							alt="Lampiran"
							class="max-h-[30vh] md:max-h-[40vh] max-w-full rounded"
						/>
					</div>
				{:else}
					<p class="text-gray-500 italic py-2 md:py-4 text-sm md:text-base">
						Lampiran tidak tersedia
					</p>
				{/if}
			</div>
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

	/* Custom scrollbar styling */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(241, 245, 249, 0.5);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #93c5fd;
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #60a5fa;
	}
</style>
