<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import axios from 'axios';
    import { writable } from 'svelte/store';

    let vehicles = [];
    let showModal = false;
    let editingVehicle = null;
    let vehicleName = '';
    let vehicleType = '';
    let vehicleStatus = 'Tersedia';
    let vehiclePlate = '';
    let isLoading = false;

    const dispatch = createEventDispatcher();
    
    const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
    const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

    // Status options
    const statusOptions = ['Tersedia', 'Service', 'Rusak', 'Dipinjam'];

    // Vehicle types
    const vehicleTypes = ['Mobil', 'Motor', 'Bus', 'Truk', 'Lainnya'];

    let notification = writable({ show: false, type: '', message: '' });
    let notificationTimeout;

    function showNotification(type, message) {
        notification.set({ show: true, type, message });
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notification.set({ show: false, type: '', message: '' });
        }, 3000);
    }

    function getDirectusUrl(path) {
        return `${DIRECTUS_URL.replace(/\/$/, '')}${path}`;
    }

    // Fetch vehicles
    async function fetchVehicles() {
        try {
            const res = await axios.get(getDirectusUrl('/items/Kendaraan'), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                }
            });
            vehicles = res.data.data || [];
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            showNotification('error', 'Gagal memuat data kendaraan');
        }
    }

    function openModal(vehicle = null) {
        editingVehicle = vehicle;
        if (vehicle) {
            vehicleName = vehicle.nama || '';
            vehicleType = vehicle.jenis || '';
            vehicleStatus = vehicle.status || 'Tersedia';
            vehiclePlate = vehicle.plat_nomor || '';
        } else {
            vehicleName = '';
            vehicleType = '';
            vehicleStatus = 'Tersedia';
            vehiclePlate = '';
        }
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingVehicle = null;
        vehicleName = '';
        vehicleType = '';
        vehicleStatus = 'Tersedia';
        vehiclePlate = '';
    }

    async function saveVehicle() {
        if (!vehicleName.trim()) {
            showNotification('error', 'Nama kendaraan tidak boleh kosong');
            return;
        }

        if (!vehiclePlate.trim()) {
            showNotification('error', 'Plat nomor tidak boleh kosong');
            return;
        }

        isLoading = true;
        
        try {
            const data = {
                nama: vehicleName.trim(),
                jenis: vehicleType,
                status: vehicleStatus,
                plat_nomor: vehiclePlate.trim()
            };

            if (editingVehicle) {
                // Update existing vehicle
                await axios.patch(getDirectusUrl(`/items/Kendaraan/${editingVehicle.id}`), data, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                showNotification('success', 'Kendaraan berhasil diperbarui');
            } else {
                // Create new vehicle
                await axios.post(getDirectusUrl('/items/Kendaraan'), data, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                showNotification('success', 'Kendaraan berhasil ditambahkan');
            }

            closeModal();
            fetchVehicles();
        } catch (error) {
            console.error('Error saving vehicle:', error);
            showNotification('error', 'Gagal menyimpan data kendaraan');
        } finally {
            isLoading = false;
        }
    }

    async function deleteVehicle(vehicle) {
        if (!confirm('Yakin ingin menghapus kendaraan ini?')) return;

        try {
            await axios.delete(getDirectusUrl(`/items/Kendaraan/${vehicle.id}`), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                }
            });
            showNotification('success', 'Kendaraan berhasil dihapus');
            fetchVehicles();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showNotification('error', 'Gagal menghapus kendaraan');
        }
    }

    export let onClose = undefined;

    function handleClose() {
        if (typeof onClose === 'function') onClose();
    }

    onMount(() => {
        fetchVehicles();
    });
</script>

{#if $notification.show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        <div
            class="px-6 py-3 rounded shadow-lg font-semibold text-white text-center transition-all duration-300"
            class:bg-green-500={$notification.type === 'success'}
            class:bg-red-500={$notification.type === 'error'}
            class:animate-bounce={$notification.type === 'success'}
        >
            {$notification.message}
        </div>
    </div>
{/if}

<div class="fixed inset-0 z-40 flex items-center justify-center p-4">
    <div class="w-full max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-2xl relative overflow-y-auto max-h-[90vh]">
        <!-- Close button -->
        <button
            on:click={handleClose}
            aria-label="Tutup"
            class="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-2xl font-bold z-50 focus:outline-none"
            >&times;</button
        >
        
        <div class="mt-4">
            <h2 class="text-xl font-semibold text-gray-700 border-b pb-2 mb-6">
                Kelola Kendaraan
            </h2>

            <!-- Add Vehicle Button -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-medium text-gray-600">Daftar Kendaraan</h3>
                <button
                    on:click={() => openModal()}
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                >
                    + Tambah Kendaraan
                </button>
            </div>

            <!-- Vehicles List -->
            <div class="overflow-x-auto">
                {#if vehicles.length === 0}
                    <div class="text-center text-gray-500 py-8">
                        Belum ada data kendaraan
                    </div>
                {:else}
                    <table class="min-w-full bg-white rounded-lg overflow-hidden">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nama</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Jenis</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Plat Nomor</th>
                                <th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                <th class="py-3 px-4 text-center text-sm font-semibold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            {#each vehicles as vehicle}
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 px-4 text-sm text-gray-800">{vehicle.nama}</td>
                                    <td class="py-3 px-4 text-sm text-gray-800">{vehicle.jenis || '-'}</td>
                                    <td class="py-3 px-4 text-sm text-gray-800">{vehicle.plat_nomor}</td>
                                    <td class="py-3 px-4">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            {vehicle.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 
                                             vehicle.status === 'Service' ? 'bg-yellow-100 text-yellow-800' : 
                                             vehicle.status === 'Rusak' ? 'bg-red-100 text-red-800' : 
                                             'bg-blue-100 text-blue-800'}">
                                            {vehicle.status || 'Tersedia'}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-center">
                                        <div class="flex space-x-2 justify-center">
                                            <button
                                                on:click={() => openModal(vehicle)}
                                                class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                on:click={() => deleteVehicle(vehicle)}
                                                class="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Vehicle Edit/Add Modal -->
{#if showModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">
                {editingVehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block font-medium text-gray-700 mb-2">Nama Kendaraan</label>
                    <input
                        type="text"
                        bind:value={vehicleName}
                        placeholder="Masukkan nama kendaraan"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                    />
                </div>
                
                <div>
                    <label class="block font-medium text-gray-700 mb-2">Plat Nomor</label>
                    <input
                        type="text"
                        bind:value={vehiclePlate}
                        placeholder="Contoh: B 1234 XYZ"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                    />
                </div>
                
                <div>
                    <label class="block font-medium text-gray-700 mb-2">Jenis Kendaraan</label>
                    <select
                        bind:value={vehicleType}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                    >
                        <option value="">Pilih Jenis</option>
                        {#each vehicleTypes as type}
                            <option value={type}>{type}</option>
                        {/each}
                    </select>
                </div>
                
                <div>
                    <label class="block font-medium text-gray-700 mb-2">Status</label>
                    <select
                        bind:value={vehicleStatus}
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
                    >
                        {#each statusOptions as status}
                            <option value={status}>{status}</option>
                        {/each}
                    </select>
                </div>
            </div>

            <div class="flex justify-end space-x-3">
                <button
                    on:click={closeModal}
                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    disabled={isLoading}
                >
                    Batal
                </button>
                <button
                    on:click={saveVehicle}
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    disabled={isLoading || !vehicleName.trim() || !vehiclePlate.trim()}
                >
                    {#if isLoading}
                        Menyimpan...
                    {:else}
                        {editingVehicle ? 'Perbarui' : 'Simpan'}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if} 