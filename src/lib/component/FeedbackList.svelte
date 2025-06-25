<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import axios from 'axios';

	export let feedbacks = [];
	export let showName = true;
	export let showDivision = true;
	export let showEdit = true;
	export let statusEditable = true;

	let isDeleting = false;
	let notification = { show: false, type: '', message: '' };
	let currentPage = 1;
	const rowsPerPage = 5;

	$: totalPages = Math.ceil(feedbacks.length / rowsPerPage);
	$: paginatedFeedbacks = feedbacks.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	const dispatch = createEventDispatcher();

	function openImageModal(url) {
		dispatch('openImage', { url });
	}
	function openDetailModal(text) {
		dispatch('openDetailFeedback', { text });
	}

	async function deleteFeedback(id) {
		if (!confirm('Yakin ingin menghapus feedback ini?')) return;
		try {
			await axios.delete(`${DIRECTUS_URL}/items/FeedbackForm/${id}`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
			});
			alert('Feedback berhasil dihapus.');
			dispatch('deleted'); // Beritahu parent untuk fetch ulang
			closeDetailModal && closeDetailModal(); // Tutup modal jika ada
		} catch (e) {
			alert('Gagal menghapus feedback.');
		}
	}

	async function markAsRead(id) {
		try {
			await axios.patch(
				`${DIRECTUS_URL}/items/FeedbackForm/${id}`,
				{ status: 'Dibaca' },
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);
			notification = { show: true, type: 'success', message: 'Status berhasil diupdate.' };
			dispatch('deleted'); // fetch ulang data dari parent
		} catch (e) {
			notification = { show: true, type: 'error', message: 'Gagal update status.' };
		} finally {
			setTimeout(() => (notification = { show: false, type: '', message: '' }), 2000);
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeydown);
		}
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
		}
	});

	function nextPage() {
		if (currentPage < totalPages) currentPage += 1;
	}
	function prevPage() {
		if (currentPage > 1) currentPage -= 1;
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

{#if notification.show}
	<div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
		<div
			class="px-6 py-3 rounded-lg shadow-lg font-semibold text-white text-center transition-all duration-300"
			class:bg-green-500={notification.type === 'success'}
			class:bg-red-500={notification.type === 'error'}
		>
			{notification.message}
		</div>
	</div>
{/if}

<div class="overflow-x-auto">
	<table
		class="w-full table-auto border-separate border-spacing-y-1 bg-white rounded-xl shadow-lg text-center"
	>
		<thead>
			<tr class="bg-blue-100 text-center">
				<th class="rounded-l p-2 text-center">ID</th>
				{#if showName}
					<th class="text-center">Nama</th>
				{/if}
				{#if showDivision}
					<th class="text-center">Divisi</th>
				{/if}
				<th class="text-center">Tanggal</th>
				<th class="text-center">Lampiran</th>
				<th class="text-center">Status</th>
				<th class="rounded-r text-center">Feedback</th>
				{#if showEdit}
					<th class="text-center">Edit</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each paginatedFeedbacks as fb, i}
				<tr
					class="border-b hover:bg-blue-50 transition duration-200 animate-fade-in-up text-center"
					style="animation-delay: {i * 60 + 200}ms; height: 50px;"
				>
					<td class="p-2 font-semibold text-blue-700 text-center">{fb.id}</td>
					{#if showName}
						<td class="text-center p-3">{fb.name}</td>
					{/if}
					{#if showDivision}
						<td class="text-center p-3">{fb.division}</td>
					{/if}
					<td class="text-center p-3">{formatDate(fb.date)}</td>
					<td class="text-center p-3">
						<div class="flex items-center justify-center">
							{#if fb.photo_feedback}
								<div class="bg-blue-100 border border-blue-200 rounded px-2 py-1">
									<button
										on:click={() => openImageModal(`https://directus.eltamaprimaindo.com/assets/${fb.photo_feedback}`)}
										class="text-blue-600 hover:text-blue-800 font-bold"
									>
										Lihat File
									</button>
								</div>
							{:else}
								<div class="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-gray-500">
									Nothing
								</div>
							{/if}
						</div>
					</td>
					<td class="text-center p-3">
						{#if fb.status === 'Dibaca'}
							<button
								class="px-2 py-1 rounded bg-green-100 text-green-800 font-bold cursor-default"
								disabled
							>
								Read
							</button>
						{:else}
							<button
								class="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold hover:bg-yellow-200 transition"
								class:cursor-default={!statusEditable}
								disabled={!statusEditable}
								on:click={statusEditable ? () => markAsRead(fb.rawId) : undefined}
							>
								Unread
							</button>
						{/if}
					</td>
					<td class="text-center">
						<button
							class="bg-blue-100 border border-blue-200 rounded px-2 py-1 text-blue-600 hover:text-blue-800 font-bold"
							on:click={() => openDetailModal(fb.text)}
						>
							Detail
						</button>
					</td>
					{#if showEdit}
						<td class="text-center">
							<div class="flex items-center justify-center">
								<div class="bg-red-100 border border-red-200 rounded px-2 py-1">
									<button
										class="text-red-600 hover:text-red-800 font-bold"
										on:click={() => deleteFeedback(fb.rawId)}
										disabled={isDeleting}
									>
										Delete
									</button>
								</div>
							</div>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
	<!-- Pagination Controls -->
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
</style>
