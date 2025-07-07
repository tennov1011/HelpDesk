<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import axios from 'axios';
	import jsPDF from 'jspdf';
	import { roleDefinitions } from '$lib/services/firebaseConfig.js';
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
	let isLoading = false;
	let selectedPic = '';
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
	let tempStatus = {};
	let showSuccess = false;
	let currentPage = 1;
	let isLoadingChat = false; // State untuk loading chat admin

	// Mobile-specific variables
	let isMobile = false;
	let mobileSearchQuery = '';
	let touchStartX = 0;
	let touchEndX = 0;
	let isTouch = false;
	let tableElement;

	// Desktop search variables
	let desktopSearchQuery = '';
	let searchCriteria = 'all'; // all, id, name, division, priority, status, department

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';
	const rowsPerPage = 6;

	// Mobile detection and touch handling
	function checkIfMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth <= 768;
		}
	}

	function handleTouchStart(e) {
		if (!isMobile) return;
		touchStartX = e.changedTouches[0].screenX;
		isTouch = true;
	}

	function handleTouchEnd(e) {
		if (!isMobile || !isTouch) return;
		touchEndX = e.changedTouches[0].screenX;
		handleSwipeGesture();
		isTouch = false;
	}

	function handleSwipeGesture() {
		const swipeThreshold = 50;
		const swipeDistance = touchStartX - touchEndX;

		if (Math.abs(swipeDistance) > swipeThreshold) {
			if (swipeDistance > 0 && currentPage < totalPages) {
				// Swipe left - next page
				nextPage();
			} else if (swipeDistance < 0 && currentPage > 1) {
				// Swipe right - previous page
				prevPage();
			}
		}
	}

	function handleMobileSearch(e) {
		mobileSearchQuery = e.target.value.toLowerCase();
		currentPage = 1; // Reset to first page when searching
	}

	function handleDesktopSearch(e) {
		desktopSearchQuery = e.target.value.toLowerCase();
		currentPage = 1; // Reset to first page when searching
	}

	function handleSearchCriteriaChange(e) {
		searchCriteria = e.target.value;
		currentPage = 1; // Reset to first page when criteria changes
	}

	// Initialize mobile detection
	if (typeof window !== 'undefined') {
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
	}

	// Cleanup on component destroy
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkIfMobile);
			window.removeEventListener('keydown', handleUpdateModalEsc);
		}
	});

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
			ticket.category.toLowerCase() === 'asset'
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
			ticket.category.toLowerCase() === 'izin keluar'
		) {
			detailFields = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				[
					'jam keluar',
					ticket.departure_time
						? new Date(ticket.departure_time).toLocaleTimeString('id-ID', {
								hour: '2-digit',
								minute: '2-digit'
							})
						: '-'
				],
				[
					'estimasi jam kembali',
					ticket.estimated_return_time
						? new Date(ticket.estimated_return_time).toLocaleTimeString('id-ID', {
								hour: '2-digit',
								minute: '2-digit'
							})
						: '-'
				],
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

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${day}/${month}/${year} ${hours}:${minutes}`;
	}

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

	// Fungsi export PDF untuk kategori Izin Keluar
	function exportExitPermitPDF(ticket) {
		if (!ticket || ticket.category?.toLowerCase() !== 'izin keluar') {
			alert('Fungsi export PDF hanya tersedia untuk kategori Izin Keluar');
			return;
		}

		// Function to extract first name from full name
		function getFirstName(fullName) {
			if (!fullName) return '';
			return fullName.split(' ')[0]; // Get first word/name
		}

		try {
			// Create new PDF with A5 landscape format (210x148 mm)
			const doc = new jsPDF({
				orientation: 'landscape',
				unit: 'mm',
				format: 'a5'
			});

			// Set font
			doc.setFont('helvetica');

			// Header
			doc.setFontSize(12); // Reduced for A5
			doc.setFont('helvetica', 'bold');
			doc.text('SURAT IZIN KELUAR', 105, 15, { align: 'center' });

			// Garis bawah header
			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(0.5);
			doc.line(15, 18, 195, 18);

			// Reset font
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8); // Reduced font size for A5

			// Informasi Perusahaan
			doc.setFont('helvetica', 'bold');
			doc.text('PT. ELTAMA PRIMA INDO', 15, 25);
			doc.setFont('helvetica', 'normal');
			doc.text(
				'Jl. Nangka No.88, RW.3, Bojong Kulur, Kec. Gn. Putri, Kabupaten Bogor, Jawa Barat 16969',
				15,
				30
			);
			doc.text('Telp: (021) 827 45', 15, 35);

			// Tanggal surat
			const currentDate = new Date().toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
			doc.text(`Jakarta, ${currentDate}`, 150, 25);

			// Konten surat
			let yPos = 40;

			doc.text('Yang bertanda tangan di bawah ini:', 15, yPos);
			yPos += 6;

			// Data karyawan
			doc.text(`Nama               : ${ticket.name || '-'}`, 25, yPos);
			yPos += 5;
			doc.text(`Divisi             : ${ticket.division || '-'}`, 25, yPos);
			yPos += 5;
			doc.text(`Email              : ${ticket.email || '-'}`, 25, yPos);
			yPos += 8;

			doc.text('Dengan ini mengajukan izin keluar dengan rincian sebagai berikut:', 15, yPos);
			yPos += 6;

			// Detail izin keluar
			const departureTime = ticket.departure_time
				? new Date(ticket.departure_time).toLocaleTimeString('id-ID', {
						hour: '2-digit',
						minute: '2-digit'
					})
				: '-';

			const returnTime = ticket.estimated_return_time
				? new Date(ticket.estimated_return_time).toLocaleTimeString('id-ID', {
						hour: '2-digit',
						minute: '2-digit'
					})
				: '-';

			doc.text(`Jam Keluar         : ${departureTime}`, 25, yPos);
			yPos += 5;
			doc.text(`Estimasi Jam Kembali : ${returnTime}`, 25, yPos);
			yPos += 5;
			doc.text(`Keperluan          : ${ticket.ticket || '-'}`, 25, yPos);
			yPos += 8;

			// Tanda tangan
			doc.text('Hormat kami,', 15, yPos);
			yPos += 10;

			// Kolom tanda tangan - layout baru dengan 4 kolom untuk A5 landscape
			// Kolom 1: Yang Mengajukan (Karyawan)
			doc.text('Yang Mengajukan,', 25, yPos);

			// Kolom 2: Atasan Divisi
			doc.text('Atasan Divisi,', 75, yPos);

			// Kolom 3: HRD
			doc.text('HRD,', 125, yPos);

			// Kolom 4: Security
			doc.text('Security,', 175, yPos);

			yPos += 14; // Spasi untuk tanda tangan

			// Get first name for the signature
			const firstName = getFirstName(ticket.name);

			// Nama-nama di bawah garis tanda tangan (hanya nama depan untuk pemohon)
			doc.text(`(${firstName || '..................'})`, 25, yPos);
			doc.text('(....................)', 75, yPos);
			doc.text('(....................)', 125, yPos);
			doc.text('(....................)', 175, yPos);

			yPos += 5;

			// Label posisi/jabatan
			doc.setFontSize(7);
			doc.text('Karyawan', 25, yPos);
			doc.text('Menyetujui', 75, yPos);
			doc.text('Mengetahui', 125, yPos);
			doc.text('Pemeriksaan', 175, yPos);

			// Footer
			doc.setFontSize(6);
			doc.text(`Dokumen ID: ${ticket.id}`, 15, 130);
			doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 134);

			// Simpan PDF
			const fileName = `Izin_Keluar_${firstName?.replace(/\s+/g, '_') || 'Unknown'}_${ticket.id}.pdf`;
			doc.save(fileName);

			// Show success message
			alert('PDF berhasil di-download!');
		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Gagal membuat PDF. Silakan coba lagi.');
		}
	}

	// Fungsi untuk mencari admin departemen dan membuka WhatsApp
	async function openChatWithAdmin(ticket) {
		isLoadingChat = true;
		try {
			console.log('Mencari admin untuk tiket:', ticket);

			// Dapatkan departemen target dari tiket
			const targetDepartment = ticket.target_department || ticket.department;
			console.log('Target department:', targetDepartment);

			if (!targetDepartment) {
				alert('Departemen target tidak ditemukan dalam tiket');
				return;
			}

			// Cari email admin berdasarkan departemen dari roleDefinitions
			const adminDefinition = roleDefinitions.find(
				(def) =>
					def.role === 'admin' && def.department.toLowerCase() === targetDepartment.toLowerCase()
			);
			console.log('Admin definition found:', adminDefinition);

			if (!adminDefinition) {
				alert(`Admin untuk departemen ${targetDepartment} tidak ditemukan`);
				return;
			}

			console.log('Mencari data karyawan dengan email:', adminDefinition.email);

			// Ambil data karyawan dari database berdasarkan email admin
			const response = await axios.get(
				`${DIRECTUS_URL}/items/karyawan?filter[email_company][_eq]=${adminDefinition.email}`,
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);

			console.log('Response data karyawan:', response.data);

			if (response.data.data.length === 0) {
				alert(`Data karyawan dengan email ${adminDefinition.email} tidak ditemukan`);
				return;
			}

			const adminEmployee = response.data.data[0];
			const phoneNumber =
				adminEmployee.no_hp ||
				adminEmployee.phone ||
				adminEmployee.telepon ||
				adminEmployee.no_telepon;

			console.log('Admin employee data:', adminEmployee);
			console.log('Phone number found:', phoneNumber);

			if (!phoneNumber) {
				alert(`Nomor WhatsApp admin ${adminDefinition.department} tidak tersedia`);
				return;
			}

			// Format nomor telepon (hapus karakter non-digit, tambahkan 62 jika dimulai dengan 0)
			let formattedPhone = phoneNumber.replace(/\D/g, '');
			if (formattedPhone.startsWith('0')) {
				formattedPhone = '62' + formattedPhone.substring(1);
			}
			console.log('Formatted phone:', formattedPhone);

			// Buat pesan WhatsApp dengan informasi tiket
			const message = `Halo, saya memerlukan bantuan terkait tiket berikut:

🎫 *ID Tiket:* ${ticket.id}
👤 *Nama:* ${ticket.name}
🏢 *Divisi:* ${ticket.division}
📧 *Email:* ${ticket.email}
📝 *Deskripsi:* ${ticket.desc || ticket.ticket}
📊 *Status:* ${ticket.status}
📅 *Tanggal:* ${formatDate(ticket.date)}

Mohon bantuannya untuk menindaklanjuti tiket ini. Terima kasih!`;

			// Encode pesan untuk URL
			const encodedMessage = encodeURIComponent(message);

			// Buka WhatsApp dengan nomor dan pesan
			const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
			console.log('Opening WhatsApp URL:', whatsappUrl);
			window.open(whatsappUrl, '_blank');
		} catch (error) {
			console.error('Error opening WhatsApp chat:', error);
			alert('Gagal membuka chat WhatsApp. Silakan coba lagi.');
		} finally {
			isLoadingChat = false;
		}
	}

	// Desktop search filtering
	$: desktopFiltered =
		!isMobile && desktopSearchQuery
			? tickets.filter((t) => {
					const query = desktopSearchQuery.toLowerCase();

					if (searchCriteria === 'all') {
						return (
							(t.id || '').toString().toLowerCase().includes(query) ||
							(t.name || '').toLowerCase().includes(query) ||
							(t.division || '').toLowerCase().includes(query) ||
							(t.priority || '').toLowerCase().includes(query) ||
							(t.status || '').toLowerCase().includes(query) ||
							(t.target_department || '').toLowerCase().includes(query) ||
							(t.desc || '').toLowerCase().includes(query)
						);
					} else if (searchCriteria === 'id') {
						return (t.id || '').toString().toLowerCase().includes(query);
					} else if (searchCriteria === 'name') {
						return (t.name || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'division') {
						return (t.division || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'priority') {
						return (t.priority || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'status') {
						return (t.status || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'department') {
						return (t.target_department || '').toLowerCase().includes(query);
					}
					return true;
				})
			: tickets;

	// Mobile search filtering
	$: mobileFiltered =
		isMobile && mobileSearchQuery
			? tickets.filter((t) => {
					const query = mobileSearchQuery.toLowerCase();
					return (
						(t.status || '').toLowerCase().includes(query) ||
						(t.target_department || '').toLowerCase().includes(query) ||
						(t.desc || '').toLowerCase().includes(query) ||
						(t.id || '').toString().toLowerCase().includes(query) ||
						(t.name || '').toLowerCase().includes(query) ||
						(t.division || '').toLowerCase().includes(query) ||
						(t.priority || '').toLowerCase().includes(query)
					);
				})
			: tickets;

	$: filteredTickets = isMobile ? mobileFiltered : desktopFiltered;

	$: totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
	$: paginatedTickets = filteredTickets.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage
	);
</script>

<div class="overflow-x-auto">
	<!-- Mobile Search Bar (only visible on mobile) -->
	{#if isMobile}
		<div class="mb-4 md:hidden">
			<input
				type="text"
				placeholder="Cari berdasarkan ID, nama, divisi, prioritas, status, departemen, atau deskripsi..."
				class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
				bind:value={mobileSearchQuery}
				on:input={handleMobileSearch}
			/>
		</div>
	{/if}

	<!-- Desktop Search Bar -->
	<div class="mb-4 hidden md:block">
		<!-- Search Section -->
		<div class="flex gap-2 mb-3">
			<!-- Search Criteria Selector -->
			<select
				class="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-700 font-semibold min-w-[140px]"
				bind:value={searchCriteria}
				on:change={handleSearchCriteriaChange}
			>
				<option value="all">Semua Field</option>
				<option value="id">ID Tiket</option>
				<option value="name">Nama</option>
				<option value="division">Divisi</option>
				<option value="priority">Prioritas</option>
				<option value="status">Status</option>
				<option value="department">Departemen</option>
			</select>

			<!-- Search Input -->
			<input
				type="text"
				placeholder={searchCriteria === 'all'
					? 'Cari berdasarkan semua field...'
					: searchCriteria === 'id'
						? 'Cari berdasarkan ID tiket...'
						: searchCriteria === 'name'
							? 'Cari berdasarkan nama...'
							: searchCriteria === 'division'
								? 'Cari berdasarkan divisi...'
								: searchCriteria === 'priority'
									? 'Cari berdasarkan prioritas...'
									: searchCriteria === 'status'
										? 'Cari berdasarkan status...'
										: 'Cari berdasarkan departemen...'}
				class="w-80 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
				bind:value={desktopSearchQuery}
				on:input={handleDesktopSearch}
			/>

			<!-- Clear Search Button -->
			{#if desktopSearchQuery}
				<button
					class="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-semibold"
					on:click={() => {
						desktopSearchQuery = '';
						currentPage = 1;
					}}
					title="Clear Search"
				>
					Clear
				</button>
			{/if}
		</div>
	</div>

	<!-- Table with touch events for mobile swipe -->
	<div
		bind:this={tableElement}
		on:touchstart={handleTouchStart}
		on:touchend={handleTouchEnd}
		class="touch-none select-none"
	>
		<table
			class="w-full table-auto border-separate border-spacing-y-1 bg-white rounded-xl shadow-lg text-center"
		>
			<thead>
				<tr class="bg-blue-100">
					<!-- Always show ID -->
					<th class="p-2 rounded-l text-center">ID</th>

					<!-- Desktop columns (hidden on mobile) -->
					{#if showNames}
						<th class="text-center hidden md:table-cell">Nama</th>
					{/if}
					{#if showDivisions}
						<th class="text-center hidden md:table-cell">Divisi</th>
					{/if}

					<!-- Always show Description -->
					{#if showDescription}
						<th class="text-center">Deskripsi</th>
					{/if}

					<!-- Desktop columns (hidden on mobile) -->
					{#if showPriority}
						<th class="text-center hidden md:table-cell">Prioritas</th>
					{/if}
					{#if showDate}
						<th class="text-center hidden md:table-cell">Tanggal</th>
					{/if}
					{#if showDepartments}
						<th class="text-center hidden md:table-cell">Departemen</th>
					{/if}

					<!-- Always show Status -->
					<th class="text-center">Status</th>

					<!-- Always show Action column -->
					{#if isAdmin}
						<th class="rounded-r text-center">Aksi</th>
					{:else}
						<th class="rounded-r text-center">Tiket / Update</th>
					{/if}
					{#if !isAdmin}
						<th class="rounded-r text-center">Chat Admin</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each paginatedTickets as ticket, i}
					<tr
						class="border-b hover:bg-blue-50 transition duration-200 animate-fade-in-up text-center"
						style="animation-delay: {i * 60 + 200}ms; height: 50px;"
					>
						<!-- Always show ID -->
						<td class="p-2 font-semibold text-blue-700 text-center">{ticket.id}</td>

						<!-- Desktop columns (hidden on mobile) -->
						{#if showNames}
							<td class="text-center hidden md:table-cell">{ticket.name}</td>
						{/if}
						{#if showDivisions}
							<td class="text-center hidden md:table-cell">{ticket.division}</td>
						{/if}

						<!-- Always show Description -->
						{#if showDescription}
							<td class="text-center">
								<!-- <div class="max-w-xs truncate" title={ticket.desc}> -->
								{ticket.desc}
								<!-- </div> -->
							</td>
						{/if}

						<!-- Desktop columns (hidden on mobile) -->
						{#if showPriority}
							<td class="text-center hidden md:table-cell">{ticket.priority}</td>
						{/if}
						{#if showDate}
							<td class="text-center hidden md:table-cell">{formatDate(ticket.date)}</td>
						{/if}
						{#if showDepartments}
							<td class="text-center hidden md:table-cell">{ticket.target_department}</td>
						{/if}

						<!-- Always show Status -->
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
									class={`inline-block px-2 py-1 rounded font-semibold text-xs ${getStatusColor(ticket.status)}`}
								>
									{ticket.status}
								</span>
							{/if}
						</td>

						<!-- Always show Action column -->
						<td class="text-center">
							{#if isAdmin}
								<div class="flex items-center justify-center gap-2">
									<!-- Detail button with icon -->
									<button
										class="text-blue-600 hover:text-blue-800 transition p-1 rounded-full hover:bg-blue-50"
										on:click={() => openDetail(ticket)}
										title="Lihat Detail"
										aria-label="Lihat Detail"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
											/>
										</svg>
									</button>
									/
									<!-- Export PDF button for Izin Keluar category -->
									{#if ticket.category?.toLowerCase() === 'izin keluar'}
										<button
											class="text-green-600 hover:text-green-800 transition p-1 rounded-full hover:bg-green-50"
											on:click={() => exportExitPermitPDF(ticket)}
											title="Export PDF Surat Izin Keluar"
											aria-label="Export PDF"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</button>
									{/if}
								</div>
							{:else}
								<!-- Container untuk item: Detail, Separator, Update, dan PDF -->
								<div class="flex items-center justify-center gap-1 md:gap-2">
									<!-- Button Detail -->
									<button
										class="text-blue-600 hover:text-blue-800 transition p-1 md:p-2 hover:bg-blue-50 rounded-full"
										on:click={() => dispatch('detail', { ticket })}
										title="Lihat Detail"
										aria-label="Lihat Detail Tiket"
									>
										<svg
											class="w-4 h-4 md:w-5 md:h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											stroke-width="2.5"
										>
											<circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2.5"
											></circle>
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
										class="text-blue-600 hover:text-blue-800 transition p-1 md:p-2 hover:bg-blue-50 rounded-full"
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
											class="w-4 h-4 md:w-5 md:h-5"
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

									<!-- Export PDF button untuk kategori Izin Keluar (User) -->
									{#if ticket.category?.toLowerCase() === 'izin keluar'}
										<!-- Separator -->
										<span class="text-gray-400 text-sm">/</span>

										<!-- Button Export PDF -->
										<button
											class="text-green-600 hover:text-green-800 transition p-1 md:p-2 hover:bg-green-50 rounded-full"
											on:click={() => exportExitPermitPDF(ticket)}
											title="Download PDF Surat Izin Keluar"
											aria-label="Export PDF Surat Izin Keluar"
										>
											<svg
												class="w-4 h-4 md:w-5 md:h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</button>
									{/if}
								</div>
							{/if}
						</td>
						<td class="text-center">
							<!-- Fitur Chat Admin -->
							{#if !isAdmin}
								<div class="flex justify-center">
									<button
										class="p-1 hover:bg-green-50 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
										title="Chat Admin"
										aria-label="Buka Chat dengan Admin"
										on:click={() => openChatWithAdmin(ticket)}
										disabled={isLoadingChat}
									>
										{#if isLoadingChat}
											<!-- Loading spinner -->
											<svg
												class="animate-spin h-5 w-5 text-gray-500"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"
												></path>
											</svg>
										{:else}
											<!-- WhatsApp icon -->
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-5 w-5 text-green-600 hover:text-green-700"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
													/>
											</svg>
										{/if}
									</button>
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
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

<!-- Mobile swipe instruction -->
{#if isMobile && totalPages > 1}
	<div class="text-center mt-2 md:hidden">
		<p class="text-xs text-gray-500">💡 Geser tabel ke kiri/kanan untuk navigasi halaman</p>
	</div>
{/if}

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
		<div class="bg-white rounded-lg shadow-lg w-full max-w-[95vw] md:max-w-2xl p-3 max-h-[95vh] overflow-y-auto">
			<div class="flex justify-between items-center mb-3">
				<h2 class="text-xl font-semibold">Update Tiket</h2>
				<button class="w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-500 hover:text-gray-700" on:click={closeUpdateModal}>
					&times;
				</button>
			</div>
			<div class="mb-2">
				<label for="update-date" class="block text-sm font-medium text-gray-700 mb-1">
					Tanggal
				</label>
				<input
					id="update-date"
					type="date"
					class="border rounded px-2 py-1 w-full text-sm"
					bind:value={updateForm.date}
				/>
			</div>
			<div class="mb-2">
				<label for="update-description" class="block text-sm font-medium text-gray-700 mb-1">
					Deskripsi
				</label>
				<textarea
					id="update-description"
					class="border rounded px-2 py-1 w-full text-sm"
					bind:value={updateForm.description}
				></textarea>
			</div>
			<div class="mb-2">
				<label for="update-attachment" class="block text-sm font-medium text-gray-700 mb-1">
					Lampiran
				</label>
				<input
					id="update-attachment"
					type="file"
					class="border rounded px-2 py-1 w-full text-sm"
					accept="image/*"
					on:change={(e) => (updateForm.attachment = e.target.files[0])}
				/>
			</div>
			<div class="mb-2">
				<label for="update-pic" class="block text-sm font-medium text-gray-700 mb-1"> PIC </label>
				<input
					id="update-pic"
					type="text"
					class="border rounded px-2 py-1 w-full text-sm"
					bind:value={updateForm.pic}
				/>
			</div>
			<div class="mb-2">
				<label for="update-status" class="block text-sm font-medium text-gray-700 mb-1">
					Status
				</label>
				<select
					id="update-status"
					class="border rounded px-2 py-1 w-full text-sm"
					bind:value={updateForm.status}
				>
					<option value="Pending">Pending</option>
					<option value="On Progress">On Progress</option>
					<option value="Done">Done</option>
					<option value="Rejected">Rejected</option>
				</select>
			</div>
			<div class="flex justify-end gap-2 mt-4">
				<button
					class="px-3 py-1.5 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition text-sm"
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
					class="px-3 py-1.5 bg-gray-300 text-gray-700 rounded shadow hover:bg-gray-400 transition text-sm"
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
	select:disabled {
		cursor: default !important;
		background: transparent;
		color: inherit;
	}

	/* Mobile-specific touch optimizations */
	.touch-none {
		touch-action: pan-x;
	}

	/* Mobile table improvements */
	@media (max-width: 768px) {
		table {
			font-size: 0.875rem;
		}

		th,
		td {
			padding: 0.5rem 0.25rem !important;
		}

		.max-w-xs {
			max-width: 120px;
		}
		
		/* Form controls in modals */
		input, select, textarea {
			font-size: 14px !important;
			padding: 4px 8px !important;
		}
		
		/* Modal header and spacing */
		.modal-header {
			margin-bottom: 0.5rem !important;
		}
		
		.modal-body {
			padding: 0.5rem !important;
		}
	}
</style>
