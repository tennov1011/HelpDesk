<script context="module">
  export async function load({ params }) {
    // Dummy data berdasarkan ID dari URL
    const dummyTickets = [
      { id: 1, name: "Andi", category: "Hardware", priority: "Tinggi", status: "Proses", technician: "Budi", description: "Laptop tidak bisa menyala.", created_at: "2025-04-05" },
      { id: 2, name: "Rina", category: "Jaringan", priority: "Sedang", status: "Baru", technician: "-", description: "Internet lambat di ruang meeting.", created_at: "2025-04-06" }
    ];
    const ticket = dummyTickets.find(t => t.id == params.id);
    return { props: { ticket } };
  }
</script>

<script>
  export let ticket;
</script>

{#if ticket}
  <div class="p-6 bg-gray-100 min-h-screen">
    <h1 class="text-2xl font-bold mb-6">Detail Tiket #{ticket.id}</h1>

    <div class="bg-white shadow rounded p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><strong>Nama:</strong> {ticket.name}</div>
        <div><strong>Kategori:</strong> {ticket.category}</div>
        <div><strong>Prioritas:</strong> {ticket.priority}</div>
        <div><strong>Status:</strong> 
          <span class="ml-2 px-2 py-1 rounded text-white
            {ticket.status === 'Selesai' ? 'bg-green-500' :
             ticket.status === 'Proses' ? 'bg-blue-500' :
             ticket.status === 'Tertunda' ? 'bg-yellow-500' : 'bg-red-500'}">
            {ticket.status}
          </span>
        </div>
        <div><strong>Teknisi:</strong> {ticket.technician || '-'}</div>
        <div><strong>Tanggal:</strong> {ticket.created_at}</div>
      </div>
      <div class="mt-4">
        <strong>Deskripsi Masalah:</strong>
        <p class="mt-2 p-3 bg-gray-100 rounded">{ticket.description}</p>
      </div>
    </div>

    <div class="mt-6">
      <a href="/admin/tickets" class="text-blue-500 hover:underline">&larr; Kembali ke daftar tiket</a>
    </div>
  </div>
{/if}

{#if !ticket}
  <div class="p-6 bg-gray-100 min-h-screen">
    <h1 class="text-2xl font-bold mb-6">Tiket tidak ditemukan</h1>
    <p class="text-gray-600">Tiket dengan ID yang diberikan tidak ditemukan.</p>
    <a href="/admin/tickets" class="text-blue-500 hover:underline">&larr; Kembali ke daftar tiket</a>
  </div>
{/if}