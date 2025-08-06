<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import axios from 'axios';
    import { writable } from 'svelte/store';

    export let onClose = () => {}; // Prop untuk menutup modal dari parent


    let etols = [];
    let showModal = false;
    let editingETol = null;
    let etolNumber = '';
    let etolPlace = '';
    let isLoading = false;

    const dispatch = createEventDispatcher();
    
    const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
    const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

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

    // Fetch etols
    async function fetchETols() {
        try {
            console.log('Fetching E-Tols from:', getDirectusUrl('/items/ETol'));
            const res = await axios.get(getDirectusUrl('/items/ETol'), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                }
            });
            console.log('E-Tol response:', res.data);
            etols = res.data.data || [];
        } catch (error) {
            console.error('Error fetching E-Tols:', error);
            showNotification('error', 'Gagal memuat data E-Tol: ' + (error.response?.data?.errors?.[0]?.message || error.message));
        }
    }

    function openModal(etol = null) {
        editingETol = etol;
        if (etol) {
            // Format nomor E-Tol saat edit (jika belum terformat)
            etolNumber = etol.no_etol ? formatEtolNumber(etol.no_etol) : '';
            etolPlace = etol.place || '';
        } else {
            etolNumber = '';
            etolPlace = '';
        }
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingETol = null;
        etolNumber = '';
        etolPlace = '';
    }

    async function saveETol() {
        if (!etolNumber.trim()) {
            showNotification('error', 'Nomor E-Tol tidak boleh kosong');
            return;
        }

        // Validasi panjang nomor E-Tol (harus 16 digit)
        const cleanNumber = etolNumber.replace(/\D/g, '');
        if (cleanNumber.length !== 16) {
            showNotification('error', 'Nomor E-Tol harus 16 digit');
            return;
        }

        if (!etolPlace.trim()) {
            showNotification('error', 'Daerah E-Tol tidak boleh kosong');
            return;
        }

        isLoading = true;
        
        try {
            const data = {
                no_etol: formatEtolNumber(etolNumber), // Pastikan format dengan strip
                place: etolPlace.trim()
            };

            if (editingETol) {
                // Update E-Tol
                await axios.patch(getDirectusUrl(`/items/ETol/${editingETol.id}`), data, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                showNotification('success', 'E-Tol berhasil diperbarui');
            } else {
                // Create new E-Tol - tambahkan created_at
                const createData = {
                    ...data,
                    created_at: new Date().toISOString()
                };
                
                console.log('Creating E-Tol with data:', createData);
                const response = await axios.post(getDirectusUrl('/items/ETol'), createData, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Create E-Tol response:', response.data);
                showNotification('success', 'E-Tol berhasil ditambahkan');
            }

            await fetchETols();
            closeModal();
        } catch (error) {
            console.error('Error saving E-Tol:', error);
            let errorMessage = 'Gagal menyimpan E-Tol';
            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage = 'Tidak ada akses untuk membuat/mengubah data E-Tol';
                } else if (error.response.status === 404) {
                    errorMessage = 'Collection ETol tidak ditemukan di database';
                } else if (error.response.data?.errors?.[0]?.message) {
                    errorMessage = error.response.data.errors[0].message;
                }
            }
            showNotification('error', errorMessage);
        } finally {
            isLoading = false;
        }
    }

    async function deleteETol(etol) {
        if (!confirm(`Yakin ingin menghapus E-Tol ${etol.no_etol}?`)) return;

        try {
            await axios.delete(getDirectusUrl(`/items/ETol/${etol.id}`), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                }
            });
            showNotification('success', 'E-Tol berhasil dihapus');
            await fetchETols();
        } catch (error) {
            console.error('Error deleting E-Tol:', error);
            showNotification('error', 'Gagal menghapus E-Tol');
        }
    }

    onMount(() => {
        fetchETols();
    });

    // Format nomor E-Tol dengan strip setiap 4 digit
    function formatEtolNumber(number) {
        // Hapus semua non-digit dan batasi maksimal 16 digit
        const cleanNumber = number.replace(/\D/g, '').slice(0, 16);
        // Tambahkan strip setiap 4 digit
        return cleanNumber.replace(/(\d{4})(?=\d)/g, '$1-');
    }

    // Handle input nomor E-Tol dengan formatting otomatis
    function handleEtolNumberInput(event) {
        const input = event.target;
        const cursorPosition = input.selectionStart;
        const oldValue = etolNumber;
        const newValue = formatEtolNumber(input.value);
        
        etolNumber = newValue;
        
        // Adjust cursor position setelah formatting
        setTimeout(() => {
            const oldLength = oldValue.length;
            const newLength = newValue.length;
            const newCursorPosition = cursorPosition + (newLength - oldLength);
            input.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    }

    // Format tanggal
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleDateString('id-ID', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
</script>

<!-- Notification component -->
{#if $notification.show}
    <div class="fixed top-4 right-4 z-[1000] animate-fade-in">
        <div class="px-4 py-3 rounded-lg shadow-lg {$notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white">
            {$notification.message}
        </div>
    </div>
{/if}

<div class="bg-white p-6 rounded-xl shadow-lg">
    <div class="flex justify-between items-center mb-6 mr-4">
        <h2 class="text-2xl font-bold text-blue-700">Kelola E-Tol</h2>
        <button 
            on:click={() => openModal()}
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition transform hover:scale-105"
        >
            <span class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Tambah E-Tol
            </span>
        </button>
    </div>

    <!-- E-Tol List -->
    <div class="overflow-x-auto">
        <table class="w-full border-collapse bg-white">
            <thead>
                <tr class="bg-gray-50">
                    <th class="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No E-Tol</th>
                    <th class="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daerah</th>
                    <th class="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                    <th class="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
            </thead>
            <tbody>
                {#if etols.length === 0}
                    <tr>
                        <td colspan="4" class="border border-gray-200 px-4 py-8 text-center text-gray-500">
                            Belum ada data E-Tol
                        </td>
                    </tr>
                {:else}
                    {#each etols as etol}
                        <tr class="hover:bg-gray-50">
                            <td class="border border-gray-200 px-4 py-3 text-sm text-gray-900">{etol.no_etol}</td>
                            <td class="border border-gray-200 px-4 py-3 text-sm text-gray-900">{etol.place}</td>
                            <td class="border border-gray-200 px-4 py-3 text-sm text-gray-500">{formatDate(etol.created_at)}</td>
                            <td class="border border-gray-200 px-4 py-3 text-sm">
                                <div class="flex space-x-2">
                                    <button 
                                        on:click={() => openModal(etol)}
                                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        on:click={() => deleteETol(etol)}
                                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>
</div>

<!-- Modal for Add/Edit E-Tol -->
{#if showModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in-up">
            <button 
                class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                on:click={closeModal}
                aria-label="Tutup modal"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>

            <div class="mb-6">
                <h3 class="text-xl font-bold text-blue-700">
                    {editingETol ? 'Edit E-Tol' : 'Tambah E-Tol Baru'}
                </h3>
                <p class="text-gray-600 text-sm mt-1">
                    {editingETol ? 'Perbarui informasi E-Tol' : 'Masukkan informasi E-Tol baru'}
                </p>
            </div>

            <form on:submit|preventDefault={saveETol} class="space-y-4">
                <div>
                    <label for="etolNumber" class="block text-sm font-medium text-gray-700 mb-1">
                        Nomor E-Tol <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="etolNumber"
                        type="text"
                        bind:value={etolNumber}
                        on:input={handleEtolNumberInput}
                        required
                        maxlength="19"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contoh: 1234-1234-1234-1234"
                    />
                </div>

                <div>
                    <label for="etolPlace" class="block text-sm font-medium text-gray-700 mb-1">
                        Daerah E-Tol <span class="text-red-500">*</span>
                    </label>
                    <input
                        id="etolPlace"
                        type="text"
                        bind:value={etolPlace}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contoh: Jakarta - Cikampek"
                    />
                </div>

                <div class="flex space-x-3 pt-4">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        class="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition"
                    >
                        {#if isLoading}
                            <div class="flex items-center justify-center">
                                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Menyimpan...
                            </div>
                        {:else}
                            {editingETol ? 'Perbarui' : 'Simpan'}
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
