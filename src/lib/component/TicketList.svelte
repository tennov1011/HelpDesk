<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import axios from 'axios';
	import jsPDF from 'jspdf';
	import { roleDefinitions } from '$lib/services/firebaseConfig.js';
	import RekapitulasiEtol from './RekapitulasiEtol.svelte';
	export let tickets = [];
	export let isAdmin = false; // <-- tambahkan ini
	export let adminDepartment = ''; // Departmen admin yang login
	export let showNames = true;
	export let showPriority = true;
	export let showDate = true;

	// Debug adminDepartment
	$: console.log('TicketList - isAdmin:', isAdmin, 'adminDepartment:', adminDepartment);
	
	// Reactive variable to track if user is HRD admin
	$: isHrdAdmin = isAdmin && adminDepartment === 'HRD';
	$: console.log('TicketList - isHrdAdmin:', isHrdAdmin);
	export let showDivisions = true;
	export let showDescription = true;
	export let showDepartments = false;
	export let showCategories = true;
	export let ticketUpdates = [];

	const dispatch = createEventDispatcher();
	let selectedTicket = null;
	let detailFields = [];
	let updatingStatusId = null;
	let isLoading = false;
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

	// Filter variables
	let categoryFilter = 'all';
	let dateRangeFilter = 'all';
	let customStartDate = '';
	let customEndDate = '';

	// Edit nominal variables
	let showEditNominalModal = false;
	let editingTicket = null;
	let editNominalForm = {
		id: '',
		submission_amount: ''
	};

	// Rekapitulasi variables
	let showRekapModal = false;
	let rekapData = {
		monthlyTotal: [],
		vehicleTotal: [],
		totalNominal: 0,
		totalKilometer: 0
	};

	// Rekapitulasi E-Tol variables
	let showRekapEtolModal = false;
	let rekapitulasiEtol;

	// Detail modal variables
	let showDetailModal = false;
	let selectedPic = '';

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

	// Filter functions
	function handleCategoryFilterChange(e) {
		categoryFilter = e.target.value;
		currentPage = 1;
	}

	function handleDateRangeFilterChange(e) {
		dateRangeFilter = e.target.value;
		currentPage = 1;

		// Reset custom dates when switching to predefined ranges
		if (dateRangeFilter !== 'custom') {
			customStartDate = '';
			customEndDate = '';
		}
	}

	function handleCustomDateChange() {
		currentPage = 1;
	}

	function isWithinDateRange(ticketDate) {
		if (dateRangeFilter === 'all') return true;

		const ticket = new Date(ticketDate);
		const today = new Date();
		today.setHours(23, 59, 59, 999); // End of today

		switch (dateRangeFilter) {
			case 'today':
				const startOfToday = new Date(today);
				startOfToday.setHours(0, 0, 0, 0);
				return ticket >= startOfToday && ticket <= today;

			case 'week':
				const weekAgo = new Date(today);
				weekAgo.setDate(today.getDate() - 7);
				return ticket >= weekAgo && ticket <= today;

			case 'month':
				const monthAgo = new Date(today);
				monthAgo.setMonth(today.getMonth() - 1);
				return ticket >= monthAgo && ticket <= today;

			case 'custom':
				if (!customStartDate || !customEndDate) return true;
				const startDate = new Date(customStartDate);
				const endDate = new Date(customEndDate);
				endDate.setHours(23, 59, 59, 999);
				return ticket >= startDate && ticket <= endDate;

			default:
				return true;
		}
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

	function getDetailFields(ticket) {
		let detailFields = [];
		
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
			ticket.category.toLowerCase() === 'peminjaman kendaraan'
		) {
			const vehicleInfo = ticket.vehicle_type || '-';
			detailFields = [
				['nama pemohon', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['kendaraan', vehicleInfo],
				['tujuan', ticket.destination],
				['tanggal Pemakaian Kendaraan', formatDateVehicle(ticket.date_used)],
				['peminjam sebelumnya', 'Mencari data...'],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
				['PIC', ticket.pic]
			];
		} else if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'pengajuan bbm'
		) {
			const vehicleInfo = ticket.vehicle_type || '-';
			detailFields = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['kendaraan', vehicleInfo],
				['Jumlah Awal BBM', ticket.initial_fuel],
				['Kilometer Awal', ticket.initial_kilometer],
				['Kilometer Sebelumnya', 'Mencari data...'],
				['Nominal Pengajuan', ticket.submission_amount],
				['Tujuan', ticket.destination],
				['lampiran', ticket.photo_ticket ? 'Tersedia' : 'Tidak Tersedia'],
				['PIC', ticket.pic]
			];
		} else if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'pengajuan e-tol'
		) {
			detailFields = [
				['nama', ticket.name],
				['divisi', ticket.division],
				['email', ticket.email],
				['kategori', ticket.category],
				['No E-Tol', ticket.no_etol || '-'],
				['Saldo Awal', ticket.initial_balance || '-'],
				['Nominal Top Up', ticket.etol_submission_amount ? 'Rp ' + parseFloat(ticket.etol_submission_amount).toLocaleString('id-ID') : '-'],
				['Tujuan', ticket.etol_destination || ticket.destination || '-'],
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
		
		return detailFields;
	}

	function openDetail(ticket) {
		selectedTicket = ticket;
		selectedPic = ticket.pic || '';
		
		// Get initial detail fields using the centralized function
		detailFields = getDetailFields(ticket);
		
		// Special handling for categories that need async data
		if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'peminjaman kendaraan'
		) {
			// Khusus untuk kategori Peminjaman Kendaraan
			const vehicleInfo = ticket.vehicle_type || '-';

			// Immediately show the modal with loading state for previousBorrower
			if (isAdmin) {
				dispatch('openDetail', { ticket, detailFields });
			} else {
				showDetailModal = true;
			}

			// Then fetch previous borrower data asynchronously
			if (isAdmin && vehicleInfo) {
				fetchPreviousBorrower(vehicleInfo, ticket);
			}

			// Return early to prevent the code after the if-else block from executing
			return;
		} else if (
			ticket.category &&
			typeof ticket.category === 'string' &&
			ticket.category.toLowerCase() === 'pengajuan bbm'
		) {
			// Khusus untuk kategori Pengajuan BBM
			const vehicleInfo = ticket.vehicle_type || '-';

			// Immediately show the modal with loading state for previousKilometer
			if (isAdmin) {
				dispatch('openDetail', { ticket, detailFields });
			} else {
				showDetailModal = true;
			}

			// Then fetch previous kilometer data asynchronously
			if (isAdmin && vehicleInfo) {
				fetchPreviousKilometer(vehicleInfo, ticket);
			}

			// Return early to prevent the code after the if-else block from executing
			return;
		} else {
			// For all other categories, use the getDetailFields function result
			// detailFields is already set above from getDetailFields(ticket)
		}
		
		if (isAdmin) {
			dispatch('openDetail', { ticket, detailFields });
		} else {
			showDetailModal = true;
		}
	}

	// Fungsi untuk mengambil data peminjam sebelumnya
	async function fetchPreviousBorrower(vehicleInfo, currentTicket) {
		if (!vehicleInfo || typeof vehicleInfo !== 'string') return;

		try {
			// Ekstrak nama kendaraan dari format "Jenis Nama PlatNomor - Status"
			const vehicleMatch = vehicleInfo.match(/^([^-]+)/);
			if (!vehicleMatch) return;

			const vehicleIdentifier = vehicleMatch[1].trim();

			// Cari tiket peminjaman kendaraan sebelumnya dengan kendaraan yang sama
			// dan status tiket sudah "Done" (telah selesai) atau "On Progress" (sedang dipinjam)
			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
				params: {
					filter: {
						category: { _eq: 'Peminjaman Kendaraan' },
						vehicle_type: { _contains: vehicleIdentifier },
						status: { _in: ['Done', 'On Progress'] }
					},
					sort: ['-date_created'],
					limit: 5 // Ambil lebih banyak untuk memastikan kita bisa mendapatkan peminjam sebelumnya jika ada
				}
			});

			// Default value if no previous borrower is found
			let previousBorrowerValue = 'Tidak ada data';

			if (response.data && response.data.data && response.data.data.length > 0) {
				// Cek apakah kendaraan sedang dipinjam (status "Dipinjam")
				// Jika sedang dipinjam, cari dari data kendaraan di Directus
				const vehicleResponse = await axios.get(`${DIRECTUS_URL}/items/Kendaraan`, {
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
					params: {
						filter: {
							nama: { _contains: vehicleIdentifier.split(' ')[1] || '' },
							status: { _eq: 'Dipinjam' }
						}
					}
				});

				let lastBorrower = null;

				// Jika kendaraan ditemukan dengan status "Dipinjam"
				if (
					vehicleResponse.data &&
					vehicleResponse.data.data &&
					vehicleResponse.data.data.length > 0
				) {
					// Filter out current ticket if it exists
					const filteredTickets = response.data.data.filter(
						(ticket) => ticket.id !== currentTicket.id && ticket.status === 'On Progress'
					);

					if (filteredTickets.length > 0) {
						lastBorrower = filteredTickets[0]; // Peminjam saat ini
					}
				}

				// If no active borrower found or vehicle not in "Dipinjam" status, look for last completed borrower
				if (!lastBorrower) {
					// Filter out current ticket if it exists and get completed tickets
					const completedTickets = response.data.data.filter(
						(ticket) => ticket.id !== currentTicket.id && ticket.status === 'Done'
					);

					if (completedTickets.length > 0) {
						lastBorrower = completedTickets[0]; // Peminjam terakhir yang sudah selesai
					}
				}

				// If a previous borrower was found, update the value
				if (lastBorrower) {
					const status =
						lastBorrower.status === 'On Progress' ? 'Sedang Meminjam' : 'Terakhir Meminjam';
					previousBorrowerValue = `${lastBorrower.name || 'Tidak diketahui'} (${status}: ${formatDate(lastBorrower.date_created)})`;
				}
			}

			// Create a new detailFields array with the updated previousBorrower value
			const updatedDetailFields = detailFields.map((field) => {
				if (field[0] === 'peminjam sebelumnya') {
					return ['peminjam sebelumnya', previousBorrowerValue];
				}
				return field;
			});

			// Update detailFields with the new array
			detailFields = updatedDetailFields;

			// Update the UI if the modal is still open
			if (isAdmin && selectedTicket && selectedTicket.id === currentTicket.id) {
				dispatch('openDetail', { ticket: currentTicket, detailFields });
			}
		} catch (error) {
			console.error('Error fetching previous borrower:', error);

			// Update detailFields with error message
			const updatedDetailFields = detailFields.map((field) => {
				if (field[0] === 'peminjam sebelumnya') {
					return ['peminjam sebelumnya', 'Error: Gagal mengambil data'];
				}
				return field;
			});

			detailFields = updatedDetailFields;

			// Update the UI if the modal is still open
			if (isAdmin && selectedTicket && selectedTicket.id === currentTicket.id) {
				dispatch('openDetail', { ticket: currentTicket, detailFields });
			}
		}
	}

	// Fungsi untuk mengambil data kilometer sebelumnya untuk kategori Pengajuan BBM
	async function fetchPreviousKilometer(vehicleInfo, currentTicket) {
		if (!vehicleInfo || typeof vehicleInfo !== 'string') return;

		try {
			// Ekstrak nama kendaraan dari format "Jenis Nama PlatNomor"
			const vehicleMatch = vehicleInfo.match(/^([^-]+)/);
			if (!vehicleMatch) return;

			const vehicleIdentifier = vehicleMatch[1].trim();

			// Cari tiket pengajuan BBM sebelumnya dengan kendaraan yang sama
			// yang sudah selesai (status "Done") atau sedang diproses (status "On Progress")
			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
				params: {
					filter: {
						category: { _eq: 'Pengajuan BBM' },
						vehicle_type: { _contains: vehicleIdentifier },
						status: { _in: ['Done', 'On Progress'] }
					},
					sort: ['-date_created'],
					limit: 10 // Ambil lebih banyak untuk memastikan kita bisa mendapatkan data sebelumnya
				}
			});

			// Default value if no previous data is found
			let previousKilometerValue = 'Tidak ada data';

			if (response.data && response.data.data && response.data.data.length > 0) {
				// Filter out current ticket dan cari tiket sebelumnya yang memiliki data kilometer
				const filteredTickets = response.data.data.filter(
					(ticket) => ticket.id !== currentTicket.id && ticket.initial_kilometer
				);

				if (filteredTickets.length > 0) {
					const lastTicket = filteredTickets[0]; // Tiket pengajuan BBM terakhir
					const status = lastTicket.status === 'On Progress' ? 'Sedang Diproses' : 'Selesai';

					// Format nilai kilometer dengan pemisah ribuan
					const formattedKilometer = parseInt(lastTicket.initial_kilometer).toLocaleString('id-ID');

					previousKilometerValue = `${formattedKilometer} km (${status}: ${formatDate(lastTicket.date_created)})`;
				}
			}

			// Create a new detailFields array with the updated previousKilometer value
			const updatedDetailFields = detailFields.map((field) => {
				if (field[0] === 'Kilometer Sebelumnya') {
					return ['Kilometer Sebelumnya', previousKilometerValue];
				}
				return field;
			});

			// Update detailFields with the new array
			detailFields = updatedDetailFields;

			// Update the UI if the modal is still open
			if (isAdmin && selectedTicket && selectedTicket.id === currentTicket.id) {
				dispatch('openDetail', { ticket: currentTicket, detailFields });
			}
		} catch (error) {
			console.error('Error fetching previous kilometer:', error);

			// Update detailFields with error message
			const updatedDetailFields = detailFields.map((field) => {
				if (field[0] === 'Kilometer Sebelumnya') {
					return ['Kilometer Sebelumnya', 'Error: Gagal mengambil data'];
				}
				return field;
			});

			detailFields = updatedDetailFields;

			// Update the UI if the modal is still open
			if (isAdmin && selectedTicket && selectedTicket.id === currentTicket.id) {
				dispatch('openDetail', { ticket: currentTicket, detailFields });
			}
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

		function formatDateVehicle(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const day = String(d.getDate()).padStart(2, '0');
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const year = d.getFullYear();
		return `${day}/${month}/${year}`;
	}

	// Function to format numbers with thousand separators
	function formatKilometer(value) {
		if (!value) return '-';
		return parseInt(value).toLocaleString('id-ID');
	}

	function formatCurrency(value) {
		if (!value) return '-';
		return 'Rp ' + parseFloat(value).toLocaleString('id-ID');
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
		// Mendapatkan status tiket dari tempStatus atau status tiket langsung
		const status = (tempStatus[ticket.id] || ticket.status || '').toLowerCase();

		// Jika kategori tiket adalah Peminjaman Kendaraan, tampilkan label khusus
		if (ticket.category && ticket.category.toLowerCase() === 'peminjaman kendaraan') {
			if (status === 'on progress') return 'dipinjam';
			if (status === 'done') return 'dikembalikan';
		}

		// Untuk kategori lain, kembalikan status asli
		return status;
	}

	// Fungsi untuk edit nominal (khusus role HRD dan General Manager)
	function openEditNominalModal(ticket) {
		if (!isHrdOrGm()) {
			alert('Fitur ini hanya dapat diakses oleh HRD dan General Manager.');
			return;
		}

		if (ticket.category !== 'Pengajuan BBM') {
			alert('Edit nominal hanya berlaku untuk kategori Pengajuan BBM.');
			return;
		}

		console.log('Opening edit modal for ticket:', ticket);
		console.log('Ticket ID:', ticket.id, 'Raw ID:', ticket.rawId);
		console.log('Ticket object keys:', Object.keys(ticket));

		// Pastikan ticket object ada dan valid
		if (!ticket || typeof ticket !== 'object') {
			alert('Data tiket tidak valid');
			return;
		}

		editingTicket = { ...ticket }; // Clone object untuk keamanan
		editNominalForm = {
			id: ticket.rawId || ticket.id, // Gunakan rawId jika ada
			submission_amount: ticket.submission_amount || ''
		};
		showEditNominalModal = true;

		// Add event listener for Esc key
		window.addEventListener('keydown', handleEditNominalModalEsc);
	}

	function closeEditNominalModal() {
		showEditNominalModal = false;
		editingTicket = null;
		editNominalForm = {
			id: '',
			submission_amount: ''
		};
		window.removeEventListener('keydown', handleEditNominalModalEsc);
	}

	function handleEditNominalModalEsc(e) {
		if (e.key === 'Escape') {
			closeEditNominalModal();
		}
	}

	async function submitEditNominal() {
		isLoading = true;

		if (
			!editNominalForm.submission_amount ||
			isNaN(parseFloat(editNominalForm.submission_amount))
		) {
			alert('Nominal pengajuan harus berupa angka yang valid');
			isLoading = false;
			return;
		}

		try {
			console.log('Updating ticket ID:', editNominalForm.id);
			console.log('New amount:', editNominalForm.submission_amount);
			console.log('Editing ticket object:', editingTicket);

			// Gunakan rawId jika ada, atau id biasa, dengan safety check
			let ticketRawId;
			if (editingTicket && typeof editingTicket === 'object') {
				ticketRawId = editingTicket.rawId || editingTicket.id || editNominalForm.id;
			} else {
				ticketRawId = editNominalForm.id;
			}

			console.log('Using raw ID:', ticketRawId);

			if (!ticketRawId) {
				throw new Error('Tidak dapat menemukan ID tiket yang valid');
			}

			const response = await axios.patch(
				`${DIRECTUS_URL}/items/TicketForm/${ticketRawId}`,
				{
					submission_amount: parseFloat(editNominalForm.submission_amount)
				},
				{
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
				}
			);

			console.log('Update response:', response);

			if (response.status === 200) {
				// Update ticket in local array
				const ticketIndex = tickets.findIndex((t) => t.id === editingTicket.id);
				if (ticketIndex !== -1) {
					tickets[ticketIndex] = {
						...tickets[ticketIndex],
						submission_amount: parseFloat(editNominalForm.submission_amount)
					};
					tickets = [...tickets]; // Trigger reactivity
					console.log('Updated local ticket:', tickets[ticketIndex]);

					// Dispatch event untuk update parent component jika ada
					const updatedTicket = tickets[ticketIndex];
					console.log('Dispatching updated ticket:', updatedTicket);
					console.log('Updated ticket has rawId:', !!updatedTicket.rawId);
					console.log('Updated ticket has id:', !!updatedTicket.id);

					dispatch('ticketUpdated', {
						updatedTicket: updatedTicket,
						type: 'nominal_updated'
					});
				} else {
					console.warn('Ticket not found in local array for update');

					// Dispatch event dengan editingTicket jika tidak ditemukan di array lokal
					const fallbackTicket = {
						...editingTicket,
						submission_amount: parseFloat(editNominalForm.submission_amount)
					};
					console.log('Dispatching fallback ticket:', fallbackTicket);
					console.log('Fallback ticket has rawId:', !!fallbackTicket.rawId);
					console.log('Fallback ticket has id:', !!fallbackTicket.id);

					dispatch('ticketUpdated', {
						updatedTicket: fallbackTicket,
						type: 'nominal_updated'
					});
				}

				alert('Nominal pengajuan berhasil diperbarui');
				closeEditNominalModal();
			}
		} catch (error) {
			console.error('Error updating nominal:', error);
			console.error('Error response:', error.response?.data);

			// Lebih spesifik error handling
			if (error.response?.status === 404) {
				alert('Tiket tidak ditemukan. ID mungkin tidak valid.');
			} else if (error.response?.status === 403) {
				alert('Tidak memiliki izin untuk mengubah data ini.');
			} else if (error.response?.status === 401) {
				alert('Token autentikasi tidak valid. Silakan login ulang.');
			} else {
				alert(`Gagal memperbarui nominal pengajuan: ${error.message}`);
			}
		} finally {
			isLoading = false;
		}
	}

	// Fungsi untuk rekapitulasi (khusus role HRD dan General Manager)
	async function openRekapModal() {
		if (!isHrdOrGm()) {
			alert('Fitur ini hanya dapat diakses oleh HRD dan General Manager.');
			return;
		}

		isLoading = true;
		showRekapModal = true;

		try {
			// Fetch all BBM tickets
			const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
				params: {
					filter: {
						category: { _eq: 'Pengajuan BBM' }
					},
					limit: -1 // Get all records
				}
			});

			if (response.data && response.data.data) {
				const bbmTickets = response.data.data;
				calculateRekapData(bbmTickets);
			}
		} catch (error) {
			console.error('Error fetching BBM data for rekap:', error);
			alert('Gagal mengambil data untuk rekapitulasi');
		} finally {
			isLoading = false;
		}
	}

	function calculateRekapData(bbmTickets) {
		// Calculate monthly totals
		const monthlyData = {};
		const vehicleData = {};
		let totalNominal = 0;
		let totalKilometer = 0;

		bbmTickets.forEach((ticket) => {
			const date = new Date(ticket.date_created || ticket.date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const monthName = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

			// Monthly totals
			if (!monthlyData[monthKey]) {
				monthlyData[monthKey] = {
					month: monthName,
					count: 0,
					totalNominal: 0,
					totalKilometer: 0,
					details: []
				};
			}
			monthlyData[monthKey].count++;

			const nominal = parseFloat(ticket.submission_amount) || 0;
			const kilometer = parseFloat(ticket.initial_kilometer) || 0;

			monthlyData[monthKey].totalNominal += nominal;
			monthlyData[monthKey].totalKilometer += kilometer;
			monthlyData[monthKey].details.push({
				id: ticket.id,
				name: ticket.name,
				vehicle: ticket.vehicle_type || '-',
				nominal: nominal,
				kilometer: kilometer,
				date: new Date(ticket.date_created || ticket.date).toLocaleDateString('id-ID')
			});

			// Vehicle totals
			const vehicleType = ticket.vehicle_type || 'Tidak Diketahui';
			if (!vehicleData[vehicleType]) {
				vehicleData[vehicleType] = {
					vehicle: vehicleType,
					count: 0,
					totalNominal: 0,
					totalKilometer: 0,
					details: []
				};
			}
			vehicleData[vehicleType].count++;
			vehicleData[vehicleType].totalNominal += nominal;
			vehicleData[vehicleType].totalKilometer += kilometer;
			vehicleData[vehicleType].details.push({
				id: ticket.id,
				name: ticket.name,
				nominal: nominal,
				kilometer: kilometer,
				date: new Date(ticket.date_created || ticket.date).toLocaleDateString('id-ID')
			});

			// Grand totals
			totalNominal += nominal;
			totalKilometer += kilometer;
		});

		// Convert to arrays and sort
		const monthlyTotal = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
		const vehicleTotal = Object.values(vehicleData).sort((a, b) => b.count - a.count);

		rekapData = {
			monthlyTotal,
			vehicleTotal,
			totalNominal,
			totalKilometer
		};
	}

	function closeRekapModal() {
		showRekapModal = false;
		rekapData = {
			monthlyTotal: [],
			vehicleTotal: [],
			totalNominal: 0,
			totalKilometer: 0
		};
	}

	// Fungsi untuk rekapitulasi E-Tol (khusus role HRD dan General Manager)
	async function openRekapEtolModal() {
		if (rekapitulasiEtol) {
			await rekapitulasiEtol.openRekapEtolModal();
		}
	}

	// Helper function to check if user is HRD or General Manager
	function isHrdOrGm() {
		if (typeof window !== 'undefined') {
			const userData = JSON.parse(localStorage.getItem('userData') || '{}');
			const userEmail = userData.email;
			const userDepartment = userData.department;

			console.log('Current user email:', userEmail); // Debug log
			console.log('Current user department:', userDepartment); // Debug log
			console.log('Full userData:', userData); // Debug log

			// Check by email first (more reliable)
			const hrdEmails = ['hrd@eltama.com', 'hrdex@eltama.com'];
			const gmEmails = ['general.manager@eltama.com'];

			const isHrdByEmail =
				userEmail && hrdEmails.some((email) => email.toLowerCase() === userEmail.toLowerCase());
			const isGmByEmail =
				userEmail && gmEmails.some((email) => email.toLowerCase() === userEmail.toLowerCase());

			// Also check by department as fallback
			const isHrdByDept = userDepartment && userDepartment.toUpperCase() === 'HRD';
			const isGmByDept =
				userDepartment &&
				(userDepartment.toUpperCase() === 'MANAGEMENT' ||
					userDepartment.toUpperCase() === 'GENERAL MANAGER' ||
					userDepartment.toUpperCase() === 'GM');

			const isHrd = isHrdByEmail || isHrdByDept;
			const isGm = isGmByEmail || isGmByDept;

			console.log('Is HRD (by email):', isHrdByEmail, 'Is HRD (by dept):', isHrdByDept); // Debug log
			console.log('Is GM (by email):', isGmByEmail, 'Is GM (by dept):', isGmByDept); // Debug log
			console.log('Final - Is HRD:', isHrd, 'Is GM:', isGm); // Debug log

			return isHrd || isGm;
		}
		return false;
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

	// Fungsi export PDF untuk kategori Pengajuan BBM
	function exportFuelRequestPDF(ticket) {
		if (!ticket || ticket.category?.toLowerCase() !== 'pengajuan bbm') {
			alert('Fungsi export PDF hanya tersedia untuk kategori Pengajuan BBM');
			return;
		}

		// Function to extract first name from full name
		function getFirstName(fullName) {
			if (!fullName) return '';
			const nameParts = fullName.split(' ');
			// Ambil maksimal 2 kata pertama (first name + second name)
			if (nameParts.length >= 2) {
				return `${nameParts[0]} ${nameParts[1]}`;
			}
			return nameParts[0]; // Jika hanya ada 1 kata, return nama tersebut
		}

		// Function to get previous kilometer data
		async function getPreviousKilometerForPDF(vehicleInfo) {
			if (!vehicleInfo || typeof vehicleInfo !== 'string') return 'Tidak ada data';

			try {
				const vehicleMatch = vehicleInfo.match(/^([^-]+)/);
				if (!vehicleMatch) return 'Tidak ada data';

				const vehicleIdentifier = vehicleMatch[1].trim();

				const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
					headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
					params: {
						filter: {
							category: { _eq: 'Pengajuan BBM' },
							vehicle_type: { _contains: vehicleIdentifier },
							status: { _in: ['Done', 'On Progress'] }
						},
						sort: ['-date_created'],
						limit: 10
					}
				});

				if (response.data && response.data.data && response.data.data.length > 0) {
					const filteredTickets = response.data.data.filter(
						(t) => t.id !== ticket.id && t.initial_kilometer
					);

					if (filteredTickets.length > 0) {
						const lastTicket = filteredTickets[0];
						return parseInt(lastTicket.initial_kilometer).toLocaleString('id-ID');
					}
				}
				return 'Tidak ada data';
			} catch (error) {
				console.error('Error fetching previous kilometer:', error);
				return 'Error';
			}
		}

		// Generate PDF with async data
		async function generatePDF() {
			try {
				// Get previous kilometer data first
				const previousKilometer = await getPreviousKilometerForPDF(ticket.vehicle_type);

				// Create new PDF with half-A4 portrait format (148x210 mm)
				const doc = new jsPDF({
					orientation: 'portrait',
					unit: 'mm',
					format: [148, 210]
				});

				// Calculate usable width with margins
				const pageWidth = doc.internal.pageSize.getWidth();
				const pageHeight = doc.internal.pageSize.getHeight();
				const margin = 8;
				const usableWidth = pageWidth - 2 * margin;
				const leftColumnWidth = usableWidth * 0.5; // 50% untuk kolom kiri
				const rightColumnWidth = usableWidth * 0.5; // 50% untuk kolom kanan
				const rightColumnX = margin + leftColumnWidth; // Tidak ada gap, langsung setelah kolom kiri

				// LEFT COLUMN positions
				const leftLabelWidth = 25; // Width for left column labels
				const leftValueX = margin + leftLabelWidth; // X position for left column values

				// RIGHT COLUMN positions
				const rightLabelWidth = 25; // Width for right column labels (sama dengan kiri)
				const rightValueX = rightColumnX + rightLabelWidth; // X position for right column values

				let yPos = 34 + 4; // Adjusted untuk tanggal yang diturunkan
				// Set font
				doc.setFont('helvetica');

				// Header - margin atas 5mm dari tepi halaman
				doc.setFontSize(12);
				doc.setFont('helvetica', 'bold');
				doc.text('PT. ELTAMA PRIMA INDO', pageWidth / 2, 5, { align: 'center' });

				// Subheader dengan alamat
				doc.setFontSize(8);
				doc.setFont('helvetica', 'normal');
				doc.text(
					'Jl. Raya Pasportel, Gang Nangka No.88, RW.3, Bojong Kulur, Kec. Gn. Putri',
					pageWidth / 2,
					9,
					{ align: 'center' }
				);
				doc.text('Kabupaten Bogor, Jawa Barat 16969. Telp (021)827 45454', pageWidth / 2, 12, {
					align: 'center'
				});
				doc.text(
					'Email : sales@eltamaprimaindo.com Website : www.eltamaprimaindo.com www.foxaprint.com',
					pageWidth / 2,
					15,
					{ align: 'center' }
				);

				// Title dengan background
				doc.setFillColor(200, 220, 255); // Light blue background
				doc.rect(margin, 18, usableWidth, 6, 'F');
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(10);
				doc.text('PENGAJUAN ANGGARAN BBM', pageWidth / 2, 22, { align: 'center' });

				// Tanggal di kanan atas - diturunkan posisinya
				const currentDate = new Date().toLocaleDateString('id-ID', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric'
				});
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(8);
				doc.text(`Tanggal`, pageWidth - margin, 28, { align: 'right' });
				doc.text(`${currentDate}`, pageWidth - margin, 31, { align: 'right' });

				// Mulai positioning yang disejajarkan
				let startY = yPos;
				let leftY = startY; // Kolom kiri mulai dari startY
				let rightY = startY; // Kolom kanan mulai dari startY yang sama
				const lineHeight = 4.5;

				// KOLOM KIRI - mulai dari leftY
				doc.setFont('helvetica', 'bold');
				doc.setFontSize(8);

				// ID
				doc.text('ID', margin, leftY);
				doc.text(':', leftValueX - 2, leftY);
				doc.setFont('helvetica', 'normal');
				doc.text(ticket.id.toString(), leftValueX, leftY);
				leftY += lineHeight;

				// Nama Pengaju dengan text wrapping
				doc.setFont('helvetica', 'bold');
				doc.text('Nama Pengaju', margin, leftY);
				doc.text(':', leftValueX - 2, leftY);
				doc.setFont('helvetica', 'normal');
				const namaPengaju = ticket.name || '-';
				const leftMaxWidth = leftColumnWidth - leftLabelWidth - 5; // Width untuk wrapping
				const splitNama = doc.splitTextToSize(namaPengaju, leftMaxWidth);
				doc.text(splitNama[0], leftValueX, leftY);
				leftY += lineHeight;

				// Jika nama terlalu panjang, tampilkan baris berikutnya
				if (splitNama.length > 1) {
					for (let i = 1; i < splitNama.length; i++) {
						doc.text(splitNama[i], leftValueX, leftY);
						leftY += lineHeight;
					}
				}

				// Nama Kendaraan
				doc.setFont('helvetica', 'bold');
				doc.text('Nama Kendaraan', margin, leftY);
				doc.text(':', leftValueX - 2, leftY);
				doc.setFont('helvetica', 'normal');
				const vehicleInfo = ticket.vehicle_type || 'Tidak Diketahui';
				doc.text(vehicleInfo, leftValueX, leftY);
				leftY += lineHeight;

				// Data BBM header
				doc.setFont('helvetica', 'bold');
				doc.text('Data BBM', margin, leftY);
				leftY += 4;

				// KM Awal
				doc.setFont('helvetica', 'normal');
				doc.text('KM Awal', margin, leftY);
				doc.text(':', leftValueX - 2, leftY);
				const currentKm = ticket.initial_kilometer || '-';
				const kmText = `${previousKilometer} -> ${currentKm} km`;
				doc.text(kmText, leftValueX, leftY);
				leftY += lineHeight;

				// Bensin Awal
				doc.text('Bensin Awal', margin, leftY);
				doc.text(':', leftValueX - 2, leftY);
				doc.text(ticket.initial_fuel || '-', leftValueX, leftY);
				leftY += lineHeight;

				// Jumlah Pengajuan
				doc.setFont('helvetica', 'bold');
				doc.text('Jumlah Pengajuan', margin, leftY);
				doc.text(':', leftValueX + 1, leftY);
				doc.setFont('helvetica', 'normal');
				const nominalFormatted = ticket.submission_amount
					? 'Rp ' + parseFloat(ticket.submission_amount).toLocaleString('id-ID')
					: 'Rp -';
				doc.text(nominalFormatted, leftValueX + 2, leftY);

				// KOLOM KANAN - mulai dari rightY yang sama dengan startY
				const rightMaxWidth = rightColumnWidth - rightLabelWidth - 5; // Width untuk wrapping

				// Tujuan
				doc.setFont('helvetica', 'bold');
				doc.text('Tujuan', rightColumnX, rightY);
				doc.text(':', rightValueX - 2, rightY);
				doc.setFont('helvetica', 'normal');
				const tujuan = ticket.destination || ticket.desc || ticket.ticket || '-';
				const splitTujuan = doc.splitTextToSize(tujuan, rightMaxWidth);
				doc.text(splitTujuan[0], rightValueX, rightY);
				rightY += lineHeight;

				// Tampilkan baris berikutnya jika ada
				if (splitTujuan.length > 1) {
					for (let i = 1; i < splitTujuan.length; i++) {
						doc.text(splitTujuan[i], rightValueX, rightY);
						rightY += lineHeight;
					}
				}

				// Penerima Dana
				doc.setFont('helvetica', 'bold');
				doc.text('Penerima Dana', rightColumnX, rightY);
				doc.text(':', rightValueX - 2, rightY);
				doc.setFont('helvetica', 'normal');
				const penerimaDana = ticket.name || '-';
				const splitPenerima = doc.splitTextToSize(penerimaDana, rightMaxWidth);
				doc.text(splitPenerima[0], rightValueX, rightY);
				rightY += lineHeight;

				// Tampilkan baris berikutnya jika ada
				if (splitPenerima.length > 1) {
					for (let i = 1; i < splitPenerima.length; i++) {
						doc.text(splitPenerima[i], rightValueX, rightY);
						rightY += lineHeight;
					}
				}

				// Cash
				doc.setFont('helvetica', 'bold');
				doc.text('Cash', rightColumnX, rightY);
				rightY += lineHeight;

				// Checkbox SESUAI SYARAT
				doc.rect(rightColumnX, rightY, 3, 3);
				doc.setFont('helvetica', 'bold');
				doc.text('SESUAI SYARAT', rightColumnX + 5, rightY + 2);
				doc.setFont('helvetica', 'normal');
				doc.setFontSize(6);
				doc.text('Syarat dapat berupa limit budget, dll', rightColumnX, rightY + 6);
				doc.setFontSize(8);

				// Tentukan Y terbesar untuk mulai tanda tangan
				const maxYPos = Math.max(leftY, rightY + 8);
				let signatureY = Math.min(maxYPos + 6, 145);

				// Tanda tangan section
				doc.setFont('helvetica', 'normal');
				doc.text('Hormat kami,', margin, signatureY);
				signatureY += 6;

				// Calculate positions for 4 signatures in a single row
				const signatureWidth = usableWidth / 4;
				const signaturePositions = [
					margin + signatureWidth / 2,
					margin + signatureWidth * 1.5,
					margin + signatureWidth * 2.5,
					margin + signatureWidth * 3.5
				];

				// Get first name for the signature
				const firstName = getFirstName(ticket.name);

				// Signature titles
				doc.setFontSize(7);
				doc.text('Yang Mengajukan,', signaturePositions[0], signatureY, { align: 'center' });
				doc.text('Disetujui,', signaturePositions[1], signatureY, { align: 'center' });
				doc.text('Mengetahui,', signaturePositions[2], signatureY, { align: 'center' });
				doc.text('Manager Finance,', signaturePositions[3], signatureY, { align: 'center' });

				signatureY += 10;

				// Names below signature lines
				doc.text(`(${firstName || '...........'})`, signaturePositions[0], signatureY, {
					align: 'center'
				});
				doc.text('(............)', signaturePositions[1], signatureY, { align: 'center' });
				doc.text('(............)', signaturePositions[2], signatureY, { align: 'center' });
				doc.text('(............)', signaturePositions[3], signatureY, { align: 'center' });

				signatureY += 3;

				// Position/title labels
				doc.setFontSize(6);
				doc.text('Karyawan', signaturePositions[0], signatureY, { align: 'center' });
				doc.text('HRD      ', signaturePositions[1], signatureY, { align: 'center' });
				doc.text('Manajemen', signaturePositions[2], signatureY, { align: 'center' });

				// Add invisible border to enforce margins during printing
				doc.setDrawColor(255, 255, 255);
				doc.setLineWidth(0.1);
				doc.rect(0, 0, pageWidth, pageHeight);

				// ...setelah selesai generate PDF...
				const fileName = `Pengajuan BBM ${namaPengaju} ${ticket.id}.pdf`;
				doc.save(fileName); // Download otomatis dengan nama sesuai permintaan

				// Show success message
				alert('Preview PDF berhasil dibuka!');
			} catch (error) {
				console.error('Error generating PDF:', error);
				alert('Gagal membuat PDF. Silakan coba lagi.');
			}
		}

		// Call the async function to generate PDF
		generatePDF();
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
			const nameParts = fullName.split(' ');
			// Ambil maksimal 2 kata pertama (first name + second name)
			if (nameParts.length >= 2) {
				return `${nameParts[0]} ${nameParts[1]}`;
			}
			return nameParts[0]; // Jika hanya ada 1 kata, return nama tersebut
		}

		try {
			// Create new PDF with half-A4 portrait format (148x210 mm)
			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: [148, 210]
			});

			// Calculate usable width with margins
			const pageWidth = doc.internal.pageSize.getWidth();
			const pageHeight = doc.internal.pageSize.getHeight();
			const margin = 10;
			const usableWidth = pageWidth - 2 * margin;

			// Set font
			doc.setFont('helvetica');

			// Header - margin atas 7mm dari tepi halaman
			doc.setFontSize(12); // Reduced font size
			doc.setFont('helvetica', 'bold');
			doc.text('SURAT IZIN KELUAR', pageWidth / 2, 7, { align: 'center' }); // Margin atas 7mm

			// Garis bawah header - 5mm di bawah teks header
			doc.setDrawColor(0, 0, 0);
			doc.setLineWidth(0.5);
			doc.line(margin, 12, pageWidth - margin, 12); // 5mm di bawah teks header (7+5=12)

			// Reset font
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8); // Reduced font size for better fit

			// Informasi Perusahaan - compressed spacing
			doc.setFont('helvetica', 'bold');
			doc.text('PT. ELTAMA PRIMA INDO', margin, 18); // Adjusted position
			doc.setFont('helvetica', 'normal');
			doc.text(
				'Jl. Raya Pasportel, Gang Nangka No.88, RW.3, Bojong Kulur, Kec. Gn. Putri',
				margin,
				22 // Adjusted position
			);
			doc.text('Kabupaten Bogor, Jawa Barat 16969', margin, 26); // Adjusted position
			doc.text('Telp: (021) 827 45454', margin, 30); // Adjusted position

			// Tanggal surat - aligned to the right
			const currentDate = new Date().toLocaleDateString('id-ID', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
			doc.text(`Bogor, ${currentDate}`, pageWidth - margin, 30, { align: 'right' });

			// Tambahkan Dokumen ID dan Dicetak pada tepat di bawah tanggal, rata kanan
			doc.text(`Dokumen ID: ${ticket.id}`, pageWidth - margin, 34, { align: 'right' });
			doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, 38, {
				align: 'right'
			});

			// Konten surat - compressed spacing
			let yPos = 38; // Adjusted position

			doc.text('Yang bertanda tangan di bawah ini:', margin, yPos);
			yPos += 5; // Reduced from 6 to 5

			// Data karyawan - using full width
			const labelWidth = 25; // Width for labels - reduced from 30 to 25
			const valueX = margin + labelWidth; // X position for values

			doc.text(`Nama`, margin, yPos);
			doc.text(`: ${ticket.name || '-'}`, valueX, yPos);
			yPos += 4; // Reduced from 5 to 4

			doc.text(`Divisi`, margin, yPos);
			doc.text(`: ${ticket.division || '-'}`, valueX, yPos);
			yPos += 4; // Reduced from 5 to 4

			doc.text(`Email`, margin, yPos);
			doc.text(`: ${ticket.email || '-'}`, valueX, yPos);
			yPos += 6; // Reduced from 8 to 6

			doc.text('Dengan ini mengajukan izin keluar dengan rincian sebagai berikut:', margin, yPos);
			yPos += 5; // Reduced from 6 to 5

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

			doc.text(`Jam Keluar`, margin, yPos);
			doc.text(`: ${departureTime}`, valueX, yPos);
			yPos += 4; // Reduced from 5 to 4

			doc.text(`Estimasi Kembali`, margin, yPos);
			doc.text(`: ${returnTime}`, valueX, yPos);
			yPos += 4; // Reduced from 5 to 4

			doc.text(`Keperluan`, margin, yPos);

			// Handle multiline purpose text with proper wrapping
			// Fixed bug: Ensure text wraps within margins by using correct width calculation
			const purposeText = ticket.ticket || '-';
			// Use strict width calculation to ensure text stays within margins
			const strictWidth = usableWidth - (valueX - margin) - 2; // Subtract 2mm for safety margin
			const splitPurpose = doc.splitTextToSize(purposeText, strictWidth);

			doc.text(`: ${splitPurpose[0]}`, valueX, yPos);

			// If purpose text has multiple lines
			if (splitPurpose.length > 1) {
				for (let i = 1; i < splitPurpose.length; i++) {
					yPos += 4; // Reduced from 5 to 4
					doc.text(`${splitPurpose[i]}`, valueX, yPos);
				}
			}

			yPos += 8; // Reduced from 10 to 8

			// Tanda tangan section
			doc.text('Hormat kami,', margin, yPos);
			yPos += 8; // Reduced from 10 to 8

			// Calculate positions for 4 signatures in a single row
			const signatureWidth = usableWidth / 4;
			const signaturePositions = [
				margin + signatureWidth / 2,
				margin + signatureWidth * 1.5,
				margin + signatureWidth * 2.5,
				margin + signatureWidth * 3.5
			];

			// Get first name for the signature
			const firstName = getFirstName(ticket.name);

			// Signature titles
			doc.setFontSize(7); // Reduced from 8 to 7
			doc.text('Yang Mengajukan,', signaturePositions[0], yPos, { align: 'center' });
			doc.text('Atasan Divisi,', signaturePositions[1], yPos, { align: 'center' });
			doc.text('HRD,', signaturePositions[2], yPos, { align: 'center' });
			doc.text('Security,', signaturePositions[3], yPos, { align: 'center' });

			yPos += 12; // Reduced from 15 to 12

			// Names below signature lines
			doc.text(`(${firstName || '...........'})`, signaturePositions[0], yPos, { align: 'center' });
			doc.text('(............)', signaturePositions[1], yPos, { align: 'center' });
			doc.text('(............)', signaturePositions[2], yPos, { align: 'center' });
			doc.text('(............)', signaturePositions[3], yPos, { align: 'center' });

			yPos += 4; // Reduced from 5 to 4

			// Position/title labels
			doc.setFontSize(6); // Reduced from 7 to 6
			doc.text('Karyawan', signaturePositions[0], yPos, { align: 'center' });
			doc.text('Menyetujui', signaturePositions[1], yPos, { align: 'center' });
			doc.text('Mengetahui', signaturePositions[2], yPos, { align: 'center' });
			doc.text('Pemeriksaan', signaturePositions[3], yPos, { align: 'center' });

			// Add invisible border to enforce margins during printing
			doc.setDrawColor(255, 255, 255); // White color (invisible)
			doc.setLineWidth(0.1);
			doc.rect(0, 0, pageWidth, pageHeight);

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

					// First apply search filter
					let matchesSearch = false;
					if (searchCriteria === 'all') {
						matchesSearch =
							(t.id || '').toString().toLowerCase().includes(query) ||
							(t.name || '').toLowerCase().includes(query) ||
							(t.division || '').toLowerCase().includes(query) ||
							(t.priority || '').toLowerCase().includes(query) ||
							(t.status || '').toLowerCase().includes(query) ||
							(t.department || t.target_department || '').toLowerCase().includes(query) ||
							(t.desc || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'id') {
						matchesSearch = (t.id || '').toString().toLowerCase().includes(query);
					} else if (searchCriteria === 'name') {
						matchesSearch = (t.name || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'division') {
						matchesSearch = (t.division || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'priority') {
						matchesSearch = (t.priority || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'status') {
						matchesSearch = (t.status || '').toLowerCase().includes(query);
					} else if (searchCriteria === 'department') {
						matchesSearch = (t.department || t.target_department || '')
							.toLowerCase()
							.includes(query);
					}

					// Apply category filter
					const matchesCategory =
						categoryFilter === 'all' ||
						(t.category || '').toLowerCase() === categoryFilter.toLowerCase();

					// Apply date range filter
					const matchesDateRange = isWithinDateRange(t.date_created || t.date);

					return matchesSearch && matchesCategory && matchesDateRange;
				})
			: tickets.filter((t) => {
					// Apply category filter
					const matchesCategory =
						categoryFilter === 'all' ||
						(t.category || '').toLowerCase() === categoryFilter.toLowerCase();

					// Apply date range filter
					const matchesDateRange = isWithinDateRange(t.date_created || t.date);

					return matchesCategory && matchesDateRange;
				});

	// Mobile search filtering
	$: mobileFiltered =
		isMobile && mobileSearchQuery
			? tickets.filter((t) => {
					const query = mobileSearchQuery.toLowerCase();

					// First apply search filter
					const matchesSearch =
						(t.status || '').toLowerCase().includes(query) ||
						(t.department || t.target_department || '').toLowerCase().includes(query) ||
						(t.desc || '').toLowerCase().includes(query) ||
						(t.id || '').toString().toLowerCase().includes(query) ||
						(t.name || '').toLowerCase().includes(query) ||
						(t.division || '').toLowerCase().includes(query) ||
						(t.priority || '').toLowerCase().includes(query);

					// Apply category filter
					const matchesCategory =
						categoryFilter === 'all' ||
						(t.category || '').toLowerCase() === categoryFilter.toLowerCase();

					// Apply date range filter
					const matchesDateRange = isWithinDateRange(t.date_created || t.date);

					return matchesSearch && matchesCategory && matchesDateRange;
				})
			: tickets.filter((t) => {
					// Apply category filter
					const matchesCategory =
						categoryFilter === 'all' ||
						(t.category || '').toLowerCase() === categoryFilter.toLowerCase();

					// Apply date range filter
					const matchesDateRange = isWithinDateRange(t.date_created || t.date);

					return matchesCategory && matchesDateRange;
				});

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
		<div class="mb-4 md:hidden space-y-3">
			<!-- Mobile Search Input -->
			<input
				type="text"
				placeholder="Cari berdasarkan ID, nama, divisi, prioritas, status, departemen, atau deskripsi..."
				class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
				bind:value={mobileSearchQuery}
				on:input={handleMobileSearch}
			/>

			<!-- Mobile Filter Row -->
			<div class="flex gap-2">
				<!-- Category Filter -->
				<select
					class="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
					bind:value={categoryFilter}
					on:change={handleCategoryFilterChange}
				>
					<option value="all">Semua Kategori</option>
					<option value="sistem">Sistem</option>
					<option value="asset">Asset</option>
					<option value="izin keluar">Izin Keluar</option>
					<option value="peminjaman kendaraan">Peminjaman Kendaraan</option>
					<option value="pengajuan bbm">Pengajuan BBM</option>
					<option value="lainnya">Lainnya</option>
				</select>

				<!-- Date Range Filter -->
				<select
					class="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
					bind:value={dateRangeFilter}
					on:change={handleDateRangeFilterChange}
				>
					<option value="all">Semua Waktu</option>
					<option value="today">Hari Ini</option>
					<option value="week">7 Hari</option>
					<option value="month">30 Hari</option>
					<option value="custom">Kustom</option>
				</select>
			</div>

			<!-- Custom Date Range for Mobile -->
			{#if dateRangeFilter === 'custom'}
				<div class="flex gap-2">
					<div class="flex-1">
						<span class="block text-xs text-gray-600 mb-1">Dari:</span>
						<input
							type="date"
							class="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
							bind:value={customStartDate}
							on:change={handleCustomDateChange}
						/>
					</div>
					<div class="flex-1">
						<span class="block text-xs text-gray-600 mb-1">Sampai:</span>
						<input
							type="date"
							class="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
							bind:value={customEndDate}
							on:change={handleCustomDateChange}
						/>
					</div>
				</div>
			{/if}

			<!-- HRD/GM Features for Mobile -->
			{#if isHrdOrGm()}
				<button
					type="button"
					class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium mb-2"
					on:click={openRekapModal}
					disabled={isLoading}
				>
					📊 Rekapitulasi BBM
				</button>
				<button
					type="button"
					class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
					on:click={openRekapEtolModal}
					disabled={isLoading}
				>
					🎫 Rekapitulasi E-Tol
				</button>
			{/if}
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
				<option value="vehicle">Kendaraan</option>
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
					type="button"
					class="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
					on:click={() => {
						desktopSearchQuery = '';
						handleDesktopSearch({ target: { value: '' } });
					}}
				>
					Clear
				</button>
			{/if}
		</div>

		<!-- Filter Section -->
		<div class="flex gap-2 mb-3 flex-wrap">
			<!-- Category Filter -->
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-gray-700">Kategori:</span>
				<select
					class="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-w-[150px]"
					bind:value={categoryFilter}
					on:change={handleCategoryFilterChange}
				>
					<option value="all">Semua Kategori</option>
					<option value="sistem">Sistem</option>
					<option value="asset">Asset</option>
					<option value="izin keluar">Izin Keluar</option>
					<option value="peminjaman kendaraan">Peminjaman Kendaraan</option>
					<option value="pengajuan bbm">Pengajuan BBM</option>
					<option value="lainnya">Lainnya</option>
				</select>
			</div>

			<!-- Date Range Filter -->
			<div class="flex items-center gap-2">
				<span class="text-sm font-medium text-gray-700">Periode:</span>
				<select
					class="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 min-w-[120px]"
					bind:value={dateRangeFilter}
					on:change={handleDateRangeFilterChange}
				>
					<option value="all">Semua Waktu</option>
					<option value="today">Hari Ini</option>
					<option value="week">7 Hari Terakhir</option>
					<option value="month">30 Hari Terakhir</option>
					<option value="custom">Kustom</option>
				</select>
			</div>

			<!-- Custom Date Range Inputs -->
			{#if dateRangeFilter === 'custom'}
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-gray-700">Dari:</span>
					<input
						type="date"
						class="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
						bind:value={customStartDate}
						on:change={handleCustomDateChange}
					/>
					<span class="text-sm font-medium text-gray-700">Sampai:</span>
					<input
						type="date"
						class="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
						bind:value={customEndDate}
						on:change={handleCustomDateChange}
					/>
				</div>
			{/if}

			<!-- HRD/GM Features -->
			{#if isHrdOrGm()}
				<div class="flex items-center gap-2 ml-auto">
					<button
						type="button"
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
						on:click={openRekapModal}
						disabled={isLoading}
					>
						📊 Rekapitulasi BBM
					</button>
					<button
						type="button"
						class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
						on:click={openRekapEtolModal}
						disabled={isLoading}
					>
						🎫 Rekapitulasi E-Tol
					</button>
				</div>
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
					{#if showCategories}
						<th class="text-center hidden md:table-cell">Kategori</th>
					{/if}

					<!-- Desktop columns (hidden on mobile) -->
					{#if showPriority && !isAdmin}
						<th class="text-center hidden md:table-cell">Prioritas</th>
					{/if}
					{#if isHrdAdmin}
						<th class="text-center hidden md:table-cell">Kendaraan</th>
					{:else if isAdmin && showPriority}
						<th class="text-center hidden md:table-cell">Prioritas</th>
					{/if}
					{#if showDate}
						<th class="text-center hidden md:table-cell">Tanggal</th>
					{/if}
					{#if showDepartments}
						<th class="text-center">Departemen</th>
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
						{#if showCategories}
							<td class="text-center hidden md:table-cell">{ticket.category}</td>
						{/if}

						<!-- Desktop columns (hidden on mobile) -->
						{#if showPriority && !isAdmin}
							<td class="text-center hidden md:table-cell">{ticket.priority}</td>
						{/if}
						{#if isHrdAdmin}
							<td class="text-center hidden md:table-cell">
								{#if ticket.category === 'Pengajuan BBM' || ticket.category === 'Peminjaman Kendaraan'}
									{ticket.vehicle_type || 'Tidak ada kendaraan'}
								{:else}
									-
								{/if}
							</td>
						{:else if isAdmin && showPriority}
							<td class="text-center hidden md:table-cell">{ticket.priority}</td>
						{/if}
						{#if showDate}
							<td class="text-center hidden md:table-cell">{formatDate(ticket.date)}</td>
						{/if}
						{#if showDepartments}
							<td
								class="text-center department-cell"
								title={ticket.department || ticket.target_department}
							>
								{ticket.department || ticket.target_department}
							</td>
						{/if}

						<!-- Always show Status -->
						<td class="text-center">
							{#if isAdmin}
								<button
									class={`px-2 py-1 rounded font-semibold transition 
	              					${getStatusColor(tempStatus[ticket.id] || ticket.status)}
	                				${['done', 'rejected', 'dikembalikan'].includes(getStatusBtn(ticket)) ? ' cursor-default' : ' cursor-pointer'}`}
									on:click={() => openUpdateModal(ticket)}
									disabled={updatingStatusId === ticket.id ||
										['done', 'rejected', 'dikembalikan'].includes(getStatusBtn(ticket))}
								>
									{#if getStatusBtn(ticket) === 'done'}
										Done
									{:else if getStatusBtn(ticket) === 'rejected'}
										Rejected
									{:else if getStatusBtn(ticket) === 'dipinjam'}
										Dipinjam
									{:else if getStatusBtn(ticket) === 'dikembalikan'}
										Dikembalikan
									{:else}
										Update
									{/if}
								</button>
							{:else}
								<span
									class={`inline-block px-2 py-1 rounded font-semibold text-xs ${getStatusColor(ticket.status)}`}
								>
									{#if ticket.category && ticket.category.toLowerCase() === 'peminjaman kendaraan'}
										{#if ticket.status && ticket.status.toLowerCase() === 'on progress'}
											Dipinjam
										{:else if ticket.status && ticket.status.toLowerCase() === 'done'}
											Dikembalikan
										{:else}
											{ticket.status}
										{/if}
									{:else}
										{ticket.status}
									{/if}
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
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</button>

									<!-- Edit Nominal BBM button (only for HRD/GM and BBM category) -->
									{#if isHrdOrGm() && ticket.category === 'Pengajuan BBM'}
										<span>/</span>
										<button
											class="text-yellow-600 hover:text-yellow-800 transition p-1 rounded-full hover:bg-yellow-50"
											on:click={() => openEditNominalModal(ticket)}
											title="Edit Nominal Pengajuan"
											aria-label="Edit Nominal"
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
													d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
												/>
											</svg>
										</button>
									{/if}

									<!-- Export PDF button for Izin Keluar category -->
									{#if ticket.category?.toLowerCase() === 'izin keluar'}
										<span>/</span>
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

									<!-- Export PDF button for Pengajuan BBM category (Admin) -->
									{#if ticket.category?.toLowerCase() === 'pengajuan bbm'}
										<span>/</span>
										<button
											class="text-purple-600 hover:text-purple-800 transition p-1 rounded-full hover:bg-purple-50"
											on:click={() => exportFuelRequestPDF(ticket)}
											title="Export PDF Pengajuan BBM"
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
													d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884A11.815 11.815 0 0012.05 24c-6.555 0-11.89-5.335-11.893-11.893a11.815 11.815 0 002.898-7.988"
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
		<div
			class="bg-white rounded-lg shadow-lg w-full max-w-[95vw] md:max-w-2xl p-3 max-h-[95vh] overflow-y-auto"
		>
			<div class="flex justify-between items-center mb-3">
				<h2 class="text-xl font-semibold">Update Tiket</h2>
				<button
					class="w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-500 hover:text-gray-700"
					on:click={closeUpdateModal}
				>
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
				{#if updatingTicket && updatingTicket.category && updatingTicket.category.toLowerCase() === 'peminjaman kendaraan'}
					<!-- Opsi status khusus untuk Peminjaman Kendaraan -->
					<select
						id="update-status"
						class="border rounded px-2 py-1 w-full text-sm"
						bind:value={updateForm.status}
					>
						<option value="Pending">Pending</option>
						<option value="On Progress">Dipinjam</option>
						<option value="Done">Dikembalikan</option>
						<option value="Rejected">Rejected</option>
					</select>
				{:else}
					<!-- Opsi status untuk kategori lainnya -->
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
				{/if}
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

<!-- Modal Edit Nominal BBM (hanya untuk HRD dan General Manager) -->
{#if showEditNominalModal && editingTicket}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeEditNominalModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeEditNominalModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="edit-nominal-title"
		>
			<h3 id="edit-nominal-title" class="text-xl font-bold mb-4 text-gray-800">
				Edit Nominal Pengajuan BBM
			</h3>

			<div class="mb-4">
				<p class="text-sm text-gray-600 mb-2">
					<strong>ID Tiket:</strong>
					{editingTicket.id}
				</p>
				<p class="text-sm text-gray-600 mb-2">
					<strong>Nama:</strong>
					{editingTicket.name}
				</p>
				<p class="text-sm text-gray-600 mb-4">
					<strong>Kendaraan:</strong>
					{editingTicket.vehicle_type || '-'}
				</p>
			</div>

			<div class="mb-4">
				<label for="edit-nominal-amount" class="block text-sm font-medium text-gray-700 mb-2">
					Nominal Pengajuan (Rp)
				</label>
				<input
					id="edit-nominal-amount"
					type="number"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
					bind:value={editNominalForm.submission_amount}
					placeholder="Masukkan nominal pengajuan"
					min="0"
					step="1000"
				/>
			</div>

			<div class="flex gap-3 justify-end">
				<button
					type="button"
					class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
					on:click={closeEditNominalModal}
					disabled={isLoading}
				>
					Batal
				</button>
				<button
					type="button"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					on:click={submitEditNominal}
					disabled={isLoading}
				>
					{#if isLoading}
						<span
							class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
						></span>
					{/if}
					Simpan
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal Rekapitulasi BBM (hanya untuk HRD dan General Manager) -->
{#if showRekapModal}
	<div
		class="fixed inset-0 flex items-center justify-center z-50"
		on:click={closeRekapModal}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && closeRekapModal()}
	>
		<div
			class="bg-white rounded-lg p-6 max-w-8xl w-full mx-4 shadow-2xl max-h-[70vh] overflow-y-auto"
			on:click|stopPropagation
			on:keydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			aria-labelledby="rekap-title"
		>
			<h3 id="rekap-title" class="text-2xl font-bold mb-6 text-gray-800 text-center">
				📊 Rekapitulasi Pengajuan BBM
			</h3>

			{#if isLoading}
				<div class="flex justify-center items-center py-8">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span class="ml-2 text-gray-600">Memuat data...</span>
				</div>
			{:else}
				<!-- Summary Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
					<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<h4 class="font-semibold text-blue-800 mb-2">💰 Total Nominal Pengajuan</h4>
						<p class="text-2xl font-bold text-blue-600">{formatCurrency(rekapData.totalNominal)}</p>
					</div>
					<div class="bg-green-50 p-4 rounded-lg border border-green-200">
						<h4 class="font-semibold text-green-800 mb-2">🛣️ Total Kilometer</h4>
						<p class="text-2xl font-bold text-green-600">
							{formatKilometer(rekapData.totalKilometer)} km
						</p>
					</div>
				</div>

				<!-- Monthly Summary -->
				<div class="mb-8">
					<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
						📅 Rekapitulasi Per Bulan
					</h4>
					{#if rekapData.monthlyTotal.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border border-gray-300 rounded-lg shadow-sm">
								<thead class="bg-blue-50">
									<tr>
										<th class="px-4 py-3 text-left border-b font-semibold text-blue-800">Bulan</th>
										<th class="px-4 py-3 text-center border-b font-semibold text-blue-800"
											>Jumlah Pengajuan</th
										>
										<th class="px-4 py-3 text-right border-b font-semibold text-blue-800"
											>Total Nominal</th
										>
										<th class="px-4 py-3 text-right border-b font-semibold text-blue-800"
											>Total Kilometer</th
										>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.monthlyTotal as monthly}
										<tr class="hover:bg-blue-25 transition-colors">
											<td class="px-4 py-3 border-b font-medium">{monthly.month}</td>
											<td class="px-4 py-3 text-center border-b">{monthly.count}</td>
											<td class="px-4 py-3 text-right border-b font-medium text-green-600"
												>{formatCurrency(monthly.totalNominal)}</td
											>
											<td class="px-4 py-3 text-right border-b"
												>{formatKilometer(monthly.totalKilometer)} km</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Detail pengajuan per bulan -->
						<div class="mt-6">
							<h5 class="text-md font-semibold mb-3 text-gray-700">
								📋 Detail Pengajuan Per Bulan
							</h5>
							{#each rekapData.monthlyTotal as monthly}
								<div class="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
									<h6 class="font-semibold text-gray-800 mb-2">{monthly.month}</h6>
									{#if monthly.details && monthly.details.length > 0}
										<div class="overflow-x-auto">
											<table class="w-full text-sm border border-gray-300 rounded">
												<thead class="bg-gray-100">
													<tr>
														<th class="px-3 py-2 text-left border-b">ID Tiket</th>
														<th class="px-3 py-2 text-left border-b">Nama</th>
														<th class="px-3 py-2 text-left border-b">Kendaraan</th>
														<th class="px-3 py-2 text-right border-b">Nominal</th>
														<th class="px-3 py-2 text-right border-b">Kilometer</th>
														<th class="px-3 py-2 text-center border-b">Tanggal</th>
													</tr>
												</thead>
												<tbody>
													{#each monthly.details as detail}
														<tr class="hover:bg-white">
															<td class="px-3 py-2 border-b">{detail.id}</td>
															<td class="px-3 py-2 border-b">{detail.name}</td>
															<td class="px-3 py-2 border-b">{detail.vehicle || '-'}</td>
															<td class="px-3 py-2 text-right border-b"
																>{formatCurrency(detail.nominal)}</td
															>
															<td class="px-3 py-2 text-right border-b"
																>{formatKilometer(detail.kilometer)} km</td
															>
															<td class="px-3 py-2 text-center border-b">{detail.date}</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{:else}
										<p class="text-gray-500 text-sm">Tidak ada detail pengajuan</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 text-center py-4">Tidak ada data pengajuan BBM</p>
					{/if}
				</div>

				<!-- Vehicle Summary -->
				<div class="mb-8">
					<h4 class="text-lg font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-2">
						🚗 Rekapitulasi Per Kendaraan
					</h4>
					{#if rekapData.vehicleTotal.length > 0}
						<div class="overflow-x-auto">
							<table class="w-full border border-gray-300 rounded-lg shadow-sm">
								<thead class="bg-green-50">
									<tr>
										<th class="px-4 py-3 text-left border-b font-semibold text-green-800"
											>Kendaraan</th
										>
										<th class="px-4 py-3 text-center border-b font-semibold text-green-800"
											>Jumlah Pengajuan</th
										>
										<th class="px-4 py-3 text-right border-b font-semibold text-green-800"
											>Total Nominal</th
										>
										<th class="px-4 py-3 text-right border-b font-semibold text-green-800"
											>Total Kilometer</th
										>
									</tr>
								</thead>
								<tbody>
									{#each rekapData.vehicleTotal as vehicle}
										<tr class="hover:bg-green-25 transition-colors">
											<td class="px-4 py-3 border-b font-medium">{vehicle.vehicle}</td>
											<td class="px-4 py-3 text-center border-b">{vehicle.count}</td>
											<td class="px-4 py-3 text-right border-b font-medium text-green-600"
												>{formatCurrency(vehicle.totalNominal)}</td
											>
											<td class="px-4 py-3 text-right border-b"
												>{formatKilometer(vehicle.totalKilometer)} km</td
											>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<!-- Detail pengajuan per kendaraan -->
						<div class="mt-6">
							<h5 class="text-md font-semibold mb-3 text-gray-700">
								📋 Detail Pengajuan Per Kendaraan
							</h5>
							{#each rekapData.vehicleTotal as vehicle}
								<div class="mb-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
									<h6 class="font-semibold text-gray-800 mb-2">{vehicle.vehicle}</h6>
									{#if vehicle.details && vehicle.details.length > 0}
										<div class="overflow-x-auto">
											<table class="w-full text-sm border border-gray-300 rounded">
												<thead class="bg-gray-100">
													<tr>
														<th class="px-3 py-2 text-left border-b">ID Tiket</th>
														<th class="px-3 py-2 text-left border-b">Nama</th>
														<th class="px-3 py-2 text-right border-b">Nominal</th>
														<th class="px-3 py-2 text-right border-b">Kilometer</th>
														<th class="px-3 py-2 text-center border-b">Tanggal</th>
													</tr>
												</thead>
												<tbody>
													{#each vehicle.details as detail}
														<tr class="hover:bg-white">
															<td class="px-3 py-2 border-b">{detail.id}</td>
															<td class="px-3 py-2 border-b">{detail.name}</td>
															<td class="px-3 py-2 text-right border-b"
																>{formatCurrency(detail.nominal)}</td
															>
															<td class="px-3 py-2 text-right border-b"
																>{formatKilometer(detail.kilometer)} km</td
															>
															<td class="px-3 py-2 text-center border-b">{detail.date}</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{:else}
										<p class="text-gray-500 text-sm">Tidak ada detail pengajuan</p>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-gray-500 text-center py-4">Tidak ada data pengajuan BBM</p>
					{/if}
				</div>
			{/if}

			<div class="flex justify-end mt-6">
				<button
					type="button"
					class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
					on:click={closeRekapModal}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Komponen Rekapitulasi E-Tol -->
<RekapitulasiEtol 
	bind:this={rekapitulasiEtol}
	bind:showRekapEtolModal
	isHrdOrGm={isHrdOrGm()}
/>

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

		/* Department column on mobile */
		.department-cell {
			max-width: 80px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 0.75rem;
		}

		/* Form controls in modals */
		input,
		select,
		textarea {
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
