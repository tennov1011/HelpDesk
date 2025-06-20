<script>
	export let ticket;
	export let isEditable = false;
	export let onClose = undefined;
	import { userRole, userDepartment, userName } from '$lib/services/firebaseConfig';

	// Helper untuk format tanggal
	function formatDate(dateStr) {
		if (!dateStr) return '-';
		const d = new Date(dateStr);
		return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
	}

	function handleClose() {
		if (typeof onClose === 'function') {
			onClose();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}

	import { onMount, onDestroy } from 'svelte';
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center">
	<div
		class="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]"
	>
		<!-- Tombol close -->
		<button
			on:click={handleClose}
			aria-label="Tutup"
			class="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-2xl font-bold z-50 focus:outline-none"
		>
			&times;
		</button>
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-2xl font-bold text-blue-800 flex items-center gap-2">
				Detail Tiket <span
					class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-base font-semibold"
					>{ticket.id}</span
				>
			</h2>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
			<div class="space-y-4">
				<div>
					<p class="font-semibold text-gray-700 mb-1">Nama</p>
					<div class="bg-gray-50 rounded px-3 py-2">{$userName|| '-'}</div>
				</div>
				<div>
					<p class="font-semibold text-gray-700 mb-1">Divisi</p>
					<div class="bg-gray-50 rounded px-3 py-2">{$userDepartment|| '-'}</div>
				</div>
				<div>
					<p class="font-semibold text-gray-700 mb-1">Kategori</p>
					<div class="bg-gray-50 rounded px-3 py-2">
						<span
							class="px-2 py-1 rounded text-xs font-bold
            {ticket.category === 'Sistem'
								? 'bg-blue-100 text-blue-700'
								: ticket.category === 'Infrastruktur'
									? 'bg-green-100 text-green-700'
									: 'bg-gray-100 text-gray-700'}"
						>
							{ticket.category}
						</span>
					</div>
				</div>
				<div>
					<p class="font-semibold text-gray-700 mb-1">Status</p>
					<div class="bg-gray-50 rounded px-3 py-2">
						<span
							class="px-2 py-1 rounded text-white text-xs font-bold shadow
            {ticket.status === 'Selesai'
								? 'bg-green-500'
								: ticket.status === 'Proses'
									? 'bg-blue-500'
									: ticket.status === 'Tertunda'
										? 'bg-yellow-500'
										: 'bg-red-500'}"
						>
							{ticket.status}
						</span>
					</div>
				</div>
				<div>
					<p class="font-semibold text-gray-700 mb-1">Prioritas</p>
					<div class="bg-gray-50 rounded px-3 py-2">
						<span
							class="px-2 py-1 rounded text-xs font-bold
            {ticket.priority === 'Tinggi'
								? 'bg-red-100 text-red-600'
								: ticket.priority === 'Sedang'
									? 'bg-yellow-100 text-yellow-700'
									: ticket.priority === 'Darurat'
										? 'bg-pink-100 text-pink-700'
										: 'bg-green-100 text-green-700'}"
						>
							{ticket.priority || '-'}
						</span>
					</div>
				</div>
				<div>
					<p class="font-semibold text-gray-700 mb-1">Tanggal</p>
					<div class="bg-gray-50 rounded px-3 py-2">{formatDate(ticket.date)}</div>
				</div>
			</div>
			<div class="space-y-4">
				{#if ticket.category === 'Sistem'}
					<div>
						<h3 class="font-semibold text-blue-700 mb-2">Detail Sistem</h3>
						<div class="grid grid-cols-1 gap-2">
							<div>
								<p class="font-semibold text-gray-700 mb-1">Jenis Aplikasi</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.jenisAplikasi || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Nama Aplikasi</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.namaAplikasi || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Browser/Device</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.browserDevice || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Langkah Dicoba</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.langkahDicoba || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Waktu Mulai</p>
								<div class="bg-gray-50 rounded px-3 py-2">{formatDate(ticket.waktuMulai)}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Frekuensi Masalah</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.masalahKonsisten || '-'}</div>
							</div>
						</div>
					</div>
				{:else if ticket.category === 'Infrastruktur'}
					<div>
						<h3 class="font-semibold text-green-700 mb-2">Detail Infrastruktur</h3>
						<div class="grid grid-cols-1 gap-2">
							<div>
								<p class="font-semibold text-gray-700 mb-1">Jenis Perangkat</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.jenisPerangkat || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Nomor/Label Aset</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.nomorAset || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Lokasi Perangkat</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.lokasiPerangkat || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Tipe Masalah Fisik</p>
								<div class="bg-gray-50 rounded px-3 py-2">
									{ticket.tipeMasalahFisik ? ticket.tipeMasalahFisik.join(', ') : '-'}
								</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Frekuensi Masalah</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.masalahBaru || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Sudah Dicoba Perbaikan</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.sudahDicobaPerbaikan || '-'}</div>
							</div>
							<div>
								<p class="font-semibold text-gray-700 mb-1">Detail Perbaikan</p>
								<div class="bg-gray-50 rounded px-3 py-2">{ticket.detailPerbaikan || '-'}</div>
							</div>
						</div>
					</div>
				{/if}
				<div>
					<h3 class="font-semibold text-gray-700 mb-2">Uraian Masalah</h3>
					<div class="bg-gray-50 rounded px-3 py-2">
						{ticket.uraianDetail || ticket.description || '-'}
					</div>
				</div>
			</div>
		</div>
		<div class="flex justify-end mt-8">
			<button
				class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold shadow transition"
				on:click={handleClose}
			>
				Tutup
			</button>
		</div>
	</div>
</div>

<style>
	.bg-white.shadow-lg.rounded-xl {
		box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
	}
</style>
