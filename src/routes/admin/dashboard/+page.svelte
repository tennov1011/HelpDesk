<script>
	import TicketList from '$lib/component/TicketList.svelte';
	import FeedbackList from '$lib/component/FeedbackList.svelte';
	import SurveyList from '$lib/component/SurveyList.svelte';
	import TicketStats from '$lib/component/TicketStats.svelte';
	import TicketingForm from '$lib/component/TicketingForm.svelte';
	import QuestionManager from '$lib/component/QuestionManager.svelte';
	import VehicleManager from '$lib/component/VehicleManager.svelte';
	import { fetchEmployees } from '$lib/services/employee.js';
	import { onMount, onDestroy } from 'svelte';
	import axios from 'axios';
	import { goto } from '$app/navigation';
	import {
		isAuthenticated,
		userRole,
		userDepartment,
		userEmail,
		isGeneralManager,
		isHrdAdmin
	} from '$lib/services/firebaseConfig';

	let tickets = [];
	let feedbacks = [];
	let surveys = [];
	let employees = [];
	let authReady = false;
	let roleReady = false;
	let currentRole = undefined;
	let isLoggedIn = false;
	let adminDepartment;
	let unsubAuth, unsubRole, unsubDept;
	let showTicketModal = false;
	let showQuestionModal = false;
	let showVehicleModal = false;
	let ticketUpdates = [];

	// Filter state for General Manager
	let selectedDepartmentFilter = 'all';
	let availableDepartments = [];

	export let myEmployee;

	// Subscribe to user department store to track admin's department
	userDepartment.subscribe((dept) => {
		adminDepartment = dept;
	});

	// Check if current user is HRD admin using the helper function
	function checkIsHrdAdmin() {
		return isHrdAdmin($userEmail, adminDepartment);
	}

	// Fetch all tickets from Directus API
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
					id: `TK${t.id}`,
					rawId: t.id,
					date: t.date_created,
					name: t.name,
					email: t.email,
					division: t.division,
					contactPhone: t.contactPhone,
					category: t.category,
					photo_ticket: t.photo_ticket,
					ticket: t.ticket,
					desc: t.desc,
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
					department: t.target_department,
					departure_time: t.departure_time,
					estimated_return_time: t.estimated_return_time,
					vehicle_type: t.vehicle_type,
					initial_fuel: t.initial_fuel,
					initial_kilometer: t.initial_kilometer,
					submission_amount: t.submission_amount,
					destination: t.destination
				}));
		} catch (e) {
			console.error('Gagal mengambil tiket:', e);
		}
	}

	// Fetch all feedback from Directus API
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
					url: fb.url,
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

	async function fetchTicketUpdates() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/TicketUpdate', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});
			ticketUpdates = res.data.data.map((update) => ({
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

	// Fetch all surveys from Directus API
	async function fetchSurveys() {
		try {
			const res = await axios.get('https://directus.eltamaprimaindo.com/items/Survey', {
				headers: {
					Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz`
				}
			});

			console.log('Raw survey data:', res.data.data); // Debug log

			surveys = res.data.data
				.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
				.map((survey) => {
					let parsedQuestions = [];

					// Parse questions if it's a string JSON
					if (survey.questions) {
						if (typeof survey.questions === 'string') {
							try {
								parsedQuestions = JSON.parse(survey.questions);
							} catch (e) {
								console.error('Failed to parse questions JSON for survey', survey.id, ':', e);
								console.error('Raw questions data:', survey.questions);
								parsedQuestions = [];
							}
						} else if (Array.isArray(survey.questions)) {
							parsedQuestions = survey.questions;
						} else if (typeof survey.questions === 'object') {
							// Jika sudah berupa object, wrap dalam array
							parsedQuestions = [survey.questions];
						}
					}

					console.log('Processed questions for survey', survey.id, ':', parsedQuestions);

					return {
						id: `S${String(survey.id).padStart(3, '0')}`,
						rawId: survey.id,
						date: survey.date_created,
						name: survey.name,
						target_department: survey.target_department,
						division: survey.division,
						additional: survey.additional,
						rating: survey.rating,
						questions: parsedQuestions
					};
				});

			console.log('Final processed surveys:', surveys);
		} catch (e) {
			console.error('Gagal mengambil survey:', e);
		}
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

	// Handler setelah tiket berhasil di-submit
	function handleTicketSubmitted() {
		closeTicketModal();
		fetchTickets(); // refresh data tiket
	}

	// Buka modal question manager
	function openQuestionModal() {
		showQuestionModal = true;
	}
	// Tutup modal question manager
	function closeQuestionModal() {
		showQuestionModal = false;
	}

	// Buka modal vehicle manager
	function openVehicleModal() {
		showVehicleModal = true;
	}
	// Tutup modal vehicle manager
	function closeVehicleModal() {
		showVehicleModal = false;
	}

	// Modal state for survey detail view
	let showDetailModalSurvey = false;
	let selectedSurvey = null;

	// Open survey detail modal
	function handleOpenDetailSurvey(e) {
		selectedSurvey = e.detail.survey;
		showDetailModalSurvey = true;
	}
	// Close survey detail modal
	function closeDetailModalSurvey() {
		showDetailModalSurvey = false;
		selectedSurvey = null;
	}

	// Handle survey deletion
	async function handleDeleteSurvey(e) {
		const survey = e.detail.survey;
		try {
			await axios.delete(`https://directus.eltamaprimaindo.com/items/Survey/${survey.rawId}`, {
				headers: { Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz` }
			});
			// Remove the deleted survey from the surveys array
			surveys = surveys.filter((s) => s.rawId !== survey.rawId);
			alert('Survey berhasil dihapus');
		} catch (error) {
			console.error('Error deleting survey:', error);
			alert('Gagal menghapus survey. Silakan coba lagi.');
		}
	}
	// Modal image state and handlers for ticket attachments
	let showImageModalTicket = false;
	let imageUrlTicket = '';
	// Close ticket image modal
	function closeImageTicket() {
		showImageModalTicket = false;
		imageUrlTicket = '';
	}

	// Modal image state and handlers for feedback attachments
	let showImageModalFeedback = false;
	let imageUrlFeedback = '';
	// Open image modal for feedback attachment
	function handleOpenImageFeedback(e) {
		imageUrlFeedback = e.detail.url;
		showImageModalFeedback = true;
	}

	// Modal state for admin created ticket detail view (simple format like user)
	let showDetailModalAdminTicket = false;
	let selectedAdminTicket = null;

	// Open admin ticket detail modal (simple format)
	function handleOpenDetailTicketAdmin(ticket) {
		selectedAdminTicket = ticket;
		showDetailModalAdminTicket = true;
	}

	// Close admin ticket detail modal
	function closeDetailModalAdminTicket() {
		showDetailModalAdminTicket = false;
		selectedAdminTicket = null;
	}

	// Modal state for feedback detail view
	let showDetailModalFeedback = false;
	let detailTextFeedback = '';

	// Open feedback detail modal
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
	// Close feedback detail modal
	function closeDetailModalFeedback() {
		showDetailModalFeedback = false;
		detailTextFeedback = '';
	}

	// Modal state for ticket detail view
	let showDetailModalTicket = false;
	let selectedTicket = null;
	let detailFieldsTicket = [];
	let selectedPic = '';

	// Open ticket detail modal
	function handleOpenDetailTicket(e) {
		selectedTicket = e.detail.ticket;
		detailFieldsTicket = e.detail.detailFields;
		selectedPic = e.detail.ticket.pic || '';
		showDetailModalTicket = true;
	}
	// Close ticket detail modal
	function closeDetailModalTicket() {
		showDetailModalTicket = false;
		selectedTicket = null;
		detailFieldsTicket = [];
		selectedPic = '';
	}

	// Modal state for ticket detail information text
	let showTicketDetailModal = false;
	let ticketDetailText = '';
	// Open modal to display ticket detail text
	function openTicketDetailModal(text) {
		ticketDetailText = text;
		showTicketDetailModal = true;
	}
	// Close ticket detail information modal
	function closeTicketDetailModal() {
		showTicketDetailModal = false;
		ticketDetailText = '';
	}

	// Handle ticket update event from child component
	function handleTicketUpdated(e) {
		const updated = e.detail.updatedTicket;
		console.log('Handling ticket update:', updated);
		
		// Update tickets array dengan safety check untuk rawId
		tickets = tickets.map((t) => {
			// Coba match berdasarkan rawId terlebih dahulu, fallback ke id
			const ticketId = t.rawId || t.id;
			const updatedId = updated.rawId || updated.id;
			
			return ticketId === updatedId ? { ...t, ...updated } : t;
		});

		// Check if this is a vehicle borrowing ticket that was just approved
		if (
			updated.category === 'Peminjaman Kendaraan' &&
			updated.status === 'On Progress' &&
			updated.vehicle_type
		) {
			// Update vehicle status to "Dipinjam" in Directus
			updateVehicleStatus(updated.vehicle_type, 'Dipinjam');
		}

		// Check if this is a vehicle borrowing ticket that was just completed
		if (
			updated.category === 'Peminjaman Kendaraan' &&
			updated.status === 'Done' &&
			updated.vehicle_type
		) {
			// Update vehicle status back to "Tersedia" in Directus
			updateVehicleStatus(updated.vehicle_type, 'Tersedia');
		}
	}

	// Function to update vehicle status in Directus
	async function updateVehicleStatus(vehicleInfo, newStatus) {
		try {
			if (!vehicleInfo || typeof vehicleInfo !== 'string') return;

			// Extract vehicle name from the format "Jenis Nama PlatNomor - Status"
			const vehicleMatch = vehicleInfo.match(/^([^-]+)/);
			if (!vehicleMatch) return;

			const vehicleIdentifier = vehicleMatch[1].trim();
			const vehicleName = vehicleIdentifier.split(' ')[1] || '';

			// Find the vehicle in Directus by name
			const response = await axios.get('https://directus.eltamaprimaindo.com/items/Kendaraan', {
				headers: { Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz` },
				params: {
					filter: {
						nama: { _contains: vehicleName }
					}
				}
			});

			if (response.data && response.data.data && response.data.data.length > 0) {
				const vehicle = response.data.data[0];

				// Update the vehicle status
				await axios.patch(
					`https://directus.eltamaprimaindo.com/items/Kendaraan/${vehicle.id}`,
					{ status: newStatus },
					{ headers: { Authorization: `Bearer JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz` } }
				);

				console.log(`Vehicle status updated: ${vehicleInfo} -> ${newStatus}`);
			}
		} catch (error) {
			console.error('Error updating vehicle status:', error);
		}
	}

	// Modal state untuk admin's ticket updates
	let showUpdateDetailModalAdmin = false;
	let selectedTicketUpdatesAdmin = [];
	let showUpdateImageModalAdmin = false;
	let updateImageUrlAdmin = '';

	// Handler untuk buka modal riwayat update tiket admin
	function handleOpenUpdateDetailForAdminTickets(e) {
		selectedTicketUpdatesAdmin = e.detail.updates;
		showUpdateDetailModalAdmin = true;
	}

	// Handler untuk buka modal gambar lampiran update admin
	function handleOpenUpdateImageForAdminTickets(e) {
		updateImageUrlAdmin = e.detail.url;
		showUpdateImageModalAdmin = true;
	}

	// Tutup modal gambar lampiran update admin
	function closeUpdateImageModalAdmin() {
		showUpdateImageModalAdmin = false;
		updateImageUrlAdmin = '';
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

	// Reset department filter (for General Manager)
	function resetDepartmentFilter() {
		selectedDepartmentFilter = 'all';
	}

	// Handle department filter change
	function handleDepartmentFilterChange(event) {
		selectedDepartmentFilter = event.target.value;
		console.log('Department filter changed to:', selectedDepartmentFilter);
	}

	// Delete selected ticket from Directus API
	async function deleteTicket() {
		// Check if ticket is selected
		if (!selectedTicket) return;
		// Confirm deletion action
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

	// Initialize auth, role, and department subscriptions on component mount
	onMount(() => {
		unsubAuth = isAuthenticated.subscribe((auth) => {
			// Check authentication status and redirect if not authenticated
			if (auth === undefined) return;
			authReady = true;
			isLoggedIn = !!auth;
			if (!auth) goto('/login');
		});
		unsubRole = userRole.subscribe((role) => {
			// Check user role and fetch data if admin
			if (role === undefined) return;
			roleReady = true;
			currentRole = role;
			if (role !== 'admin') goto('/login');
			// fetch data hanya jika sudah siap dan role benar
			if (authReady && roleReady && isLoggedIn && currentRole === 'admin') {
				fetchTickets();
				fetchFeedback();
				fetchSurveys(); // Add this
				fetchTicketUpdates();
				fetchEmployees().then((data) => {
					employees = data || [];
				});
			}
		});
		// Subscribe to user department changes
		unsubDept = userDepartment.subscribe((dept) => {
			adminDepartment = dept;
		});
	});

	// Clean up subscriptions when component is destroyed
	onDestroy(() => {
		if (unsubAuth) unsubAuth();
		if (unsubRole) unsubRole();
		if (unsubDept) unsubDept();
	});

	// Reactive statement: Filter tickets by admin's department
	// General Manager can see all tickets from all departments
	$: filteredTickets = isGeneralManager($userEmail)
		? selectedDepartmentFilter === 'all'
			? tickets // Show all tickets if 'all' is selected
			: tickets.filter(
					(t) => t.department?.trim().toLowerCase() === selectedDepartmentFilter.toLowerCase()
				)
		: // General Manager sees all tickets with optional department filter
			tickets.filter(
				(t) => t.department?.trim().toLowerCase() === adminDepartment?.trim().toLowerCase()
			);

	// Reactive statement: Filter surveys by admin's department
	// General Manager can see all surveys from all departments
	$: filteredSurveys = isGeneralManager($userEmail)
		? selectedDepartmentFilter === 'all'
			? surveys // Show all surveys if 'all' is selected
			: surveys.filter(
					(s) =>
						s.target_department?.trim().toLowerCase() === selectedDepartmentFilter.toLowerCase()
				)
		: // General Manager sees all surveys with optional department filter
			surveys.filter(
				(s) => s.target_department?.trim().toLowerCase() === adminDepartment?.trim().toLowerCase()
			);

	// Reactive statement: Log admin department changes for debugging
	$: if (adminDepartment !== undefined) {
		console.log('adminDepartment:', adminDepartment);
		console.log('userEmail:', $userEmail);
		console.log('Is general manager:', isGeneralManager($userEmail));
		console.log('Selected department filter:', selectedDepartmentFilter);
		console.log('Total tickets:', tickets.length);
		console.log('Filtered tickets:', filteredTickets.length);
		console.log('Total surveys:', surveys.length);
		console.log('Filtered surveys:', filteredSurveys.length);
	}

	// Reactive: Extract available departments from tickets and surveys for filter dropdown
	$: if ((tickets.length > 0 || surveys.length > 0) && isGeneralManager($userEmail)) {
		const ticketDepartments = tickets
			.map((t) => t.department)
			.filter((dept) => dept && dept.trim() !== '');
		const surveyDepartments = surveys
			.map((s) => s.target_department)
			.filter((dept) => dept && dept.trim() !== '');
		const allDepartments = [...ticketDepartments, ...surveyDepartments];
		const departments = [...new Set(allDepartments.map((dept) => dept.trim()))].sort();
		availableDepartments = departments;
		console.log('Available departments (from tickets and surveys):', availableDepartments);
	}

	// Reactive: Cari data karyawan yang cocok dengan email admin
	$: myEmployee = employees.find(
		(e) =>
			e.email_company && e.email_company.trim().toLowerCase() === $userEmail?.trim().toLowerCase()
	);

	// Reactive: Filter tiket yang dibuat oleh admin yang sedang login
	$: adminCreatedTickets = myEmployee
		? tickets.filter(
				(t) => t.email?.trim().toLowerCase() === myEmployee.email_company?.trim().toLowerCase()
			)
		: [];
</script>

<svelte:head>
	<title>Dashboard Admin</title>
	<meta
		name="description"
		content="Dashboard untuk Admin Helpdesk dengan statistik dan daftar tiket terbaru."
	/>
</svelte:head>
<!-- Check if authentication and role are ready -->
{#if !authReady || !roleReady}
	<div class="flex items-center justify-center min-h-screen text-lg text-blue-700">Loading...</div>
{:else}
	<div class="p-0 md:p-6 min-h-screen animate-fade-in">
		<h1 class="text-2xl font-bold text-blue-800 drop-shadow px-2 md:px-0">Dashboard Admin</h1>

		<!-- General Manager Info Banner -->
		{#if isGeneralManager($userEmail)}
			<div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 mx-2 md:mx-0 rounded-r-lg">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							></path>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm text-blue-700">
							<strong>General Manager Access:</strong> Anda dapat melihat semua tiket, feedback, dan
							survey dari seluruh departemen. Gunakan filter departemen untuk memfokuskan tampilan pada
							departemen tertentu.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="flex justify-between items-center mb-6"></div>
		<!-- Stats -->
		<div class="w-full px-0 md:px-0">
			<TicketStats tickets={filteredTickets} {feedbacks} />
		</div>

		<!-- Quick Actions -->
		<div class="flex items-center gap-4 mb-6 px-2 md:px-0">
			<!-- Tombol Tiket Baru -->
			<button
				on:click={openTicketModal}
				class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl text-center shadow-lg font-semibold transition transform hover:scale-105 animate-fade-in-up"
				>Tiket Baru</button
			>
			<!-- Tombol Kelola Pertanyaan -->
			<button
				on:click={openQuestionModal}
				class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl text-center shadow-lg font-semibold transition transform hover:scale-105 animate-fade-in-up"
			>
				<span class="inline md:hidden">Kelola Survey</span>
				<span class="hidden md:inline">Kelola Pertanyaan Survey</span>
			</button>
			<!-- Tombol Kelola Kendaraan (hanya untuk admin HRD) -->
			{#if checkIsHrdAdmin()}
				<button
					on:click={openVehicleModal}
					class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-center shadow-lg font-semibold transition transform hover:scale-105 animate-fade-in-up"
				>
					<span class="inline md:hidden">Kelola Armada</span>
					<span class="hidden md:inline">Kelola Kendaraan</span>
				</button>
			{/if}
		</div>

		<!-- Tiket Saya (Admin) -->
		<div class="bg-white p-4 md:rounded-xl shadow-lg mb-6 animate-fade-in-up mx-0 md:mx-0 w-full">
			<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono">Tiket Saya</h2>
			<!-- Conditional: Empty state jika admin belum membuat tiket -->
			{#if adminCreatedTickets.length === 0}
				<div class="text-center text-gray-500 py-8">Belum ada tiket yang Anda buat.</div>
			{:else}
				<TicketList
					tickets={adminCreatedTickets}
					isAdmin={false}
					showActions={true}
					showNames={false}
					showDivisions={false}
					showPriority={false}
					showDate={false}
					showDepartments={true}
					showDescription={true}
					{ticketUpdates}
					on:detail={(e) => handleOpenDetailTicketAdmin(e.detail.ticket)}
					on:openUpdateDetail={handleOpenUpdateDetailForAdminTickets}
					on:openUpdateImage={handleOpenUpdateImageForAdminTickets}
				/>
			{/if}

			<!-- Tickets Table -->
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
				<h2 class="text-xl font-semibold ml-2 text-blue-700 font-mono">
					{isGeneralManager($userEmail) ? 'List Tiket (Semua Departemen)' : 'List Tiket'}
				</h2>

				<!-- Department Filter for General Manager -->
				{#if isGeneralManager($userEmail) && availableDepartments.length > 0}
					<div class="flex items-center gap-2">
						<label for="department-filter" class="text-sm font-medium text-gray-700">
							Filter Departemen:
						</label>
						<select
							id="department-filter"
							bind:value={selectedDepartmentFilter}
							class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px]"
						>
							<option value="all">Semua Departemen</option>
							{#each availableDepartments as dept}
								<option value={dept}>{dept}</option>
							{/each}
						</select>

						<!-- Filter Summary -->
						<div class="text-sm text-gray-600 ml-2">
							({filteredTickets.length} tiket)
						</div>
					</div>
				{/if}
			</div>

			<TicketList
				tickets={filteredTickets}
				isAdmin={true}
				showDepartments={isGeneralManager($userEmail)}
				{ticketUpdates}
				on:deleted={fetchTickets}
				on:openDetail={handleOpenDetailTicket}
				on:ticketUpdated={handleTicketUpdated}
			/>
		</div>

		<!-- Feedback Table -->
		<div class="bg-white p-4 md:rounded-xl shadow-lg mb-6 animate-fade-in-up mx-0 md:mx-0 w-full">
			<h2 class="text-xl font-semibold mb-4 ml-2 text-blue-700 font-mono mt-4">List Feedback</h2>
			<FeedbackList
				{feedbacks}
				on:deleted={fetchFeedback}
				statusEditable={true}
				on:openImageFeedback={handleOpenImageFeedback}
				on:openDetailFeedback={handleOpenDetailFeedback}
			/>
		</div>

		<!-- Survey Table -->
		<div class="bg-white p-4 md:rounded-xl shadow-lg mb-6 animate-fade-in-up mx-0 md:mx-0 w-full">
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
				<h2 class="text-xl font-semibold ml-2 text-blue-700 font-mono">
					{isGeneralManager($userEmail) ? 'List Survey (Semua Departemen)' : 'List Survey'}
				</h2>

				<!-- Department Filter Summary for General Manager -->
				{#if isGeneralManager($userEmail)}
					<div class="text-sm text-gray-600">
						({filteredSurveys.length} survey)
					</div>
				{/if}
			</div>

			<SurveyList
				surveys={filteredSurveys}
				showDepartments={isGeneralManager($userEmail)}
				on:openDetailSurvey={handleOpenDetailSurvey}
				on:deleteSurvey={handleDeleteSurvey}
			/>
		</div>
	</div>
{/if}

<!-- Modal for ticket image display -->
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

<!-- Modal for ticket detail information display -->
{#if showDetailModalTicket && selectedTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-200 rounded-2xl shadow-4xl p-4 md:p-8 max-w-[95vw] md:max-w-6xl w-full h-[70vh] md:h-[60vh] overflow-y-auto relative animate-fade-in-up"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 transition"
				on:click={closeDetailModalTicket}>&times;</button
			>
			<h2 class="text-lg md:text-xl font-extrabold mb-4 md:mb-6 text-blue-700 drop-shadow gap-5">
				Detail Tiket <span
					class="bg-blue-100 text-blue-700 px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-sm md:text-base font-semibold ml-2"
					>{selectedTicket?.id}</span
				>
			</h2>
			<table
				class="w-full text-left mb-3 md:mb-4 border-separate border-spacing-y-0.5 md:border-spacing-y-1"
			>
				<tbody class="space-y-1 md:space-y-2">
					{#each detailFieldsTicket as [key, value], idx}
						<!-- Display alternating row colors -->
						<tr class={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
							<td
								class="font-semibold pr-2 md:pr-4 py-1.5 md:py-2 capitalize text-blue-900 w-1/3 text-sm md:text-base"
							>
								{key.replace(/_/g, ' ')}
							</td>
							<td class="py-1.5 md:py-2 text-gray-700 break-words text-sm md:text-base">
								<!-- Check if field is detail and show button -->
								{#if key.toLowerCase() === 'detail'}
									<button
										class="px-2 md:px-3 py-0.5 md:py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-xs font-bold"
										type="button"
										on:click={() => openTicketDetailModal(value)}
									>
										Lihat Detail
									</button>
									<!-- Check if field is attachment and show file button -->
								{:else if key.toLowerCase() === 'lampiran'}
									<!-- Check if ticket has photo attachment -->
									{#if selectedTicket.photo_ticket}
										<button
											class="px-2 md:px-3 py-0.5 md:py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-xs font-bold"
											type="button"
											on:click={() => {
												imageUrlTicket = `https://directus.eltamaprimaindo.com/assets/${selectedTicket.photo_ticket}`;
												showImageModalTicket = true;
											}}
										>
											Lihat File
										</button>
									{:else}
										<span class="text-gray-400 italic text-xs md:text-sm">Tidak Tersedia</span>
									{/if}
									<!-- Check if value is array and join with comma -->
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
			<!-- Check if current user is admin to show delete button -->
			{#if currentRole === 'admin'}
				<div
					class="mt-4 md:mt-6 bg-red-50 rounded-lg p-3 md:p-4 border border-red-100 flex justify-center"
				>
					<button
						class="flex-1 bg-red-500 text-white py-1.5 md:py-2 rounded-md hover:bg-red-600 transition font-semibold shadow text-sm md:text-base"
						on:click={deleteTicket}
					>
						Hapus Tiket
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Modal for ticket detail text information -->
{#if showTicketDetailModal}
	<div class="fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-70">
		<div
			class="bg-white rounded-xl shadow-2xl p-4 md:p-6 max-w-[95vw] md:max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[80vh] md:h-[60vh]"
			style="max-height: 90vh; overflow-y: auto"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-600 hover:text-red-600"
				on:click={closeTicketDetailModal}>&times;</button
			>
			<h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4 text-blue-700">
				Detail Informasi Tiket
			</h2>
			<p class="text-gray-800 whitespace-pre-line text-justify text-sm md:text-base px-2">
				{ticketDetailText}
			</p>
		</div>
	</div>
{/if}

<!-- Modal untuk tiket form -->
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

<!-- Modal for admin's ticket update detail -->
{#if showDetailModalAdminTicket && selectedAdminTicket}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-2xl p-4 md:p-6 relative animate-fade-in-up max-h-[95vh] overflow-y-auto"
		>
			<button
				class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
				on:click={closeDetailModalAdminTicket}
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
					{selectedAdminTicket.id}
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
								{selectedAdminTicket.name || '-'}
							</span>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-blue-700 mb-1">Kategori</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-blue-200 text-sm"
							>
								{selectedAdminTicket.category || '-'}
							</span>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-blue-700 mb-1">Departemen Tujuan</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-blue-200 text-sm"
							>
								{selectedAdminTicket.department || '-'}
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
                                    {selectedAdminTicket.status === 'completed'
										? 'bg-green-100 text-green-800'
										: selectedAdminTicket.status === 'in_progress'
											? 'bg-yellow-100 text-yellow-800'
											: 'bg-gray-100 text-gray-800'}"
								>
									{selectedAdminTicket.status || 'Pending'}
								</span>
							</div>
						</div>
						<div class="flex flex-col">
							<span class="text-sm font-medium text-green-700 mb-1">Tanggal Dibuat</span>
							<span
								class="text-gray-800 bg-white px-3 py-2 rounded-lg border border-green-200 text-sm"
							>
								{formatDate(selectedAdminTicket.date) || '-'}
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
						{selectedAdminTicket.desc ||
							selectedAdminTicket.ticket ||
							'Tidak ada deskripsi masalah yang tersedia.'}
					</p>
				</div>
			</div>

			<!-- Lampiran -->
			{#if selectedAdminTicket.photo_ticket}
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
							class="group relative overflow-hidden rounded-lg border-2 border-dashed border-orange-300 hover:border-orange-400 transition-colors"
						>
							<img
								src="https://directus.eltamaprimaindo.com/assets/{selectedAdminTicket.photo_ticket}"
								alt="Lampiran tiket"
								class="w-full h-auto max-h-[300px] object-contain cursor-pointer transition-transform group-hover:scale-105"
								on:click={() => {
									window.open(
										`https://directus.eltamaprimaindo.com/assets/${selectedAdminTicket.photo_ticket}`,
										'_blank'
									);
								}}
							/>
							<div
								class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center"
							>
								<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<div class="bg-white bg-opacity-90 rounded-full p-2">
										<svg
											class="w-6 h-6 text-gray-700"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
											></path>
										</svg>
									</div>
								</div>
							</div>
						</div>
						<p class="text-xs text-orange-600 mt-2 text-center">
							Klik gambar untuk melihat ukuran penuh
						</p>
					</div>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex justify-center space-x-3">
				<button
					class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm flex items-center shadow-lg hover:shadow-xl"
					on:click={closeDetailModalAdminTicket}
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 17l-5-5m0 0l5-5m-5 5h12"
						></path>
					</svg>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal for admin's update image -->
{#if showUpdateImageModalAdmin}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-3 md:p-6 max-w-[95vw] md:max-w-5xl w-full relative flex flex-col items-center animate-fade-in-up h-[80vh] md:h-[70vh]"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-600 hover:text-red-600"
				on:click={closeUpdateImageModalAdmin}>&times;</button
			>
			<h3 class="text-base md:text-lg font-bold mb-2 md:mb-4 text-blue-700">Lampiran</h3>
			<img
				src={updateImageUrlAdmin}
				alt="Lampiran"
				class="max-h-[60vh] max-w-full rounded border"
			/>
		</div>
	</div>
{/if}

<!-- Modal untuk question manager -->
{#if showQuestionModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
	>
		<div class="bg-white rounded-lg shadow-xl p-0 max-w-4xl w-full relative animate-fade-in-up">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
				on:click={closeQuestionModal}>&times;</button
			>
			<QuestionManager onClose={closeQuestionModal} />
		</div>
	</div>
{/if}

<!-- Modal untuk vehicle manager (hanya untuk admin HRD) -->
{#if showVehicleModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in"
	>
		<div class="bg-white rounded-lg shadow-xl p-0 max-w-4xl w-full relative animate-fade-in-up">
			<button
				class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold z-10"
				on:click={closeVehicleModal}>&times;</button
			>
			<VehicleManager onClose={closeVehicleModal} />
		</div>
	</div>
{/if}

<!-- Modal for survey detail display -->
{#if showDetailModalSurvey && selectedSurvey}
	<div class="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-40">
		<div
			class="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full relative flex flex-col animate-fade-in-up"
			style="max-height: 90vh; overflow-y:auto"
		>
			<button
				class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
				on:click={closeDetailModalSurvey}>&times;</button
			>
			<h2 class="text-xl font-bold mb-4 text-blue-700 text-center">
				Detail Survey {selectedSurvey.id}
			</h2>

			<!-- Questions and Answers -->
			{#if selectedSurvey.questions && Array.isArray(selectedSurvey.questions) && selectedSurvey.questions.length > 0}
				<div class="mb-6">
					<h3 class="font-semibold text-gray-700 mb-4">Pertanyaan & Jawaban</h3>
					<div class="space-y-4">
						{#each selectedSurvey.questions as qa, index}
							<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
								<h4 class="font-medium text-gray-700 mb-2">
									{index + 1}. {qa.question || 'Pertanyaan tidak tersedia'}
								</h4>
								<p class="text-gray-600 whitespace-pre-line">{qa.answer || 'Tidak ada jawaban'}</p>
							</div>
						{/each}
					</div>
				</div>
			{:else if selectedSurvey.questions && typeof selectedSurvey.questions === 'string'}
				<!-- Jika questions masih berupa string JSON -->
				<div class="mb-6">
					<h3 class="font-semibold text-gray-700 mb-4">Pertanyaan & Jawaban</h3>
					<div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
						<p class="text-orange-700 text-sm mb-2">
							⚠️ Data questions masih dalam format string JSON:
						</p>
						<pre class="text-xs bg-white p-2 rounded overflow-auto">{selectedSurvey.questions}</pre>
					</div>
				</div>
			{:else if selectedSurvey.questions && typeof selectedSurvey.questions === 'object'}
				<!-- Jika questions berupa object tunggal -->
				<div class="mb-6">
					<h3 class="font-semibold text-gray-700 mb-4">Pertanyaan & Jawaban</h3>
					<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
						<h4 class="font-medium text-gray-700 mb-2">
							1. {selectedSurvey.questions.question || 'Pertanyaan tidak tersedia'}
						</h4>
						<p class="text-gray-600 whitespace-pre-line">
							{selectedSurvey.questions.answer || 'Tidak ada jawaban'}
						</p>
					</div>
				</div>
			{:else}
				<!-- Tidak ada questions -->
				<div class="mb-6">
					<h3 class="font-semibold text-gray-700 mb-4">Pertanyaan & Jawaban</h3>
					<div class="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
						Tidak ada pertanyaan dan jawaban untuk survey ini
					</div>
				</div>
			{/if}

			<!-- Additional Comments -->
			{#if selectedSurvey.additional}
				<div class="mb-6">
					<h3 class="font-semibold text-gray-700 mb-3">Pendapat Tambahan</h3>
					<div class="bg-purple-50 rounded-lg p-4">
						<p class="text-gray-700 whitespace-pre-line">{selectedSurvey.additional}</p>
					</div>
				</div>
			{/if}

			<!-- Close Button -->
			<div class="flex justify-center">
				<button
					class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
					on:click={closeDetailModalSurvey}
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal for admin's ticket update detail -->
{#if showUpdateDetailModalAdmin}
	<div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
		<div
			class="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] md:max-w-xl p-4 md:p-8 relative animate-fade-in-up"
		>
			<button
				class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 transition"
				on:click={() => (showUpdateDetailModalAdmin = false)}
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
			{#if selectedTicketUpdatesAdmin.length > 0}
				<div class="space-y-4 md:space-y-6 max-h-[70vh] md:max-h-96 overflow-y-auto pr-2">
					{#each [...selectedTicketUpdatesAdmin].sort((a, b) => new Date(b.date) - new Date(a.date)) as update, idx}
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
												updateImageUrlAdmin = url;
												showUpdateImageModalAdmin = true;
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
					on:click={() => (showUpdateDetailModalAdmin = false)}
				>
					Tutup
				</button>
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
		background: rgba(96, 165, 250, 0.5);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: rgba(59, 130, 246, 0.7);
	}
</style>
