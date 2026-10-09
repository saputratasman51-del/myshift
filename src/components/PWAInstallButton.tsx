import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-[#176B62] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#12554E] transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Install Aplikasi
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-[#E7EAE4] bg-white px-4 py-2 text-xs font-bold text-[#202B2A] hover:bg-[#F8F9F7] transition-colors cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          Install di iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202B2A]/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E7EAE4]">
              <h3 className="font-bold text-base text-[#202B2A]">Install di iPhone / iPad</h3>
              <p className="mt-2 text-xs text-[#687572] leading-relaxed">
                1. Tap tombol <strong>Share</strong> di toolbar Safari.<br />
                2. Gulir ke bawah dan tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#F8F9F7] py-2 text-xs font-bold text-[#202B2A] hover:bg-[#E7EAE4] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
