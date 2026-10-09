import { Schedule, ShiftConfig, Staff, LeaveRequest, ScheduleConflict } from '../types';

/**
 * Calculates start and end timestamps in UTC/millisecond representation
 * properly accounting for overnight shifts (e.g. 21:00 to 07:00 next day).
 */
export function getScheduleTimeRange(schedule: Schedule, shift?: ShiftConfig): { startMs: number; endMs: number } {
  // If schedule already has explicit ISO startAt & endAt
  if (schedule.startAt && schedule.endAt) {
    const startMs = new Date(schedule.startAt).getTime();
    const endMs = new Date(schedule.endAt).getTime();
    if (!isNaN(startMs) && !isNaN(endMs)) {
      return { startMs, endMs };
    }
  }

  // Fallback calculation using date and shift time
  const [year, month, day] = schedule.date.split('-').map(Number);
  const startTime = shift?.startTime || '07:00';
  const endTime = shift?.endTime || '14:00';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, startHour, startMin, 0);
  let endDate = new Date(year, month - 1, day, endHour, endMin, 0);

  // If overnight shift (endHour < startHour or shift.isOvernight)
  if (endHour <= startHour || shift?.isOvernight) {
    endDate = new Date(year, month - 1, day + 1, endHour, endMin, 0);
  }

  return {
    startMs: startDate.getTime(),
    endMs: endDate.getTime(),
  };
}

/**
 * Detect all conflicts within the provided schedule list, shifts, staff, and leaves.
 */
export function detectScheduleConflicts(
  schedules: Schedule[],
  shifts: ShiftConfig[],
  staffList: Staff[],
  leaves: LeaveRequest[] = []
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const shiftMap = new Map<string, ShiftConfig>(shifts.map(s => [s.shiftId, s]));
  const staffMap = new Map<string, Staff>(staffList.map(st => [st.staffId, st]));

  // Filter out cancelled schedules
  const activeSchedules = schedules.filter(s => s.status !== 'cancelled');

  // Pre-calculate time ranges for all active schedules
  const ranges = activeSchedules.map(schedule => {
    const shift = shiftMap.get(schedule.shiftId);
    const { startMs, endMs } = getScheduleTimeRange(schedule, shift);
    return {
      schedule,
      shift,
      startMs,
      endMs,
    };
  });

  // 1. Check Unassigned Shifts
  for (const item of ranges) {
    if (!item.schedule.staffId || item.schedule.staffId.trim() === '') {
      conflicts.push({
        id: `unassigned-${item.schedule.scheduleId}`,
        type: 'unassigned',
        severity: 'critical',
        title: 'Jadwal Belum Ditugaskan',
        description: `Shift ${item.shift?.name || item.schedule.shiftId} pada tanggal ${item.schedule.date} belum memiliki petugas ATLM.`,
        date: item.schedule.date,
        shiftId: item.schedule.shiftId,
        suggestion: 'Tugaskan petugas ATLM yang memenuhi kualifikasi untuk shift ini sebelum menerbitkan jadwal.',
        scheduleIds: [item.schedule.scheduleId],
      });
    }
  }

  // 2. Check Overlapping Shifts and Insufficient Rest for the same staff
  const staffSchedulesMap = new Map<string, typeof ranges>();
  for (const item of ranges) {
    if (!item.schedule.staffId) continue;
    const list = staffSchedulesMap.get(item.schedule.staffId) || [];
    list.push(item);
    staffSchedulesMap.set(item.schedule.staffId, list);
  }

  const MIN_REST_HOURS = 11; // Standar istirahat minimal antar shift di rumah sakit
  const MIN_REST_MS = MIN_REST_HOURS * 60 * 60 * 1000;

  for (const [staffId, staffItems] of staffSchedulesMap.entries()) {
    const staff = staffMap.get(staffId);
    const staffName = staff ? staff.fullName : `Petugas (${staffId})`;

    // Sort chronologically by start time
    staffItems.sort((a, b) => a.startMs - b.startMs);

    for (let i = 0; i < staffItems.length; i++) {
      for (let j = i + 1; j < staffItems.length; j++) {
        const itemA = staffItems[i];
        const itemB = staffItems[j];

        // A. Overlapping Shifts (Tumpang tindih)
        // Two schedules overlap if itemA starts before itemB ends AND itemA ends after itemB starts
        const isOverlap = itemA.startMs < itemB.endMs && itemA.endMs > itemB.startMs;
        if (isOverlap) {
          conflicts.push({
            id: `overlap-${itemA.schedule.scheduleId}-${itemB.schedule.scheduleId}`,
            type: 'overlap',
            severity: 'critical',
            title: 'Jadwal Bentrok (Tumpang Tindih)',
            description: `${staffName} memiliki dua jadwal shift yang bertabrakan waktu: ${itemA.shift?.name} (${itemA.schedule.date}) dan ${itemB.shift?.name} (${itemB.schedule.date}).`,
            date: itemA.schedule.date,
            staffId,
            staffName,
            suggestion: `Batalkan atau pindahkan salah satu penugasan shift milik ${staffName} ke petugas ATLM lain.`,
            scheduleIds: [itemA.schedule.scheduleId, itemB.schedule.scheduleId],
          });
        } else {
          // B. Insufficient Rest / Back-to-Back Shifts (Kurang waktu istirahat)
          // Specifically if itemA ends and itemB starts in less than MIN_REST_MS
          const restTimeMs = itemB.startMs - itemA.endMs;
          if (restTimeMs >= 0 && restTimeMs < MIN_REST_MS) {
            const restHours = Math.round((restTimeMs / (1000 * 60 * 60)) * 10) / 10;
            conflicts.push({
              id: `rest-${itemA.schedule.scheduleId}-${itemB.schedule.scheduleId}`,
              type: 'insufficient_rest',
              severity: 'warning',
              title: 'Waktu Istirahat Kurang',
              description: `${staffName} hanya memiliki waktu istirahat ${restHours} jam antara shift ${itemA.shift?.name} (selesai ${new Date(itemA.endMs).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}) dan shift ${itemB.shift?.name} (mulai ${new Date(itemB.startMs).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}). Minimal istirahat adalah ${MIN_REST_HOURS} jam.`,
              date: itemB.schedule.date,
              staffId,
              staffName,
              suggestion: `Hindari menugaskan shift pagi langsung setelah shift malam (21:00-07:00). Berikan jeda libur pasca jaga malam atau alihkan ke shift sore/petugas lain.`,
              scheduleIds: [itemA.schedule.scheduleId, itemB.schedule.scheduleId],
            });
          }
        }
      }
    }
  }

  // 3. Check Approved Leave Conflicts (Petugas dijadwalkan saat cuti/izin)
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  for (const item of ranges) {
    if (!item.schedule.staffId) continue;
    const matchingLeave = approvedLeaves.find(l => {
      if (l.staffId !== item.schedule.staffId) return false;
      const schedDate = item.schedule.date;
      return schedDate >= l.startDate && schedDate <= l.endDate;
    });

    if (matchingLeave) {
      const staff = staffMap.get(item.schedule.staffId);
      const staffName = staff?.fullName || item.schedule.staffId;
      conflicts.push({
        id: `leave-${item.schedule.scheduleId}-${matchingLeave.requestId}`,
        type: 'on_leave',
        severity: 'critical',
        title: 'Petugas Sedang Cuti / Izin',
        description: `${staffName} telah disetujui ${matchingLeave.leaveType.replace('_', ' ').toUpperCase()} dari tanggal ${matchingLeave.startDate} sampai ${matchingLeave.endDate}, namun masih dijadwalkan pada ${item.schedule.date} (${item.shift?.name}).`,
        date: item.schedule.date,
        staffId: item.schedule.staffId,
        staffName,
        suggestion: `Ganti penugasan ${staffName} dengan petugas pengganti yang tidak sedang cuti.`,
        scheduleIds: [item.schedule.scheduleId],
      });
    }
  }

  // 4. Check Understaffed Shifts (Petugas kurang dari minimum kebutuhan)
  // Group by date & shiftId
  const dateShiftCount = new Map<string, { count: number; date: string; shiftId: string; scheduleIds: string[] }>();
  for (const item of ranges) {
    if (!item.schedule.staffId) continue;
    const key = `${item.schedule.date}_${item.schedule.shiftId}`;
    const entry = dateShiftCount.get(key) || {
      count: 0,
      date: item.schedule.date,
      shiftId: item.schedule.shiftId,
      scheduleIds: [],
    };
    entry.count += 1;
    entry.scheduleIds.push(item.schedule.scheduleId);
    dateShiftCount.set(key, entry);
  }

  // Also check if any shift on that date has 0 staff
  const distinctDates = Array.from(new Set(activeSchedules.map(s => s.date)));
  for (const d of distinctDates) {
    for (const shift of shifts) {
      if (!shift.active) continue;
      const key = `${d}_${shift.shiftId}`;
      const entry = dateShiftCount.get(key);
      const currentStaffCount = entry ? entry.count : 0;
      const minRequired = shift.minimumStaff || 1;

      if (currentStaffCount < minRequired) {
        conflicts.push({
          id: `understaffed-${d}-${shift.shiftId}`,
          type: 'understaffed',
          severity: 'warning',
          title: 'Kekurangan Tenaga Shift',
          description: `Shift ${shift.name} pada ${d} hanya memiliki ${currentStaffCount} dari kuota minimum ${minRequired} petugas ATLM.`,
          date: d,
          shiftId: shift.shiftId,
          suggestion: `Tambahkan minimal ${minRequired - currentStaffCount} petugas ATLM lagi untuk memenuhi standar pelayanan laboratorium RSUD Sultan Muhammad Jamaludin I.`,
          scheduleIds: entry ? entry.scheduleIds : [],
        });
      }
    }
  }

  return conflicts;
}
