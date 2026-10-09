import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  Eye,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import { AuditLog, UserAccount } from '../types';
import { labStore } from '../services/store';

interface AuditLogViewProps {
  currentUser: UserAccount;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const auditLogs = labStore.getAuditLogs();

  const filteredLogs = auditLogs.filter(log => {
    return (
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.logId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="clinical-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176B62] bg-[#E8F4F2] px-2.5 py-0.5 rounded-full border border-[#E7EAE4]">
              Tata Kelola & Kepatuhan
            </span>
            <span className="text-[10px] font-extrabold text-[#202B2A] bg-[#FFFAD3] px-2 py-0.5 rounded-md border border-[#F5EEB0]">
              Audit Trail Imutabel
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-[#202B2A] tracking-tight flex items-center space-x-2 mt-1">
            <History className="w-5 h-5 text-[#176B62]" />
            <span>Jejak Audit Aktivitas & Perubahan Sistem</span>
          </h2>
          <p className="text-xs text-[#687572] mt-0.5">
            Log permanen mutasi jadwal, penerbitan, tukar shift, serah terima, dan koreksi presensi
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#202B2A] bg-[#FFFAD3]/60 px-3.5 py-2 rounded-xl border border-[#F5EEB0] shrink-0 font-bold">
          <ShieldCheck className="w-4 h-4 text-[#176B62]" />
          <span>Integritas Log: Terproteksi</span>
        </div>
      </div>

      {/* 2. Search Ribbon */}
      <div className="clinical-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8E9B98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas berdasarkan nama personil, jenis tindakan, atau alasan..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9F7] border border-[#E7EAE4] rounded-xl text-xs text-[#202B2A] font-semibold focus:bg-white focus:outline-[#176B62]"
          />
        </div>
      </div>

      {/* 3. Logs Table */}
      <div className="clinical-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9F7] border-b border-[#E7EAE4] text-[#202B2A] font-extrabold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pelaku / Pengguna</th>
                <th className="py-3 px-4">Jenis Tindakan</th>
                <th className="py-3 px-4">Entitas Terkait</th>
                <th className="py-3 px-4">Alasan / Catatan</th>
                <th className="py-3 px-4 text-right">Rincian Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EAE4]">
              {filteredLogs.map(log => (
                <tr key={log.logId} className="hover:bg-[#F8F9F7]/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[#687572] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-[#202B2A]">{log.actorName}</div>
                    <div className="text-[10px] text-[#8E9B98] font-mono">{log.actorId}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 bg-[#FFFAD3] text-amber-950 rounded-md border border-[#F5EEB0]">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#687572]">
                    {log.entityType} {log.entityId ? <span className="text-[#8E9B98]">({log.entityId.slice(0, 8)}...)</span> : null}
                  </td>
                  <td className="py-3.5 px-4 text-[#202B2A] max-w-sm truncate">
                    {log.reason || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 text-[11px] bg-[#F8F9F7] hover:bg-[#E8F4F2] border border-[#E7EAE4] text-[#176B62] rounded-lg font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspeksi</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2A]/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[22px] max-w-lg w-full p-6 shadow-2xl border border-[#E7EAE4]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EAE4]">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#176B62]" />
                <h3 className="font-extrabold text-base text-[#202B2A]">
                  Rincian Bukti Audit Log #{selectedLog.logId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#8E9B98] hover:text-[#202B2A] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#F8F9F7] rounded-xl border border-[#E7EAE4]">
                <div>
                  <span className="text-[#687572] block text-[10px] font-bold">Waktu Eksekusi:</span>
                  <strong className="text-[#202B2A] font-mono">{new Date(selectedLog.createdAt).toLocaleString('id-ID')} WIB</strong>
                </div>
                <div>
                  <span className="text-[#687572] block text-[10px] font-bold">Pelaku Tindakan:</span>
                  <strong className="text-[#202B2A]">{selectedLog.actorName}</strong>
                </div>
                <div>
                  <span className="text-[#687572] block text-[10px] font-bold">Jenis Tindakan:</span>
                  <strong className="text-[#176B62] font-mono">{selectedLog.actionType}</strong>
                </div>
                <div>
                  <span className="text-[#687572] block text-[10px] font-bold">Entitas Target:</span>
                  <strong className="text-[#202B2A] font-mono">{selectedLog.entityType} {selectedLog.entityId ? `(${selectedLog.entityId})` : ''}</strong>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-3 bg-[#FFFAD3]/70 rounded-xl border border-[#F5EEB0]">
                  <span className="text-[#687572] block text-[10px] font-bold">Alasan / Justifikasi:</span>
                  <p className="text-[#202B2A] mt-0.5 font-medium">{selectedLog.reason}</p>
                </div>
              )}

              {(selectedLog.beforeData || selectedLog.afterData) && (
                <div>
                  <span className="font-bold text-[#202B2A] block mb-1">Payload Perubahan (Sebelum / Sesudah):</span>
                  <pre className="p-3 bg-[#202B2A] text-[#FFFAD3] rounded-xl text-[10px] font-mono overflow-x-auto max-h-48">
                    {JSON.stringify({ before: selectedLog.beforeData, after: selectedLog.afterData }, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-[#E7EAE4]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#176B62] hover:bg-[#12554E] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
