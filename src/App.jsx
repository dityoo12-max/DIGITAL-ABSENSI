import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function App() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Konfigurasi dan inisialisasi scanner kamera
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    // Fungsi yang berjalan saat QR Code berhasil terbaca
    const onScanSuccess = (decodedText) => {
      setScanResult(decodedText);
      // Catatan: Di sinilah nanti Anda mengirim 'decodedText' ke API teman Anda (Back-End)
    };

    const onScanFailure = (error) => {
      // Dibiarkan kosong agar tidak spam error saat kamera mencari QR code
    };

    scanner.render(onScanSuccess, onScanFailure);

    // Membersihkan scanner saat halaman ditutup atau berpindah
    return () => {
      scanner.clear().catch(err => console.error("Gagal membersihkan scanner", err));
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Absensi Digital Kelas</h1>
      <p>Silakan arahkan kartu QR code siswa ke kamera tablet.</p>

      {/* Area kamera akan dirender di dalam div ini */}
      <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>

      {/* Menampilkan hasil pindaian */}
      <div style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
        {scanResult ? (
          <span style={{ color: 'green' }}>Berhasil Absen: {scanResult}</span>
        ) : (
          <span style={{ color: 'gray' }}>Menunggu pemindaian...</span>
        )}
      </div>
    </div>
  );
}

export default App;