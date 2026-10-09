import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  X,
  Lightbulb,
  Calendar,
  User,
  ArrowRight,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { ScheduleConflict } from '../types';
import { labStore } from '../services/store';

interface ConflictModalProps {
  conflicts: ScheduleConflict[];
  onClose: () => void;
  onSelectScheduleForEdit?: (scheduleId: string) => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflicts,
  onClose,
  onSelectScheduleForEdit,
}) => {
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini untuk menyelesaikan bentrok?')) {
      labStore.deleteSchedule(scheduleId, 'Dihapus untuk menyelesaikan bentrok jadwal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[22px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E7EAE4] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#202B2A] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${criticalCount > 0 ? 'bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/40' : 'bg-[#D99A22]/20 text-[#D99A22] border border-[#D99A22]/40'}`}>
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFFAD3] bg-white/10 px-2 py-0.5 rounded">
                  Engine Validasi RSUD SMJ I
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5">
                Deteksi Bentrok Jadwal Shift Laboratorium
              </h2>
              <p className="text-xs text-[#8E9B98]">
                Pemeriksaan otomatis tumpang tindih waktu, jeda istirahat minimum, kuota jaga, dan cuti petugas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8E9B98] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict Summary Ribbon */}
        <div className="px-6 py-3 bg-[#F8F9F7] border-b border-[#E7EAE4] flex flex-wrap items-center gap-3 text-xs">
          <div className="font-bold text-[#202B2A]">Status Validasi:</div>
          {criticalCount > 0 ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FDF2F2] text-[#D9534F] font-bold border border-[#D9534F]/30">
              <span className="w-2 h-2 rounded-full bg-[#D9534F] animate-ping" />
              <span>{criticalCount} Bentrok Kritis (Wajib Diselesaikan)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EBF7F1] text-[#21865B] font-bold border border-[#21865B]/30">
              <CheckCircle className="w-3.5 h-3.5 text-[#21865B]" />
              <span>Bebas Bentrok Kritis</span>
            </span>
          )}

          {warningCount > 0 && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#FEF8EC] text-[#D99A22] font-bold border border-[#D99A22]/30">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D99A22]" />
              <span>{warningCount} Peringatan Operasional</span>
            </span>
          )}
        </div>

        {/* Conflict List Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {conflicts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-[#EBF7F1] text-[#21865B] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#21865B]/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-[#202B2A] text-base">Jadwal Bersih & Bebas Bentrok</h3>
              <p className="text-xs text-[#687572] max-w-sm mx-auto mt-1">
                Semua jadwal shift telah memenuhi aturan: tidak ada tumpang tindih waktu, waktu istirahat pasca jaga malam mencukupi, dan kuota pelayanan terpenuhi.
              </p>
            </div>
          ) : (
            conflicts.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-[18px] border text-xs space-y-3 transition-colors ${
                  item.severity === 'critical'
                    ? 'bg-[#FDF2F2]/60 border-[#D9534F]/30'
                    : 'bg-[#FEF8EC]/60 border-[#D99A22]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    {item.severity === 'critical' ? (
                      <div className="p-1.5 bg-[#D9534F] text-white rounded-lg mt-0.5">
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-[#D99A22] text-white rounded-lg mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-[#202B2A] text-sm">
                        {item.title}
                      </div>
                      <p className="text-[#687572] mt-0.5 text-xs">{item.description}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      item.severity === 'critical'
                        ? 'bg-[#D9534F] text-white border-transparent'
                        : 'bg-[#D99A22] text-white border-transparent'
                    }`}
                  >
                    {item.severity === 'critical' ? 'Kritis' : 'Peringatan'}
                  </span>
                </div>

                {/* Conflict Metadata Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-black/5 text-[#687572] text-[11px]">
                  {item.staffName && (
                    <div className="flex items-center space-x-1 font-semibold text-[#202B2A]">
                      <User className="w-3.5 h-3.5 text-[#176B62]" />
                      <span>{item.staffName}</span>
                    </div>
                  )}
                  {item.date && (
                    <div className="flex items-center space-x-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#176B62]" />
                      <span>{item.date}</span>
                    </div>
                  )}
                </div>

                {/* Recommendation Box with #FFFAD3 Accent */}
                {item.suggestion && (
                  <div className="flex items-start space-x-2 bg-[#FFFAD3] p-3 rounded-xl border border-[#F5EEB0] text-[#202B2A]">
                    <Lightbulb className="w-4 h-4 text-[#D99A22] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-[11px] block">Rekomendasi Solusi:</span>
                      <span className="text-xs">{item.suggestion}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons if schedules are attached */}
                {item.scheduleIds && item.scheduleIds.length > 0 && (
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {item.scheduleIds.map((scId: string, idx: number) => (
                      <button
                        key={scId}
                        onClick={() => handleDeleteSchedule(scId)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FDF2F2] border border-[#D9534F]/30 text-[#D9534F] rounded-lg font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Jadwal #{idx + 1}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F9F7] border-t border-[#E7EAE4] flex items-center justify-between">
          <span className="text-[11px] text-[#687572]">
            Total {conflicts.length} temuan pada kalender shift berjalan
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Selesai Meninjau
          </button>
        </div>
      </div>
    </div>
  );
};
