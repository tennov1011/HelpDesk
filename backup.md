// Fungsi export PDF untuk kategori Pengajuan BBM
function exportFuelRequestPDF(ticket) {
    if (!ticket || ticket.category?.toLowerCase() !== 'pengajuan bbm') {
        alert('Fungsi export PDF hanya tersedia untuk kategori Pengajuan BBM');
        return;
    }

    // Function to extract first name from full name
    function getFirstName(fullName) {
        if (!fullName) return '';
        return fullName.split(' ')[0]; // Get first word/name
    }

    // Function to get previous kilometer data
    async function getPreviousKilometerForPDF(vehicleInfo) {
        if (!vehicleInfo || typeof vehicleInfo !== 'string') return 'Tidak ada data';

        try {
            const vehicleMatch = vehicleInfo.match(/^([^-]+)/);
            if (!vehicleMatch) return 'Tidak ada data';

            const vehicleIdentifier = vehicleMatch[1].trim();

            const response = await axios.get(`${DIRECTUS_URL}/items/TicketForm`, {
                headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
                params: {
                    filter: {
                        category: { _eq: 'Pengajuan BBM' },
                        vehicle_type: { _contains: vehicleIdentifier },
                        status: { _in: ['Done', 'On Progress'] }
                    },
                    sort: ['-date_created'],
                    limit: 10
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                const filteredTickets = response.data.data.filter(
                    (t) => t.id !== ticket.id && t.initial_kilometer
                );

                if (filteredTickets.length > 0) {
                    const lastTicket = filteredTickets[0];
                    return parseInt(lastTicket.initial_kilometer).toLocaleString('id-ID');
                }
            }
            return 'Tidak ada data';
        } catch (error) {
            console.error('Error fetching previous kilometer:', error);
            return 'Error';
        }
    }

    // Generate PDF with async data
    async function generatePDF() {
        try {
            // Get previous kilometer data first
            const previousKilometer = await getPreviousKilometerForPDF(ticket.vehicle_type);

            // Create new PDF with half-A4 portrait format (148x210 mm)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [148, 210]
            });

            // Calculate usable width with margins
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 8;
            const usableWidth = pageWidth - 2 * margin;
            const colGap = 8; // Gap antar kolom
            const colWidth = (usableWidth - colGap) / 2;

            // X posisi label dan value untuk kolom kiri
            const leftLabelX = margin;
            const leftValueX = margin + 38; // 38mm dari kiri, agar rata semua value

            // X posisi label dan value untuk kolom kanan
            const rightLabelX = margin + colWidth + colGap;
            const rightValueX = rightLabelX + 38;

            // Set font
            doc.setFont('helvetica');

            // Header - margin atas 5mm dari tepi halaman
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('PT. ELTAMA PRIMA INDO', pageWidth / 2, 5, { align: 'center' });

            // Subheader dengan alamat
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Jl. Raya Pasportel, Gang Nangka No.88, RW.3, Bojong Kulur, Kec. Gn. Putri',
                pageWidth / 2,
                9,
                { align: 'center' }
            );
            doc.text('Kabupaten Bogor, Jawa Barat 16969. Telp (021)827 45454', pageWidth / 2, 12, {
                align: 'center'
            });
            doc.text(
                'Email : sales@eltamaprimaindo.com Website : www.eltamaprimaindo.com www.foxaprint.com',
                pageWidth / 2,
                15,
                { align: 'center' }
            );

            // Title dengan background
            doc.setFillColor(200, 220, 255); // Light blue background
            doc.rect(margin, 18, usableWidth, 6, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('PENGAJUAN ANGGARAN BBM', pageWidth / 2, 22, { align: 'center' });

            // Tanggal di kanan atas - diturunkan posisinya
            const currentDate = new Date().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(`Tanggal`, pageWidth - margin, 28, { align: 'right' }); // Turun dari 26 ke 28
            doc.text(`${currentDate}`, pageWidth - margin, 31, { align: 'right' }); // Turun dari 29 ke 31

            let yPos = 34; // Adjusted untuk tanggal yang diturunkan
            const lineHeight = 6; // spacing antar field

            // Fungsi bantu untuk menggambar label dan value dengan jarak konsisten
            function drawField(label, value, xLabel, xValue, y, doc, bold = false) {
                if (bold) doc.setFont('helvetica', 'bold');
                else doc.setFont('helvetica', 'normal');
                doc.text(label, xLabel, y);
                doc.text(':', xValue - 2, y); // Tanda ":" selalu 2mm sebelum value
                doc.setFont('helvetica', 'normal');
                doc.text(value, xValue, y);
            }

            // Kiri: ID, Nama Pengaju, Nama Kendaraan, KM Awal, Bensin Awal, Jumlah Pengajuan
            drawField('ID', ticket.id, leftLabelX, leftValueX, yPos, doc, true); yPos += lineHeight;
            drawField('Nama Pengaju', ticket.name || '-', leftLabelX, leftValueX, yPos, doc, true); yPos += lineHeight;
            drawField('Nama Kendaraan', ticket.vehicle_type || '-', leftLabelX, leftValueX, yPos, doc, true); yPos += lineHeight;
            const kmAwal = `${previousKilometer} -> ${ticket.initial_kilometer || '-'}`;
            drawField('KM Awal', kmAwal, leftLabelX, leftValueX, yPos, doc, true); yPos += lineHeight;
            drawField('Bensin Awal', ticket.initial_fuel || '-', leftLabelX, leftValueX, yPos, doc, true); yPos += lineHeight;
            const nominalFormatted = ticket.submission_amount
                ? 'Rp ' + parseFloat(ticket.submission_amount).toLocaleString('id-ID')
                : 'Rp -';
            drawField('Jumlah Pengajuan', nominalFormatted, leftLabelX, leftValueX, yPos, doc, true);

            // Simpan Y terakhir kolom kiri
            let leftEndY = yPos + lineHeight;

            // Kolom kanan: Tujuan, Penerima Dana, dst
            yPos = 34;
            drawField('Tujuan', ticket.destination || ticket.desc || ticket.ticket || '-', rightLabelX, rightValueX, yPos, doc, true); yPos += lineHeight;
            drawField('Penerima Dana', ticket.name || '-', rightLabelX, rightValueX, yPos, doc, true); yPos += lineHeight;
            drawField('Cash', ' ', rightLabelX, rightValueX, yPos, doc, true); yPos += lineHeight;
            // Tambahkan field lain jika perlu...

            // Simpan Y terakhir kolom kanan
            let rightEndY = yPos + lineHeight;

            // Ambil Y terbesar untuk mulai tanda tangan
            let signatureY = Math.max(leftEndY, rightEndY) + 6;

            // Tanda tangan section (full width) - dinaikkan posisinya dengan spacing yang lebih rapat
            doc.setFont('helvetica', 'normal');
            doc.text('Hormat kami,', margin, signatureY);
            signatureY += 6; // Reduced spacing dari 8 ke 6

            // Calculate positions for 4 signatures in a single row
            const signatureWidth = usableWidth / 4;
            const signaturePositions = [
                margin + signatureWidth / 2,
                margin + signatureWidth * 1.5,
                margin + signatureWidth * 2.5,
                margin + signatureWidth * 3.5
            ];

            // Get first name for the signature
            const firstName = getFirstName(ticket.name);

            // Signature titles
            doc.setFontSize(7);
            doc.text('Yang Mengajukan,', signaturePositions[0], signatureY, { align: 'center' });
            doc.text('Disetujui,', signaturePositions[1], signatureY, { align: 'center' });
            doc.text('Mengetahui,', signaturePositions[2], signatureY, { align: 'center' });
            doc.text('Manager Finance,', signaturePositions[3], signatureY, { align: 'center' });

            signatureY += 10; // Reduced spacing dari 12 ke 10

            // Names below signature lines
            doc.text(`(${firstName || '...........'})`, signaturePositions[0], signatureY, { align: 'center' });
            doc.text('(............)', signaturePositions[1], signatureY, { align: 'center' });
            doc.text('(............)', signaturePositions[2], signatureY, { align: 'center' });
            doc.text('(............)', signaturePositions[3], signatureY, { align: 'center' });

            signatureY += 3; // Reduced spacing dari 4 ke 3

            // Position/title labels
            doc.setFontSize(6);
            doc.text('Karyawan', signaturePositions[0], signatureY, { align: 'center' });
            doc.text('HRD      ', signaturePositions[1], signatureY, { align: 'center' });
            doc.text('Manajemen', signaturePositions[2], signatureY, { align: 'center' });

            // Add invisible border to enforce margins during printing
            doc.setDrawColor(255, 255, 255); // White color (invisible)
            doc.setLineWidth(0.1);
            doc.rect(0, 0, pageWidth, pageHeight);

            // Simpan PDF
            const fileName = `Pengajuan_BBM_${getFirstName(ticket.name)?.replace(/\s+/g, '_') || 'Unknown'}_${ticket.id}.pdf`;
            doc.save(fileName);

            // Show success message
            alert('PDF berhasil di-download!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Gagal membuat PDF. Silakan coba lagi.');
        }
    }

    // Call the async function to generate PDF
    generatePDF();
}