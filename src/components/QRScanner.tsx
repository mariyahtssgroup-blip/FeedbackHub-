import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';

export const QRScanner = ({ onScanSuccess, onScanFailure }: { onScanSuccess: (decodedText: string) => void, onScanFailure?: (error: any) => void }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    if (!scannerRef.current || isStartedRef.current) return;
    isStartedRef.current = true;
    
    const scannerId = "qr-reader";
    const html5Qrcode = new Html5Qrcode(scannerId);
    
    const startScanner = async () => {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      
      const onScan = (decodedText: string) => {
        if (html5Qrcode.isScanning) {
          html5Qrcode.stop().then(() => {
            onScanSuccess(decodedText);
          }).catch(err => console.error("Failed to stop scanner", err));
        } else {
          onScanSuccess(decodedText);
        }
      };

      const onError = (errorMessage: string) => {
        if (onScanFailure) onScanFailure(errorMessage);
      };

      try {
        await html5Qrcode.start({ facingMode: "environment" }, config, onScan, onError);
      } catch (err) {
        console.warn("Kamera belakang tidak ditemukan, mencoba kamera depan...", err);
        try {
          await html5Qrcode.start({ facingMode: "user" }, config, onScan, onError);
        } catch (err2) {
          console.error("Error starting scanner", err2);
          toast.error("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera pada browser Anda.");
        }
      }
    };

    startScanner();

    return () => {
      isStartedRef.current = false;
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(err => console.error("Failed to stop on unmount", err));
      }
    };
  }, []);

  return <div id="qr-reader" ref={scannerRef} className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white min-h-[300px] flex items-center justify-center text-gray-400" />
};
