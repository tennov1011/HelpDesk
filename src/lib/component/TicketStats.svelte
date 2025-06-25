<script>
	export let tickets = [];
	export let feedbacks = [];

	// Hitung statistik
	$: totalTickets = tickets.length;
	$: totalFeedback = feedbacks.length;
	$: pendingTickets = tickets.filter((t) => t.status?.toLowerCase() === 'pending').length;
	$: onProgressTickets = tickets.filter((t) => t.status?.toLowerCase() === 'on progress').length;
	$: doneTickets = tickets.filter((t) => t.status?.toLowerCase() === 'done').length;
	$: rejectedTickets = tickets.filter((t) => t.status?.toLowerCase() === 'rejected').length;
</script>

<div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-blue-300 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">Total Tiket</span>
		<span class="text-2xl font-bold text-blue-800">{totalTickets}</span>
	</div>
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-indigo-300 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">Total Feedback</span>
		<span class="text-2xl font-bold text-indigo-700">{totalFeedback}</span>
	</div>
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-gray-400 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">Pending</span>
		<span class="text-2xl font-bold text-gray-700">{pendingTickets}</span>
	</div>
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-yellow-300 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">On Progress</span>
		<span class="text-2xl font-bold text-yellow-600">{onProgressTickets}</span>
	</div>
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-green-300 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">Done</span>
		<span class="text-2xl font-bold text-green-700">{doneTickets}</span>
	</div>
	<div
		class="bg-white p-4 rounded-xl shadow-lg border-b-4 border-red-300 flex flex-col items-center"
	>
		<span class="text-sm text-gray-500 font-semibold">Rejected</span>
		<span class="text-2xl font-bold text-red-700">{rejectedTickets}</span>
	</div>
</div>
