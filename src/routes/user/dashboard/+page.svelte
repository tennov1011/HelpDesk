<script>
	import TicketList from '$lib/component/TicketList.svelte';
	import FeedbackList from '$lib/component/FeedbackList.svelte';
	import TicketDetail from '$lib/component/TicketDetail.svelte';
	import TicketingForm from '$lib/component/TicketingForm.svelte';
	import FeedbackForm from '$lib/component/FeedbackForm.svelte';
	import Notification from '$lib/component/Notification.svelte'; // Import Notification
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
	let showFeedbackModal = false;
	let showDetailModal = false;
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
					pic: t.pic
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

	function openTicketModal() {
		showTicketModal = true;
	}
	function closeTicketModal() {
		showTicketModal = false;
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
	function closeDetailModal() {
		showDetailModal = false;
		selectedTicket = null;
	}

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
		<div class="mb-6 animate-fade-in-up">
			<h2
				class="text-2xl font-bold mb-2 text-blue-700 font-mono"
				style="font-family: Monaco, monospace;"
			>
				Tiket Saya
			</h2>
			<div class="bg-white p-4 shadow-lg rounded-xl overflow-hidden">
				{#if userTickets.length === 0}
					<div class="text-center text-gray-500 py-8">Belum ada tiket yang dibuat.</div>
				{:else}
				<TicketList
					tickets={userTickets}
					isAdmin={false}
					showActions={true}
					showNames={false}
					showDivisions={false}
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

		<!-- Feedback Saya -->
		<div class="animate-fade-in-up">
			<h2
				class="text-2xl font-bold mb-2 text-blue-700 font-mono"
				style="font-family: Monaco, monospace;"
			>
				Feedback Saya
			</h2>
			<div class="bg-white shadow-lg rounded-xl overflow-hidden">
				{#if userFeedbacks.length === 0}
					<div class="text-center text-gray-500 py-8">Belum ada feedback.</div>
				{:else}
					<FeedbackList
						feedbacks={userFeedbacks}
						showDivision={false}
						showName={false}
						showEdit={false}
						statusEditable={false}
					/>
				{/if}
			</div>
		</div>

		<!-- Modal TicketingForm -->
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
