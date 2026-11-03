import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMsg(null);
    setCapturedBlobUrl(null);
    setCapturedFile(null);

    const initCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (isMounted) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'Unable to access camera. Check browser permissions.');
        }
      }
    };

    initCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  const handleStopAndClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCapturedBlobUrl(null);
    setCapturedFile(null);
    onClose();
  };

  const handleSnap = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `battery_photo_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlobUrl(previewUrl);
        setCapturedFile(file);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      handleStopAndClose();
    }
  };

  const handleRetake = () => {
    setCapturedBlobUrl(null);
    setCapturedFile(null);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {capturedBlobUrl ? 'Preview Product Photo' : 'Capture Product Photo'}
            </h3>
          </div>
          <button
            onClick={handleStopAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera or Preview Viewport */}
        <div className="relative bg-black min-h-[360px] flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center text-white">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Camera Unavailable</p>
              <p className="text-xs text-slate-400 mb-4">{errorMsg}</p>
              <button
                onClick={handleStopAndClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          ) : capturedBlobUrl ? (
            <img
              src={capturedBlobUrl}
              alt="Captured"
              className="w-full max-h-[420px] object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-h-[420px] object-cover"
              />
              {/* Product framing guide overlay */}
              <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-end justify-center p-2">
                <span className="text-[11px] bg-black/60 text-white/90 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Frame battery within box
                </span>
              </div>
            </>
          )}

          {/* Switch camera button */}
          {!capturedBlobUrl && !errorMsg && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition"
              title="Switch Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {capturedBlobUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStopAndClose}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSnap}
                disabled={!!errorMsg}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                <span>Snap Photo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
