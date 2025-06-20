<script>
  // Dummy data tiket
  let tickets = [
    { id: 1, name: "Andi", category: "Hardware", priority: "Tinggi", status: "Proses", technician: "Budi" },
    { id: 2, name: "Rina", category: "Jaringan", priority: "Sedang", status: "Baru", technician: "-" },
    { id: 3, name: "Dodi", category: "Email", priority: "Darurat", status: "Selesai", technician: "Ani" }
  ];

  // Variabel untuk form modal
  let showModal = false;
  let isEditing = false;
  let currentTicket = {
    id: null,
    name: "",
    category: "",
    priority: "",
    status: "",
    technician: ""
  };

  // Kategori dan pilihan lainnya
  const categories = ["Hardware", "Jaringan", "Server", "Aplikasi", "Email"];
  const priorities = ["Rendah", "Sedang", "Tinggi", "Darurat"];
  const statuses = ["Baru", "Proses", "Tertunda", "Selesai"];
  const technicians = ["Budi", "Ani", "Candra"];

  // Fungsi: Buka modal tambah/edit
  function openAddModal() {
    isEditing = false;
    currentTicket = {
      id: null,
      name: "",
      category: "",
      priority: "",
      status: "",
      technician: ""
    };
    showModal = true;
  }

  function openEditModal(ticket) {
    isEditing = true;
    currentTicket = { ...ticket };
    showModal = true;
  }

  // Fungsi: Simpan atau Update
  function saveTicket() {
    if (!isEditing) {
      // Create
      const newTicket = { ...currentTicket, id: tickets.length + 1 };
      tickets = [...tickets, newTicket];
    } else {
      // Update
      tickets = tickets.map(t =>
        t.id === currentTicket.id ? { ...currentTicket } : t
      );
    }
    showModal = false;
  }

  // Fungsi: Hapus tiket
  function deleteTicket(id) {
    tickets = tickets.filter(t => t.id !== id);
  }
</script>

<div class="p-6 bg-gray-100 min-h-screen">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Kelola Tiket</h1>
    <button on:click={openAddModal} class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
      Tambah Tiket
    </button>
  </div>

  <!-- Tabel Tiket -->
  <div class="bg-white shadow rounded overflow-hidden">
    <table class="w-full table-auto">
      <thead class="bg-gray-200">
        <tr>
          <th class="p-3 text-left">ID</th>
          <th>Nama</th>
          <th>Kategori</th>
          <th>Prioritas</th>
          <th>Status</th>
          <th>Teknisi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#each tickets as ticket}
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3">{ticket.id}</td>
            <td>{ticket.name}</td>
            <td>{ticket.category}</td>
            <td>{ticket.priority}</td>
            <td>
              <span class="px-2 py-1 rounded text-white
                {ticket.status === 'Selesai' ? 'bg-green-500' :
                 ticket.status === 'Proses' ? 'bg-blue-500' :
                 ticket.status === 'Tertunda' ? 'bg-yellow-500' : 'bg-red-500'}">
                {ticket.status}
              </span>
            </td>
            <td>{ticket.technician || '-'}</td>
            <td class="p-3 space-x-2">
              <button on:click={() => openEditModal(ticket)} class="text-blue-500 hover:underline">Edit</button>
              <button on:click={() => deleteTicket(ticket.id)} class="text-red-500 hover:underline">Hapus</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Modal Form -->
  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-md p-6 rounded shadow-lg">
        <h2 class="text-xl font-bold mb-4">{isEditing ? 'Edit Tiket' : 'Tambah Tiket Baru'}</h2>
        <form on:submit|preventDefault={saveTicket}>
          <div class="mb-4">
            <label>Nama Pelapor</label>
            <input type="text" bind:value={currentTicket.name} required class="w-full border p-2 rounded" />
          </div>
          <div class="mb-4">
            <label>Kategori</label>
            <select bind:value={currentTicket.category} required class="w-full border p-2 rounded">
              <option value="">-- Pilih --</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
          <div class="mb-4">
            <label>Prioritas</label>
            <select bind:value={currentTicket.priority} required class="w-full border p-2 rounded">
              {#each priorities as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </div>
          <div class="mb-4">
            <label>Status</label>
            <select bind:value={currentTicket.status} required class="w-full border p-2 rounded">
              {#each statuses as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>
          <div class="mb-4">
            <label>Teknisi</label>
            <select bind:value={currentTicket.technician} class="w-full border p-2 rounded">
              <option value="">-- Pilih --</option>
              {#each technicians as t}
                <option value={t}>{t}</option>
              {/each}
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" on:click={() => showModal = false} class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
              Batal
            </button>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>