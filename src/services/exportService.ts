import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { Schedule, ShiftConfig, Staff, AttendanceRecord, LeaveRequest, HandoverRecord } from '../types';

// Ensure autoTable plugin is registered on jsPDF prototype if available
try {
  applyPlugin(jsPDF);
} catch {
  // Plugin might already be applied or handled via function call
}

interface ReportFilter {
  startDate: string;
  endDate: string;
  staffId?: string;
  shiftId?: string;
}

export function exportScheduleToExcel(
  schedules: Schedule[],
  shifts: ShiftConfig[],
  staffList: Staff[],
  filter: ReportFilter
) {
  const shiftMap = new Map(shifts.map(s => [s.shiftId, s.name]));
  const staffMap = new Map(staffList.map(st => [st.staffId, st]));

  const filtered = schedules.filter(s => {
    if (s.date < filter.startDate || s.date > filter.endDate) return false;
    if (filter.staffId && s.staffId !== filter.staffId) return false;
    if (filter.shiftId && s.shiftId !== filter.shiftId) return false;
    return true;
  });

  const rows = filtered.map((s, index) => {
    const staff = staffMap.get(s.staffId);
    return {
      'No': index + 1,
      'Tanggal': s.date,
      'Shift': shiftMap.get(s.shiftId) || s.shiftId,
      'Nama Petugas ATLM': staff?.fullName || 'Belum Ditugaskan',
      'NIP / STR': staff?.employeeNumber || '-',
      'Posisi / Unit': staff?.position || '-',
      'Status Jadwal': s.status.toUpperCase(),
      'Jam Mulai': new Date(s.startAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Jam Selesai': new Date(s.endAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Catatan': s.notes || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Shift');

  const filename = `Jadwal_Shift_Lab_RSUD_SMJ_I_${filter.startDate}_sd_${filter.endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportRecapToExcel(
  schedules: Schedule[],
  shifts: ShiftConfig[],
  staffList: Staff[],
  attendance: AttendanceRecord[],
  filter: ReportFilter
) {
  const staffMap = new Map(staffList.map(st => [st.staffId, st]));

  // Calculate stats per staff
  const staffStats = staffList.map((st, idx) => {
    const staffScheds = schedules.filter(
      s => s.staffId === st.staffId && s.date >= filter.startDate && s.date <= filter.endDate && s.status !== 'cancelled'
    );
    const morningCount = staffScheds.filter(s => s.shiftId === 'pagi').length;
    const afternoonCount = staffScheds.filter(s => s.shiftId === 'sore').length;
    const nightCount = staffScheds.filter(s => s.shiftId === 'malam').length;
    const totalShift = staffScheds.length;

    // Approximate scheduled hours: Pagi 7h, Sore 7h, Malam 10h
    const scheduledHours = (morningCount * 7) + (afternoonCount * 7) + (nightCount * 10);

    // Actual attendance in date range
    const staffAtt = attendance.filter(
      a => a.staffId === st.staffId && a.date >= filter.startDate && a.date <= filter.endDate
    );
    const presentCount = staffAtt.filter(a => a.status === 'present').length;
    const lateCount = staffAtt.filter(a => a.status === 'late').length;
    const excusedCount = staffAtt.filter(a => a.status === 'excused').length;
    const absentCount = staffAtt.filter(a => a.status === 'absent').length;

    return {
      'No': idx + 1,
      'Nama Petugas ATLM': st.fullName,
      'NIP / STR': st.employeeNumber,
      'Jabatan': st.position,
      'Total Shift': totalShift,
      'Pagi': morningCount,
      'Sore': afternoonCount,
      'Malam': nightCount,
      'Total Jam Terjadwal': `${scheduledHours} Jam`,
      'Hadir': presentCount,
      'Terlambat': lateCount,
      'Izin/Cuti': excusedCount,
      'Tanpa Keterangan': absentCount,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(staffStats);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kerja & Presensi');

  const filename = `Rekap_Presensi_dan_Jam_Kerja_Lab_${filter.startDate}_sd_${filter.endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportScheduleToPDF(
  schedules: Schedule[],
  shifts: ShiftConfig[],
  staffList: Staff[],
  filter: ReportFilter
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Letterhead (Kop Surat)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(23, 107, 98); // Medical Teal #176B62
  doc.text('PEMERINTAH KABUPATEN KAYONG UTARA', 148.5, 14, { align: 'center' });
  doc.setFontSize(15);
  doc.setTextColor(32, 43, 42); // Primary Dark #202B2A
  doc.text('RSUD SULTAN MUHAMMAD JAMALUDIN I', 148.5, 21, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(104, 117, 114); // Secondary Text #687572
  doc.text('INSTALASI LABORATORIUM PATOLOGI KLINIK', 148.5, 26, { align: 'center' });
  doc.setFontSize(8);
  doc.text('Jl. Provinsi No. 1, Teluk Batang / Sukadana, Kab. Kayong Utara, Kalimantan Barat (Zona WIB / Asia/Pontianak)', 148.5, 30, { align: 'center' });

  // Divider Line
  doc.setDrawColor(23, 107, 98);
  doc.setLineWidth(0.8);
  doc.line(14, 33, 283, 33);
  doc.setLineWidth(0.2);
  doc.line(14, 34.5, 283, 34.5);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(32, 43, 42);
  doc.text('DAFTAR JADWAL SHIFT JAGA INSTALASI LABORATORIUM PATOLOGI KLINIK', 148.5, 42, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Periode: ${filter.startDate} s/d ${filter.endDate} | Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })} (WIB)`, 148.5, 47, { align: 'center' });

  const shiftMap = new Map(shifts.map(s => [s.shiftId, s.name]));
  const staffMap = new Map(staffList.map(st => [st.staffId, st]));

  const filtered = schedules.filter(s => {
    if (s.date < filter.startDate || s.date > filter.endDate) return false;
    if (filter.staffId && s.staffId !== filter.staffId) return false;
    if (filter.shiftId && s.shiftId !== filter.shiftId) return false;
    return true;
  });

  const tableRows = filtered.map((s, index) => {
    const staff = staffMap.get(s.staffId);
    return [
      (index + 1).toString(),
      s.date,
      shiftMap.get(s.shiftId) || s.shiftId,
      staff?.fullName || 'Belum Ditugaskan',
      staff?.employeeNumber || '-',
      staff?.position || '-',
      s.status.toUpperCase(),
      `${new Date(s.startAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.endAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      s.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 52,
    head: [['No', 'Tanggal', 'Shift', 'Nama Petugas ATLM', 'NIP / STR', 'Posisi', 'Status', 'Jam Jaga', 'Catatan']],
    body: tableRows,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [23, 107, 98],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // Signature Block
  const signY = finalY + 12 > 175 ? 175 : finalY + 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 30, signY);
  doc.text('Kepala Instalasi Laboratorium Patologi Klinik', 30, signY + 5);
  doc.text('dr. Penanggung Jawab Lab, Sp.PK', 30, signY + 22);
  doc.text('NIP. 19820412 201001 1 008', 30, signY + 26);

  doc.text('Kayong Utara, ' + new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }), 200, signY);
  doc.text('Koordinator Shift Jaga ATLM', 200, signY + 5);
  doc.text('Supriatna, A.Md.AK', 200, signY + 22);
  doc.text('NIP. 19890520 201502 1 003', 200, signY + 26);

  doc.save(`Jadwal_Lab_RSUD_SMJ_I_${filter.startDate}_sd_${filter.endDate}.pdf`);
}

export function exportHandoverPdf(handover: HandoverRecord) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Kop Surat Resmi
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PEMERINTAH KABUPATEN KAYONG UTARA', 105, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('RUMAH SAKIT UMUM DAERAH SULTAN MUHAMMAD JAMALUDIN I', 105, 19, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(23, 107, 98);
  doc.text('INSTALASI LABORATORIUM PATOLOGI KLINIK', 105, 24, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Jl. Provinsi No. 1, Sukadana, Kab. Kayong Utara, Kalimantan Barat (Zona WIB)', 105, 28, { align: 'center' });

  doc.setLineWidth(0.8);
  doc.line(14, 31, 196, 31);
  doc.setLineWidth(0.2);
  doc.line(14, 32, 196, 32);

  // Document Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BERITA ACARA SERAH TERIMA JAGA ATLM', 105, 38, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor / ID Dokumen: ${handover.handoverId} | Tanggal: ${handover.handoverDate}`, 105, 43, { align: 'center' });

  // Petugas Shift Info Box
  doc.setFillColor(248, 249, 247);
  doc.roundedRect(14, 47, 182, 18, 2, 2, 'F');
  doc.setDrawColor(231, 234, 228);
  doc.roundedRect(14, 47, 182, 18, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Petugas Shift (Pagi):', 18, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(handover.outgoingStaffName || 'Petugas Shift Pagi', 58, 53);

  doc.setFont('helvetica', 'bold');
  doc.text('Petugas Shift (Siang):', 18, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(handover.incomingStaffName || 'Petugas Shift Siang', 58, 60);

  // A. Kategori Pemeriksaan Pasien (Table)
  const cats = handover.patientCategories || {
    rawatInap: 0,
    verloskamer: 0,
    nifas: 0,
    ponek: 0,
    poliUmum: 0,
    icu: 0,
    igd: 0,
    rajal: 0,
    perinatologi: 0,
    tranfusi: 0,
    pendonorLolos: 0,
    pendonorLanjutBesok: 0,
    pendonorTidakLolos: 0,
    crossmatch: 0,
    nilaiKritis: 0,
    tcmTb: 0,
    mcu: 0,
  };

  const patientRows = [
    ['1. Rawat Inap', cats.rawatInap.toString(), '10. Tranfusi', cats.tranfusi.toString()],
    ['2. Verloskamer', cats.verloskamer.toString(), '11. Pendonor Lolos', cats.pendonorLolos.toString()],
    ['3. Nifas', cats.nifas.toString(), '12. Pendonor Lanjut besok', cats.pendonorLanjutBesok.toString()],
    ['4. Ponek', cats.ponek.toString(), '13. Pendonor tidak lolos', cats.pendonorTidakLolos.toString()],
    ['5. Poli Umum', cats.poliUmum.toString(), '14. Crossmatch', cats.crossmatch.toString()],
    ['6. ICU', cats.icu.toString(), '15. Nilai Kritis', cats.nilaiKritis.toString()],
    ['7. IGD', cats.igd.toString(), '16. TCM TB', cats.tcmTb.toString()],
    ['8. Rajal', cats.rajal.toString(), '17. MCU', cats.mcu.toString()],
    ['9. Perinatologi', cats.perinatologi.toString(), '', ''],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('A. Kategori Pemeriksaan Pasien :', 14, 71);

  autoTable(doc, {
    startY: 74,
    head: [['No & Kategori Pasien', 'Jumlah', 'No & Kategori Pasien', 'Jumlah']],
    body: patientRows,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [23, 107, 98], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const patientTableY = (doc as any).lastAutoTable?.finalY || 135;

  // Total Pasien
  doc.setFillColor(255, 250, 211); // #FFFAD3
  doc.rect(14, patientTableY + 2, 182, 7, 'F');
  doc.setDrawColor(245, 238, 176);
  doc.rect(14, patientTableY + 2, 182, 7, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(32, 43, 42);
  doc.text(`Total Pasien (otomatis dari perhitungan diatas) :  ${handover.totalPatients || 0} Pasien / Spesimen`, 18, patientTableY + 6.8);
  doc.setTextColor(0, 0, 0);

  // B, C, D, E Sections
  let curY = patientTableY + 14;

  const sections = [
    {
      title: 'B. Kategori Instrumen dan alat (1. Laporan QC Alat dan reagen):',
      content:
        handover.qcItems && handover.qcItems.length > 0
          ? handover.qcItems
              .map(
                (q, idx) =>
                  `${idx + 1}. [${q.status}] ${q.instrumentName}${q.reagentName ? ` (Reagen: ${q.reagentName})` : ''} — ${q.notes}`
              )
              .join('\n')
          : handover.qcInstrumentsReport ||
            handover.equipmentStatus ||
            'Tidak ada kendala, QC instrumen normal dan reagen mencukupi.',
    },
    {
      title: 'C. Titipan:',
      content: handover.depositNotes || handover.pendingSamples || 'Tidak ada sampel / berkas titipan.',
    },
    {
      title: 'D. Stok darah:',
      content: handover.bloodStockNotes || 'Stok darah Bank Darah dalam batas aman operasional.',
    },
    {
      title: 'E. Info / Keterangan:',
      content: handover.infoNotes || handover.followUpNotes || 'Operasional pelayanan berjalan lancar.',
    },
  ];

  sections.forEach(sec => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(sec.title, 14, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const splitLines = doc.splitTextToSize(sec.content, 180);
    doc.text(splitLines, 16, curY);
    curY += splitLines.length * 4.2 + 3;
  });

  // Signatures at bottom
  const signY = Math.max(curY + 6, 245);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Yang Menyerahkan,', 30, signY);
  doc.text('Petugas Shift (Pagi)', 30, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(handover.outgoingStaffName || 'Petugas Pagi', 30, signY + 20);
  doc.setFontSize(7.5);
  doc.text(`Status: Terverifikasi (${handover.createdAt.slice(0, 10)})`, 30, signY + 24);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Yang Menerima,', 140, signY);
  doc.text('Petugas Shift (Siang)', 140, signY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(handover.incomingStaffName || 'Petugas Siang', 140, signY + 20);
  doc.setFontSize(7.5);
  doc.text(handover.status === 'confirmed' ? `Status: Telah Dikonfirmasi (${handover.confirmedAt?.slice(0, 10) || '-'})` : 'Status: Menunggu Konfirmasi', 140, signY + 24);

  doc.save(`Serah_Terima_Jaga_ATLM_${handover.handoverDate}_${handover.handoverId}.pdf`);
}

export function exportHandoverRecapToExcel(
  handovers: HandoverRecord[],
  titleSuffix: string = 'Semua'
) {
  const rows = handovers.map((h, idx) => {
    const cats = h.patientCategories || ({} as any);
    const qcCount = h.qcItems?.length || 0;
    const shiftLabel = `${(h.shiftId || 'Pagi').toUpperCase()} ➔ ${(h.targetShiftId || 'Siang').toUpperCase()}`;

    return {
      'No': idx + 1,
      'ID Berita Acara': h.handoverId,
      'Tanggal': h.handoverDate,
      'Shift': shiftLabel,
      'Petugas Shift Menyerahkan': h.outgoingStaffName || '-',
      'Petugas Shift Menerima': h.incomingStaffName || '-',
      'Status Verifikasi': h.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu',
      'Total Pasien': h.totalPatients || 0,
      '1. Rawat Inap': cats.rawatInap || 0,
      '2. Verloskamer': cats.verloskamer || 0,
      '3. Nifas': cats.nifas || 0,
      '4. Ponek': cats.ponek || 0,
      '5. Poli Umum': cats.poliUmum || 0,
      '6. ICU': cats.icu || 0,
      '7. IGD': cats.igd || 0,
      '8. Rajal': cats.rajal || 0,
      '9. Perinatologi': cats.perinatologi || 0,
      '10. Tranfusi': cats.tranfusi || 0,
      '11. Donor Lolos': cats.pendonorLolos || 0,
      '12. Donor Lanjut': cats.pendonorLanjutBesok || 0,
      '13. Donor Gagal': cats.pendonorTidakLolos || 0,
      '14. Crossmatch': cats.crossmatch || 0,
      '15. Nilai Kritis': cats.nilaiKritis || 0,
      '16. TCM TB': cats.tcmTb || 0,
      '17. MCU': cats.mcu || 0,
      'Instrumen QC Terdata': qcCount,
      'Laporan QC Alat & Reagen': h.qcInstrumentsReport || '-',
      'Titipan': h.depositNotes || '-',
      'Stok Darah BDRS': h.bloodStockNotes || '-',
      'Info / Keterangan': h.infoNotes || '-',
      'Waktu Dibuat': h.createdAt ? new Date(h.createdAt).toLocaleString('id-ID') : '-',
      'Waktu Konfirmasi': h.confirmedAt ? new Date(h.confirmedAt).toLocaleString('id-ID') : '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Serah Terima');

  const filename = `Rekap_Serah_Terima_Jaga_Lab_${titleSuffix.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
