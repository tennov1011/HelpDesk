<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import axios from 'axios';
    import { writable } from 'svelte/store';

    export let employee = null;

    let name = '';
    let target_department = '';
    let division = '';
    let additional = '';
    let rating = '5';
    let departmentQuestions = [];
    let questionAnswers = {};
    let isLoading = false;

    const dispatch = createEventDispatcher();

    const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL || 'https://directus.eltamaprimaindo.com';
    const DIRECTUS_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN || 'JaXaSE93k24zq7T2-vZyu3lgNOUgP8fz';

    // Daftar departemen
    const departments = [
        'IT',
        'HR',
        'Finance',
        'Marketing',
        'Procurement',
        'Produksi',
        'Inventory',
        'Management',
        'Project',
        'Maintenance'
    ];

    function getDirectusUrl(path) {
        return `${DIRECTUS_URL.replace(/\/$/, '')}${path}`;
    }

    let notification = writable({ show: false, type: '', message: '' });
    let notificationTimeout;

    function showNotification(type, message) {
        notification.set({ show: true, type, message });
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            notification.set({ show: false, type: '', message: '' });
        }, 3000);
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeydown);
        // Pre-fill user data if employee exists
        if (employee) {
            name = employee.nama_karyawan || '';
            division = employee.divisi || '';
        }
    });

    onDestroy(() => {
        document.removeEventListener('keydown', handleKeydown);
    });

    // Fetch questions when department is selected
    async function fetchDepartmentQuestions(department) {
        if (!department) {
            departmentQuestions = [];
            questionAnswers = {};
            return;
        }

        try {
            const res = await axios.get(getDirectusUrl('/items/SurveyQuestions'), {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`
                },
                params: {
                    filter: {
                        department: { _eq: department }
                    }
                }
            });
            departmentQuestions = res.data.data || [];
            // Reset answers when department changes
            questionAnswers = {};
        } catch (error) {
            console.error('Error fetching department questions:', error);
            departmentQuestions = [];
            questionAnswers = {};
        }
    }

    // Watch for department changes
    $: if (target_department) {
        fetchDepartmentQuestions(target_department);
    }

    // Validate form data before submission
    function validateForm() {
        if (!name.trim()) {
            showNotification('error', 'Nama tidak boleh kosong');
            return false;
        }
        
        if (!target_department.trim()) {
            showNotification('error', 'Target departemen harus dipilih');
            return false;
        }
        
        if (!division.trim()) {
            showNotification('error', 'Divisi tidak boleh kosong');
            return false;
        }

        // Validate all required questions are answered
        if (departmentQuestions.length > 0) {
            const unansweredQuestions = departmentQuestions.filter(q => !questionAnswers[q.id]?.trim());
            if (unansweredQuestions.length > 0) {
                showNotification('error', 'Semua pertanyaan wajib dijawab');
                return false;
            }
        }
        
        return true;
    }

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        console.log('Starting survey submission...');
        
        isLoading = true;
        
        // Format questions and answers
        const questionData = departmentQuestions.map(q => ({
            question_id: q.id,
            question: q.question,
            answer: questionAnswers[q.id] || ''
        }));

        const data = {
            name: name.trim(),
            target_department: target_department,
            division: division.trim(),
            additional: additional.trim(),
            rating: parseInt(rating),
            questions: JSON.stringify(questionData) // Convert to JSON string for database
        };

        console.log('Survey payload:', data);
        console.log('Questions JSON:', JSON.stringify(questionData));

        try {
            const response = await axios.post(getDirectusUrl('/items/Survey'), data, {
                headers: {
                    Authorization: `Bearer ${DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Survey response success:', response.data);
            showNotification('success', 'Survey Anda telah terkirim. Terima kasih!');
            
            // Reset form
            name = employee?.nama_karyawan || '';
            target_department = '';
            division = employee?.divisi || '';
            additional = '';
            rating = '5';
            departmentQuestions = [];
            questionAnswers = {};
            
            // Redirect ke dashboard setelah submit sukses
            setTimeout(() => {
                dispatch('submitted');
            }, 2000);
        } catch (error) {
            console.error('Survey submit error:', error);
            
            let errorMessage = 'Gagal mengirim survey';
            if (error.response?.data?.errors) {
                errorMessage = error.response.data.errors[0]?.message || errorMessage;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showNotification('error', errorMessage);
        } finally {
            isLoading = false;
        }
    };

    export let onClose = undefined;

    function handleClose() {
        if (typeof onClose === 'function') onClose();
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleClose();
        }
    }
</script>

{#if isLoading}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div class="flex flex-col items-center">
            <svg
                class="animate-spin h-6 w-6 sm:h-12 sm:w-12 text-blue-600 mb-2 sm:mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span class="text-white text-sm sm:text-lg font-semibold">Mengirim survey...</span>
        </div>
    </div>
{/if}

{#if $notification.show}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        <div
            class="px-2 py-1 sm:px-6 sm:py-3 rounded shadow-lg font-semibold text-white text-center transition-all duration-300 text-xs sm:text-base"
            class:bg-green-500={$notification.type === 'success'}
            class:bg-red-500={$notification.type === 'error'}
            class:animate-bounce={$notification.type === 'success'}
        >
            {$notification.message}
        </div>
    </div>
{/if}

<div class="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4">
    <div class="w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-3xl mx-auto bg-white p-3 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-2xl relative overflow-y-auto max-h-[75vh] sm:max-h-[90vh]">
        <!-- Close button -->
        <button
            on:click={handleClose}
            aria-label="Tutup"
            class="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-600 hover:text-red-500 text-lg sm:text-2xl font-bold z-50 focus:outline-none w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center bg-white rounded-full shadow-sm"
            >&times;</button
        >
        
        <form
            on:submit={handleSubmit}
            class="flex flex-col gap-2 sm:gap-6 w-full mt-6 sm:mt-0"
        >
            <div>
                <h2 class="text-sm sm:text-lg font-semibold text-gray-700 border-b pb-1 sm:pb-2 mb-2 sm:mb-4">
                    Survey Departemen
                </h2>
            </div>

            <!-- Target Department -->
            <div>
                <label for="target_department" class="block font-medium text-xs sm:text-base mb-0.5 sm:mb-2">
                    Target Departemen 
                    <span class="text-red-500 text-sm sm:text-xl" title="Field wajib diisi">*</span>
                </label>
                <select
                    id="target_department"
                    name="target_department"
                    bind:value={target_department}
                    class="w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-blue-400 outline-none transition"
                >
                    <option value="">Pilih departemen yang dituju</option>
                    {#each departments as dept}
                        <option value={dept}>{dept}</option>
                    {/each}
                </select>
            </div>

            <!-- Rating Departemen -->
            <div>
                <label for="rating" class="block font-medium text-xs sm:text-base mb-0.5 sm:mb-2">
                    Rating Departemen
                    <span class="text-gray-500 text-xs">(1 = Sangat Buruk, 5 = Sangat Baik)</span>
                </label>
                <select
                    id="rating"
                    name="rating"
                    bind:value={rating}
                    class="w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-yellow-400 outline-none transition"
                >
                    <option value="1">⭐ 1 - Sangat Buruk</option>
                    <option value="2">⭐⭐ 2 - Buruk</option>
                    <option value="3">⭐⭐⭐ 3 - Cukup</option>
                    <option value="4">⭐⭐⭐⭐ 4 - Baik</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 - Sangat Baik</option>
                </select>
            </div>

            <!-- Questions Section (Dynamic based on selected department) -->
            {#if departmentQuestions.length > 0}
                <div>
                    <label class="block font-medium text-xs sm:text-base mb-2 sm:mb-4">
                        Pertanyaan Survey
                        <span class="text-red-500 text-sm sm:text-xl" title="Semua pertanyaan wajib dijawab">*</span>
                    </label>
                    
                    {#each departmentQuestions as question, index}
                        <div class="border border-gray-200 rounded-lg p-2 sm:p-4 mb-2 sm:mb-3 bg-gray-50">
                            <h4 class="font-medium text-xs sm:text-sm text-gray-700 mb-2">
                                {index + 1}. {question.question}
                            </h4>
                            <textarea
                                bind:value={questionAnswers[question.id]}
                                placeholder="Masukkan jawaban Anda..."
                                rows="3"
                                class="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-green-400 outline-none transition resize-none"
                            ></textarea>
                        </div>
                    {/each}
                </div>
            {:else if target_department}
                <div class="text-center text-gray-500 py-4">
                    Tidak ada pertanyaan tersedia untuk departemen {target_department}
                </div>
            {/if}

            <!-- Additional -->
            <div>
                <label for="additional" class="block font-medium text-xs sm:text-base mb-0.5 sm:mb-2">
                    Tambahan Pendapat (Opsional)
                </label>
                <textarea
                    id="additional"
                    name="additional"
                    bind:value={additional}
                    rows="3"
                    placeholder="Masukkan pendapat tambahan untuk target departemen..."
                    class="w-full px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 rounded text-xs sm:text-base focus:ring-2 focus:ring-purple-400 outline-none transition resize-none"
                ></textarea>
            </div>
            
            <button
                type="submit"
                class="mt-2 sm:mt-8 w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 sm:py-3 rounded font-medium text-xs sm:text-base shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
                disabled={isLoading}
            >
                {#if isLoading}
                    Mengirim Survey...
                {:else}
                    Kirim Survey
                {/if}
            </button>
        </form>
    </div>
</div>

<style>
    @media (max-width: 375px) {
        /* iPhone SE specific optimizations */
        .max-w-\[95vw\] {
            max-width: 95vw;
        }
    }
    @media (max-width: 639px) {
        /* General mobile optimizations */
        .max-w-\[95vw\] {
            max-width: 95vw;
        }
    }
</style>