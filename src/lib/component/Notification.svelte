<script>
	import axios from 'axios';

	export let userEmail = '';

	let notifications = [];
	let unreadCount = 0;
	let showNotifDropdown = false;
	let notifDropdownEl;

	const DIRECTUS_URL = 'https://directus.eltamaprimaindo.com';
	const DIRECTUS_TOKEN = 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

	const RESET_INTERVAL = 2 * 60 * 60 * 1000; 

	async function loadNotifications() {
		if (!userEmail) {
			notifications = [];
			unreadCount = 0;
			return;
		}
		try {
			const res = await axios.get(`${DIRECTUS_URL}/items/Notifications`, {
				params: {
					filter: { email: { _eq: userEmail } },
					sort: '-date'
				},
				headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` }
			});
			notifications = res.data.data || [];
			unreadCount = notifications.filter(
				(n) =>
					n.read === false ||
					n.read === 'false' ||
					n.read === 0 ||
					n.read === null ||
					n.read === undefined
			).length;
		} catch (e) {
			notifications = [];
			unreadCount = 0;
		}
	}

    async function markAllAsRead() {
        if (!userEmail) return;
        try {
            // Ambil semua id notifikasi yang belum dibaca
            const unreadIds = notifications.filter(n => n.read == 0 || n.read === '0').map(n => n.id);
            if (unreadIds.length === 0) return;
            // Update semua notifikasi menjadi read
            await Promise.all(
                unreadIds.map(id =>
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

    function handleClickOutside(event) {
        if (showNotifDropdown && notifDropdownEl && !notifDropdownEl.contains(event.target)) {
            showNotifDropdown = false;
        }
    }

    onMount(() => {
        console.log('userEmail Notification:', userEmail);
        fetchNotifications();
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    });

    // Optional: refresh notifikasi setiap 30 detik
    let interval;
    onMount(() => {
        interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    });
</script>

<div class="relative">
	<button on:click={handleBellClick} aria-label="Notifikasi" class="relative">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
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
			{#if getVisibleNotifications().length > 0}
				<ul>
					{#each getVisibleNotifications() as notif}
						<li class="mb-2 text-sm text-gray-700 gap-2">
							<div class="font-bold">ID: {notif.ticket_id}</div>
							<div>Tanggal: {notif.date}</div>
							<div>Status: {notif.status}</div>
						</li>
						<div class="border-t border-gray-300 my-2"></div>
					{/each}
				</ul>
			{:else}
				<div class="text-gray-500 text-sm">Tidak ada notifikasi.</div>
			{/if}
		</div>
	{/if}
</div>
