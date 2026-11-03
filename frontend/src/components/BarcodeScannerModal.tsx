import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Flashlight, AlertCircle } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Battery Barcode / QR Code',
  subtitle = 'Point camera at the battery barcode or part number',
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-barcode-reader';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMsg(null);

    // Initialize scanner
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF,
          ],
          verbose: false,
        });

        scannerRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              // Play a quick pleasant audio beep if audio context is available
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
              } catch (_) {}

              onScan(decodedText.trim());
              handleStopAndClose();
            }
          },
          () => {
            // Frame callback (ignore errors during searching)
          }
        );

        // Check if torch/flashlight is supported
        try {
          const capabilities = scanner.getRunningTrackCapabilities() as any;
          if (capabilities && 'torch' in capabilities) {
            setHasTorch(true);
          }
        } catch (_) {}
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'Unable to access camera. Please ensure camera permissions are granted.');
        }
      }
    };

    // Small delay to ensure DOM element is rendered
    const timeout = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        }).catch(() => {});
      }
    };
  }, [isOpen]);

  const handleStopAndClose = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (_) {}
    scannerRef.current = null;
    onClose();
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleStopAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[320px] relative">
          <div
            id={readerElementId}
            className="w-full max-w-[340px] overflow-hidden rounded-xl bg-black"
          />

          {errorMsg && (
            <div className="absolute inset-4 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 rounded-xl">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-white text-xs font-semibold mb-2">Camera Access Error</p>
              <p className="text-slate-400 text-xs mb-4">{errorMsg}</p>
              <button
                onClick={handleStopAndClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          )}

          {/* Flashlight toggle */}
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`absolute bottom-6 right-6 p-3 rounded-full shadow-lg transition ${
                torchOn ? 'bg-amber-500 text-white' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Footer tips */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Align barcode inside the central red box</span>
          <button
            onClick={handleStopAndClose}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md font-medium text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

