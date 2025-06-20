<script>
	import UserHeader from '$lib/component/UserHeader.svelte';
	import { onMount} from 'svelte';
	import { userEmail } from '$lib/services/firebaseConfig';
	import { fetchEmployees } from '$lib/services/employee.js';

	let employees = [];
	let myEmployee = null;

	onMount(async () => {
		fetchEmployees().then((data) => {
			employees = data || [];
		});
	});

	$: if (employees.length && $userEmail) {
		myEmployee = employees.find(
			(e) =>
				e.email_company && e.email_company.trim().toLowerCase() === $userEmail?.trim().toLowerCase()
		);
	}
</script>

<UserHeader employee={myEmployee} />
<main>
	<slot {myEmployee} />
</main>
