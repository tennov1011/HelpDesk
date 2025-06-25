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
        if (!userEmail) return;
        try {
            const res = await axios.get(
                `https://directus.eltamaprimaindo.com/items/Notifications?filter[email]=${userEmail.trim().toLowerCase()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            notifications = res.data.data || [];
            unreadCount = notifications.filter(n => n.read == 0 || n.read === '0').length;
        } catch (e) {
            notifications = [];
            unreadCount = 0;
        }
    }

<<<<<<< Updated upstream
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
=======
	const RESET_INTERVAL = 2 * 60 * 60 * 1000;
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
    // Optional: refresh notifikasi setiap 30 detik
    let interval;
    onMount(() => {
        interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    });
=======
	// Reaktif jika userEmail berubah
	$: userEmail, loadNotifications();

	async function handleBellClick() {
		await loadNotifications();
		showNotifDropdown = !showNotifDropdown;
		if (showNotifDropdown && unreadCount > 0) {
			try {
				const unreadIds = notifications
					.filter((n) => n.read === false || n.read === 'false' || n.read === 0)
					.map((n) => n.id);
				if (unreadIds.length > 0) {
					await Promise.all(
						unreadIds.map((id) =>
							axios.patch(
								`${DIRECTUS_URL}/items/Notifications/${id}`,
								{ read: true },
								{ headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` } }
							)
						)
					);
				}
				await loadNotifications();
			} catch (e) {}
		}
		// Simpan waktu baca terakhir
		if (showNotifDropdown) {
			const lastReadKey = `notif_last_read_${userEmail}`;
			localStorage.setItem(lastReadKey, Date.now().toString());
		}
	}

	function getVisibleNotifications() {
		if (!userEmail) return [];
		const lastReadKey = `notif_last_read_${userEmail}`;
		const lastRead = localStorage.getItem(lastReadKey);
		const now = Date.now();

		// Jika belum pernah baca, tampilkan semua
		if (!lastRead) return notifications;

		// Jika sudah lebih dari 4 jam, sembunyikan semua notifikasi yang sudah dibaca sebelum waktu reset
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
>>>>>>> Stashed changes
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
            <span class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1 font-bold">!</span>
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
                <ul>
                    {#each notifications as notif}
                        <li class="mb-2 text-sm {notif.read == 0 || notif.read === '0' ? 'text-black' : 'text-gray-400'}">
                            <span class="font-bold">{notif.title}</span><br />
                            <span>{notif.message}</span>
                            <div class="text-xs text-gray-400">{notif.date}</div>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>