<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import axios from 'axios';
    import { writable } from 'svelte/store';
    import { userDepartment } from '$lib/services/firebaseConfig';

    let questions = [];
    let showModal = false;
    let editingQuestion = null;
    let questionText = '';
    let isLoading = false;
    let adminDept = '';

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

    // Subscribe to admin department
    userDepartment.subscribe((dept) => {
        adminDept = dept;
        if (dept) {
            fetchQuestions();
        }
    });

    // Fetch questions for admin's department
    async function fetchQuestions() {
        if (!adminDept) return;
        
        try {
            const res = await axios.get(getDirectusUrl('/items/SurveyQuestions'), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                },
                params: {
                    filter: {
                        department: { _eq: adminDept }
                    }
                }
            });
            questions = res.data.data || [];
        } catch (error) {
            console.error('Error fetching questions:', error);
            showNotification('error', 'Gagal memuat pertanyaan');
        }
    }

    function openModal(question = null) {
        editingQuestion = question;
        questionText = question ? question.question : '';
        showModal = true;
    }

    function closeModal() {
        showModal = false;
        editingQuestion = null;
        questionText = '';
    }

    async function saveQuestion() {
        if (!questionText.trim()) {
            showNotification('error', 'Pertanyaan tidak boleh kosong');
            return;
        }

        isLoading = true;
        
        try {
            const data = {
                question: questionText.trim(),
                department: adminDept
            };

            if (editingQuestion) {
                // Update existing question
                await axios.patch(getDirectusUrl(`/items/SurveyQuestions/${editingQuestion.id}`), data, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                showNotification('success', 'Pertanyaan berhasil diperbarui');
            } else {
                // Create new question
                await axios.post(getDirectusUrl('/items/SurveyQuestions'), data, {
                    headers: {
                        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                showNotification('success', 'Pertanyaan berhasil ditambahkan');
            }

            closeModal();
            fetchQuestions();
        } catch (error) {
            console.error('Error saving question:', error);
            showNotification('error', 'Gagal menyimpan pertanyaan');
        } finally {
            isLoading = false;
        }
    }

    async function deleteQuestion(question) {
        if (!confirm('Yakin ingin menghapus pertanyaan ini?')) return;

        try {
            await axios.delete(getDirectusUrl(`/items/SurveyQuestions/${question.id}`), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                }
            });
            showNotification('success', 'Pertanyaan berhasil dihapus');
            fetchQuestions();
        } catch (error) {
            console.error('Error deleting question:', error);
            showNotification('error', 'Gagal menghapus pertanyaan');
        }
    }

    export let onClose = undefined;

    function handleClose() {
        if (typeof onClose === 'function') onClose();
    }

    onMount(() => {
        if (adminDept) {
            fetchQuestions();
        }
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
                Kelola Pertanyaan Survey - {adminDept}
            </h2>

            <!-- Add Question Button -->
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-medium text-gray-600">Daftar Pertanyaan</h3>
                <button
                    on:click={() => openModal()}
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                >
                    + Tambah Pertanyaan
                </button>
            </div>

            <!-- Questions List -->
            <div class="space-y-4 max-h-96 overflow-y-auto">
                {#if questions.length === 0}
                    <div class="text-center text-gray-500 py-8">
                        Belum ada pertanyaan untuk departemen {adminDept}
                    </div>
                {:else}
                    {#each questions as question, index}
                        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h4 class="font-medium text-gray-700 mb-2">Pertanyaan {index + 1}</h4>
                                    <p class="text-gray-600 text-sm leading-relaxed">{question.question}</p>
                                </div>
                                <div class="flex space-x-2 ml-4">
                                    <button
                                        on:click={() => openModal(question)}
                                        class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        on:click={() => deleteQuestion(question)}
                                        class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Question Edit/Add Modal -->
{#if showModal}
    <div class="fixed inset-0  z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <h3 class="text-lg font-semibold text-gray-700 mb-4">
                {editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}
            </h3>
            
            <div class="mb-4">
                <label class="block font-medium text-gray-700 mb-2">Pertanyaan</label>
                <textarea
                    bind:value={questionText}
                    rows="4"
                    placeholder="Masukkan pertanyaan untuk survey..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition resize-none"
                ></textarea>
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
                    on:click={saveQuestion}
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    disabled={isLoading || !questionText.trim()}
                >
                    {#if isLoading}
                        Menyimpan...
                    {:else}
                        {editingQuestion ? 'Perbarui' : 'Simpan'}
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}