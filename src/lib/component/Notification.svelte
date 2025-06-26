<script>
	import { onMount } from 'svelte';
	import axios from 'axios';

	export let userEmail = '';
	export let token = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz'; // Directus token

	let notifications = [];
	let unreadCount = 0;
	let showNotifDropdown = false;
	let notifDropdownEl;

	async function fetchNotifications() {
		if (!userEmail) {
			notifications = [];
			unreadCount = 0;
			return;
		}
		try {
			const res = await axios.get(
				`https://directus.eltamaprimaindo.com/items/Notifications`,
				{
					params: {
						filter: { email: { _eq: userEmail } },
						sort: '-date'
					},
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			notifications = res.data.data || [];
			unreadCount = notifications.filter(
				(n) => n.read === false || n.read === 'false' || n.read === 0 || n.read === null || n.read === undefined
			).length;
		} catch (e) {
			notifications = [];
			unreadCount = 0;
		}
	}

	async function markAllAsRead() {
		if (!userEmail) return;
		try {
			const unreadIds = notifications.filter((n) => n.read == 0 || n.read === '0' || n.read === false || n.read === undefined || n.read === null).map((n) => n.id);
			if (unreadIds.length === 0) return;
			await Promise.all(
				unreadIds.map((id) =>
					axios.patch(
						`https://directus.eltamaprimaindo.com/items/Notifications/${id}`,
						{ read: 1 },
						{ headers: { Authorization: `Bearer ${token}` } }
					)
				)
			);
			fetchNotifications(); // refresh
		} catch (e) {
			// handle error
		}
	}

	const RESET_INTERVAL = 2 * 60 * 60 * 1000;

	function handleClickOutside(event) {
		if (showNotifDropdown && notifDropdownEl && !notifDropdownEl.contains(event.target)) {
			showNotifDropdown = false;
		}
	}

	onMount(() => {
		fetchNotifications();
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	let interval;
	onMount(() => {
		interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	});

	$: userEmail, fetchNotifications();

	function getVisibleNotifications() {
		if (!userEmail) return [];
		const lastReadKey = `notif_last_read_${userEmail}`;
		const lastRead = localStorage.getItem(lastReadKey);
		const now = Date.now();
		if (!lastRead) return notifications;
		if (now - Number(lastRead) > RESET_INTERVAL) {
			return notifications.filter(
				(n) =>
					n.read === false ||
					n.read === 'false' ||
					n.read === 0 ||
					new Date(n.date).getTime() > Number(lastRead)
			);
		}
		return notifications;
	}
</script>

<div class="relative">
	<button
		on:click={() => {
			showNotifDropdown = !showNotifDropdown;
			if (!showNotifDropdown) return;
			markAllAsRead();
		}}
		aria-label="Notifikasi"
		class="relative"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="white"
			class="bg-orange-500 rounded-full"
		>
			<circle cx="12" cy="12" r="12" fill="#f59e42" />
			<path
				d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16z"
				fill="white"
			/>
		</svg>
		{#if unreadCount > 0}
			<span
				class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 font-bold"
				>!</span
			>
		{/if}
	</button>
	{#if showNotifDropdown}
		<div
			class="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg z-50 p-2"
			bind:this={notifDropdownEl}
		>
			<h3 class="font-semibold mb-2 text-gray-700">Notifikasi</h3>
			{#if notifications.length === 0}
				<div class="text-gray-500 text-sm">Tidak ada notifikasi.</div>
			{:else}
				<ul >
					{#each getVisibleNotifications() as notif, i (notif.id)}
						<li
							class="mb-2 text-sm text-black"
						>
							<span class="font-bold">{notif.ticket_id}</span><br />
							<div class="text-xs">{notif.date}</div>
							<span>{notif.status}</span>
							{#if i < getVisibleNotifications().length - 1}
								<hr class="my-2 border-gray-200" />
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
