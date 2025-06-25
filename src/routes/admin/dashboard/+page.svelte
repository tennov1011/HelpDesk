<script>
	import TicketList from '$lib/component/TicketList.svelte';
	import FeedbackList from '$lib/component/FeedbackList.svelte';
	import TicketStats from '$lib/component/TicketStats.svelte';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import { isAuthenticated, userRole, userDepartment } from '$lib/services/firebaseConfig';

	let tickets = [];
	let feedbacks = [];
	let authReady = false;
	let roleReady = false;
	let currentRole = undefined;
	let isLoggedIn = false;
	let adminDepartment;
	userDepartment.subscribe((dept) => {
		adminDepartment = dept;
	});

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
					pic: t.pic,
					department: t.target_department
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

	let unsubAuth, unsubRole, unsubDept;

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
			if (role !== 'admin') goto('/login');
			// fetch data hanya jika sudah siap dan role benar
			if (authReady && roleReady && isLoggedIn && currentRole === 'admin') {
				fetchTickets();
				fetchFeedback();
			}
		});
		unsubDept = userDepartment.subscribe((dept) => {
			adminDepartment = dept;
		});
	});

	// Jangan lupa cleanup
	onDestroy(() => {
		if (unsubAuth) unsubAuth();
		if (unsubRole) unsubRole();
		if (unsubDept) unsubDept();
	});

	$: ticketsByDept = tickets.filter(
		(t) => t.department?.trim().toLowerCase() === adminDepartment?.trim().toLowerCase()
	);

	$: filteredTickets = tickets.filter(
		(t) => t.department?.trim().toLowerCase() === adminDepartment?.trim().toLowerCase()
	);

	$: if (adminDepartment !== undefined) {
		console.log('adminDepartment:', adminDepartment);
	}

	$: console.log(
		'tickets:',
		tickets.map((t) => ({ id: t.id, department: t.department }))
	);
</script>

<svelte:head>
	<title>Dashboard Admin</title>
	<meta
		name="description"
		content="Dashboard untuk Admin Helpdesk dengan statistik dan daftar tiket terbaru."
	/>
</svelte:head>
{#if !authReady || !roleReady}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">Loading...</div>
{:else}
	<div
		class="p-6 bg-gradient-to-br from-blue-100 via-blue-50 to-white min-h-screen animate-fade-in"
	>
		<h1 class="text-2xl font-bold mb-6 text-blue-800 drop-shadow">Dashboard Admin</h1>
		<!-- Stats -->
		<TicketStats tickets={filteredTickets} {feedbacks} />

		<!-- Tickets Table -->
		<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">List Tiket</h2>
		<div class="bg-white p-4 rounded-xl shadow-lg mb-6 animate-fade-in-up">
			<TicketList
				tickets={filteredTickets}
				isAdmin={true}
				on:deleted={fetchTickets}
				on:openImage={handleOpenImageTicket}
				on:openDetailTicket={handleOpenDetailTicket}
			/>
			<!-- Feedback Table -->
			<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">List Feedback</h2>
			<FeedbackList
				{feedbacks}
				on:deleted={fetchFeedback}
				statusEditable={true}
				on:openImage={handleOpenImageFeedback}
				on:openDetailFeedback={handleOpenDetailFeedback}
			/>
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

{#if showDetailModalFeedback}
	<div class="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full relative flex flex-col items-center animate-fade-in-up"
			style="max-height: 60vh"
		>
			<button
				class="absolute top-2 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeDetailModalFeedback}>&times;</button
			>
			<h2 class="text-xl font-bold mb-4 text-blue-700">Detail Feedback</h2>
			<p class="text-gray-800 whitespace-pre-line text-justify">{detailTextFeedback}</p>
		</div>

		<!-- Feedback Table -->
		<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">List Feedback</h2>
		<div class="bg-white p-4 rounded-xl shadow-lg animate-fade-in-up">
			<FeedbackList {feedbacks} on:deleted={fetchFeedback} statusEditable={true} />
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
