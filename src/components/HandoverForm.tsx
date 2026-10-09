import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  FileCheck2,
  X,
  Droplet,
  Package,
  Wrench,
  Info,
  Clock,
  UserCheck,
  Building,
  Radio,
  Flame,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { UserAccount, HandoverPatientCategories, HandoverRecord, HandoverQCItem, QCStatus } from '../types';
import { labStore } from '../services/store';

export interface HandoverFormProps {
  currentUser: UserAccount;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<HandoverRecord>;
}

// Konfigurasi 17 Kategori Pasien
export interface CategoryConfig {
  key: keyof HandoverPatientCategories;
  number: number;
  label: string;
  badge?: string;
  description?: string;
}

export const PATIENT_CATEGORIES_CONFIG: CategoryConfig[] = [
  { key: 'rawatInap', number: 1, label: 'Rawat Inap', badge: 'Ranap', description: 'Pasien bangsal rawat inap' },
  { key: 'verloskamer', number: 2, label: 'Verloskamer', badge: 'VK / Bersalin', description: 'Kamar bersalin / persalinan' },
  { key: 'nifas', number: 3, label: 'Nifas', badge: 'Kebidanan', description: 'Ruang perawatan pasca persalinan' },
  { key: 'ponek', number: 4, label: 'Ponek', badge: 'Maternal CITO', description: 'Pelayanan obstetri neonatal emergensi' },
  { key: 'poliUmum', number: 5, label: 'Poli Umum', badge: 'Rawat Jalan', description: 'Poliklinik umum rawat jalan' },
  { key: 'icu', number: 6, label: 'ICU', badge: 'Intensive Care', description: 'Pasien rawat intensif' },
  { key: 'igd', number: 7, label: 'IGD', badge: 'Gawat Darurat', description: 'Pelayanan CITO gawat darurat' },
  { key: 'rajal', number: 8, label: 'Rajal', badge: 'Spesialis', description: 'Poli spesialis rawat jalan' },
  { key: 'perinatologi', number: 9, label: 'Perinatologi', badge: 'Neonatus', description: 'Ruang perawatan bayi & inkubator' },
  { key: 'tranfusi', number: 10, label: 'Tranfusi', badge: 'BDRS', description: 'Pelayanan transfusi darah pasien' },
  { key: 'pendonorLolos', number: 11, label: 'Pendonor Lolos', badge: 'Donor Darah', description: 'Pendonor memenuhi syarat aftap' },
  { key: 'pendonorLanjutBesok', number: 12, label: 'Pendonor Lanjut besok', badge: 'Tunda', description: 'Jadwal aftap dialihkan besok' },
  { key: 'pendonorTidakLolos', number: 13, label: 'Pendonor tidak lolos', badge: 'Skrining Gagal', description: 'Hb rendah/tensi/riwayat' },
  { key: 'crossmatch', number: 14, label: 'Crossmatch', badge: 'Uji Serasi', description: 'Pemeriksaan kecocokan darah' },
  { key: 'nilaiKritis', number: 15, label: 'Nilai Kritis', badge: 'Critical Value', description: 'Hasil panik wajib readback' },
  { key: 'tcmTb', number: 16, label: 'TCM TB', badge: 'GeneXpert', description: 'Tes cepat molekuler tuberkulosis' },
  { key: 'mcu', number: 17, label: 'MCU', badge: 'Check Up', description: 'Pemeriksaan kesehatan berkala' },
];

export const INITIAL_CATEGORIES: HandoverPatientCategories = {
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

// Preset instrumen & reagen lab patologi klinik RSUD SMJ I
export const INSTRUMENT_PRESETS = [
  {
    instrument: 'Sysmex XN-350 (Hematologi)',
    reagent: 'Cellpack DCL, Fluorocell WDF, Lysercell WNR',
    defaultNotes: 'Level 1, 2, 3 Normal (CV < 2.5%), masuk rentang 2SD.',
  },
  {
    instrument: 'Cobas C111 (Kimia Klinik)',
    reagent: 'Glukosa, Kolesterol, Ureum, Kreatinin, SGOT, SGPT',
    defaultNotes: 'Kontrol Precinorm & Precipath in-control. Reagen rutin cukup.',
  },
  {
    instrument: 'Dirui H-500 (Urinalisis)',
    reagent: 'Strip Urine Urinalysis 10 Parameter',
    defaultNotes: 'Strip test normal. Optik reader bersih dan terkalibrasi.',
  },
  {
    instrument: 'GeneXpert XVI (TCM TB)',
    reagent: 'Cartridge MTB/RIF Ultra (Lot: 48201)',
    defaultNotes: 'Modul A & B self-test pass. Suhu modul 37.0°C stabil.',
  },
  {
    instrument: 'Biomerieux VIDAS (Imunologi)',
    reagent: 'Reagen HBsAg & HIV Ultra Duo',
    defaultNotes: 'Standar & kontrol in-control. Pipetting valid.',
  },
  {
    instrument: 'Electrolyte Analyzer (ISE)',
    reagent: 'Reagent Pack Na/K/Cl',
    defaultNotes: 'Slope elektroda normal, kalibrasi 2-point valid.',
  },
  {
    instrument: 'Centrifuge & Pemusing Tabung',
    reagent: 'Kecepatan 3000 - 4000 RPM',
    defaultNotes: 'Rotor stabil tanpa vibrasi berlebih, timer berfungsi akurat.',
  },
  {
    instrument: 'Kulkas Darah BDRS (Blood Bank)',
    reagent: 'Pemantauan Suhu 2°C - 6°C',
    defaultNotes: 'Suhu 3.8°C aman stabil. Alarm temperatur berfungsi baik.',
  },
];

export const DEFAULT_QC_ITEMS: HandoverQCItem[] = [
  {
    id: 'QC-001',
    instrumentName: 'Sysmex XN-350 (Hematologi)',
    reagentName: 'Cellpack DCL, Fluorocell WDF, Lysercell WNR',
    status: 'OK',
    notes: 'Level 1, 2, 3 Normal (CV < 2.5%), masuk rentang 2SD. Reagen Lyse sisa 2 boks, Diluent aman.',
    updatedAt: '07:30',
  },
  {
    id: 'QC-002',
    instrumentName: 'Cobas C111 (Kimia Klinik)',
    reagentName: 'Glukosa, Kolesterol, Ureum, Kreatinin, SGOT, SGPT',
    status: 'OK',
    notes: 'Kalibrasi Albumin & Glukosa OK. Control Precinorm & Precipath in-control. Reagen rutin cukup.',
    updatedAt: '08:00',
  },
  {
    id: 'QC-003',
    instrumentName: 'Dirui H-500 (Urinalisis)',
    reagentName: 'Strip Urine Urinalysis 10 Parameter',
    status: 'OK',
    notes: 'Kontrol strip urine normal. Reader optik bersih terkalibrasi.',
    updatedAt: '08:15',
  },
  {
    id: 'QC-004',
    instrumentName: 'GeneXpert XVI (TCM TB)',
    reagentName: 'Cartridge MTB/RIF Ultra (Lot: 48201)',
    status: 'OK',
    notes: 'Modul A & B self-test pass. Suhu modul 37.0°C stabil, 10 cartridge tersedia.',
    updatedAt: '08:30',
  },
];

export interface ActiveShiftInfo {
  currentShiftId: 'pagi' | 'siang' | 'malam';
  currentShiftName: string;
  currentHours: string;
  nextShiftId: 'siang' | 'malam' | 'pagi';
  nextShiftName: string;
  nextHours: string;
}

export function getOngoingShiftInfo(): ActiveShiftInfo {
  const now = new Date();
  const utcHours = now.getUTCHours();
  // Zona Waktu RSUD SMJ I Kayong Utara: WIB (UTC+7)
  const wibHours = (utcHours + 7) % 24;
  const wibMinutes = now.getUTCMinutes();
  const totalMinutes = wibHours * 60 + wibMinutes;

  if (totalMinutes >= 420 && totalMinutes < 840) {
    // 07:00 - 14:00 WIB
    return {
      currentShiftId: 'pagi',
      currentShiftName: 'Shift Pagi',
      currentHours: '07.00 - 14.00 WIB',
      nextShiftId: 'siang',
      nextShiftName: 'Shift Siang',
      nextHours: '14.00 - 21.00 WIB',
    };
  } else if (totalMinutes >= 840 && totalMinutes < 1260) {
    // 14:00 - 21:00 WIB
    return {
      currentShiftId: 'siang',
      currentShiftName: 'Shift Siang',
      currentHours: '14.00 - 21.00 WIB',
      nextShiftId: 'malam',
      nextShiftName: 'Shift Malam',
      nextHours: '21.00 - 07.00 WIB',
    };
  } else {
    // 21:00 - 07:00 WIB
    return {
      currentShiftId: 'malam',
      currentShiftName: 'Shift Malam',
      currentHours: '21.00 - 07.00 WIB',
      nextShiftId: 'pagi',
      nextShiftName: 'Shift Pagi',
      nextHours: '07.00 - 14.00 WIB',
    };
  }
}

export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const HandoverForm: React.FC<HandoverFormProps> = ({
  currentUser,
  onSuccess,
  onCancel,
  initialData,
}) => {
  const ongoingShift = useMemo(() => getOngoingShiftInfo(), []);

  const [selectedDate, setSelectedDate] = useState(
    () => initialData?.handoverDate || getLocalDateStr()
  );

  // Petugas Shift Pagi & Siang
  const [outgoingStaffName, setOutgoingStaffName] = useState(initialData?.outgoingStaffName || '');
  const [outgoingStaffId, setOutgoingStaffId] = useState(initialData?.outgoingStaffId || '');
  const [incomingStaffName, setIncomingStaffName] = useState(initialData?.incomingStaffName || '');
  const [incomingStaffId, setIncomingStaffId] = useState(initialData?.incomingStaffId || '');

  // A. Kategori Pemeriksaan Pasien
  const [categories, setCategories] = useState<HandoverPatientCategories>(
    initialData?.patientCategories || INITIAL_CATEGORIES
  );

  // B. Instrumen & Alat (1. Laporan QC Alat dan reagen) - Dynamic List
  const [qcItems, setQcItems] = useState<HandoverQCItem[]>(() => {
    if (initialData?.qcItems && initialData.qcItems.length > 0) {
      return initialData.qcItems;
    }
    return DEFAULT_QC_ITEMS;
  });

  // State untuk form Tambah / Ubah QC Instrumen
  const [isQCFormOpen, setIsQCFormOpen] = useState(false);
  const [editingQCId, setEditingQCId] = useState<string | null>(null);
  const [qcInputInstrument, setQcInputInstrument] = useState('');
  const [qcInputReagent, setQcInputReagent] = useState('');
  const [qcInputStatus, setQcInputStatus] = useState<QCStatus>('OK');
  const [qcInputNotes, setQcInputNotes] = useState('');

  // Teks ringkasan Laporan QC
  const [qcInstrumentsReport, setQcInstrumentsReport] = useState(() => {
    if (initialData?.qcInstrumentsReport) return initialData.qcInstrumentsReport;
    return 'Laporan QC Hematology Sysmex XN-350 Level 1, 2, 3 Normal (CV < 2.5%). QC Kimia Klinik Cobas C111 lolos validasi. Reagen Lyse, Diluent, & Reagen Kimia mencukupi untuk shift lanjutan.';
  });

  // C. Titipan
  const [depositNotes, setDepositNotes] = useState(
    initialData?.depositNotes || 'Tidak ada sampel / berkas titipan tertunda.'
  );

  // D. Stok Darah
  const [bloodStockNotes, setBloodStockNotes] = useState(
    initialData?.bloodStockNotes ||
      'Gol A: 4 kolf (PRC) | Gol B: 6 kolf (PRC) | Gol O: 5 kolf (PRC) | Gol AB: 2 kolf (PRC). Suhu kulkas penyimpanan BDRS 3.8°C aman stabil.'
  );

  // E. Info / Keterangan
  const [infoNotes, setInfoNotes] = useState(
    initialData?.infoNotes ||
      'Pelayanan shift pagi berjalan aman, tertib, dan lancar. Dokter Sp.PK supervisi visite terkonfirmasi.'
  );

  const staffList = labStore.getStaff();
  const schedules = labStore.getSchedules();

  const staffMap = useMemo(() => new Map(staffList.map(s => [s.staffId, s])), [staffList]);

  // Otomatis deteksi Petugas Shift Pagi & Petugas Shift Siang sesuai jadwal terdata pada tanggal yang dipilih
  const autoSchedule = useMemo(() => {
    const morningSchedules = schedules.filter(
      s => s.date === selectedDate && (s.shiftId === 'pagi' || s.shiftId === 'morning')
    );
    const afternoonSchedules = schedules.filter(
      s => s.date === selectedDate && (s.shiftId === 'sore' || s.shiftId === 'siang' || s.shiftId === 'afternoon')
    );

    const morningStaffList = morningSchedules
      .map(s => staffMap.get(s.staffId))
      .filter(Boolean);

    const afternoonStaffList = afternoonSchedules
      .map(s => staffMap.get(s.staffId))
      .filter(Boolean);

    const morningNames = morningStaffList.map(s => s?.fullName).filter(Boolean) as string[];
    const afternoonNames = afternoonStaffList.map(s => s?.fullName).filter(Boolean) as string[];

    const primaryMorningStaff = morningSchedules[0]?.staffId || currentUser.staffId;
    const primaryAfternoonStaff = afternoonSchedules[0]?.staffId || '';

    return {
      morningNamesString: morningNames.length > 0 ? morningNames.join(' & ') : 'Belum ada jadwal terdata',
      afternoonNamesString: afternoonNames.length > 0 ? afternoonNames.join(' & ') : 'Belum ada jadwal terdata',
      primaryMorningStaff,
      primaryAfternoonStaff,
      hasMorning: morningNames.length > 0,
      hasAfternoon: afternoonNames.length > 0,
      morningCount: morningNames.length,
      afternoonCount: afternoonNames.length,
      morningStaffList,
      afternoonStaffList,
    };
  }, [schedules, selectedDate, staffMap, currentUser.staffId]);

  // Sinkronisasi nama otomatis bila user mengganti tanggal
  useEffect(() => {
    if (initialData?.outgoingStaffName) return;

    if (autoSchedule.hasMorning) {
      setOutgoingStaffName(autoSchedule.morningNamesString);
      setOutgoingStaffId(autoSchedule.primaryMorningStaff);
    } else {
      const cur = staffMap.get(currentUser.staffId);
      setOutgoingStaffName(cur ? cur.fullName : 'Petugas Shift Pagi');
      setOutgoingStaffId(currentUser.staffId);
    }

    if (autoSchedule.hasAfternoon) {
      setIncomingStaffName(autoSchedule.afternoonNamesString);
      setIncomingStaffId(autoSchedule.primaryAfternoonStaff);
    } else {
      const nextStaff = staffList.find(s => s.staffId !== currentUser.staffId && s.active);
      setIncomingStaffName(nextStaff ? nextStaff.fullName : 'Petugas Shift Siang');
      setIncomingStaffId(nextStaff ? nextStaff.staffId : '');
    }
  }, [selectedDate, autoSchedule, staffMap, currentUser.staffId, staffList, initialData]);

  // Perhitungan otomatis Total Pasien dari 17 kategori
  const totalPatients = useMemo(() => {
    return Object.values(categories).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [categories]);

  const handleCategoryChange = (key: keyof HandoverPatientCategories, val: string | number) => {
    const num = Math.max(0, parseInt(String(val), 10) || 0);
    setCategories(prev => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleIncrement = (key: keyof HandoverPatientCategories) => {
    setCategories(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const handleDecrement = (key: keyof HandoverPatientCategories) => {
    setCategories(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 0) - 1),
    }));
  };

  const handleFillSample = () => {
    setCategories({
      rawatInap: 28,
      verloskamer: 6,
      nifas: 8,
      ponek: 4,
      poliUmum: 22,
      icu: 5,
      igd: 14,
      rajal: 18,
      perinatologi: 3,
      tranfusi: 4,
      pendonorLolos: 6,
      pendonorLanjutBesok: 2,
      pendonorTidakLolos: 1,
      crossmatch: 4,
      nilaiKritis: 2,
      tcmTb: 3,
      mcu: 8,
    });
  };

  const handleResetCategories = () => {
    setCategories(INITIAL_CATEGORIES);
  };

  // --- Handlers untuk QC Instrumen (Tambah, Ubah, Hapus) ---
  const handleOpenAddQC = () => {
    setEditingQCId(null);
    setQcInputInstrument('');
    setQcInputReagent('');
    setQcInputStatus('OK');
    setQcInputNotes('');
    setIsQCFormOpen(true);
  };

  const handleOpenEditQC = (item: HandoverQCItem) => {
    setEditingQCId(item.id);
    setQcInputInstrument(item.instrumentName);
    setQcInputReagent(item.reagentName);
    setQcInputStatus(item.status);
    setQcInputNotes(item.notes);
    setIsQCFormOpen(true);
  };

  const handleSelectPreset = (preset: typeof INSTRUMENT_PRESETS[0]) => {
    setQcInputInstrument(preset.instrument);
    setQcInputReagent(preset.reagent);
    if (!qcInputNotes) {
      setQcInputNotes(preset.defaultNotes);
    }
  };

  const handleSaveQCItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qcInputInstrument.trim()) {
      alert('Nama alat / instrumen wajib diisi.');
      return;
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (editingQCId) {
      // UBAH (Edit)
      setQcItems(prev =>
        prev.map(item =>
          item.id === editingQCId
            ? {
                ...item,
                instrumentName: qcInputInstrument.trim(),
                reagentName: qcInputReagent.trim(),
                status: qcInputStatus,
                notes: qcInputNotes.trim(),
                updatedAt: nowTime,
              }
            : item
        )
      );
    } else {
      // TAMBAH (Add)
      const newItem: HandoverQCItem = {
        id: `QC-${Date.now().toString().slice(-5)}`,
        instrumentName: qcInputInstrument.trim(),
        reagentName: qcInputReagent.trim(),
        status: qcInputStatus,
        notes: qcInputNotes.trim(),
        updatedAt: nowTime,
      };
      setQcItems(prev => [...prev, newItem]);
    }

    setIsQCFormOpen(false);
    setEditingQCId(null);
  };

  const handleDeleteQCItem = (id: string) => {
    const target = qcItems.find(q => q.id === id);
    const confirmName = target ? target.instrumentName : 'alat ini';
    if (window.confirm(`Hapus data QC instrumen "${confirmName}" dari laporan?`)) {
      setQcItems(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleResetStandardQC = () => {
    if (window.confirm('Muat ulang 4 instrumen standar laboratorium?')) {
      setQcItems(DEFAULT_QC_ITEMS);
    }
  };

  // Generate ringkasan teks otomatis dari QC items
  const handleGenerateQCSummary = () => {
    if (qcItems.length === 0) {
      setQcInstrumentsReport('Belum ada data instrumen QC yang dicatat.');
      return;
    }
    const summary = qcItems
      .map((q, idx) => `${idx + 1}. ${q.instrumentName} [${q.status}]: ${q.reagentName ? `Reagen (${q.reagentName}) - ` : ''}${q.notes}`)
      .join(' | ');
    setQcInstrumentsReport(summary);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!outgoingStaffName.trim()) {
      alert('Nama Petugas Shift (Pagi) wajib diisi.');
      return;
    }
    if (!incomingStaffName.trim()) {
      alert('Nama Petugas Shift (Siang) wajib diisi.');
      return;
    }

    const payload = {
      shiftId: 'pagi',
      targetShiftId: 'siang',
      handoverDate: selectedDate,
      outgoingStaffId: outgoingStaffId || currentUser.staffId,
      outgoingStaffName: outgoingStaffName.trim(),
      incomingStaffId: incomingStaffId || 'STF-NEXT',
      incomingStaffName: incomingStaffName.trim(),
      patientCategories: categories,
      totalPatients,
      qcInstrumentsReport: qcInstrumentsReport.trim(),
      qcItems,
      depositNotes: depositNotes.trim(),
      bloodStockNotes: bloodStockNotes.trim(),
      infoNotes: infoNotes.trim(),
      equipmentStatus: qcInstrumentsReport.trim(),
      pendingSamples: depositNotes.trim(),
      reagentNotes: 'Reagen dan kontrol mutu harian aman tervalidasi.',
      followUpNotes: infoNotes.trim(),
    };

    if (initialData?.handoverId) {
      labStore.updateHandover(initialData.handoverId, payload);
      alert('Perubahan Berita Acara & QC Alat berhasil diperbarui.');
    } else {
      labStore.createHandover(payload);
      alert('Formulir Berita Acara Serah Terima Jaga ATLM berhasil disimpan.');
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="clinical-card p-6 sm:p-8 border-t-4 border-t-[#176B62] shadow-sm bg-white">
      {/* Header Formulir & Status Jadwal Berlangsung */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E7EAE4]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-[#176B62] uppercase tracking-wider bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              {initialData?.handoverId ? 'Edit / Ubah Berita Acara' : 'Format Baku Berita Acara'}
            </span>
            <span className="text-[10px] bg-[#FFFAD3] text-[#202B2A] px-2.5 py-0.5 rounded-md font-bold border border-[#F5EEB0] flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#176B62] animate-pulse"></span>
              <span>Data Otomatis Terhubung Jadwal</span>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#202B2A] mt-1.5 flex items-center space-x-2">
            <span>Formulir Serah Terima Jaga (Handover Shift ATLM)</span>
          </h3>
          <p className="text-xs text-[#687572] mt-0.5">
            Instalasi Laboratorium Patologi Klinik — RSUD Sultan Muhammad Jamaludin I Kayong Utara
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <label className="text-xs font-bold text-[#687572] flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#176B62]" />
            <span>Tanggal Dinas:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F9F7] border border-[#E7EAE4] rounded-lg text-xs font-semibold text-[#202B2A] focus:bg-white focus:outline-[#176B62]"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PETUGAS SHIFT (PAGI) & (SIANG) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Petugas Shift (Pagi) */}
          <div className="p-4 rounded-xl border-l-4 border-l-[#176B62] border border-[#E7EAE4] bg-[#E8F4F2]/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0E5149] uppercase tracking-wide flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#176B62]" />
                <span>Petugas Shift (Pagi) — Menyerahkan :</span>
              </label>
              <span className="text-[10px] text-[#176B62] font-extrabold bg-[#E8F4F2] px-2 py-0.5 rounded border border-[#176B62]/20">
                Dinas 07.00 - 14.00 WIB
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={outgoingStaffName}
                onChange={e => setOutgoingStaffName(e.target.value)}
                placeholder="Nama petugas shift pagi otomatis sesuai jadwal..."
                className="w-full px-3 py-2 bg-white border border-[#E7EAE4] rounded-lg text-xs font-bold text-[#202B2A] focus:outline-[#176B62] focus:ring-1 focus:ring-[#176B62]"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#4D6360] pt-1 font-medium">
              <span>(Terisi otomatis dari jadwal aktif yang sedang berjalan)</span>
              {autoSchedule.hasMorning && (
                <span className="text-[#21865B] font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-[#21865B]" />
                  <span>Sesuai jadwal terdata</span>
                </span>
              )}
            </div>
          </div>

          {/* Petugas Shift (Siang) */}
          <div className="p-4 rounded-xl border-l-4 border-l-[#0284C7] border border-[#E7EAE4] bg-sky-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#0369A1] uppercase tracking-wide flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Petugas Shift (Siang) — Menerima :</span>
              </label>
              <span className="text-[10px] text-[#0369A1] font-extrabold bg-sky-100/80 px-2 py-0.5 rounded border border-sky-300/40">
                Dinas 14.00 - 21.00 WIB
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={incomingStaffName}
                onChange={e => setIncomingStaffName(e.target.value)}
                placeholder="Nama petugas shift siang otomatis sesuai jadwal..."
                className="w-full px-3 py-2 bg-white border border-[#E7EAE4] rounded-lg text-xs font-bold text-[#202B2A] focus:outline-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#0369A1]/70 pt-1 font-medium">
              <span>(Terisi otomatis dari jadwal dinas penerima berikutnya)</span>
              {autoSchedule.hasAfternoon && (
                <span className="text-[#21865B] font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-[#21865B]" />
                  <span>Sesuai jadwal terdata</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* A. KATEGORI PEMERIKSAAN PASIEN (17 Poin) */}
        <div className="p-5 sm:p-6 bg-white rounded-2xl border-2 border-[#176B62]/30 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-[#E8F4F2] via-[#E8F4F2]/50 to-white border border-[#176B62]/30">
            <div>
              <h4 className="text-sm sm:text-base font-black text-[#0E5149] flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-[#176B62] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  A
                </span>
                <span>Kategori Pemeriksaan Pasien (17 Kategori Baku) :</span>
              </h4>
              <p className="text-[11px] text-[#176B62]/80 font-medium mt-0.5 pl-8">
                Rincian 17 poin unit pemeriksaan laboratorium patologi klinik selama shift berlangsung
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleFillSample}
                className="px-2.5 py-1 bg-white hover:bg-[#d6ece8] text-[#176B62] rounded-lg text-[11px] font-extrabold border border-[#176B62]/30 cursor-pointer transition-colors shadow-2xs"
              >
                Contoh Data
              </button>
              <button
                type="button"
                onClick={handleResetCategories}
                className="px-2.5 py-1 bg-white hover:bg-[#E7EAE4] text-[#687572] rounded-lg text-[11px] font-bold border border-[#E7EAE4] cursor-pointer transition-colors"
              >
                Reset (0)
              </button>
            </div>
          </div>

          {/* Grid 17 Poin Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PATIENT_CATEGORIES_CONFIG.map(cat => {
              const val = categories[cat.key] || 0;
              return (
                <div
                  key={cat.key}
                  className="p-3 rounded-xl border border-[#E7EAE4] bg-[#F8F9F7]/70 hover:bg-white hover:border-[#176B62]/40 transition-all flex items-center justify-between gap-2"
                >
                  <div className="overflow-hidden">
                    <div className="text-xs font-extrabold text-[#202B2A] truncate">
                      {cat.number}. {cat.label}
                    </div>
                    {cat.badge && (
                      <span className="text-[9px] text-[#687572] font-semibold bg-white px-1.5 py-0.5 rounded border border-[#E7EAE4]">
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecrement(cat.key)}
                      className="w-6 h-6 rounded-md bg-white border border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7] hover:text-[#202B2A] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={val}
                      onChange={e => handleCategoryChange(cat.key, e.target.value)}
                      className="w-14 text-center py-1 bg-white border border-[#E7EAE4] rounded-md text-xs font-extrabold text-[#202B2A] focus:outline-[#176B62]"
                    />
                    <button
                      type="button"
                      onClick={() => handleIncrement(cat.key)}
                      className="w-6 h-6 rounded-md bg-[#176B62] text-white hover:bg-[#12554E] flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Pasien (otomatis dari perhitungan diatas) */}
          <div className="mt-5 p-4 rounded-xl bg-[#FFFAD3] border-2 border-[#F5EEB0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="text-xs font-black text-[#875A00] uppercase tracking-wide flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#875A00]" />
                <span>Total Pasien (Otomatis Dari Perhitungan Di Atas):</span>
              </div>
              <div className="text-[11px] text-[#687572] mt-0.5">
                Kalkulasi otomatis akumulasi total dari 17 kategori poin di atas
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="px-4 py-2 bg-white rounded-xl border border-[#E7EAE4] shadow-xs flex items-baseline space-x-2">
                <span className="text-2xl font-black text-[#176B62] font-mono leading-none">
                  {totalPatients}
                </span>
                <span className="text-xs font-bold text-[#687572]">Pasien / Spesimen</span>
              </div>
            </div>
          </div>
        </div>

        {/* B. KATEGORI INSTRUMEN DAN ALAT (Dapat Ditambah, Diubah, Dihapus) */}
        <div className="p-5 bg-white rounded-2xl border-2 border-sky-300/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/50 to-white border border-sky-200">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shadow-xs">
                B
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#0369A1] flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-[#0284C7]" />
                  <span>Kategori Instrumen dan Alat :</span>
                </h4>
                <p className="text-[11px] text-[#0284C7]/80 font-medium mt-0.5">
                  1. Laporan QC Alat dan reagen (Dapat ditambah, diubah, dihapus)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={handleResetStandardQC}
                className="px-2.5 py-1 bg-white hover:bg-sky-100 text-[#0369A1] rounded-lg text-xs font-bold border border-sky-200 flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                title="Muat ulang 4 instrumen standar lab"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Preset Standar Lab</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddQC}
                className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah QC Alat & Reagen</span>
              </button>
            </div>
          </div>

          {/* Form Modal / Inline Editor Tambah / Ubah QC Instrumen */}
          {isQCFormOpen && (
            <div className="p-4 sm:p-5 rounded-xl border-2 border-[#176B62]/40 bg-[#E8F4F2]/40 space-y-4 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-[#176B62]/20">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-[#176B62]" />
                  <span className="text-xs font-extrabold text-[#202B2A]">
                    {editingQCId ? 'Ubah Data QC Instrumen & Reagen' : 'Tambah QC Instrumen & Reagen Baru'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQCFormOpen(false)}
                  className="p-1 rounded-md text-[#687572] hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preset Cepat Pilihan Alat */}
              <div>
                <span className="text-[10px] font-bold text-[#687572] uppercase tracking-wider block mb-1.5">
                  Pilihan Cepat Preset Instrumen Lab:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENT_PRESETS.map(preset => (
                    <button
                      key={preset.instrument}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2 py-1 bg-white hover:bg-[#FFFAD3] border border-[#E7EAE4] hover:border-[#F5EEB0] rounded-md text-[10px] font-bold text-[#202B2A] cursor-pointer transition-colors"
                    >
                      + {preset.instrument}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Input Nama Alat */}
                <div>
                  <label className="block text-[11px] font-extrabold text-[#202B2A] mb-1">
                    Nama Alat / Instrumen <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={qcInputInstrument}
                    onChange={e => setQcInputInstrument(e.target.value)}
                    placeholder="Contoh: Sysmex XN-350 (Hematologi)"
                    className="w-full px-3 py-1.5 bg-white border border-[#E7EAE4] rounded-lg text-xs font-semibold text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>

                {/* Input Reagen / Parameter */}
                <div>
                  <label className="block text-[11px] font-extrabold text-[#202B2A] mb-1">
                    Reagen / Parameter Terkait:
                  </label>
                  <input
                    type="text"
                    value={qcInputReagent}
                    onChange={e => setQcInputReagent(e.target.value)}
                    placeholder="Contoh: Cellpack DCL, Fluorocell WDF, Lysercell WNR"
                    className="w-full px-3 py-1.5 bg-white border border-[#E7EAE4] rounded-lg text-xs text-[#202B2A] focus:outline-[#176B62]"
                  />
                </div>
              </div>

              {/* Pilihan Status QC */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#202B2A] mb-1.5">
                  Status Kontrol Mutu (QC):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQcInputStatus('OK')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      qcInputStatus === 'OK'
                        ? 'bg-[#EBF7F1] border-[#21865B] text-[#21865B] ring-2 ring-[#21865B]/30'
                        : 'bg-white border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />
                    <span>OK / In-Control</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQcInputStatus('Warning')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      qcInputStatus === 'Warning'
                        ? 'bg-[#FEF8EC] border-[#D99A22] text-[#D99A22] ring-2 ring-[#D99A22]/30'
                        : 'bg-white border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D99A22]" />
                    <span>Warning (Perhatian)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQcInputStatus('Fail')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      qcInputStatus === 'Fail'
                        ? 'bg-[#FDF2F2] border-[#D9383A] text-[#D9383A] ring-2 ring-[#D9383A]/30'
                        : 'bg-white border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7]'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#D9383A]" />
                    <span>Fail / Out-Control</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQcInputStatus('Maintenance')}
                    className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                      qcInputStatus === 'Maintenance'
                        ? 'bg-[#EBF2F7] border-[#2B6CB0] text-[#2B6CB0] ring-2 ring-[#2B6CB0]/30'
                        : 'bg-white border-[#E7EAE4] text-[#687572] hover:bg-[#F8F9F7]'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-[#2B6CB0]" />
                    <span>Maintenance / Kalibrasi</span>
                  </button>
                </div>
              </div>

              {/* Catatan QC & Reagen */}
              <div>
                <label className="block text-[11px] font-extrabold text-[#202B2A] mb-1">
                  Catatan Hasil QC & Ketersediaan Reagen:
                </label>
                <textarea
                  rows={2}
                  value={qcInputNotes}
                  onChange={e => setQcInputNotes(e.target.value)}
                  placeholder="Catatan nilai kontrol, status kalibrasi, ketersediaan lot reagen..."
                  className="w-full p-2.5 bg-white border border-[#E7EAE4] rounded-lg text-xs text-[#202B2A] focus:outline-[#176B62]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#176B62]/20">
                <button
                  type="button"
                  onClick={() => setIsQCFormOpen(false)}
                  className="px-3 py-1.5 bg-white hover:bg-[#F8F9F7] text-[#687572] border border-[#E7EAE4] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQCItem}
                  className="px-4 py-1.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingQCId ? 'Simpan Perubahan' : 'Tambahkan ke Daftar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Daftar QC Alat & Reagen (Tabel / Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-[#0369A1] flex items-center space-x-1.5">
                <span>Daftar QC Instrumen Terdata:</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-[#0369A1] text-[10px] font-black border border-sky-200">
                  {qcItems.length} Alat
                </span>
              </span>
              <button
                type="button"
                onClick={handleGenerateQCSummary}
                className="text-[11px] text-[#0284C7] hover:underline font-bold cursor-pointer"
                title="Sinkronkan daftar instrumen ke teks ringkasan di bawah"
              >
                ↻ Perbarui Rangkuman Teks
              </button>
            </div>

            {qcItems.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-[#E7EAE4] bg-[#F8F9F7] text-xs text-[#8E9B98]">
                <Cpu className="w-8 h-8 mx-auto mb-2 text-[#8E9B98]/60" />
                <p className="font-bold text-[#687572]">Belum ada instrumen QC yang ditambahkan.</p>
                <p className="text-[11px] mt-1">
                  Klik tombol <strong>&quot;Tambah QC Alat & Reagen&quot;</strong> di atas atau muat preset standar lab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {qcItems.map((item, idx) => {
                  let badgeBg = 'bg-[#EBF7F1] text-[#21865B] border-[#21865B]/30';
                  let statusLabel = 'Lolos (OK)';
                  let icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#21865B]" />;

                  if (item.status === 'Warning') {
                    badgeBg = 'bg-[#FEF8EC] text-[#D99A22] border-[#F5EEB0]';
                    statusLabel = 'Peringatan (Warning)';
                    icon = <AlertTriangle className="w-3.5 h-3.5 text-[#D99A22]" />;
                  } else if (item.status === 'Fail') {
                    badgeBg = 'bg-[#FDF2F2] text-[#D9383A] border-[#D9383A]/30';
                    statusLabel = 'Gagal (Fail)';
                    icon = <ShieldAlert className="w-3.5 h-3.5 text-[#D9383A]" />;
                  } else if (item.status === 'Maintenance') {
                    badgeBg = 'bg-[#EBF2F7] text-[#2B6CB0] border-[#BEE3F8]';
                    statusLabel = 'Maintenance';
                    icon = <Wrench className="w-3.5 h-3.5 text-[#2B6CB0]" />;
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-[#E7EAE4] bg-white hover:border-[#176B62]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-black text-[#687572] font-mono">
                            #{idx + 1}
                          </span>
                          <strong className="text-xs font-black text-[#202B2A]">
                            {item.instrumentName}
                          </strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center space-x-1 ${badgeBg}`}
                          >
                            {icon}
                            <span>{statusLabel}</span>
                          </span>
                          {item.updatedAt && (
                            <span className="text-[10px] text-[#8E9B98] flex items-center space-x-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{item.updatedAt}</span>
                            </span>
                          )}
                        </div>

                        {item.reagentName && (
                          <div className="text-[11px] text-[#176B62] font-semibold flex items-center space-x-1">
                            <Droplet className="w-3 h-3 text-[#176B62] shrink-0" />
                            <span>Reagen: {item.reagentName}</span>
                          </div>
                        )}

                        <p className="text-xs text-[#687572] leading-snug">
                          {item.notes || 'Tidak ada catatan tambahan.'}
                        </p>
                      </div>

                      {/* Tombol Aksi: Ubah & Hapus */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditQC(item)}
                          className="px-2.5 py-1.5 bg-[#F8F9F7] hover:bg-[#FFFAD3] text-[#202B2A] rounded-lg text-xs font-bold border border-[#E7EAE4] flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Ubah data QC alat ini"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#176B62]" />
                          <span>Ubah</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQCItem(item.id)}
                          className="px-2.5 py-1.5 bg-[#F8F9F7] hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-[#E7EAE4] hover:border-red-200 flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Hapus data QC alat ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rangkuman Teks Bebas / Catatan Tambahan QC */}
          <div className="pt-2 border-t border-sky-100 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-black text-[#0369A1]">
                Catatan Rangkuman Laporan QC Alat dan Reagen :
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  'QC Sysmex OK',
                  'QC Cobas OK',
                  'Reagen Cukup',
                  'Urin Analyzer Siap',
                  'Perlu Kalibrasi Elektrolit',
                ].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() =>
                      setQcInstrumentsReport(prev => (prev ? `${prev} • ${chip}` : chip))
                    }
                    className="text-[10px] bg-white hover:bg-sky-50 text-[#0369A1] font-semibold px-2 py-0.5 rounded border border-sky-200 cursor-pointer transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={2}
              value={qcInstrumentsReport}
              onChange={e => setQcInstrumentsReport(e.target.value)}
              placeholder="Catatan hasil quality control (QC) harian alat analisa, status reagen, kalibrator..."
              className="w-full p-3 bg-white border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:outline-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
            />
          </div>
        </div>

        {/* C. TITIPAN */}
        <div className="p-5 bg-white rounded-2xl border-2 border-amber-300/60 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border border-amber-200">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#D97706] text-white flex items-center justify-center text-xs font-black shadow-xs">
                C
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#B45309] flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-[#D97706]" />
                  <span>Kategori Titipan :</span>
                </h4>
                <p className="text-[11px] text-[#B45309]/80 font-medium">
                  Sampel CITO tertunda, sampel rujukan luar, berkas/hasil pemeriksaan yang perlu ditindaklanjuti
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {[
                'Tidak ada titipan',
                'Sampel CITO running',
                'Sampel rujukan luar',
                'Hasil belum diambil perawat',
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDepositNotes(chip)}
                  className="text-[10px] bg-white hover:bg-amber-100 text-[#B45309] font-bold px-2 py-0.5 rounded border border-amber-300/60 cursor-pointer transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              value={depositNotes}
              onChange={e => setDepositNotes(e.target.value)}
              placeholder="Sampel CITO tertunda, sampel rujukan luar, berkas/hasil pemeriksaan yang perlu ditindaklanjuti..."
              className="w-full p-3 bg-white border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:outline-[#D97706] focus:ring-1 focus:ring-[#D97706]"
            />
          </div>
        </div>

        {/* D. STOK DARAH */}
        <div className="p-5 bg-white rounded-2xl border-2 border-rose-300/60 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-rose-50/50 to-white border border-rose-200">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#E11D48] text-white flex items-center justify-center text-xs font-black shadow-xs">
                D
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#BE123C] flex items-center space-x-1.5">
                  <Droplet className="w-4 h-4 text-[#E11D48]" />
                  <span>Kategori Stok Darah (BDRS) :</span>
                </h4>
                <p className="text-[11px] text-[#BE123C]/80 font-medium">
                  Ketersediaan kantong darah (Gol A, B, O, AB, PRC, FFP, TC) & kondisi Bank Darah
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {[
                'Stok PRC Lengkap Aman',
                'Krisis Golongan O',
                'Suhu Kulkas 3.8°C Stabil',
                'Permintaan Darah VK Running',
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setBloodStockNotes(prev => (prev ? `${prev} | ${chip}` : chip))
                  }
                  className="text-[10px] bg-white hover:bg-rose-100 text-[#BE123C] font-bold px-2 py-0.5 rounded border border-rose-300/60 cursor-pointer transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              value={bloodStockNotes}
              onChange={e => setBloodStockNotes(e.target.value)}
              placeholder="Ketersediaan kantong darah (Gol A, B, O, AB, PRC, FFP, TC), suhu lemari pendingin Bank Darah..."
              className="w-full p-3 bg-white border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:outline-[#E11D48] focus:ring-1 focus:ring-[#E11D48]"
            />
          </div>
        </div>

        {/* E. INFO/ KETERANGAN */}
        <div className="p-5 bg-white rounded-2xl border-2 border-indigo-300/60 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-white border border-indigo-200">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center text-xs font-black shadow-xs">
                E
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#4338CA] flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-[#4F46E5]" />
                  <span>Kategori Info / Keterangan Operasional :</span>
                </h4>
                <p className="text-[11px] text-[#4338CA]/80 font-medium">
                  Catatan khusus dinas jaga, supervisi Sp.PK, laporan nilai kritis, atau situasi khusus lainnya
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 shrink-0">
              {[
                'Visite Dokter Sp.PK Jam 15.00',
                'Nilai Kritis Sudah Dilaporkan',
                'Operasional Shift Berjalan Lancar',
                'Kunjungan Ranap Terlayani Cepat',
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setInfoNotes(prev => (prev ? `${prev} • ${chip}` : chip))
                  }
                  className="text-[10px] bg-white hover:bg-indigo-100 text-[#4338CA] font-bold px-2 py-0.5 rounded border border-indigo-300/60 cursor-pointer transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea
              rows={2}
              value={infoNotes}
              onChange={e => setInfoNotes(e.target.value)}
              placeholder="Instruksi dokter Sp.PK, pencatatan nilai kritis, koordinasi unit lain, situasi khusus..."
              className="w-full p-3 bg-white border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] focus:outline-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E7EAE4]">
          <div className="text-xs text-[#687572]">
            Data akan disimpan ke arsip berita acara serah terima jaga ATLM.
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#F8F9F7] hover:bg-[#E7EAE4] text-[#202B2A] rounded-xl text-xs font-bold border border-[#E7EAE4] cursor-pointer transition-colors"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-[#FFFAD3]" />
              <span>{initialData?.handoverId ? 'Perbarui Berita Acara & QC' : 'Simpan Berita Acara & QC'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
