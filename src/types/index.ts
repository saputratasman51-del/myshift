export type Role = 'admin' | 'coordinator' | 'staff';

export interface UserAccount {
  uid: string;
  staffId: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

export interface Staff {
  staffId: string;
  fullName: string;
  employeeNumber: string; // NIP / STR ATLM
  position: string; // Misal: Penanggung Jawab Lab, ATLM Hematologi, ATLM Kimia Klinik
  email: string;
  phone: string;
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  role: Role;
}

export interface ShiftConfig {
  shiftId: string;
  name: string;
  startTime: string; // "07:00"
  endTime: string;   // "14:00"
  minimumStaff: number;
  color: string;
  isOvernight?: boolean;
  active: boolean;
  description?: string;
}

export type ScheduleStatus = 'draft' | 'published' | 'changed' | 'cancelled';

export interface Schedule {
  scheduleId: string;
  staffId: string;
  shiftId: string;
  date: string; // YYYY-MM-DD
  startAt: string; // ISO String
  endAt: string;   // ISO String
  status: ScheduleStatus;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftSwapRequest {
  requestId: string;
  requesterStaffId: string;
  targetStaffId: string;
  sourceScheduleId: string;
  targetScheduleId: string;
  reason: string;
  status: SwapStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export type LeaveType = 'cuti_tahunan' | 'izin_sakit' | 'izin_penting' | 'tugas_luar';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  requestId: string;
  staffId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

export interface AttendanceRecord {
  attendanceId: string;
  staffId: string;
  scheduleId?: string;
  date: string;
  checkIn?: string; // ISO
  checkOut?: string; // ISO
  status: AttendanceStatus;
  notes?: string;
  isCorrected?: boolean;
  correctedBy?: string;
  correctionReason?: string;
  createdAt: string;
}

export type HandoverStatus = 'submitted' | 'confirmed';

export type QCStatus = 'OK' | 'Warning' | 'Fail' | 'Maintenance';

export interface HandoverQCItem {
  id: string;
  instrumentName: string; // Nama alat / instrumen (e.g. Sysmex XN-350, Cobas C111, dll)
  reagentName: string; // Nama reagen / parameter
  status: QCStatus; // Status QC: OK, Warning, Fail, Maintenance
  notes: string; // Catatan hasil QC dan ketersediaan reagen
  updatedAt?: string;
}

export interface HandoverPatientCategories {
  rawatInap: number;
  verloskamer: number;
  nifas: number;
  ponek: number;
  poliUmum: number;
  icu: number;
  igd: number;
  rajal: number;
  perinatologi: number;
  tranfusi: number;
  pendonorLolos: number;
  pendonorLanjutBesok: number;
  pendonorTidakLolos: number;
  crossmatch: number;
  nilaiKritis: number;
  tcmTb: number;
  mcu: number;
}

export interface HandoverRecord {
  handoverId: string;
  shiftId: string; // e.g. 'pagi'
  targetShiftId?: string; // e.g. 'siang'
  handoverDate: string;
  outgoingStaffId: string;
  outgoingStaffName?: string;
  incomingStaffId: string;
  incomingStaffName?: string;
  
  // A. Kategori Pemeriksaan Pasien
  patientCategories: HandoverPatientCategories;
  totalPatients: number;

  // B. Kategori Instrumen dan alat
  qcInstrumentsReport: string; // 1. Laporan QC Alat dan reagen
  qcItems?: HandoverQCItem[]; // Daftar QC Instrumen alat dan reagen yang dapat ditambah, diubah, dihapus

  // C. Titipan
  depositNotes: string; // Titipan sampel / berkas / lainnya

  // D. Stok darah
  bloodStockNotes: string; // Stok darah

  // E. Info/ Keterangan
  infoNotes: string; // Info / Keterangan

  // Backward compatibility
  pendingSamples?: string;
  equipmentStatus?: string;
  reagentNotes?: string;
  followUpNotes?: string;

  status: HandoverStatus;
  confirmedAt?: string;
  createdAt: string;
}

export interface AppNotification {
  notificationId: string;
  recipientId: string; // staffId or 'all'
  title: string;
  message: string;
  type: 'schedule_publish' | 'swap_request' | 'swap_decision' | 'leave_decision' | 'conflict_warning' | 'info';
  isRead: boolean;
  refId?: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  beforeData?: any;
  afterData?: any;
  reason?: string;
  createdAt: string;
}

export type ConflictSeverity = 'critical' | 'warning';

export interface ScheduleConflict {
  id: string;
  type: 'overlap' | 'insufficient_rest' | 'understaffed' | 'on_leave' | 'unassigned' | 'double_overnight';
  severity: ConflictSeverity;
  title: string;
  description: string;
  date: string;
  shiftId?: string;
  staffId?: string;
  staffName?: string;
  suggestion: string;
  scheduleIds?: string[];
}
