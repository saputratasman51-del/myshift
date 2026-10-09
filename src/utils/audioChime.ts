/**
 * Web Audio API Hospital Shift Chime & Alarm Generator
 * RSUD Sultan Muhammad Jamaludin I Kayong Utara
 * Menghasilkan nada lonceng/chime pengingat klinis yang lembut dan elegan
 * tanpa dependensi file audio eksternal.
 */

let audioCtx: AudioContext | null = null;
let alarmIntervalId: number | null = null;
let isChimePlaying = false;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Memainkan satu putaran nada Chime Klinis Rumah Sakit (Melodic Tri-tone)
 * Frekuensi: A5 (880Hz), C#6 (1108.7Hz), E6 (1318.5Hz) yang tenang namun tegas
 */
export function playSingleChimeTone(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.5 }, // E5
    { freq: 880.0, time: 0.22, dur: 0.6 }, // A5
    { freq: 1108.73, time: 0.44, dur: 0.8 }, // C#6
  ];

  notes.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + time);

    // Envelope bell-like: quick attack, smooth exponential decay
    gain.gain.setValueAtTime(0.0001, now + time);
    gain.gain.exponentialRampToValueAtTime(0.25, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Memulai alarm berkala (berbunyi setiap 3.2 detik sampai dihentikan)
 */
export function startShiftAlarm(onTick?: () => void): boolean {
  try {
    stopShiftAlarm();
    isChimePlaying = true;
    playSingleChimeTone();
    if (onTick) onTick();

    alarmIntervalId = window.setInterval(() => {
      if (!isChimePlaying) {
        stopShiftAlarm();
        return;
      }
      playSingleChimeTone();
      if (onTick) onTick();
    }, 3200);

    return true;
  } catch (err) {
    console.warn('Gagal memulai audio alarm:', err);
    return false;
  }
}

/**
 * Menghentikan alarm suara
 */
export function stopShiftAlarm(): void {
  isChimePlaying = false;
  if (alarmIntervalId !== null) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

/**
 * Status apakah alarm saat ini sedang aktif berbunyi
 */
export function isAlarmActive(): boolean {
  return isChimePlaying;
}
