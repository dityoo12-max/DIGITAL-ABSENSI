import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function App() {
  const [scanMessage, setScanMessage] = useState("Menunggu pemindaian...");
  const [statusColor, setStatusColor] = useState("text-gray-500");
  
  const isProcessing = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText) => {
      if (isProcessing.current) return; 
      
      isProcessing.current = true;
      setScanMessage(`Memproses data...`);
      setStatusColor("text-blue-600");

      try {
        // Menyiapkan data yang akan dikirim (ID dan Nama)
        let payloadData = { waktu: new Date().toISOString() };

        try {
          // Jika QR Code berisi format JSON (Contoh: {"id": "1", "nama": "Budi"})
          const parsedData = JSON.parse(decodedText);
          payloadData.id = parsedData.id;
          payloadData.nama = parsedData.nama;
        } catch (e) {
          // Jika QR Code HANYA teks biasa/ID saja (Contoh: "101")
          payloadData.id = decodedText;
          payloadData.nama = "Nama tidak ada di QR"; // Info ini dikirim jika QR tidak punya nama
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/absensi';
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Mengirim payloadData (berisi id, nama, dan waktu) ke Back-End
          body: JSON.stringify(payloadData), 
        });

        if (response.ok) {
          // Tampilkan nama siswa di layar jika ada, atau ID jika nama tidak tersedia di QR
          setScanMessage(`Berhasil Absen: ${payloadData.nama !== "Nama tidak ada di QR" ? payloadData.nama : payloadData.id}`);
          setStatusColor("text-green-600");
        } else {
          setScanMessage(`Gagal Absen: Ditolak oleh server`);
          setStatusColor("text-red-600");
        }
      } catch (error) {
        setScanMessage("Gagal terhubung ke server Back-End.");
        setStatusColor("text-red-600");
      }

      setTimeout(() => {
        isProcessing.current = false;
        setScanMessage("Menunggu pemindaian...");
        setStatusColor("text-gray-500");
      }, 3000);
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(err => console.error("Gagal membersihkan scanner", err));
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Bagian Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Digital Absensi</h1>
          <p className="text-sm text-gray-500">Arahkan kartu QR code siswa ke kamera</p>
        </div>

        {/* Area Scanner */}
        <div className="rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 mb-6 relative">
          <div id="reader" className="w-full"></div>
        </div>

        {/* Indikator Status */}
        <div className={`text-center font-medium text-lg px-4 py-3 rounded-lg bg-gray-50/50 ${statusColor}`}>
          {scanMessage}
        </div>
        
      </div>
    </div>
  );
}

export default App;