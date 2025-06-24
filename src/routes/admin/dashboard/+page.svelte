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

	// Modal Imgae ticket
	let showImageModalTicket = false;
	let imageUrlTicket = '';
	function handleOpenImageTicket(e) {
		imageUrlTicket = e.detail.url;
		showImageModalTicket = true;
	}
	function closeImageTicket() {
		showImageModalTicket = false;
		imageUrlTicket = '';
	}

	// Modal Image Feedback
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

	// Modal Detail Feedback
	let showDetailModalFeedback = false;
	let detailTextFeedback = '';

	function handleOpenDetailFeedback(e) {
		console.log('openDetailFeedback event:', e.detail); // Debug log
		detailTextFeedback = e.detail.text;
		showDetailModalFeedback = true;
	}
	function closeDetailModalFeedback() {
		showDetailModalFeedback = false;
		detailTextFeedback = '';
	}

	// Modal Detail Ticket
	let showDetailModalTicket = false;
	let selectedTicket = null;
	let detailFieldsTicket = [];
	let selectedPic = '';

	function handleOpenDetailTicket(e) {
		selectedTicket = e.detail.ticket;
		detailFieldsTicket = e.detail.detailFields;
		selectedPic = e.detail.ticket.pic || '';
		showDetailModalTicket = true;
	}
	function closeDetailModalTicket() {
		showDetailModalTicket = false;
		selectedTicket = null;
		detailFieldsTicket = [];
		selectedPic = '';
	}

	// Assign PIC
	async function updatePic() {
		if (!selectedTicket) return;
		try {
			await axios.patch(
				`https://directus.eltamaprimaindo.com/items/TicketForm/${selectedTicket.rawId}`,
				{ pic: selectedPic },
				{
					headers: { Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz` }
				}
			);
			selectedTicket.pic = selectedPic;
			alert('PIC berhasil di-assign');
			closeDetailModalTicket();
			fetchTickets();
		} catch (e) {
			alert('Gagal assign PIC');
		}
	}

	// Delete Ticket
	async function deleteTicket() {
		if (!selectedTicket) return;
		if (!confirm('Yakin ingin menghapus tiket ini?')) return;
		try {
			await axios.delete(
				`https://directus.eltamaprimaindo.com/items/TicketForm/${selectedTicket.rawId}`,
				{
					headers: { Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz` }
				}
			);
			alert('Ticket berhasil dihapus');
			closeDetailModalTicket();
			fetchTickets();
		} catch (e) {
			alert('Gagal menghapus tiket');
		}
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
	</div>
{/if}

{#if showDetailModalTicket && selectedTicket}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div
            class="bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 rounded-2xl shadow-4xl p-8 max-w-7xl w-full h-[80vh] overflow-y-auto relative animate-fade-in-up"
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
            {#if currentRole === 'admin'}
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

{#if showTicketDetailModal}
	<div class="fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-70">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[60vh]"
			style="max-height: 80vh; overflow-y: auto"
		>
			<button
				class="absolute top-3 right-4 text-2xl font-bold text-gray-600 hover:text-red-600"
				on:click={closeTicketDetailModal}>&times;</button
			>
			<h2 class="text-xl font-bold mb-4 text-blue-700">Detail Informasi Tiket</h2>
			<p class="text-gray-800 whitespace-pre-line text-justify">{ticketDetailText}</p>
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
