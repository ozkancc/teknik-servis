'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

type Props = {
  onScan: (result: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    startScanner()
    return () => { stopScanner() }
  }, [])

  async function startScanner() {
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      setScanning(true)

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      if (devices.length === 0) {
        setError('Kamera bulunamadı')
        return
      }

      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('arka') ||
        d.label.toLowerCase().includes('environment')
      ) ?? devices[devices.length - 1]

      await reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            onScan(result.getText())
            stopScanner()
          }
        }
      )
    } catch (e) {
      setError('Kamera açılamadı. Kamera iznini kontrol edin.')
      setScanning(false)
    }
  }

  function stopScanner() {
    if (readerRef.current) {
      BrowserMultiFormatReader.releaseAllStreams()
      readerRef.current = null
    }
    setScanning(false)
  }

  function handleClose() {
    stopScanner()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#1a1a1a] rounded-2xl overflow-hidden w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-white text-sm font-medium">Seri No Okut</p>
          <button onClick={handleClose} className="text-[#555] hover:text-white transition text-lg">✕</button>
        </div>

        {/* Kamera */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} className="w-full h-full object-cover" />

          {/* Tarama çerçevesi */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-32">
                {/* Köşeler */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br" />
                {/* Tarama çizgisi animasyonu */}
                <div className="absolute left-0 right-0 h-0.5 bg-blue-400/70 animate-scan" style={{
                  animation: 'scan 2s linear infinite',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Alt bilgi */}
        <div className="px-4 py-3">
          {error ? (
            <p className="text-red-400 text-xs text-center">{error}</p>
          ) : (
            <p className="text-[#555] text-xs text-center">
              Barkodu veya QR kodu çerçeve içine getirin
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
      `}</style>
    </div>
  )
}