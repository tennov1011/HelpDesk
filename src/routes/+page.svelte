<script>
import { goto } from '$app/navigation';
import { onMount } from 'svelte';

onMount(() => {
	goto('/login').catch(() => {
		window.location.href = '/login';
	});
});
</script>
