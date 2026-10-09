import {
  UserAccount,
  Staff,
  ShiftConfig,
  Schedule,
  ShiftSwapRequest,
  LeaveRequest,
  AttendanceRecord,
  HandoverRecord,
  AppNotification,
  AuditLog,
  Role,
} from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEY_PREFIX = 'rsud_smj_lab_';

// Safe storage wrapper (handles browser and non-browser environments)
const memoryStorage: Record<string, string> = {};

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStorage[key] || null;
  } catch {
    return memoryStorage[key] || null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStorage[key] = value;
  } catch {
    memoryStorage[key] = value;
  }
}

function safeRemoveStorage(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    delete memoryStorage[key];
  } catch {
    delete memoryStorage[key];
  }
}

// Initial Shift Master Configuration
export const DEFAULT_SHIFTS: ShiftConfig[] = [
  {
    shiftId: 'pagi',
    name: 'Shift Pagi',
    startTime: '07:00',
    endTime: '14:00',
    minimumStaff: 2,
    color: '#0d9488', // Teal
    isOvernight: false,
    active: true,
    description: 'Pelayanan poli rawat jalan, rawat inap, dan kontrol mutu harian.',
  },
  {
    shiftId: 'sore',
    name: 'Shift Sore',
    startTime: '14:00',
    endTime: '21:00',
    minimumStaff: 2,
    color: '#f59e0b', // Amber
    isOvernight: false,
    active: true,
    description: 'Pelayanan IGD cito, rawat inap, dan validasi spesimen sore.',
  },
  {
    shiftId: 'malam',
    name: 'Shift Malam',
    startTime: '21:00',
    endTime: '07:00',
    minimumStaff: 1,
    color: '#6366f1', // Indigo
    isOvernight: true,
    active: true,
    description: 'Pelayanan CITO gawat darurat, bank darah, dan observasi malam.',
  },
  {
    shiftId: 'libur',
    name: 'Lepas Piket / Libur',
    startTime: '00:00',
    endTime: '23:59',
    minimumStaff: 0,
    color: '#64748b', // Slate
    isOvernight: false,
    active: true,
    description: 'Waktu istirahat wajib pasca jaga malam atau jadwal libur rutin.',
  },
];

// Initial Staff Roster for RSUD Sultan Muhammad Jamaludin I Kayong Utara
export const DEFAULT_STAFF: Staff[] = [
  {
    staffId: 'STF-001',
    fullName: 'Supriatna, A.Md.AK',
    employeeNumber: '19890520 201502 1 003',
    position: 'Koordinator ATLM & Penanggung Jawab Shift',
    email: 'supriatna.atlm@rsud-smj.go.id',
    phone: '0812-5678-9001',
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
    role: 'coordinator',
  },
  {
    staffId: 'STF-002',
    fullName: 'Rina Indriyani, A.Md.AK',
    employeeNumber: '19920314 201801 2 007',
    position: 'ATLM Pelaksana - Hematologi & Urinalisis',
    email: 'rina.indriyani@rsud-smj.go.id',
    phone: '0813-4567-8902',
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-003',
    fullName: 'Dedi Kurniawan, S.Tr.Kes',
    employeeNumber: '19900822 201603 1 004',
    position: 'ATLM Pelaksana - Kimia Klinik & Elektrolit',
    email: 'dedi.kurniawan@rsud-smj.go.id',
    phone: '0821-3456-7893',
    active: true,
    createdAt: '2024-01-12T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-004',
    fullName: 'Nurul Fatimah, A.Md.AK',
    employeeNumber: '19941105 201902 2 006',
    position: 'ATLM Pelaksana - Imunoserologi & Bank Darah',
    email: 'nurul.fatimah@rsud-smj.go.id',
    phone: '0852-6789-0124',
    active: true,
    createdAt: '2024-01-15T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-005',
    fullName: 'Bayu Saputra, A.Md.AK',
    employeeNumber: '19950719 202001 1 002',
    position: 'ATLM Pelaksana - Mikrobiologi & Parasitologi',
    email: 'bayu.saputra@rsud-smj.go.id',
    phone: '0853-7890-1235',
    active: true,
    createdAt: '2024-02-01T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-006',
    fullName: 'Siti Wahyuni, A.Md.AK',
    employeeNumber: '19960210 202103 2 005',
    position: 'ATLM Pelaksana - CITO IGD & Rawat Inap',
    email: 'siti.wahyuni@rsud-smj.go.id',
    phone: '0812-8901-2346',
    active: true,
    createdAt: '2024-02-05T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-007',
    fullName: 'Hendra Wijaya, A.Md.AK',
    employeeNumber: '19930915 201704 1 008',
    position: 'ATLM Pelaksana - Jaga Malam & Validasi Spesimen',
    email: 'hendra.wijaya@rsud-smj.go.id',
    phone: '0813-9012-3457',
    active: true,
    createdAt: '2024-02-10T08:00:00Z',
    role: 'staff',
  },
  {
    staffId: 'STF-000',
    fullName: 'Administrator Sistem Lab',
    employeeNumber: '19850101 200801 1 001',
    position: 'Kepala Tata Usaha & IT Instalasi Lab RSUD SMJ I',
    email: 'admin.lab@rsud-smj.go.id',
    phone: '0811-5000-001',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    role: 'admin',
  },
];

export const DEFAULT_USERS: UserAccount[] = [
  {
    uid: 'USR-ADMIN',
    staffId: 'STF-000',
    email: 'admin.lab@rsud-smj.go.id',
    displayName: 'Administrator Lab',
    role: 'admin',
    active: true,
    password: 'password123',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    uid: 'USR-COORD',
    staffId: 'STF-001',
    email: 'supriatna.atlm@rsud-smj.go.id',
    displayName: 'Supriatna, A.Md.AK',
    role: 'coordinator',
    active: true,
    password: 'password123',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    uid: 'USR-RINA',
    staffId: 'STF-002',
    email: 'rina.indriyani@rsud-smj.go.id',
    displayName: 'Rina Indriyani, A.Md.AK',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    uid: 'USR-DEDI',
    staffId: 'STF-003',
    email: 'dedi.kurniawan@rsud-smj.go.id',
    displayName: 'Dedi Kurniawan, S.Tr.Kes',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-01-12T08:00:00Z',
  },
  {
    uid: 'USR-NURUL',
    staffId: 'STF-004',
    email: 'nurul.fatimah@rsud-smj.go.id',
    displayName: 'Nurul Fatimah, A.Md.AK',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    uid: 'USR-BAYU',
    staffId: 'STF-005',
    email: 'bayu.saputra@rsud-smj.go.id',
    displayName: 'Bayu Saputra, A.Md.AK',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    uid: 'USR-SITI',
    staffId: 'STF-006',
    email: 'siti.wahyuni@rsud-smj.go.id',
    displayName: 'Siti Wahyuni, A.Md.AK',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-02-05T08:00:00Z',
  },
  {
    uid: 'USR-HENDRA',
    staffId: 'STF-007',
    email: 'hendra.wijaya@rsud-smj.go.id',
    displayName: 'Hendra Wijaya, A.Md.AK',
    role: 'staff',
    active: true,
    password: 'password123',
    createdAt: '2024-02-10T08:00:00Z',
  },
];

// Helper to generate dates around today
function getDateStr(dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate Realistic Schedules
export function generateInitialSchedules(): Schedule[] {
  const schedules: Schedule[] = [];
  let idCounter = 1;

  const staffRotation = [
    { morning: ['STF-001', 'STF-002'], afternoon: ['STF-003', 'STF-004'], night: 'STF-007' },
    { morning: ['STF-005', 'STF-006'], afternoon: ['STF-001', 'STF-002'], night: 'STF-003' },
    { morning: ['STF-004', 'STF-007'], afternoon: ['STF-005', 'STF-006'], night: 'STF-002' },
    { morning: ['STF-002', 'STF-003'], afternoon: ['STF-004', 'STF-007'], night: 'STF-001' },
    { morning: ['STF-001', 'STF-005'], afternoon: ['STF-002', 'STF-006'], night: 'STF-004' },
  ];

  // Past 3 days to Next 7 days
  for (let offset = -3; offset <= 7; offset++) {
    const dateStr = getDateStr(offset);
    const rotation = staffRotation[Math.abs(offset) % staffRotation.length];

    // Morning shift (07:00 - 14:00)
    for (const staffId of rotation.morning) {
      schedules.push({
        scheduleId: `SCH-${String(idCounter++).padStart(4, '0')}`,
        staffId,
        shiftId: 'pagi',
        date: dateStr,
        startAt: `${dateStr}T07:00:00+07:00`,
        endAt: `${dateStr}T14:00:00+07:00`,
        status: offset < 0 ? 'published' : 'published',
        notes: 'Pemeriksaan rutin dan kontrol mutu spesimen pagi',
        createdBy: 'STF-001',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });
    }

    // Afternoon shift (14:00 - 21:00)
    for (const staffId of rotation.afternoon) {
      schedules.push({
        scheduleId: `SCH-${String(idCounter++).padStart(4, '0')}`,
        staffId,
        shiftId: 'sore',
        date: dateStr,
        startAt: `${dateStr}T14:00:00+07:00`,
        endAt: `${dateStr}T21:00:00+07:00`,
        status: 'published',
        notes: 'Pelayanan poli sore dan cito IGD',
        createdBy: 'STF-001',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      });
    }

    // Night shift (21:00 - 07:00 next day)
    const nextDateStr = getDateStr(offset + 1);
    schedules.push({
      scheduleId: `SCH-${String(idCounter++).padStart(4, '0')}`,
      staffId: rotation.night,
      shiftId: 'malam',
      date: dateStr,
      startAt: `${dateStr}T21:00:00+07:00`,
      endAt: `${nextDateStr}T07:00:00+07:00`,
      status: 'published',
      notes: 'Piket jaga malam & darurat bank darah',
      createdBy: 'STF-001',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
  }

  return schedules;
}

export function generateInitialLeaves(): LeaveRequest[] {
  return [
    {
      requestId: 'LEV-001',
      staffId: 'STF-005', // Bayu Saputra
      leaveType: 'cuti_tahunan',
      startDate: getDateStr(3),
      endDate: getDateStr(5),
      reason: 'Cuti tahunan keperluan keluarga di Pontianak',
      status: 'approved',
      reviewedBy: 'STF-001',
      reviewedAt: new Date().toISOString(),
      reviewNotes: 'Disetujui. Pastikan serah terima stok reagen mikrobiologi tuntas.',
      createdAt: '2025-02-01T08:00:00Z',
    },
  ];
}

export function generateInitialSwaps(): ShiftSwapRequest[] {
  return [
    {
      requestId: 'SWP-001',
      requesterStaffId: 'STF-002', // Rina Indriyani
      targetStaffId: 'STF-003',    // Dedi Kurniawan
      sourceScheduleId: 'SCH-0002',
      targetScheduleId: 'SCH-0003',
      reason: 'Ada urusan administrasi keluarga pada sesi pagi',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateInitialAttendance(): AttendanceRecord[] {
  return [
    {
      attendanceId: 'ATT-001',
      staffId: 'STF-001',
      date: getDateStr(0),
      checkIn: `${getDateStr(0)}T06:55:12+07:00`,
      status: 'present',
      notes: 'Tepat waktu, alat siap operasional.',
      createdAt: new Date().toISOString(),
    },
    {
      attendanceId: 'ATT-002',
      staffId: 'STF-002',
      date: getDateStr(0),
      checkIn: `${getDateStr(0)}T07:12:00+07:00`,
      status: 'late',
      notes: 'Keterlambatan 12 menit karena kendala cuaca hujan deras.',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateInitialHandovers(): HandoverRecord[] {
  return [
    {
      handoverId: 'HND-001',
      shiftId: 'pagi',
      targetShiftId: 'siang',
      handoverDate: getDateStr(0),
      outgoingStaffId: 'STF-001', // Supriatna
      outgoingStaffName: 'Supriatna, A.Md.AK & Rina Indriyani, A.Md.AK',
      incomingStaffId: 'STF-003', // Dedi Kurniawan
      incomingStaffName: 'Dedi Kurniawan, S.Tr.Kes & Nurul Fatimah, A.Md.AK',
      patientCategories: {
        rawatInap: 14,
        verloskamer: 3,
        nifas: 4,
        ponek: 2,
        poliUmum: 18,
        icu: 5,
        igd: 11,
        rajal: 22,
        perinatologi: 3,
        tranfusi: 4,
        pendonorLolos: 6,
        pendonorLanjutBesok: 2,
        pendonorTidakLolos: 1,
        crossmatch: 4,
        nilaiKritis: 2,
        tcmTb: 3,
        mcu: 8,
      },
      totalPatients: 102,
      qcInstrumentsReport: 'QC Hematology Sysmex XN-350 Level 1,2,3 Normal (CV < 2.5%). QC Kimia Klinik Cobas C111 Normal, kalibrasi Albumin & Glukosa OK. Reagen Lyse sisa 2 boks, Diluent aman.',
      qcItems: [
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
      ],
      depositNotes: '2 sampel darah EDTA CITO IGD sedang sentrifugasi. 1 sampel sputum TCM TB Ny. Siti (Poli Paru) belum di-running, siap proses jam 14.30.',
      bloodStockNotes: 'Golongan A: 5 kolf (PRC), Golongan B: 7 kolf (PRC), Golongan O: 6 kolf (PRC), Golongan AB: 2 kolf (PRC). FFP: Gol A 2 kantong, Gol O 3 kantong. Kulkas darah suhu 3.8°C stabil.',
      infoNotes: 'Dokter Sp.PK visite jam 15.00 WIB. Terdapat 2 pelaporan Nilai Kritis pasien ICU (K+ 6.8 mmol/L dan Trombosit 18.000/uL) sudah dilaporkan ke dr. Jaga ICU dan terdokumentasi di buku readback.',
      equipmentStatus: 'Hematology Analyzer Sysmex XN-350 normal, QC pagi lolos. Cobas C111 normal.',
      pendingSamples: '2 sampel CITO IGD running, 1 sputum TCM TB siap proses.',
      reagentNotes: 'Reagen Lyse sisa 2 boks, Diluent cukup.',
      followUpNotes: 'Dokter Sp.PK visite jam 15.00 WIB.',
      status: 'confirmed',
      confirmedAt: `${getDateStr(0)}T14:10:00+07:00`,
      createdAt: `${getDateStr(0)}T13:50:00+07:00`,
    },
    {
      handoverId: 'HND-002',
      shiftId: 'siang',
      targetShiftId: 'malam',
      handoverDate: getDateStr(-1),
      outgoingStaffId: 'STF-003', // Dedi Kurniawan
      outgoingStaffName: 'Dedi Kurniawan, S.Tr.Kes & Nurul Fatimah, A.Md.AK',
      incomingStaffId: 'STF-007', // Hendra Wijaya
      incomingStaffName: 'Hendra Wijaya, A.Md.AK',
      patientCategories: {
        rawatInap: 19,
        verloskamer: 4,
        nifas: 3,
        ponek: 3,
        poliUmum: 8,
        icu: 6,
        igd: 18,
        rajal: 5,
        perinatologi: 4,
        tranfusi: 6,
        pendonorLolos: 0,
        pendonorLanjutBesok: 0,
        pendonorTidakLolos: 0,
        crossmatch: 7,
        nilaiKritis: 3,
        tcmTb: 2,
        mcu: 0,
      },
      totalPatients: 88,
      qcInstrumentsReport: 'Sysmex XN-350 normal lancar. Cobas C111 running elektrolit & fungsi ginjal CITO. Kulkas darah suhu 3.5°C aman.',
      qcItems: [
        {
          id: 'QC-101',
          instrumentName: 'Sysmex XN-350 (Hematologi)',
          reagentName: 'Cellpack DCL',
          status: 'OK',
          notes: 'Background check normal (WBC 0.00, RBC 0.00, PLT 0). Siap pelayanan IGD sore.',
          updatedAt: '14:20',
        },
        {
          id: 'QC-102',
          instrumentName: 'Electrolyte Analyzer (ISE)',
          reagentName: 'Reagent Pack Na/K/Cl',
          status: 'OK',
          notes: 'Slope elektroda K & Na valid, slope Cl normal.',
          updatedAt: '15:10',
        },
      ],
      depositNotes: '1 spesimen urin 24 jam pasien ICU kulkas specimen. 3 tabung crossmatch cadangan operasi SC VK besok pagi.',
      bloodStockNotes: 'Golongan A: 4 kolf (PRC), Golongan B: 6 kolf (PRC), Golongan O: 5 kolf (PRC), Golongan AB: 2 kolf (PRC). Telah dikeluarkan 2 kolf Gol B untuk IGD.',
      infoNotes: 'Ada rencana operasi CITO appendectomy malam dari IGD jam 22.00, dr. Sp.B sudah konfirmasi permintaan darah 2 labu.',
      status: 'confirmed',
      confirmedAt: `${getDateStr(-1)}T21:15:00+07:00`,
      createdAt: `${getDateStr(-1)}T20:55:00+07:00`,
    },
    {
      handoverId: 'HND-003',
      shiftId: 'pagi',
      targetShiftId: 'siang',
      handoverDate: getDateStr(-1),
      outgoingStaffId: 'STF-005', // Bayu Saputra
      outgoingStaffName: 'Bayu Saputra, A.Md.AK & Siti Wahyuni, A.Md.AK',
      incomingStaffId: 'STF-003', // Dedi Kurniawan
      incomingStaffName: 'Dedi Kurniawan, S.Tr.Kes & Nurul Fatimah, A.Md.AK',
      patientCategories: {
        rawatInap: 16,
        verloskamer: 2,
        nifas: 5,
        ponek: 1,
        poliUmum: 24,
        icu: 4,
        igd: 10,
        rajal: 26,
        perinatologi: 2,
        tranfusi: 3,
        pendonorLolos: 8,
        pendonorLanjutBesok: 3,
        pendonorTidakLolos: 2,
        crossmatch: 5,
        nilaiKritis: 1,
        tcmTb: 4,
        mcu: 12,
      },
      totalPatients: 128,
      qcInstrumentsReport: 'QC pagi semua instrumen lulus. Cobas C111 reagen Glukosa baru dibuka lot baru dan terkalibrasi normal.',
      qcItems: [
        {
          id: 'QC-103',
          instrumentName: 'Sysmex XN-350 (Hematologi)',
          reagentName: 'Cellpack DCL, Fluorocell WDF',
          status: 'OK',
          notes: 'Level 1,2,3 Normal. QC harian terverifikasi.',
          updatedAt: '07:35',
        },
        {
          id: 'QC-104',
          instrumentName: 'Cobas C111 (Kimia Klinik)',
          reagentName: 'Glukosa, Kolesterol, Asam Urat',
          status: 'OK',
          notes: 'Lot baru Glukosa berhasil kalibrasi 2-titik, control Precinorm masuk batas.',
          updatedAt: '08:15',
        },
      ],
      depositNotes: 'Spesimen kultur darah poli anak disimpan di inkubator suhu 37°C.',
      bloodStockNotes: 'Golongan A: 6 kolf, Golongan B: 8 kolf, Golongan O: 7 kolf, Golongan AB: 2 kolf.',
      infoNotes: 'Kegiatan MCU CPNS selesai jam 12.00, seluruh spesimen terinput di SIMRS.',
      status: 'confirmed',
      confirmedAt: `${getDateStr(-1)}T14:05:00+07:00`,
      createdAt: `${getDateStr(-1)}T13:48:00+07:00`,
    },
    {
      handoverId: 'HND-004',
      shiftId: 'malam',
      targetShiftId: 'pagi',
      handoverDate: getDateStr(-1),
      outgoingStaffId: 'STF-007', // Hendra Wijaya
      outgoingStaffName: 'Hendra Wijaya, A.Md.AK',
      incomingStaffId: 'STF-005', // Bayu Saputra
      incomingStaffName: 'Bayu Saputra, A.Md.AK & Siti Wahyuni, A.Md.AK',
      patientCategories: {
        rawatInap: 12,
        verloskamer: 3,
        nifas: 2,
        ponek: 2,
        poliUmum: 0,
        icu: 5,
        igd: 16,
        rajal: 0,
        perinatologi: 3,
        tranfusi: 4,
        pendonorLolos: 0,
        pendonorLanjutBesok: 0,
        pendonorTidakLolos: 0,
        crossmatch: 5,
        nilaiKritis: 2,
        tcmTb: 1,
        mcu: 0,
      },
      totalPatients: 55,
      qcInstrumentsReport: 'Pembersihan harian malam selesai. Waste container Sysmex telah dikosongkan. Suhu ruang lab 21°C stabil.',
      qcItems: [
        {
          id: 'QC-105',
          instrumentName: 'Sysmex XN-350 (Hematologi)',
          reagentName: 'Cellpack DCL',
          status: 'OK',
          notes: 'Shut-down cycle malam terlaksana, waste dibuang ke jerigen B3.',
          updatedAt: '06:15',
        },
        {
          id: 'QC-106',
          instrumentName: 'Kulkas Darah BDRS (Blood Bank)',
          reagentName: 'Pemantauan Suhu 2°C - 6°C',
          status: 'OK',
          notes: 'Suhu jam 06.00 tercatat 3.6°C, tidak ada fluktuasi selama dinas malam.',
          updatedAt: '06:00',
        },
      ],
      depositNotes: '1 sampel darah lisis IGD telah dimintakan pengambilan ulang (re-sampling) ke perawat IGD.',
      bloodStockNotes: 'Golongan A: 6 kolf, Golongan B: 6 kolf, Golongan O: 6 kolf, Golongan AB: 2 kolf. 1 labu transfusi malam aman.',
      infoNotes: 'Pelayanan CITO malam berjalan tertib. Tidak ada insiden tumpahan B3.',
      status: 'confirmed',
      confirmedAt: `${getDateStr(-1)}T07:15:00+07:00`,
      createdAt: `${getDateStr(-1)}T06:50:00+07:00`,
    },
    {
      handoverId: 'HND-005',
      shiftId: 'pagi',
      targetShiftId: 'siang',
      handoverDate: getDateStr(-2),
      outgoingStaffId: 'STF-004', // Nurul Fatimah
      outgoingStaffName: 'Nurul Fatimah, A.Md.AK & Hendra Wijaya, A.Md.AK',
      incomingStaffId: 'STF-001', // Supriatna
      incomingStaffName: 'Supriatna, A.Md.AK & Bayu Saputra, A.Md.AK',
      patientCategories: {
        rawatInap: 15,
        verloskamer: 3,
        nifas: 4,
        ponek: 2,
        poliUmum: 20,
        icu: 4,
        igd: 12,
        rajal: 20,
        perinatologi: 3,
        tranfusi: 5,
        pendonorLolos: 7,
        pendonorLanjutBesok: 1,
        pendonorTidakLolos: 2,
        crossmatch: 6,
        nilaiKritis: 1,
        tcmTb: 3,
        mcu: 10,
      },
      totalPatients: 118,
      qcInstrumentsReport: 'QC Hematologi dan Kimia Darah OK. QC Urinalisis Dirui H-500 strip 10 parameter normal.',
      qcItems: [
        {
          id: 'QC-107',
          instrumentName: 'Sysmex XN-350 (Hematologi)',
          reagentName: 'Cellpack DCL',
          status: 'OK',
          notes: 'CV < 2%, semua kontrol masuk target 2SD.',
          updatedAt: '07:40',
        },
      ],
      depositNotes: 'Sampel TCM TB 3 pot sudah register SIRS-TB.',
      bloodStockNotes: 'Stok darah Bank Darah lengkap, fresh frozen plasma aman.',
      infoNotes: 'Reagen Lyse Sysmex datang dari gudang farmasi sebanyak 4 boks dan disimpan di ruang reagen.',
      status: 'confirmed',
      confirmedAt: `${getDateStr(-2)}T14:10:00+07:00`,
      createdAt: `${getDateStr(-2)}T13:50:00+07:00`,
    },
  ];
}

export function generateInitialNotifications(): AppNotification[] {
  return [
    {
      notificationId: 'NOTIF-001',
      recipientId: 'all',
      title: 'Jadwal Shift Diterbitkan',
      message: 'Jadwal jaga minggu ini telah diverifikasi dan resmi diterbitkan oleh Koordinator Lab.',
      type: 'schedule_publish',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      notificationId: 'NOTIF-002',
      recipientId: 'STF-001',
      title: 'Permohonan Tukar Shift Baru',
      message: 'Rina Indriyani mengajukan tukar shift dengan Dedi Kurniawan dan menunggu persetujuan.',
      type: 'swap_request',
      isRead: false,
      refId: 'SWP-001',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function generateInitialAuditLogs(): AuditLog[] {
  return [
    {
      logId: 'AUD-001',
      actorId: 'STF-001',
      actorName: 'Supriatna, A.Md.AK',
      actionType: 'SCHEDULE_PUBLISH',
      entityType: 'schedule',
      entityId: 'BATCH-2025-W1',
      reason: 'Penerbitan jadwal mingguan resmi laboratorium',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      logId: 'AUD-002',
      actorId: 'STF-000',
      actorName: 'Administrator Lab',
      actionType: 'SYSTEM_STARTUP',
      entityType: 'system',
      entityId: 'SYS',
      reason: 'Inisialisasi sistem shift jaga laboratorium RSUD Sultan Muhammad Jamaludin I',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];
}

// -------------------------------------------------------------
// Reactive Store Implementation with Auto-Storage Sync
// -------------------------------------------------------------
class LaboratoryStore {
  private users: UserAccount[] = [];
  private staff: Staff[] = [];
  private shifts: ShiftConfig[] = [];
  private schedules: Schedule[] = [];
  private swaps: ShiftSwapRequest[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private handovers: HandoverRecord[] = [];
  private notifications: AppNotification[] = [];
  private auditLogs: AuditLog[] = [];
  private currentUser: UserAccount | null = null;
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;

  constructor() {
    this.loadState();
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  private loadState() {
    // ... same as before
    try {
      this.users = this.getItem('users', DEFAULT_USERS);
      this.staff = this.getItem('staff', DEFAULT_STAFF);
      this.shifts = this.getItem('shifts', DEFAULT_SHIFTS);
      this.schedules = this.getItem('schedules', generateInitialSchedules());
      this.swaps = this.getItem('swaps', generateInitialSwaps());
      this.leaves = this.getItem('leaves', generateInitialLeaves());
      this.attendance = this.getItem('attendance', generateInitialAttendance());
      this.handovers = this.getItem('handovers', generateInitialHandovers());
      this.notifications = this.getItem('notifications', generateInitialNotifications());
      this.auditLogs = this.getItem('auditLogs', generateInitialAuditLogs());

      const savedUserUid = safeGetStorage(STORAGE_KEY_PREFIX + 'currentUserUid');
      if (savedUserUid) {
        this.currentUser = this.users.find(u => u.uid === savedUserUid) || null;
      } else {
        // Tanpa sesi aktif: arahkan ke layar autentikasi login petugas
        this.currentUser = null;
      }

      // Pastikan seluruh data staf memiliki akun login dan kata sandi aktif
      let usersChanged = false;
      this.staff.forEach(s => {
        let u = this.users.find(user => user.staffId === s.staffId);
        if (!u) {
          u = {
            uid: `USR-${s.staffId.replace('STF-', '')}`,
            staffId: s.staffId,
            email: s.email,
            displayName: s.fullName,
            role: s.role,
            active: s.active,
            password: 'password123',
            createdAt: s.createdAt,
          };
          this.users.push(u);
          usersChanged = true;
        } else if (!u.password) {
          u.password = 'password123';
          usersChanged = true;
        }
      });
      if (usersChanged) {
        this.setItem('users', this.users);
      }
    } catch (e) {
      console.warn('Error loading state from localStorage:', e);
      this.resetToDefaults();
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    const raw = safeGetStorage(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  private async syncToSupabase(key: string, value: any): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const tableKey = key.replace(STORAGE_KEY_PREFIX, '');
    this.isSyncing = true;
    this.notify();

    try {
      console.log(`Syncing table: ${tableKey}`);
      let query;
      switch (tableKey) {
        case 'staff':
          query = client.from('staff').upsert(value.map((s: Staff) => ({
            staff_id: s.staffId, full_name: s.fullName, employee_number: s.employeeNumber,
            position: s.position, email: s.email, phone: s.phone, active: s.active,
            avatar_url: s.avatarUrl, created_at: s.createdAt, updated_at: new Date().toISOString()
          })));
          break;
        case 'users':
          query = client.from('app_users').upsert(value.map((u: UserAccount) => ({
            uid: u.uid, staff_id: u.staffId, email: u.email, display_name: u.displayName,
            role: u.role, active: u.active, created_at: u.createdAt, updated_at: new Date().toISOString()
          })));
          break;
        case 'shifts':
          query = client.from('shifts').upsert(value.map((s: ShiftConfig) => ({
            shift_id: s.shiftId, name: s.name, start_time: s.startTime, end_time: s.endTime,
            minimum_staff: s.minimumStaff, color: s.color, is_overnight: s.isOvernight,
            active: s.active, created_at: new Date().toISOString()
          })));
          break;
        case 'schedules':
          query = client.from('schedules').upsert(value.map((s: Schedule) => ({
            schedule_id: s.scheduleId, staff_id: s.staffId, shift_id: s.shiftId, date: s.date,
            start_at: s.startAt, end_at: s.endAt, status: s.status, notes: s.notes,
            created_by: s.createdBy, updated_by: s.updatedBy, created_at: s.createdAt, updated_at: s.updatedAt
          })));
          break;
        case 'swaps':
          query = client.from('shift_swap_requests').upsert(value.map((s: ShiftSwapRequest) => ({
            request_id: s.requestId, requester_staff_id: s.requesterStaffId, target_staff_id: s.targetStaffId,
            source_schedule_id: s.sourceScheduleId, target_schedule_id: s.targetScheduleId,
            reason: s.reason, status: s.status, reviewed_by: s.reviewedBy,
            reviewed_at: s.reviewedAt, review_notes: s.reviewNotes, created_at: s.createdAt
          })));
          break;
        case 'leaves':
          query = client.from('leave_requests').upsert(value.map((l: LeaveRequest) => ({
            request_id: l.requestId, staff_id: l.staffId, leave_type: l.leaveType,
            start_date: l.startDate, end_date: l.endDate, reason: l.reason,
            status: l.status, reviewed_by: l.reviewedBy, reviewed_at: l.reviewedAt,
            review_notes: l.reviewNotes, created_at: l.createdAt
          })));
          break;
        case 'attendance':
          query = client.from('attendance').upsert(value.map((a: AttendanceRecord) => ({
            attendance_id: a.attendanceId, staff_id: a.staffId, schedule_id: a.scheduleId,
            date: a.date, check_in: a.checkIn, check_out: a.checkOut, status: a.status,
            notes: a.notes, is_corrected: a.isCorrected, corrected_by: a.correctedBy,
            correction_reason: a.correctionReason, created_at: a.createdAt
          })));
          break;
        case 'handovers':
          query = client.from('handovers').upsert(value.map((h: HandoverRecord) => ({
            handover_id: h.handoverId, shift_id: h.shiftId, handover_date: h.handoverDate,
            outgoing_staff_id: h.outgoingStaffId, incoming_staff_id: h.incomingStaffId,
            pending_samples: h.pendingSamples, equipment_status: h.equipmentStatus,
            reagent_notes: h.reagentNotes, follow_up_notes: h.followUpNotes, status: h.status,
            confirmed_at: h.confirmedAt, created_at: h.createdAt
          })));
          break;
        case 'notifications':
          query = client.from('notifications').upsert(value.map((n: AppNotification) => ({
            notification_id: n.notificationId, recipient_id: n.recipientId, title: n.title,
            message: n.message, type: n.type, is_read: n.isRead, ref_id: n.refId,
            created_at: n.createdAt
          })));
          break;
        case 'auditLogs':
          query = client.from('audit_logs').upsert(value.map((a: AuditLog) => ({
            log_id: a.logId, actor_id: a.actorId, actor_name: a.actorName, action_type: a.actionType,
            entity_type: a.entityType, entity_id: a.entityId, before_data: a.beforeData,
            after_data: a.afterData, reason: a.reason, created_at: a.createdAt
          })));
          break;
        default:
          console.warn(`No mapping found for table: ${tableKey}`);
          return;
      }

      const { error } = await query;
      if (error) throw error;
      console.log(`Successfully synced ${tableKey} to Supabase`);
    } catch (e: any) {
      console.error(`Failed to sync ${tableKey} to Supabase:`, e);
      if (e.message) console.error(`Sync error message: ${e.message}`);
      if (e.details) console.error(`Sync error details: ${e.details}`);
    } finally {
        this.isSyncing = false;
        this.notify();
    }
  }

  private setItem(key: string, value: any): void {
    try {
      safeSetStorage(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
      this.syncToSupabase(key, value);
    } catch (e) {
      console.error(`Failed to persist ${key}:`, e);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public resetToDefaults() {
    this.users = [...DEFAULT_USERS];
    this.staff = [...DEFAULT_STAFF];
    this.shifts = [...DEFAULT_SHIFTS];
    this.schedules = generateInitialSchedules();
    this.swaps = generateInitialSwaps();
    this.leaves = generateInitialLeaves();
    this.attendance = generateInitialAttendance();
    this.handovers = generateInitialHandovers();
    this.notifications = generateInitialNotifications();
    this.auditLogs = generateInitialAuditLogs();
    this.currentUser = this.users[1];

    this.setItem('users', this.users);
    this.setItem('staff', this.staff);
    this.setItem('shifts', this.shifts);
    this.setItem('schedules', this.schedules);
    this.setItem('swaps', this.swaps);
    this.setItem('leaves', this.leaves);
    this.setItem('attendance', this.attendance);
    this.setItem('handovers', this.handovers);
    this.setItem('notifications', this.notifications);
    this.setItem('auditLogs', this.auditLogs);
    safeSetStorage(STORAGE_KEY_PREFIX + 'currentUserUid', this.currentUser.uid);

    this.notify();
  }

  // --- Getters ---
  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public getCurrentStaff(): Staff | null {
    if (!this.currentUser) return null;
    return this.staff.find(s => s.staffId === this.currentUser?.staffId) || null;
  }

  public getUsers(): UserAccount[] {
    return this.users;
  }

  public getStaff(): Staff[] {
    return this.staff;
  }

  public getShifts(): ShiftConfig[] {
    return this.shifts;
  }

  public getSchedules(): Schedule[] {
    return this.schedules;
  }

  public getSwaps(): ShiftSwapRequest[] {
    return this.swaps;
  }

  public getLeaves(): LeaveRequest[] {
    return this.leaves;
  }

  public getAttendance(): AttendanceRecord[] {
    return this.attendance;
  }

  public getHandovers(): HandoverRecord[] {
    return this.handovers;
  }

  public getNotifications(): AppNotification[] {
    return this.notifications;
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  // --- Auth Actions ---
  public findAccountByIdentifier(identifier: string): { user: UserAccount; staff: Staff } | null {
    if (!identifier) return null;
    const raw = identifier.trim().toLowerCase();
    const cleanNip = raw.replace(/\s+/g, '');

    // Cari dari data staf berdasarkan email, NIP (dengan/tanpa spasi), atau Staff ID
    const matchingStaff = this.staff.find(s => {
      const sEmail = s.email.toLowerCase();
      const sNip = s.employeeNumber.replace(/\s+/g, '').toLowerCase();
      const sId = s.staffId.toLowerCase();
      return sEmail === raw || sNip === cleanNip || sId === raw;
    });

    if (matchingStaff) {
      let user = this.users.find(
        u => u.staffId === matchingStaff.staffId || u.email.toLowerCase() === matchingStaff.email.toLowerCase()
      );
      if (!user) {
        // Buat user jika belum ada
        user = {
          uid: `USR-${matchingStaff.staffId.replace('STF-', '')}`,
          staffId: matchingStaff.staffId,
          email: matchingStaff.email,
          displayName: matchingStaff.fullName,
          role: matchingStaff.role,
          active: matchingStaff.active,
          password: 'password123',
          createdAt: matchingStaff.createdAt,
        };
        this.users.push(user);
        this.setItem('users', this.users);
      }
      return { user, staff: matchingStaff };
    }

    // Cari langsung dari data users (email atau uid)
    const matchingUser = this.users.find(u => u.email.toLowerCase() === raw || u.uid.toLowerCase() === raw);
    if (matchingUser) {
      const staff = this.staff.find(s => s.staffId === matchingUser.staffId) || {
        staffId: matchingUser.staffId || matchingUser.uid,
        fullName: matchingUser.displayName,
        employeeNumber: '-',
        position: matchingUser.role === 'admin' ? 'Administrator Sistem Lab' : 'Petugas Lab',
        email: matchingUser.email,
        phone: '-',
        active: matchingUser.active,
        createdAt: matchingUser.createdAt,
        role: matchingUser.role,
      };
      return { user: matchingUser, staff };
    }

    return null;
  }

  public login(identifier: string, passwordInput?: string, fallbackRole?: Role): boolean {
    const foundData = this.findAccountByIdentifier(identifier);

    // Fallback role support jika dipanggil programatik
    if (!foundData && fallbackRole) {
      const user = this.users.find(u => u.role === fallbackRole && u.active);
      if (user) {
        this.currentUser = user;
        this.currentUser.lastLogin = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_PREFIX + 'currentUserUid', user.uid);
        this.logActivity('LOGIN', 'user', user.uid, undefined, { email: user.email }, 'User login ke sistem');
        this.notify();
        return true;
      }
    }

    if (!foundData) {
      throw new Error(`Akun dengan NIP atau Email "${identifier}" tidak terdaftar di sistem RSUD SMJ I.`);
    }

    const { user, staff } = foundData;

    if (!user.active || !staff.active) {
      throw new Error('Akun petugas ini sedang dinonaktifkan oleh administrator. Silakan hubungi bagian TU / Kepala Instalasi Lab.');
    }

    // Verifikasi kata sandi (jika passwordInput diisi)
    if (passwordInput !== undefined) {
      const currentPwd = user.password || 'password123';
      if (currentPwd !== passwordInput) {
        throw new Error('Kata sandi yang Anda masukkan salah. Silakan coba lagi atau gunakan menu Lupa / Reset Sandi.');
      }
    }

    this.currentUser = user;
    this.currentUser.lastLogin = new Date().toISOString();
    safeSetStorage(STORAGE_KEY_PREFIX + 'currentUserUid', user.uid);

    this.logActivity(
      'LOGIN',
      'user',
      user.uid,
      undefined,
      { email: user.email, staffId: user.staffId, role: user.role, nip: staff.employeeNumber },
      `Petugas ${user.displayName} (${user.role.toUpperCase()}) berhasil masuk ke sistem`
    );
    this.notify();
    return true;
  }

  public resetPassword(identifier: string, newPassword: string): { success: boolean; message: string; user: UserAccount } {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Kata sandi baru minimal harus terdiri dari 6 karakter.');
    }

    const foundData = this.findAccountByIdentifier(identifier);
    if (!foundData) {
      throw new Error(`Akun dengan NIP atau Email "${identifier}" tidak ditemukan.`);
    }

    const { user } = foundData;
    const uIdx = this.users.findIndex(u => u.uid === user.uid);
    if (uIdx !== -1) {
      this.users[uIdx].password = newPassword;
      this.setItem('users', this.users);

      if (this.currentUser && this.currentUser.uid === user.uid) {
        this.currentUser.password = newPassword;
      }

      this.logActivity('PASSWORD_RESET', 'user', user.uid, null, null, `Kata sandi petugas ${user.displayName} direset`);
      this.notify();
      return {
        success: true,
        message: `Kata sandi untuk ${user.displayName} berhasil diperbarui. Silakan login dengan kata sandi baru.`,
        user: this.users[uIdx],
      };
    }

    throw new Error('Gagal memperbarui kata sandi. Silakan coba kembali.');
  }

  public changePassword(oldPassword: string, newPassword: string): { success: boolean; message: string } {
    if (!this.currentUser) {
      throw new Error('Sesi login telah berakhir. Silakan login kembali.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Kata sandi baru minimal harus 6 karakter.');
    }

    const currentPwd = this.currentUser.password || 'password123';
    if (currentPwd !== oldPassword) {
      throw new Error('Kata sandi saat ini yang Anda masukkan tidak sesuai.');
    }

    const uIdx = this.users.findIndex(u => u.uid === this.currentUser!.uid);
    if (uIdx !== -1) {
      this.users[uIdx].password = newPassword;
      this.currentUser.password = newPassword;
      this.setItem('users', this.users);
      this.logActivity('PASSWORD_CHANGE', 'user', this.currentUser.uid, null, null, `Petugas ${this.currentUser.displayName} mengubah kata sandi pribadi`);
      this.notify();
      return { success: true, message: 'Kata sandi pribadi Anda berhasil diperbarui.' };
    }

    throw new Error('Gagal menyimpan kata sandi baru.');
  }

  public adminResetStaffPassword(staffId: string, newPassword = 'password123'): { success: boolean; message: string; newPassword: string } {
    const staff = this.staff.find(s => s.staffId === staffId);
    if (!staff) {
      throw new Error('Data petugas tidak ditemukan.');
    }

    const uIdx = this.users.findIndex(u => u.staffId === staffId || u.email.toLowerCase() === staff.email.toLowerCase());
    if (uIdx !== -1) {
      this.users[uIdx].password = newPassword;
      this.setItem('users', this.users);
      this.logActivity('ADMIN_PASSWORD_RESET', 'staff', staffId, null, { staffId }, `Administrator mereset kata sandi petugas ${staff.fullName}`);
      this.notify();
      return {
        success: true,
        message: `Kata sandi petugas ${staff.fullName} berhasil direset menjadi "${newPassword}".`,
        newPassword,
      };
    } else {
      const newUser: UserAccount = {
        uid: `USR-${staff.staffId.replace('STF-', '')}`,
        staffId: staff.staffId,
        email: staff.email,
        displayName: staff.fullName,
        role: staff.role,
        active: staff.active,
        password: newPassword,
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.setItem('users', this.users);
      this.notify();
      return {
        success: true,
        message: `Akun login petugas ${staff.fullName} berhasil dibuat dengan kata sandi "${newPassword}".`,
        newPassword,
      };
    }
  }

  public logout(): void {
    if (this.currentUser) {
      this.logActivity('LOGOUT', 'user', this.currentUser.uid, undefined, undefined, 'User logout');
    }
    this.currentUser = null;
    safeRemoveStorage(STORAGE_KEY_PREFIX + 'currentUserUid');
    this.notify();
  }

  public switchUser(uid: string): void {
    const user = this.users.find(u => u.uid === uid);
    if (user && user.active) {
      this.currentUser = user;
      safeSetStorage(STORAGE_KEY_PREFIX + 'currentUserUid', user.uid);
      this.logActivity('ROLE_SWITCH', 'user', user.uid, undefined, { role: user.role }, `Beralih peran ke ${user.role}`);
      this.notify();
    }
  }

  // --- Schedule Actions ---
  public addSchedule(scheduleData: Omit<Schedule, 'scheduleId' | 'createdAt' | 'updatedAt'>): Schedule {
    const newSchedule: Schedule = {
      ...scheduleData,
      scheduleId: `SCH-${String(this.schedules.length + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.schedules.push(newSchedule);
    this.setItem('schedules', this.schedules);

    this.logActivity(
      'SCHEDULE_CREATE',
      'schedule',
      newSchedule.scheduleId,
      null,
      newSchedule,
      `Membuat jadwal tanggal ${newSchedule.date} untuk staff ${newSchedule.staffId}`
    );

    this.notify();
    return newSchedule;
  }

  public updateSchedule(scheduleId: string, updates: Partial<Schedule>): void {
    const index = this.schedules.findIndex(s => s.scheduleId === scheduleId);
    if (index !== -1) {
      const before = { ...this.schedules[index] };
      this.schedules[index] = {
        ...this.schedules[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUser?.staffId || 'SYSTEM',
      };
      this.setItem('schedules', this.schedules);

      // Notify affected staff if schedule changed
      this.addNotification({
        recipientId: this.schedules[index].staffId,
        title: 'Perubahan Jadwal Shift',
        message: `Jadwal shift Anda pada tanggal ${this.schedules[index].date} telah diperbarui oleh Koordinator.`,
        type: 'schedule_publish',
        isRead: false,
        refId: scheduleId,
      });

      this.logActivity('SCHEDULE_UPDATE', 'schedule', scheduleId, before, this.schedules[index], 'Memperbarui jadwal');
      this.notify();
    }
  }

  public deleteSchedule(scheduleId: string, reason = 'Dihapus oleh pengelola'): void {
    const index = this.schedules.findIndex(s => s.scheduleId === scheduleId);
    if (index !== -1) {
      const before = this.schedules[index];
      this.schedules.splice(index, 1);
      this.setItem('schedules', this.schedules);

      this.logActivity('SCHEDULE_DELETE', 'schedule', scheduleId, before, null, reason);
      this.notify();
    }
  }

  public publishSchedules(dateStart: string, dateEnd: string): number {
    let count = 0;
    for (let i = 0; i < this.schedules.length; i++) {
      if (this.schedules[i].date >= dateStart && this.schedules[i].date <= dateEnd && this.schedules[i].status === 'draft') {
        this.schedules[i].status = 'published';
        this.schedules[i].updatedAt = new Date().toISOString();
        this.schedules[i].updatedBy = this.currentUser?.staffId || 'COORD';
        count++;
      }
    }

    if (count > 0) {
      this.setItem('schedules', this.schedules);
      this.addNotification({
        recipientId: 'all',
        title: 'Jadwal Baru Diterbitkan',
        message: `Sebanyak ${count} jadwal shift periode ${dateStart} s/d ${dateEnd} telah resmi diterbitkan.`,
        type: 'schedule_publish',
        isRead: false,
      });

      this.logActivity('SCHEDULE_PUBLISH', 'schedule', `PERIOD_${dateStart}_${dateEnd}`, null, { count }, `Penerbitan ${count} jadwal shift`);
      this.notify();
    }
    return count;
  }

  // --- Staff Actions ---
  public addStaff(staffData: Omit<Staff, 'staffId' | 'createdAt'>, createAccount = true): Staff {
    const staffId = `STF-${String(this.staff.length + 1).padStart(3, '0')}`;
    const newStaff: Staff = {
      ...staffData,
      staffId,
      createdAt: new Date().toISOString(),
    };
    this.staff.push(newStaff);
    this.setItem('staff', this.staff);

    if (createAccount) {
      const newUser: UserAccount = {
        uid: `USR-${staffId}`,
        staffId,
        email: newStaff.email,
        displayName: newStaff.fullName,
        role: newStaff.role,
        active: newStaff.active,
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.setItem('users', this.users);
    }

    this.logActivity('STAFF_CREATE', 'staff', staffId, null, newStaff, `Menambah data petugas ${newStaff.fullName}`);
    this.notify();
    return newStaff;
  }

  public updateStaff(staffId: string, updates: Partial<Staff>): void {
    const index = this.staff.findIndex(s => s.staffId === staffId);
    if (index !== -1) {
      const before = { ...this.staff[index] };
      this.staff[index] = { ...this.staff[index], ...updates };
      this.setItem('staff', this.staff);

      // Sync role/name to user account
      const userIdx = this.users.findIndex(u => u.staffId === staffId);
      if (userIdx !== -1) {
        if (updates.fullName) this.users[userIdx].displayName = updates.fullName;
        if (updates.email) this.users[userIdx].email = updates.email;
        if (updates.role) this.users[userIdx].role = updates.role;
        if (updates.active !== undefined) this.users[userIdx].active = updates.active;
        this.setItem('users', this.users);
      }

      this.logActivity('STAFF_UPDATE', 'staff', staffId, before, this.staff[index], 'Memperbarui data petugas');
      this.notify();
    }
  }

  public toggleStaffStatus(staffId: string): void {
    const staff = this.staff.find(s => s.staffId === staffId);
    if (staff) {
      const newStatus = !staff.active;
      this.updateStaff(staffId, { active: newStatus });
      this.logActivity('STAFF_STATUS_CHANGE', 'staff', staffId, { active: !newStatus }, { active: newStatus }, `Mengubah status akun ${staff.fullName} menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`);
    }
  }

  // --- Shift Swap Actions ---
  public createSwapRequest(req: Omit<ShiftSwapRequest, 'requestId' | 'status' | 'createdAt'>): ShiftSwapRequest {
    const newSwap: ShiftSwapRequest = {
      ...req,
      requestId: `SWP-${String(this.swaps.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.swaps.unshift(newSwap);
    this.setItem('swaps', this.swaps);

    // Notify coordinator
    this.addNotification({
      recipientId: 'STF-001',
      title: 'Permohonan Tukar Shift Masuk',
      message: `Petugas mengajukan permohonan tukar shift jaga laboratorium. Mohon ditinjau.`,
      type: 'swap_request',
      isRead: false,
      refId: newSwap.requestId,
    });

    this.logActivity('SWAP_REQUEST_CREATE', 'shift_swap', newSwap.requestId, null, newSwap, req.reason);
    this.notify();
    return newSwap;
  }

  public approveSwapRequest(requestId: string, reviewNotes = 'Disetujui oleh Koordinator'): void {
    const swap = this.swaps.find(s => s.requestId === requestId);
    if (!swap || swap.status !== 'pending') return;

    swap.status = 'approved';
    swap.reviewedBy = this.currentUser?.staffId || 'COORD';
    swap.reviewedAt = new Date().toISOString();
    swap.reviewNotes = reviewNotes;

    // Swap the staff on the schedules!
    const schedA = this.schedules.find(s => s.scheduleId === swap.sourceScheduleId);
    const schedB = this.schedules.find(s => s.scheduleId === swap.targetScheduleId);

    if (schedA && schedB) {
      const tempStaff = schedA.staffId;
      schedA.staffId = schedB.staffId;
      schedB.staffId = tempStaff;
      schedA.status = 'changed';
      schedB.status = 'changed';
      schedA.updatedAt = new Date().toISOString();
      schedB.updatedAt = new Date().toISOString();
      this.setItem('schedules', this.schedules);
    }

    this.setItem('swaps', this.swaps);

    // Notify both staff members
    this.addNotification({
      recipientId: swap.requesterStaffId,
      title: 'Tukar Shift Disetujui',
      message: `Permohonan tukar shift Anda telah disetujui oleh Koordinator. Jadwal telah disesuaikan.`,
      type: 'swap_decision',
      isRead: false,
      refId: requestId,
    });
    this.addNotification({
      recipientId: swap.targetStaffId,
      title: 'Tukar Shift Disetujui',
      message: `Pertukaran shift dengan rekan telah disetujui. Silakan cek jadwal terbaru Anda.`,
      type: 'swap_decision',
      isRead: false,
      refId: requestId,
    });

    this.logActivity('SWAP_APPROVE', 'shift_swap', requestId, null, { status: 'approved' }, reviewNotes);
    this.notify();
  }

  public rejectSwapRequest(requestId: string, reviewNotes = 'Ditolak karena bentrok jadwal atau kebutuhan unit'): void {
    const swap = this.swaps.find(s => s.requestId === requestId);
    if (!swap || swap.status !== 'pending') return;

    swap.status = 'rejected';
    swap.reviewedBy = this.currentUser?.staffId || 'COORD';
    swap.reviewedAt = new Date().toISOString();
    swap.reviewNotes = reviewNotes;
    this.setItem('swaps', this.swaps);

    this.addNotification({
      recipientId: swap.requesterStaffId,
      title: 'Tukar Shift Ditolak',
      message: `Permohonan tukar shift Anda tidak dapat disetujui: ${reviewNotes}`,
      type: 'swap_decision',
      isRead: false,
      refId: requestId,
    });

    this.logActivity('SWAP_REJECT', 'shift_swap', requestId, null, { status: 'rejected' }, reviewNotes);
    this.notify();
  }

  // --- Leave Actions ---
  public createLeaveRequest(leave: Omit<LeaveRequest, 'requestId' | 'status' | 'createdAt'>): LeaveRequest {
    const newLeave: LeaveRequest = {
      ...leave,
      requestId: `LEV-${String(this.leaves.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.leaves.unshift(newLeave);
    this.setItem('leaves', this.leaves);

    this.logActivity('LEAVE_REQUEST_CREATE', 'leave', newLeave.requestId, null, newLeave, leave.reason);
    this.notify();
    return newLeave;
  }

  public approveLeaveRequest(requestId: string, reviewNotes = 'Disetujui'): void {
    const leave = this.leaves.find(l => l.requestId === requestId);
    if (!leave) return;
    leave.status = 'approved';
    leave.reviewedBy = this.currentUser?.staffId || 'COORD';
    leave.reviewedAt = new Date().toISOString();
    leave.reviewNotes = reviewNotes;
    this.setItem('leaves', this.leaves);

    this.addNotification({
      recipientId: leave.staffId,
      title: 'Permohonan Cuti/Izin Disetujui',
      message: `Permohonan ${leave.leaveType.replace('_', ' ')} tanggal ${leave.startDate} s/d ${leave.endDate} telah disetujui.`,
      type: 'leave_decision',
      isRead: false,
      refId: requestId,
    });

    this.logActivity('LEAVE_APPROVE', 'leave', requestId, null, { status: 'approved' }, reviewNotes);
    this.notify();
  }

  public rejectLeaveRequest(requestId: string, reviewNotes = 'Ditolak karena kuota pelayanan'): void {
    const leave = this.leaves.find(l => l.requestId === requestId);
    if (!leave) return;
    leave.status = 'rejected';
    leave.reviewedBy = this.currentUser?.staffId || 'COORD';
    leave.reviewedAt = new Date().toISOString();
    leave.reviewNotes = reviewNotes;
    this.setItem('leaves', this.leaves);

    this.addNotification({
      recipientId: leave.staffId,
      title: 'Permohonan Cuti/Izin Ditolak',
      message: `Permohonan tidak dapat disetujui: ${reviewNotes}`,
      type: 'leave_decision',
      isRead: false,
      refId: requestId,
    });

    this.logActivity('LEAVE_REJECT', 'leave', requestId, null, { status: 'rejected' }, reviewNotes);
    this.notify();
  }

  // --- Attendance Actions ---
  public recordCheckIn(staffId: string, scheduleId?: string, notes?: string): AttendanceRecord {
    const today = getDateStr(0);
    const existing = this.attendance.find(a => a.staffId === staffId && a.date === today);
    if (existing) {
      existing.checkIn = new Date().toISOString();
      if (notes) existing.notes = notes;
      this.setItem('attendance', this.attendance);
      this.notify();
      return existing;
    }

    const newRecord: AttendanceRecord = {
      attendanceId: `ATT-${Date.now().toString().slice(-6)}`,
      staffId,
      scheduleId,
      date: today,
      checkIn: new Date().toISOString(),
      status: 'present',
      notes,
      createdAt: new Date().toISOString(),
    };
    this.attendance.unshift(newRecord);
    this.setItem('attendance', this.attendance);

    this.logActivity('ATTENDANCE_CHECKIN', 'attendance', newRecord.attendanceId, null, newRecord, 'Petugas check-in shift');
    this.notify();
    return newRecord;
  }

  public recordCheckOut(attendanceId: string, notes?: string): void {
    const record = this.attendance.find(a => a.attendanceId === attendanceId);
    if (record) {
      record.checkOut = new Date().toISOString();
      if (notes) record.notes = (record.notes ? record.notes + ' | ' : '') + notes;
      this.setItem('attendance', this.attendance);

      this.logActivity('ATTENDANCE_CHECKOUT', 'attendance', attendanceId, null, { checkOut: record.checkOut }, 'Petugas check-out shift');
      this.notify();
    }
  }

  public correctAttendance(attendanceId: string, updates: Partial<AttendanceRecord>, reason: string): void {
    const record = this.attendance.find(a => a.attendanceId === attendanceId);
    if (record) {
      const before = { ...record };
      Object.assign(record, updates, {
        isCorrected: true,
        correctedBy: this.currentUser?.displayName || 'Admin',
        correctionReason: reason,
      });
      this.setItem('attendance', this.attendance);

      this.logActivity('ATTENDANCE_CORRECTION', 'attendance', attendanceId, before, record, reason);
      this.notify();
    }
  }

  // --- Handover Actions ---
  public createHandover(data: Omit<HandoverRecord, 'handoverId' | 'status' | 'createdAt'>): HandoverRecord {
    const newHandover: HandoverRecord = {
      ...data,
      handoverId: `HND-${Date.now().toString().slice(-6)}`,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };
    this.handovers.unshift(newHandover);
    this.setItem('handovers', this.handovers);

    this.logActivity('HANDOVER_SUBMIT', 'handover', newHandover.handoverId, null, newHandover, 'Serah terima jaga dibuat');
    this.notify();
    return newHandover;
  }

  public confirmHandover(handoverId: string): void {
    const item = this.handovers.find(h => h.handoverId === handoverId);
    if (item) {
      item.status = 'confirmed';
      item.confirmedAt = new Date().toISOString();
      this.setItem('handovers', this.handovers);

      this.logActivity('HANDOVER_CONFIRM', 'handover', handoverId, null, { status: 'confirmed' }, 'Serah terima jaga diverifikasi penerima');
      this.notify();
    }
  }

  public updateHandover(handoverId: string, updates: Partial<HandoverRecord>): void {
    const item = this.handovers.find(h => h.handoverId === handoverId);
    if (item) {
      const before = { ...item };
      Object.assign(item, updates);
      this.setItem('handovers', this.handovers);
      this.logActivity('HANDOVER_UPDATE', 'handover', handoverId, before, item, 'Berita acara serah terima / QC diperbarui');
      this.notify();
    }
  }

  public deleteHandover(handoverId: string): void {
    const index = this.handovers.findIndex(h => h.handoverId === handoverId);
    if (index !== -1) {
      const removed = this.handovers.splice(index, 1)[0];
      this.setItem('handovers', this.handovers);
      this.logActivity('HANDOVER_DELETE', 'handover', handoverId, removed, null, 'Berita acara serah terima dihapus');
      this.notify();
    }
  }

  // --- Notifications ---
  public addNotification(notif: Omit<AppNotification, 'notificationId' | 'createdAt'>): void {
    const item: AppNotification = {
      ...notif,
      notificationId: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(item);
    this.setItem('notifications', this.notifications);
    this.notify();
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find(n => n.notificationId === id);
    if (notif) {
      notif.isRead = true;
      this.setItem('notifications', this.notifications);
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => (n.isRead = true));
    this.setItem('notifications', this.notifications);
    this.notify();
  }

  // --- Audit Log ---
  public logActivity(
    actionType: string,
    entityType: string,
    entityId?: string,
    beforeData?: any,
    afterData?: any,
    reason?: string
  ): void {
    const newLog: AuditLog = {
      logId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      actorId: this.currentUser?.staffId || this.currentUser?.uid || 'GUEST',
      actorName: this.currentUser?.displayName || 'Tamu / Sistem',
      actionType,
      entityType,
      entityId,
      beforeData,
      afterData,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    // Keep max 200 logs locally
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this.setItem('auditLogs', this.auditLogs);
  }

  // --- Shift Config ---
  public updateShiftConfig(shiftId: string, updates: Partial<ShiftConfig>): void {
    const shift = this.shifts.find(s => s.shiftId === shiftId);
    if (shift) {
      const before = { ...shift };
      Object.assign(shift, updates);
      this.setItem('shifts', this.shifts);
      this.logActivity('SHIFT_CONFIG_UPDATE', 'shift', shiftId, before, shift, 'Pembaruan konfigurasi shift jaga');
      this.notify();
    }
  }
}

export const labStore = new LaboratoryStore();
