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
	let selectedTicket = null;
	let showTicketModal = false;
=======
>>>>>>> Stashed changes
	let showFeedbackModal = false;
	let authReady = false;
	let roleReady = false;
	let currentRole = undefined;
	let isLoggedIn = false;
	let showNotifDropdown = false; // Tambahkan ini
	let notifDropdownEl;

	export let myEmployee;

	async function fetchTickets() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/TicketForm', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			tickets = res.data.data
				.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
				.map((t) => ({
					id: `T00${t.id}`,
					rawId: t.id,
					date: t.date_created,
					name: t.name,
					email: t.email,
					division: t.division,
					desc: t.desc,
					contactPhone: t.contactPhone,
					category: t.category,
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
					id: `#F${String(fb.id).padStart(3, '0')}`,
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

	let ticketUpdates = [];

	async function fetchTicketUpdates() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/TicketUpdate', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			ticketUpdates = res.data.data;
			ticketUpdates = ticketUpdates.map((update) => ({
				id: `TU00${update.id}`,
				rawId: update.id,
				ticketId: update.ticket_id,
				date: update.date,
				status: update.status,
				pic: update.pic,
				description: update.description,
				attachment: update.attachment || ''
			}));
		} catch (e) {
			console.error('Gagal mengambil TicketUpdates:', e);
		}
	}

	function openFeedbackModal() {
		showFeedbackModal = true;
	}
	function closeFeedbackModal() {
		showFeedbackModal = false;
	}
	function openDetailModal(ticket) {
		selectedTicket = ticket;
		showDetailModal = true;
	}
	function closeDetailModalTicket() {
		showDetailModalTicket = false;
		selectedTicket = null;
		detailFieldsTicket = [];
		selectedPic = '';
	}

	// Lihat Detail Informasi Ticket
	let showTicketDetailModal = false;
	let ticketDetailText = '';
	function openTicketDetailModal(text) {
		ticketDetailText = text;
		showTicketDetailModal = true;
	}
	function closeTicketDetailModal() {
		showTicketDetailModal = false;
		ticketDetailText = '';
	}
=======

	// Modal untuk detail feedback
	let showImageModalFeedback = false;
	let imageUrlFeedback = '';
	function handleOpenImageFeedback(e) {
		imageUrlFeedback = e.detail.url;
		showImageModalFeedback = true;
	}
	function closeImageFeedback() {
		showImageModalFeedback = false;
		imageUrlFeedback = '';
	}

	// Modal untuk detail feedback
	let showDetailModalFeedback = false;
	let detailTextFeedback = '';

	function handleOpenDetailFeedback(e) {
		detailTextFeedback = e.detail.text;
		showDetailModalFeedback = true;
	}
	function closeDetailModalFeedback() {
		showDetailModalFeedback = false;
		detailTextFeedback = '';
	}


>>>>>>> Stashed changes

	let unsubAuth, unsubRole;

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

	onDestroy(() => {
		if (unsubAuth) unsubAuth();
		if (unsubRole) unsubRole();
	});

	function handleTicketSubmitted() {
		closeTicketModal();
		fetchTickets(); // refresh data tiket
	}

	function handleFeedbackSubmitted() {
		closeFeedbackModal();
		fetchFeedback(); // refresh data feedback
	}

	$: myEmployee = employees.find(
		(e) =>
			e.email_company && e.email_company.trim().toLowerCase() === $userEmail?.trim().toLowerCase()
	);

	$: userTickets = myEmployee
		? tickets.filter(
				(t) => t.email?.trim().toLowerCase() === myEmployee.email_company?.trim().toLowerCase()
			)
		: [];
	$: userFeedbacks = myEmployee
		? feedbacks.filter(
				(fb) => fb.email?.trim().toLowerCase() === myEmployee.email_company?.trim().toLowerCase()
			)
		: [];

	function handleClickOutside(event) {
		if (showNotifDropdown && notifDropdownEl && !notifDropdownEl.contains(event.target)) {
			showNotifDropdown = false;
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});
</script>

<svelte:head>
	<title>Dashboard User</title>
	<meta
		name="description"
		content="Dashboard untuk User dengan fleksibilitas membuat form ticket atau feedback baru."
	/>
</svelte:head>
{#if !authReady || !roleReady}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">Loading...</div>
{:else if !myEmployee}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">
		Memuat data karyawan...
	</div>
{:else}
	<div class="p-4 max-w-6xl mx-auto animate-fade-in">
		<div class="flex justify-between items-center mb-6">
			<h1 class="text-xl font-bold drop-shadow text-blue-800">
				Halo {myEmployee.nama_karyawan}, what your needs ?
			</h1>
		</div>

		<!-- Quick Actions -->
		<div class="flex items-center gap-4 mb-6">
			<div class="flex justify-center">
				<Notification userEmail={myEmployee.email_company} />
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
		<div class="mb-6 animate-fade-in-up gap-10px">
			<h2
				class="text-2xl font-bold mb-2 text-blue-700 font-mono"
				style="font-family: Monaco, monospace;"
			>
				Tiket Saya
			</h2>
			{#if userTickets.length === 0}
				<div class="text-center text-gray-500 py-8">Belum ada tiket yang dibuat.</div>
			{:else}
				<TicketList
					tickets={userTickets}
					isAdmin={false}
					showActions={true}
					showNames={false}
					showDivisions={false}
<<<<<<< Updated upstream
					on:detail={(e) => openDetailModal(e.detail.ticket)}
				/>
				{/if}
			</div>
		</div>

		<!-- Modal TicketDetail -->
		{#if showDetailModal && selectedTicket}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
			>
				<div class="bg-white rounded-lg shadow-xl p-0 max-w-2xl w-full relative animate-fade-in-up">
					<button
						class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
						on:click={closeDetailModal}>&times;</button
					>
					<TicketDetail ticket={selectedTicket} onClose={closeDetailModal} />
				</div>
			</div>
		{/if}

			<h2
				class="text-2xl font-bold mb-2 text-blue-700 font-mono"
				style="font-family: Monaco, monospace;"
			>
				Feedback Saya
			</h2>
			{#if userFeedbacks.length === 0}
				<div class="text-center text-gray-500 py-8">Belum ada feedback.</div>
			{:else}
				<FeedbackList
					feedbacks={userFeedbacks}
					showDivision={false}
					showName={false}
					showEdit={false}
					statusEditable={false}
					on:openImage={handleOpenImageFeedback}
					on:openDetailFeedback={handleOpenDetailFeedback}
				/>
			{/if}
		</div>

		<!-- Modal FeedbackForm -->
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
	</div>
{/if}

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

{#if showImageModalTicket}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[70vh]"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeImageTicket}>&times;</button
			>
			<h3 class="text-lg font-bold mb-4 text-blue-700">Lampiran Tiket</h3>
			<img src={imageUrlTicket} alt="Lampiran" class="max-h-[60vh] max-w-full rounded border" />
		</div>
	</div>
{/if}

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

{#if showDetailModalTicket && selectedTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 rounded-2xl shadow-4xl p-8 max-w-7xl w-full h-[50vh] overflow-y-auto relative animate-fade-in-up"
		>
			<button
				class="absolute top-3 right-5 text-2xl text-gray-400 hover:text-red-500 transition"
				on:click={closeDetailModalTicket}>&times;</button
			>
			<h2 class="text-xl font-extrabold mb-6 text-blue-700 drop-shadow gap-5">
				Detail Tiket <span
					class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-base font-semibold ml-2"
					>{selectedTicket?.id}</span
				>
			</h2>
			<table class="w-full text-left mb-4 border-separate border-spacing-y-1">
				<tbody class="space-y-2">
					{#each detailFieldsTicket as [key, value], idx}
						<tr class={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
							<td class="font-semibold pr-4 py-2 capitalize text-blue-900 w-1/3">
								{key.replace(/_/g, ' ')}
							</td>
							<td class="py-2 text-gray-700 break-words">
								{#if key.toLowerCase() === 'detail'}
									<button
										class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-xs font-bold"
										type="button"
										on:click={() => openTicketDetailModal(value)}
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
		</div>
	</div>
{/if}

{#if showTicketDetailModal}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full h-[60vh] relative flex flex-col items-center overflow-y-auto animate-fade-in-up"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeTicketDetailModal}>&times;</button
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

<<<<<<< Updated upstream
=======
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


>>>>>>> Stashed changes
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
