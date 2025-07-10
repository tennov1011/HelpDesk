<script>
	import { createEventDispatcher } from 'svelte';

	export let surveys = [];
	export let showDepartments = false; // New prop to control department column visibility
	
	let selectedRatingFilter = 'all'; // Filter berdasarkan rating
	let searchQuery = '';
	let isMobile = false;

	const dispatch = createEventDispatcher();

	// Detect mobile screen size
	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	// Check mobile on mount and resize
	import { onMount } from 'svelte';
	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	function handleDetailSurvey(survey) {
		console.log('Selected survey for detail:', survey); // Debug log
		console.log('Survey questions:', survey.questions); // Debug questions specifically
		console.log('Questions type:', typeof survey.questions);
		console.log('Questions length:', survey.questions?.length);
		dispatch('openDetailSurvey', { survey });
	}

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

	// Filter surveys berdasarkan rating dan search query
	$: filteredSurveys = surveys.filter(survey => {
		// Rating filter
		const ratingMatch = selectedRatingFilter === 'all' || 
			parseInt(survey.rating) === parseInt(selectedRatingFilter);
		
		// Search filter
		const searchMatch = !searchQuery || 
			survey.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			survey.division?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			survey.target_department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			survey.rating?.toString().includes(searchQuery);

		return ratingMatch && searchMatch;
	});

	// Debug reactive statement
	$: {
		console.log('Filter changed to:', selectedRatingFilter);
		console.log('Total surveys:', surveys.length);
		console.log('Filtered surveys:', filteredSurveys.length);
		console.log('All survey ratings:', surveys.map(s => ({ name: s.name, rating: s.rating })));
	}

	function getRatingLabel(rating) {
		const labels = {
			1: '⭐ Sangat Buruk',
			2: '⭐⭐ Buruk',
			3: '⭐⭐⭐ Cukup',
			4: '⭐⭐⭐⭐ Baik',
			5: '⭐⭐⭐⭐⭐ Sangat Baik'
		};
		return labels[rating] || `Rating ${rating}`;
	}
</script>

<div class="overflow-x-auto">
	<!-- Search and Filter Controls -->
	<div class="mb-4 space-y-3">
		<!-- Search Bar -->
		<div class="flex flex-col md:flex-row gap-3">
			<input
				type="text"
				placeholder="Cari berdasarkan nama, divisi, departemen, atau rating..."
				class="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
				bind:value={searchQuery}
			/>
			
			<!-- Rating Filter -->
			<div class="flex items-center gap-2">
				<label for="rating-filter" class="text-sm font-medium text-gray-700">
					Filter Rating:
				</label>
				<select
					id="rating-filter"
					bind:value={selectedRatingFilter}
					class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
				>
					<option value="all">Semua Rating</option>
					<option value="5">⭐⭐⭐⭐⭐ Sangat Baik (5)</option>
					<option value="4">⭐⭐⭐⭐ Baik (4)</option>
					<option value="3">⭐⭐⭐ Cukup (3)</option>
					<option value="2">⭐⭐ Buruk (2)</option>
					<option value="1">⭐ Sangat Buruk (1)</option>
				</select>
			</div>
		</div>
		
		<!-- Results Count -->
		<div class="text-sm text-gray-600">
			Menampilkan {filteredSurveys.length} dari {surveys.length} survey
		</div>
	</div>

	{#if filteredSurveys.length === 0}
		<div class="text-center text-gray-500 py-8">
			{#if searchQuery}
				Tidak ada survey yang ditemukan dengan kata kunci "{searchQuery}".
			{:else if selectedRatingFilter !== 'all'}
				Tidak ada survey dengan rating {getRatingLabel(parseInt(selectedRatingFilter))}.
			{:else}
				Belum ada survey yang masuk.
			{/if}
		</div>
	{:else}
		<!-- Desktop Table View -->
		<div class="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Pengisi Survey
							</th>
							<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Rating
							</th>
							{#if showDepartments}
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Target Dept
								</th>
							{/if}
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Tanggal
							</th>
							<th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each filteredSurveys as survey}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div>
										<div class="text-sm font-medium text-gray-900">{survey.name}</div>
										<div class="text-sm text-gray-500">{survey.division}</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<span
										class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
										class:bg-red-100={survey.rating <= 2}
										class:text-red-800={survey.rating <= 2}
										class:bg-yellow-100={survey.rating === 3}
										class:text-yellow-800={survey.rating === 3}
										class:bg-green-100={survey.rating >= 4}
										class:text-green-800={survey.rating >= 4}
									>
										{getRatingLabel(survey.rating)}
									</span>
								</td>
								{#if showDepartments}
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{survey.target_department}
									</td>
								{/if}
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(survey.date)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-center">
									<button
										on:click={() => handleDetailSurvey(survey)}
										class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
									>
										Detail
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Mobile Card View -->
		<div class="md:hidden space-y-4">
			{#each filteredSurveys as survey}
				<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
					<div class="flex justify-between items-start mb-3">
						<div class="flex-1">
							<div class="font-medium text-gray-900 text-sm">{survey.name}</div>
							<div class="text-gray-500 text-xs">{survey.division}</div>
						</div>
						<div class="ml-2">
							<span
								class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
								class:bg-red-100={survey.rating <= 2}
								class:text-red-800={survey.rating <= 2}
								class:bg-yellow-100={survey.rating === 3}
								class:text-yellow-800={survey.rating === 3}
								class:bg-green-100={survey.rating >= 4}
								class:text-green-800={survey.rating >= 4}
							>
								{getRatingLabel(survey.rating)}
							</span>
						</div>
					</div>
					
					<div class="grid grid-cols-1 gap-2 text-xs text-gray-600 mb-3">
						{#if showDepartments}
							<div>
								<span class="font-medium">Target Dept:</span>
								<span class="text-gray-900">{survey.target_department}</span>
							</div>
						{/if}
						<div>
							<span class="font-medium">Tanggal:</span>
							<span class="text-gray-900">{formatDate(survey.date)}</span>
						</div>
					</div>
					
					<div class="flex justify-end">
						<button
							on:click={() => handleDetailSurvey(survey)}
							class="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
						>
							Detail
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
