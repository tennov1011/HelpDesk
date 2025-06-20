<script>
	import { onMount } from 'svelte';
	import { userEmail } from '$lib/services/firebaseConfig';
	import { fetchEmployees } from '$lib/services/employee.js';
	import Sidebar from '$lib/component/Sidebar.svelte';
	import Header from '$lib/component/Header.svelte';
	import Footer from '$lib/component/Footer.svelte';

	let employees = [];
	let myEmployee = null;

	onMount(async () => {
		const data = await fetchEmployees();
		employees = data || [];
	});

	$: if (employees.length && $userEmail) {
		myEmployee = employees.find(
			(e) =>
				e.email_company && e.email_company.trim().toLowerCase() === $userEmail?.trim().toLowerCase()
		);
	}
</script>

<div class="flex h-screen overflow-hidden">
	<Sidebar />
	<div class="flex-1 flex flex-col overflow-hidden">
		<Header employee={myEmployee} />
		<main class="p-6 bg-gray-100 overflow-auto flex-1">
			<slot {myEmployee} />
		</main>
		<Footer />
	</div>
</div>
