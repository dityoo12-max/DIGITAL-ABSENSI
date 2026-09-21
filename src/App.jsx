import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const scannerConfig = {
  fps: 10,
  qrbox: { width: 320, height: 160 },
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
  ],
};

function App() {
  const [scanMessage, setScanMessage] = useState("Menunggu pemindaian...");
  const [statusColor, setStatusColor] = useState("text-gray-500");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  
  const isProcessing = useRef(false);
  const scannerRef = useRef(null);
  const scanSuccessHandlerRef = useRef(null);

  const showCameraError = (error) => {
    const message = error?.name === "NotAllowedError"
      ? "Izin kamera ditolak. Izinkan kamera di browser lalu coba lagi."
      : "Kamera tidak dapat digunakan. Pastikan webcam tidak sedang dipakai aplikasi lain.";

    setScanMessage(message);
    setStatusColor("text-red-600");
  };

  useEffect(() => {
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
        } catch {
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
      } catch {
        setScanMessage("Gagal terhubung ke server Back-End.");
        setStatusColor("text-red-600");
      }

      setTimeout(() => {
        isProcessing.current = false;
        setScanMessage("Menunggu pemindaian...");
        setStatusColor("text-gray-500");
      }, 3000);
    };

    scanSuccessHandlerRef.current = onScanSuccess;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startCamera = async (cameraId) => {
      if (scanner.isScanning) return;

      try {
        await scanner.start(
          cameraId || { facingMode: "user" },
          scannerConfig,
          scanSuccessHandlerRef.current,
          () => {},
        );
        setIsCameraRunning(true);
        setScanMessage("Kamera aktif. Arahkan QR code ke kamera.");
        setStatusColor("text-gray-500");
      } catch (error) {
        showCameraError(error);
      }
    };

    const loadCameras = async () => {
      try {
        const availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras);

        if (availableCameras.length > 0) {
          const cameraId = availableCameras[0].id;
          setSelectedCamera(cameraId);
          await startCamera(cameraId);
        } else {
          await startCamera();
        }
      } catch (error) {
        showCameraError(error);
      }
    };

    loadCameras();

    return () => {
      if (scanner.isScanning) {
        Promise.resolve(scanner.stop()).catch(() => {});
      }
      Promise.resolve(scanner.clear()).catch(() => {});
    };
  }, []);

  const changeCamera = async (event) => {
    const cameraId = event.target.value;
    setSelectedCamera(cameraId);

    if (!scannerRef.current || !cameraId) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.start(
        cameraId,
        scannerConfig,
        scanSuccessHandlerRef.current,
        () => {},
      );
      setIsCameraRunning(true);
    } catch (error) {
      showCameraError(error);
    }
  };

  const toggleCamera = async () => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsCameraRunning(false);
        setScanMessage("Kamera berhenti.");
      } else {
        await scannerRef.current.start(
          selectedCamera || { facingMode: "user" },
          scannerConfig,
          scanSuccessHandlerRef.current,
          () => {},
        );
        setIsCameraRunning(true);
        setScanMessage("Kamera aktif. Arahkan QR code ke kamera.");
      }
    } catch (error) {
      showCameraError(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Bagian Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Digital Absensi</h1>
          <p className="text-sm text-gray-500">Arahkan QR code atau barcode siswa ke kamera</p>
        </div>

        {/* Area Scanner */}
        <div className="rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 mb-6 relative">
          <div id="reader" className="w-full"></div>
        </div>

        <div className="flex gap-2 mb-6">
          {cameras.length > 1 && (
            <select
              value={selectedCamera}
              onChange={changeCamera}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              aria-label="Pilih kamera"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || "Kamera laptop"}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={toggleCamera}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            {isCameraRunning ? "Matikan kamera" : "Nyalakan kamera"}
          </button>
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