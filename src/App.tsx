import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { motion, AnimatePresence } from 'motion/react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { QRScanner } from './components/QRScanner';
import { 
  Lock, Settings, Plus, Users, Star, MessageSquare, 
  ChevronRight, ArrowLeft, Download, Mic, QrCode, Camera, CheckCircle, 
  Lightbulb, Copy, X, Trash2, BookOpen, Search, Moon, Sun
} from 'lucide-react';

// Panduan Warna IWDemy
const COLORS = {
  mustard: '#FCB528',
  orange: '#FF9900',
  black: '#000000',
  grey: '#6A6A6A',
  silver: '#EFEFEF',
  white: '#FFFFFF',
  blue: '#005287',
  green: '#1B8040',
  darkRed: '#660000',
};

// Komponen Logo Kecil Reusable
const SmallLogos = ({ className = '' }) => (
  <div className={`flex items-center gap-3 md:gap-4 ${className}`}>
    <img 
      src="/logo_tjitra.png" 
      alt="Logo Tjitra" 
      className="h-6 md:h-8 w-auto object-contain"
    />
    <div className="w-px h-6 md:h-8 bg-gray-300 rounded-full"></div>
    <img 
      src="/logo_iwdemy.jpeg" 
      alt="Logo IWDemy" 
      className="h-6 md:h-8 w-auto object-contain"
    />
  </div>
);

// Data 10 Prompt Cheatsheet Premium
const PREMIUM_PROMPTS = [
  { title: "Menulis Email Sulit / Komplain", prompt: "Bertindaklah sebagai [Jabatan Anda]. Tulis email balasan kepada [Nama Klien] yang mengeluhkan [Sebutkan Masalah]. Jelaskan bahwa tim kami sedang menanganinya secara prioritas. Nada: Empati, profesional, dan solutif. Format: Maksimal 3 paragraf." },
  { title: "Notulen Rapat Terstruktur", prompt: "Bertindaklah sebagai Asisten Eksekutif. Rapikan catatan kasar berikut menjadi notulen rapat formal. Kelompokkan menjadi 3 bagian: Poin Diskusi, Keputusan, dan Action Items (beserta Penanggung Jawab dan tenggat waktu). Catatan: [Masukkan Teks]" },
  { title: "Merangkum Dokumen Panjang", prompt: "Baca laporan di bawah ini. Buatkan Executive Summary yang menyoroti 3 masalah utama dan 3 rekomendasi solusi. Format menggunakan bullet points agar mudah dipindai oleh pimpinan. Laporan: [Masukkan Teks]" },
  { title: "Menyusun Kerangka Presentasi", prompt: "Bertindaklah sebagai Analis Bisnis. Buatkan kerangka presentasi [Jumlah] slide untuk topik [Nama Proyek]. Untuk setiap slide, berikan usulan judul dan 3 poin pembicaraan utama yang harus disampaikan." },
  { title: "Membuat Draf SOP Prosedur", prompt: "Buatkan draf awal Standard Operating Procedure (SOP) untuk [Sebutkan Proses]. Gunakan format: Tujuan, Ruang Lingkup, Pihak yang Terlibat, dan Langkah-langkah (bernomor). Nada: Instruksional dan lugas." },
  { title: "Ekstraksi Teks ke Format Tabel", prompt: "Ekstrak semua informasi terkait [Nama, Jabatan, Instansi, dan Kontak] dari teks acak di bawah ini. Sajikan ke dalam tabel yang rapi. Jangan berhalusinasi menambahkan informasi yang tidak ada di dalam teks. Teks: [Masukkan Teks]" },
  { title: "Terjemahan Konteks Korporat", prompt: "Terjemahkan email bahasa [Asal] berikut ke bahasa [Tujuan]. Bertindaklah sebagai penerjemah bisnis profesional. Pastikan istilah teknis korporat diterjemahkan dengan luwes dan tidak kaku. Teks: [Masukkan Teks]" },
  { title: "Pengumuman Internal Tim", prompt: "Tulis draf pengumuman internal grup WhatsApp/Slack mengenai [Pembaruan/Acara]. Buat agar nadanya antusias, santai namun informatif. Gunakan bullet points untuk tanggal penting dan tambahkan emoji secukupnya." },
  { title: "Brainstorming Pemecahan Masalah", prompt: "Tim kami sedang menghadapi tantangan terkait [Sebutkan Masalah]. Berikan 5 ide solusi praktis yang bisa diterapkan di lingkungan kantor. Berikan satu kalimat pro dan kontra untuk setiap ide." },
  { title: "Menyunting & Memoles Proposal", prompt: "Bertindaklah sebagai Editor Profesional. Perbaiki draf teks proposal ini. Koreksi ejaan, perbaiki tata bahasa, dan tingkatkan alur kalimatnya agar terdengar lebih meyakinkan dan berwibawa tanpa mengubah makna aslinya. Teks: [Masukkan Teks]" }
];

const initialMockSessions = [
  {
    id: 1,
    pin: '8829',
    name: 'Pelatihan Kepemimpinan Digital',
    speaker: 'Budi Santoso',
    date: '2023-10-24',
    responsesCount: 45,
    avgRating: 4.8,
    formStructure: [
      { id: 'q1', type: 'rating', label: 'Bagaimana kepuasan Anda terhadap materi?' },
      { id: 'q2', type: 'text', label: 'Apa insight terbesar atau hal baru yang Anda dapatkan dari program ini?' }
    ],
    aiReport: {
      actionableInsight: "Banyak peserta akan langsung menerapkan framework 'Agile Leadership' di rapat mingguan mereka mulai Senin depan.",
      strengths: [
        "Materi sangat relevan dengan tantangan WFH saat ini.",
        "Studi kasus nyata membantu pemahaman.",
        "Pemateri sangat interaktif dan menguasai materi."
      ],
      areasForImprovement: [
        "Durasi diskusi kelompok terlalu singkat.",
        "Sesi roleplay bisa diperbanyak.",
        "Materi presentasi PDF sebaiknya dibagikan H-1."
      ]
    },
    chartData: [
      { name: 'Sangat Puas', count: 30 },
      { name: 'Puas', count: 12 },
      { name: 'Biasa', count: 3 },
      { name: 'Kurang', count: 0 },
    ]
  }
];

const AdminApp = ({ sessions, setSessions, onLogout, isDarkMode, setIsDarkMode }: any) => {
  const [view, setView] = useState('dashboard'); // dashboard, new-session, qr-view, report
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionResponses, setSessionResponses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [sessionToDelete, setSessionToDelete] = useState<{id: string, name: string} | null>(null);
  const [responseToDelete, setResponseToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (view === 'report' && activeSession) {
      const q = query(collection(db, "responses"), where("sessionId", "==", activeSession.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a: any, b: any) => b.submittedAt - a.submittedAt);
        setSessionResponses(loaded);
      });
      return () => unsubscribe();
    }
  }, [view, activeSession]);

  // State for Form Builder
  const [sessionName, setSessionName] = useState('');
  const [sessionSpeaker, setSessionSpeaker] = useState('');
  const [formQuestions, setFormQuestions] = useState([
    { id: 'q1', type: 'rating', label: 'Bagaimana penilaian Anda secara keseluruhan?' },
    { id: 'q2', type: 'text', label: 'Apa insight terbesar atau hal baru yang Anda dapatkan dari program ini?' }
  ]);

  const addQuestion = (type: string) => {
    setFormQuestions([
      ...formQuestions, 
      { id: `q${Date.now()}`, type, label: type === 'rating' ? 'Pertanyaan Rating Baru' : 'Pertanyaan Teks Baru' }
    ]);
  };

  const removeQuestion = (id: string) => {
    // Prevent removing if only 1 left, or force keeping at least one text question
    if (formQuestions.length <= 1) return;
    setFormQuestions(formQuestions.filter(q => q.id !== id));
  };

  const updateQuestionLabel = (id: string, newLabel: string) => {
    setFormQuestions(formQuestions.map(q => q.id === id ? { ...q, label: newLabel } : q));
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;
    
    const newSession = {
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      name: sessionName,
      speaker: sessionSpeaker || 'Tidak disebut',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      responsesCount: 0,
      avgRating: 0,
      formStructure: formQuestions,
      aiReport: null,
      chartData: [
        { name: 'Sangat Puas', count: 0 },
        { name: 'Puas', count: 0 },
        { name: 'Biasa', count: 0 },
        { name: 'Kurang', count: 0 },
      ]
    };
    
    try {
      const docRef = await addDoc(collection(db, "sessions"), newSession);
      setActiveSession({ id: docRef.id, ...newSession });
      setView('qr-view');
      
      // Reset form
      setSessionName('');
      setSessionSpeaker('');
      setFormQuestions([
        { id: 'q1', type: 'rating', label: 'Bagaimana penilaian Anda secara keseluruhan?' },
        { id: 'q2', type: 'text', label: 'Apa insight terbesar atau hal baru yang Anda dapatkan dari program ini?' }
      ]);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error("Gagal membuat sesi. Periksa koneksi Anda.");
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const { id: sessionId, name: sessionName } = sessionToDelete;
    setSessionToDelete(null); // close modal
    
    try {
      const loadingToast = toast.loading("Menghapus sesi...");
      
      // Hapus semua respons yang terkait dengan sesi ini terlebih dahulu
      const q = query(collection(db, "responses"), where("sessionId", "==", sessionId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, "responses", docSnap.id)));
      await Promise.all(deletePromises);

      // Hapus dokumen sesi utama
      await deleteDoc(doc(db, "sessions", sessionId));
      
      toast.dismiss(loadingToast);
      toast.success("Sesi berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Gagal menghapus sesi.");
    }
  };

  const confirmDeleteResponse = async () => {
    if (!responseToDelete || !activeSession) return;
    const currentSession = sessions.find((s: any) => s.id === activeSession?.id) || activeSession;
    const responseId = responseToDelete;
    setResponseToDelete(null); // close modal
    
    try {
      const loadingToast = toast.loading("Menghapus data...");
      // 1. Hapus dokumen respons
      await deleteDoc(doc(db, "responses", responseId));
      
      // 2. Kalkulasi ulang statistik untuk sesi
      const remainingResponses = sessionResponses.filter(r => r.id !== responseId);
      
      let totalRating = 0;
      let ratingCount = 0;
      let newChartData = [
        { name: 'Sangat Puas', count: 0 },
        { name: 'Puas', count: 0 },
        { name: 'Biasa', count: 0 },
        { name: 'Kurang', count: 0 },
      ];

      remainingResponses.forEach(resp => {
         let userTotalRating = 0;
         let userRatingCount = 0;
         Object.keys(resp.answers).forEach(key => {
           const q = currentSession.formStructure.find((q: any) => q.id === key);
           if (q && q.type === 'rating') {
             const val = parseInt(resp.answers[key], 10);
             userTotalRating += val;
             userRatingCount++;
             totalRating += val;
             ratingCount++;
           }
         });
         
         let userAvg = userRatingCount > 0 ? (userTotalRating / userRatingCount) : 0;
         if (userAvg >= 4.5) newChartData[0].count += 1;
         else if (userAvg >= 3.5) newChartData[1].count += 1;
         else if (userAvg >= 2.5) newChartData[2].count += 1;
         else if (userAvg > 0) newChartData[3].count += 1;
      });

      const newAvg = ratingCount > 0 ? (totalRating / ratingCount) : 0;
      const newResponseCount = remainingResponses.length;

      // 3. Perbarui dokumen sesi
      await updateDoc(doc(db, "sessions", currentSession.id), {
        responsesCount: newResponseCount,
        avgRating: parseFloat(newAvg.toFixed(1)),
        chartData: newChartData
      });

      toast.dismiss(loadingToast);
      toast.success("Respons berhasil dihapus.");
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Gagal menghapus respons.");
    }
  };

  const renderDashboard = () => (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <SmallLogos className="mb-4" />
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: COLORS.blue }}>Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500">IWDemy Feedback Hub</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button 
            onClick={onLogout}
            className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition text-sm sm:text-base"
          >
            Tutup Admin
          </button>
          <button 
            onClick={() => setView('new-session')}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 text-white font-bold rounded-lg transition shadow-md text-sm sm:text-base"
            style={{ backgroundColor: COLORS.orange }}
          >
            <Plus size={20} /> Buat Sesi Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sessions.length === 0 ? (
          <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <BookOpen size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Belum ada sesi</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-sm">Buat sesi pertama Anda untuk mulai mengumpulkan feedback dari peserta.</p>
            <button 
              onClick={() => setView('new-session')}
              className="flex items-center gap-2 px-5 py-3 text-white font-bold rounded-xl transition shadow-md text-sm sm:text-base"
              style={{ backgroundColor: COLORS.orange }}
            >
              <Plus size={20} /> Buat Sesi Sekarang
            </button>
          </div>
        ) : (
          sessions.map((session: any) => (
            <div key={session.id} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition gap-4">
              <div className="max-w-2xl w-full">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 font-black rounded-md text-xs sm:text-sm tracking-widest">
                    PIN: {session.pin}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">{session.date}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 break-words">{session.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">Pemateri: {session.speaker}</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-gray-600">
                  <span className="flex items-center gap-1"><Users size={16} /> {session.responsesCount} Responden</span>
                  <span className="flex items-center gap-1"><Star size={16} style={{color: COLORS.mustard}}/> {session.avgRating} Rata-rata</span>
                </div>
              </div>
              <div className="flex flex-row gap-2 shrink-0 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <button 
                  onClick={() => setSessionToDelete({id: session.id, name: session.name})}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition shrink-0"
                  title="Hapus Sesi"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => { setActiveSession(session); setView('qr-view'); }}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition shrink-0 text-sm sm:text-base"
                  title="Tampilkan Layar QR Saja"
                >
                  <QrCode size={18} /> <span className="hidden sm:inline">Tampilkan QR</span>
                </button>
                <button 
                  onClick={() => { setActiveSession(session); setView('report'); }}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition shrink-0 text-sm sm:text-base"
                >
                  Laporan <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderNewSession = () => (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold mb-2 sm:mb-4">
        <ArrowLeft size={20} /> Kembali
      </button>

      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-black border-b pb-4" style={{ color: COLORS.blue }}>Buat Form Evaluasi Baru</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Sesi / Pelatihan</label>
            <input 
              type="text" 
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Contoh: Design Thinking Workshop"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pemateri (Opsional)</label>
            <input 
              type="text" 
              value={sessionSpeaker}
              onChange={(e) => setSessionSpeaker(e.target.value)}
              placeholder="Contoh: Dr. Budi Santoso"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Susunan Pertanyaan (Form Builder)</h3>
          
          <div className="space-y-4 mb-6">
            {formQuestions.map((q, index) => (
              <div key={q.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex gap-3 items-start relative group">
                <div className="bg-white p-2 border border-gray-300 rounded-lg shrink-0">
                  {q.type === 'rating' ? <Star size={20} className="text-yellow-500" /> : <MessageSquare size={20} className="text-blue-500" />}
                </div>
                <div className="flex-grow">
                  <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    {q.type === 'rating' ? 'Rating 1-5' : 'Teks Panjang / Suara'}
                  </div>
                  <input 
                    type="text"
                    value={q.label}
                    onChange={(e) => updateQuestionLabel(q.id, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 outline-none"
                  />
                </div>
                {formQuestions.length > 1 && (
                  <button 
                    onClick={() => removeQuestion(q.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-6"
                    title="Hapus Pertanyaan"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => addQuestion('rating')}
              className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Tambah Rating
            </button>
            <button 
              onClick={() => addQuestion('text')}
              className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Tambah Teks
            </button>
          </div>
        </div>

        <button 
          onClick={handleCreateSession}
          disabled={!sessionName.trim()}
          className={`w-full py-4 text-white font-black rounded-xl text-lg mt-4 transition shadow-md ${!sessionName.trim() ? 'bg-gray-400 cursor-not-allowed' : 'hover:brightness-110'}`}
          style={{ backgroundColor: sessionName.trim() ? COLORS.blue : undefined }}
        >
          Simpan & Hasilkan Akses Peserta
        </button>
      </div>
    </div>
  );

  const renderQRView = () => (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-4 sm:space-y-6 text-center mt-4 sm:mt-10">
      <h2 className="text-xl sm:text-2xl font-black text-gray-800">Akses Peserta Siap!</h2>
      <p className="text-sm sm:text-base text-gray-600">Tampilkan layar ini di proyektor agar peserta dapat mengakses form evaluasi.</p>
      
      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-lg border-2 border-gray-100 mt-6">
        <div className="mb-6 sm:mb-8">
          <div className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">PIN Akses Manual</div>
          <div className="text-5xl sm:text-7xl font-black tracking-widest" style={{ color: COLORS.blue }}>
            {activeSession?.pin}
          </div>
        </div>
        
        <div className="relative inline-block border-4 border-gray-800 p-2 sm:p-4 rounded-3xl mx-auto">
          <div className="w-32 h-32 sm:w-48 sm:h-48 bg-white flex items-center justify-center"> 
             <QRCodeSVG value={`${window.location.origin}?pin=${activeSession?.pin}`} size={180} />
          </div>
          <div className="absolute -top-3 -left-3 w-6 sm:w-8 h-6 sm:h-8 border-t-8 border-l-8 border-blue-600"></div>
          <div className="absolute -top-3 -right-3 w-6 sm:w-8 h-6 sm:h-8 border-t-8 border-r-8 border-blue-600"></div>
          <div className="absolute -bottom-3 -left-3 w-6 sm:w-8 h-6 sm:h-8 border-b-8 border-l-8 border-blue-600"></div>
          <div className="absolute -bottom-3 -right-3 w-6 sm:w-8 h-6 sm:h-8 border-b-8 border-r-8 border-blue-600"></div>
        </div>
        <div className="text-xs text-gray-500 mt-2 max-w-xs mx-auto break-all">
          <p>Tautan akses:</p>
          <a href={`${window.location.origin}?pin=${activeSession?.pin}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            {`${window.location.origin}?pin=${activeSession?.pin}`}
          </a>
        </div>
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-4 max-w-sm mx-auto border border-amber-200">
          <strong>Catatan:</strong> Jika Anda menguji di mode pengembangan (AI Studio), URL mungkin tidak bisa dibuka di HP Anda. Silakan klik tombol <strong>Share/Bagikan</strong> aplikasi ini terlebih dahulu agar publik bisa mengaksesnya.
        </div>
        <p className="mt-4 sm:mt-6 font-bold text-gray-800 text-base sm:text-lg">{activeSession?.name}</p>
        {activeSession?.speaker && <p className="text-xs sm:text-sm text-gray-500">Pemateri: {activeSession?.speaker}</p>}
      </div>

      <button 
        onClick={() => setView('dashboard')}
        className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200 transition inline-block text-sm sm:text-base"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );

  const renderReport = () => {
    if (!activeSession) return null;
    const currentSession = sessions.find((s: any) => s.id === activeSession?.id) || activeSession;
    
    // Gunakan jumlah terbanyak antara state sesi dan jumlah dokumen riil (menghindari bug spam klik)
    const actualResponseCount = Math.max(currentSession.responsesCount, sessionResponses.length);
    const hasData = actualResponseCount > 0;

    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold">
            <ArrowLeft size={20} /> Kembali ke Dashboard
          </button>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="bg-yellow-100 text-yellow-800 font-bold px-3 sm:px-4 py-2 rounded-lg border border-yellow-200 flex items-center justify-center gap-2 flex-grow sm:flex-grow-0">
              PIN Sesi: <span className="text-lg sm:text-xl tracking-wider">{currentSession.pin}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-1">{currentSession.name}</h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium">Laporan Analisis Evaluasi &bull; {currentSession.date} {currentSession.speaker ? `• Pemateri: ${currentSession.speaker}` : ''}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Stats Cards */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: '#E3F2FD', color: COLORS.blue }}>
              <Users size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-500">Total Responden</p>
              <p className="text-2xl sm:text-3xl font-black">{actualResponseCount}</p>
            </div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 sm:p-4 rounded-xl" style={{ backgroundColor: '#FFF8E1', color: COLORS.orange }}>
              <Star size={28} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-500">Rata-rata Kepuasan</p>
              <p className="text-2xl sm:text-3xl font-black">{currentSession.avgRating} <span className="text-base sm:text-lg text-gray-400">/ 5.0</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:col-span-1">
             <p className="text-sm font-bold text-gray-500 mb-2">Distribusi Angka</p>
             <div className="w-full h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentSession.chartData} margin={{ top: 15, right: 10, left: -25, bottom: -5 }}>
                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#888'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} />
                    <Bar dataKey="count" fill={COLORS.mustard} radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 12, fill: '#333', fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:col-span-1">
             <p className="text-sm font-bold text-gray-500 mb-2">Porsi Kepuasan</p>
             <div className="w-full h-32 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentSession.chartData.filter((d: any) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {currentSession.chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.blue, COLORS.orange, COLORS.mustard, '#E5E7EB'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* AI Analytics Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white flex items-center gap-3">
            <Settings className="animate-spin-slow" size={24} />
            <h3 className="text-xl font-black">AI Summary & Actionable Insights</h3>
          </div>
          <div className="p-6 space-y-6">
            {!hasData ? (
              <div className="text-center py-10 text-gray-400">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p>Belum ada data survei yang masuk untuk dianalisis oleh AI.</p>
              </div>
            ) : (
              <>
                {/* Most Actionable Insight Highlight */}
                {currentSession.aiReport?.actionableInsight && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-xl">
                    <div className="flex items-center gap-2 text-yellow-800 font-bold mb-2">
                      <Lightbulb size={20} className="text-yellow-600" />
                      Insight Paling Aplikatif (Langsung Bisa Diterapkan)
                    </div>
                    <p className="text-gray-800 font-medium leading-relaxed">
                      "{currentSession.aiReport.actionableInsight}"
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="border border-green-100 rounded-xl p-5 bg-green-50/30">
                    <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div> Kekuatan (Yang Sudah Bagus)
                    </h4>
                    <ul className="space-y-3">
                      {currentSession.aiReport?.strengths?.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-gray-700 text-sm">
                          <span className="text-green-500 font-bold">✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-red-100 rounded-xl p-5 bg-red-50/30">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600"></div> Area Evaluasi (Perlu Dikembangkan)
                    </h4>
                    <ul className="space-y-3">
                      {currentSession.aiReport?.areasForImprovement?.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-gray-700 text-sm">
                          <span className="text-red-500 font-bold">!</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Raw Responses Section */}
        {hasData && sessionResponses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <MessageSquare size={24} className="text-gray-600" />
                <h3 className="text-lg sm:text-xl font-black text-gray-800">Semua Jawaban Peserta ({sessionResponses.length})</h3>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="p-0">
              {sessionResponses.filter(resp => 
                Object.values(resp.answers).some((ans: any) => String(ans).toLowerCase().includes(searchQuery.toLowerCase()))
              ).map((resp: any, index: number) => (
                <div key={resp.id} className="p-4 sm:p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
                    <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold w-fit">
                      Responden #{sessionResponses.length - index}
                    </span>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(resp.submittedAt).toLocaleString('id-ID')}
                      </span>
                      <button 
                        onClick={() => setResponseToDelete(resp.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus respons ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {currentSession.formStructure.map((q: any) => (
                      <div key={q.id}>
                        <p className="text-sm font-bold text-gray-500 mb-1">{q.label}</p>
                        <p className="text-sm sm:text-base text-gray-800 font-medium whitespace-pre-wrap break-words">
                          {q.type === 'rating' ? (
                            <span className="flex items-center gap-1 text-orange-500">
                              <Star size={16} fill="currentColor" /> {resp.answers[q.id]} / 5
                            </span>
                          ) : (
                            resp.answers[q.id] || '-'
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-[100dvh] font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {renderDashboard()}
          </motion.div>
        )}
        {view === 'new-session' && (
          <motion.div key="new-session" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {renderNewSession()}
          </motion.div>
        )}
        {view === 'qr-view' && (
          <motion.div key="qr-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {renderQRView()}
          </motion.div>
        )}
        {view === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {renderReport()}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals for Deletion Confirmation */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Sesi?</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus laporan/sesi "{sessionToDelete.name}" beserta semua responsnya?<br/><br/>
              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteSession}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {responseToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Respons?</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus data respons ini?<br/><br/>
              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setResponseToDelete(null)}
                className="px-4 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteResponse} // We need to make confirmDeleteResponse available here. Wait, it's defined inside renderReport!
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ParticipantApp = ({ sessions, setSessions, onRequestAdminLogin, isDarkMode, setIsDarkMode }: any) => {
  const [view, setView] = useState('login'); // login, scanner, survey, thankyou, cheatsheet
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  // Survey State
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin && sessions.length > 0) {
      const session = sessions.find((s: any) => s.pin === urlPin);
      if (session) {
        setPin(urlPin);
        setCurrentSession(session);
        setErrorMsg('');
        setAnswers({});
        setCurrentStep(0);
        setView('survey');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [sessions]);

  const handleLogin = () => {
    const session = sessions.find((s: any) => s.pin === pin);
    if (session) {
      setCurrentSession(session);
      setErrorMsg('');
      setAnswers({});
      setCurrentStep(0);
      setView('survey');
    } else {
      setErrorMsg('PIN tidak ditemukan. Silakan cek kembali.');
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      const urlPin = url.searchParams.get('pin');
      
      if (urlPin) {
        const session = sessions.find((s: any) => s.pin === urlPin);
        if (session) {
          setPin(urlPin);
          setCurrentSession(session);
          setErrorMsg('');
          setAnswers({});
          setCurrentStep(0);
          setView('survey');
        } else {
          toast.error("Sesi tidak ditemukan untuk QR Code tersebut.");
        }
      }
    } catch (e) {
      console.error("Invalid QR code URL", e);
    }
  };

  const toggleRecording = (questionId: string) => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAnswers(prev => ({
          ...prev,
          [questionId]: (prev[questionId] ? prev[questionId] + ' ' : '') + transcript
        }));
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      
      recognition.start();
    } else {
      toast.error("Browser Anda tidak mendukung fitur input suara.");
    }
  };

  const handleNext = () => {
    if (currentStep < currentSession.formStructure.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmitSurvey();
    }
  };

  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    // 1. Calculate new stats
    let totalRating = 0;
    let ratingCount = 0;
    
    Object.keys(answers).forEach(key => {
       const q = currentSession.formStructure.find((q: any) => q.id === key);
       if (q && q.type === 'rating') {
         totalRating += parseInt(answers[key], 10);
         ratingCount++;
       }
    });

    const newResponseCount = currentSession.responsesCount + 1;
    const newAvg = ratingCount > 0 
      ? ((currentSession.avgRating * currentSession.responsesCount) + (totalRating / ratingCount)) / newResponseCount
      : currentSession.avgRating;
      
    // Determine category for chartData
    let userAvg = ratingCount > 0 ? (totalRating / ratingCount) : 0;
    let newChartData = (currentSession.chartData || [
      { name: 'Sangat Puas', count: 0 },
      { name: 'Puas', count: 0 },
      { name: 'Biasa', count: 0 },
      { name: 'Kurang', count: 0 },
    ]).map((item: any) => ({ ...item }));
    
    if (userAvg >= 4.5) newChartData[0].count += 1;
    else if (userAvg >= 3.5) newChartData[1].count += 1;
    else if (userAvg >= 2.5) newChartData[2].count += 1;
    else if (userAvg > 0) newChartData[3].count += 1;
      
    try {
      // 1. Create response doc
      await addDoc(collection(db, "responses"), {
        sessionId: currentSession.id,
        answers: answers,
        submittedAt: Date.now()
      });

      // 2. Update session doc stats immediately
      await updateDoc(doc(db, "sessions", currentSession.id), {
        responsesCount: newResponseCount,
        avgRating: parseFloat(newAvg.toFixed(1)),
        chartData: newChartData
      });

      setView('thankyou');
      setIsSubmitting(false);

      // 3. Background AI report generation (fire and forget)
      fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: currentSession.name,
          currentReport: currentSession.aiReport,
          newAnswers: answers,
          formStructure: currentSession.formStructure
        })
      }).then(async (aiResponse) => {
        if (aiResponse.ok) {
          const newAiReport = await aiResponse.json();
          updateDoc(doc(db, "sessions", currentSession.id), {
            aiReport: newAiReport
          }).catch(console.error);
        }
      }).catch(console.error);

    } catch (e) {
      console.error("Error submitting survey: ", e);
      toast.error("Gagal mengirim feedback. Periksa koneksi Anda.");
      setIsSubmitting(false);
    }
  };

  if (view === 'login') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4 lg:p-8 relative">
        {/* Hidden Admin Trigger */}
        <button 
          onClick={onRequestAdminLogin}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 transition z-50 bg-white/50 backdrop-blur rounded-full shadow-sm"
          title="Login Admin"
        >
          <Lock size={16} />
        </button>

        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          <div className="md:w-1/2 bg-gradient-to-b from-blue-900 to-blue-800 p-10 lg:p-16 text-center text-white flex flex-col justify-center items-center relative">
            <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white p-2 md:p-3 rounded-xl shadow-md">
              <SmallLogos />
            </div>
            <div className="mt-12 sm:mt-0 flex flex-col items-center">
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 mb-6 shadow-lg">
                <BookOpen size={56} className="text-white drop-shadow-md" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-wide mb-3">IWDemy</h1>
              <p className="text-blue-200 text-base lg:text-lg font-medium tracking-wide uppercase">Feedback Hub</p>
            </div>
          </div>
          <div className="md:w-1/2 p-8 lg:p-16 space-y-6 flex flex-col justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">Masuk ke Sesi</h2>
              <p className="text-sm text-gray-500 mt-1">Masukkan PIN dari instruktur Anda</p>
            </div>
            
            <div>
              <input 
                type="text" 
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0,4))}
                placeholder="____"
                className="w-full text-center text-4xl font-black tracking-[0.5em] p-4 border-b-2 border-gray-300 focus:border-blue-600 outline-none transition"
              />
              {errorMsg && <p className="text-red-500 text-sm text-center mt-3 font-bold">{errorMsg}</p>}
            </div>

            <button 
              onClick={handleLogin}
              className="w-full py-4 text-white font-black rounded-xl text-lg transition shadow-md hover:brightness-110 active:translate-y-1"
              style={{ backgroundColor: COLORS.orange }}
            >
              Mulai Evaluasi
            </button>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">ATAU</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button 
              onClick={() => setView('scanner')}
              className="w-full py-4 text-gray-700 bg-gray-100 font-bold rounded-xl text-lg flex justify-center items-center gap-2 hover:bg-gray-200 transition"
            >
              <Camera size={20} /> Scan QR Code
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (view === 'scanner') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="h-[100dvh] bg-black flex flex-col relative">
        <div className="p-4 flex items-center gap-4 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={() => setView('login')} className="p-2"><ArrowLeft size={24} /></button>
          <h2 className="font-bold">Scan QR Code Sesi</h2>
        </div>
        
        <div className="flex-grow flex items-center justify-center relative px-4">
           <QRScanner onScanSuccess={handleQRScanSuccess} />
        </div>

        <div className="p-8 text-center pb-12">
          <p className="text-white/70 mb-6 text-sm">Arahkan kamera ke QR Code yang ada di layar presentasi.</p>
        </div>
      </motion.div>
    );
  }

  if (view === 'survey' && currentSession) {
    const question = currentSession.formStructure[currentStep];
    const isLastStep = currentStep === currentSession.formStructure.length - 1;
    const progress = ((currentStep + 1) / currentSession.formStructure.length) * 100;
    
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-[100dvh] bg-gray-100 flex items-center justify-center p-0 md:p-8">
        <div className="h-[100dvh] md:h-auto md:min-h-[600px] w-full max-w-5xl bg-white md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Header & Progress / Sidebar on Desktop */}
          <div className="md:w-1/3 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-6 md:p-10 flex flex-col shrink-0 relative">
            <div className="mb-8 hidden md:block bg-white p-3 rounded-xl shadow-sm self-start border border-gray-100">
              <SmallLogos />
            </div>
            <div className="mb-6 hidden md:block">
               <h3 className="font-black text-xl text-gray-800 leading-snug">{currentSession.name}</h3>
               {currentSession.speaker && <p className="text-gray-500 mt-2">{currentSession.speaker}</p>}
            </div>
            
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 mt-auto">
              Pertanyaan {currentStep + 1} / {currentSession.formStructure.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:w-2/3 flex flex-col relative bg-white">
            <div className="flex-grow overflow-y-auto p-6 md:p-12 flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 leading-snug mb-2">
                {question.label}
              </h2>
              {currentSession.speaker && (
                <p className="text-sm text-gray-500 font-medium mb-8 bg-gray-50 inline-block px-3 py-1 rounded-md self-start md:hidden">
                  Sesi: {currentSession.name} • Pemateri: {currentSession.speaker}
                </p>
              )}

              {/* Input Area */}
              <div className="mt-6">
            {question.type === 'rating' ? (
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button 
                    key={star}
                    onClick={() => setAnswers({...answers, [question.id]: star})}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="p-2 transition-colors"
                  >
                    <Star 
                      size={42} 
                      fill={answers[question.id] >= star ? COLORS.mustard : 'transparent'} 
                      color={answers[question.id] >= star ? COLORS.mustard : '#CBD5E1'} 
                    />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="relative">
                <textarea 
                  className="w-full h-40 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-500 outline-none resize-none text-gray-700 leading-relaxed"
                  placeholder="Ketik jawaban Anda di sini..."
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
                ></textarea>
                <button 
                  onClick={() => toggleRecording(question.id)}
                  className={`absolute bottom-4 right-4 p-3 rounded-full shadow-md transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-600 border border-gray-200 hover:bg-gray-50'}`}
                  title="Gunakan Suara"
                >
                  <Mic size={20} />
                </button>
              </div>
            )}
              </div>
            </div>

            {/* Footer Button - Always at bottom */}
            <div className="p-6 md:p-8 shrink-0 bg-white border-t border-gray-100">
              <button 
                onClick={handleNext}
                disabled={!answers[question.id] || isSubmitting}
                className={`w-full py-4 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 transition shadow-md ${(!answers[question.id] || isSubmitting) ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'hover:brightness-110 active:scale-[0.98]'}`}
                style={{ backgroundColor: (answers[question.id] && !isSubmitting) ? COLORS.blue : undefined }}
              >
                {isSubmitting ? 'Mengirim...' : (isLastStep ? 'Kirim Feedback' : 'Lanjut')} <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (view === 'thankyou') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-[100dvh] bg-gray-100 flex items-center justify-center p-0 md:p-8">
        <div className="w-full max-w-5xl bg-white md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[100dvh] md:min-h-[500px]">
          
          <div className="md:w-1/2 p-10 lg:p-16 flex flex-col justify-center items-center text-center bg-green-50/50 border-b md:border-b-0 md:border-r border-gray-100">
            <CheckCircle size={100} className="text-green-500 mb-8 drop-shadow-sm" />
            <h2 className="text-3xl lg:text-4xl font-black text-gray-800 mb-4">Terima Kasih!</h2>
            <p className="text-gray-500 leading-relaxed max-w-md">
              Feedback Anda sangat berharga bagi kami. Sebagai bentuk apresiasi, kami telah menyiapkan hadiah spesial untuk Anda.
            </p>
          </div>

          <div className="md:w-1/2 p-10 lg:p-16 flex flex-col justify-center bg-white items-center">
            <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-1.5 mb-8">
              <div className="border border-yellow-200 border-dashed rounded-2xl p-6 lg:p-8 bg-white text-center">
                <h3 className="font-black text-yellow-800 text-xl mb-2">🎁 Hadiah Eksklusif</h3>
                <p className="text-gray-600 font-medium mb-6">10 Template Prompt AI untuk Administrasi</p>
                <button 
                  onClick={() => setView('cheatsheet')}
                  className="w-full py-4 bg-orange-100 text-orange-900 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-orange-200 transition border-2 border-orange-200 shadow-sm hover:shadow active:scale-[0.98]" 
                >
                  Buka Cheatsheet
                </button>
              </div>
            </div>

            <button 
              onClick={() => setView('login')}
              className="text-gray-400 font-bold hover:text-gray-600 underline transition"
            >
              Kembali ke Beranda
            </button>
          </div>
          
        </div>
      </motion.div>
    );
  }

  if (view === 'cheatsheet') {
    const handleDownload = () => {
      const generatePDF = () => {
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20;
        
        // Menambahkan Header Dokumen PDF
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 82, 135); // IWDemy Blue (#005287)
        doc.text("MASTERING AI PROMPTS", 105, y, { align: "center" });
        y += 8;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("10 Template Sempurna untuk Mengotomatisasi Pekerjaan Administratif Anda", 105, y, { align: "center" });
        y += 15;

        // Memasukkan Konten Prompt ke dalam PDF
        PREMIUM_PROMPTS.forEach((p, i) => {
          // Buat halaman baru jika teks sudah hampir mencapai ujung bawah kertas A4
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 82, 135);
          doc.text(`${i + 1}. ${p.title}`, 20, y);
          y += 6;
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(50, 50, 50); // Teks abu-abu gelap
          
          // Memecah teks panjang agar otomatis turun ke baris baru (Wrap Text)
          const splitPrompt = doc.splitTextToSize(p.prompt, 170);
          doc.text(splitPrompt, 20, y);
          
          // Memberi jarak antar prompt
          y += (splitPrompt.length * 5) + 10;
        });

        // Mengunduh file ke perangkat
        doc.save("IWDemy_AI_Prompts_Cheatsheet.pdf");
      };

      // Cek apakah library PDF sudah ada, jika belum muat dari CDN secara dinamis
      // @ts-ignore
      if (window.jspdf) {
        generatePDF();
      } else {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = generatePDF;
        document.body.appendChild(script);
      }
    };

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Teks berhasil disalin!");
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-[100dvh] bg-gray-100 flex flex-col w-full mx-auto relative md:p-6 lg:p-10">
        <div className="md:rounded-3xl bg-white overflow-hidden flex flex-col h-[100dvh] md:h-auto md:min-h-[85vh] shadow-2xl max-w-7xl mx-auto w-full">
          
          {/* Header - Fixed At Top */}
          <div className="bg-white p-4 lg:px-8 lg:py-6 shadow-sm z-10 flex justify-between items-center shrink-0 relative border-b border-gray-100">
            <button onClick={() => setView('thankyou')} className="text-gray-500 hover:text-gray-800 p-2 flex items-center gap-2 font-bold transition">
              <ArrowLeft size={24} /> <span className="hidden sm:inline">Kembali</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <h2 className="font-black text-gray-800 whitespace-nowrap lg:text-xl">Premium Cheat Sheet</h2>
            </div>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-2.5 bg-orange-100 text-orange-900 hover:bg-orange-200 font-bold rounded-xl transition-colors border-2 border-orange-200 shadow-sm"
            >
              <Download size={18} /> <span>Download <span className="hidden sm:inline">(.pdf)</span></span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-grow overflow-y-auto p-5 md:p-8 lg:p-12 bg-gray-50">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-black text-gray-800">MASTERING AI PROMPTS</h1>
              <p className="text-gray-600 mt-3 font-medium leading-relaxed">Salin teks di dalam kotak, lalu sesuaikan bagian yang di-highlight <b>[seperti ini]</b> dengan konteks dan kebutuhan spesifik pekerjaan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {PREMIUM_PROMPTS.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full">
                  <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-blue-900 flex items-center gap-3 text-sm">
                      <span className="bg-blue-200 text-blue-800 w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0">{index + 1}</span> 
                      <span className="line-clamp-2">{item.title}</span>
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(item.prompt)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 bg-white p-2 rounded-lg border border-blue-200 shadow-sm flex items-center justify-center shrink-0 active:scale-95 transition"
                      title="Salin Prompt"
                    >
                      <Copy size={16}/>
                    </button>
                  </div>
                  <div className="p-5 bg-white text-sm text-gray-700 leading-relaxed font-mono flex-grow">
                    {/* Highlight text within brackets */}
                    {item.prompt.split(/(\[.*?\])/g).map((part, i) => 
                      part.startsWith('[') && part.endsWith(']') 
                        ? <span key={i} className="bg-yellow-200 font-bold px-1.5 py-0.5 rounded text-yellow-900">{part}</span>
                        : part
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-10"></div> {/* Bottom padding */}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default function App() {
  const [currentView, setCurrentView] = useState('participant'); // participant, admin
  const [sessions, setSessions] = useState<any>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sessions"), (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => b.createdAt - a.createdAt); // assuming we add createdAt
      setSessions(loadedSessions);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLoginAttempt = () => {
    if (passwordInput === 'iwdemy') {
      setCurrentView('admin');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Kata sandi salah.');
    }
  };

  return (
    <div className={`w-full min-h-[100dvh] transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-900 text-gray-100' : 'bg-gray-200 text-gray-800'}`}>
      <Toaster position="top-center" />
      
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed bottom-6 right-6 p-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all z-50 border border-gray-200 dark:border-slate-700 flex items-center justify-center"
        title={isDarkMode ? "Matikan Mode Gelap" : "Nyalakan Mode Gelap"}
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <AnimatePresence mode="wait">
        {currentView === 'admin' ? (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminApp 
              sessions={sessions} 
              setSessions={setSessions} 
              onLogout={() => setCurrentView('participant')} 
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          </motion.div>
        ) : (
          <motion.div key="participant" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ParticipantApp 
              sessions={sessions} 
              setSessions={setSessions} 
              onRequestAdminLogin={() => setShowPasswordModal(true)} 
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative">
            <button 
              onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordInput(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="flex justify-center mb-4 text-blue-600">
              <Lock size={40} />
            </div>
            <h3 className="text-xl font-black text-center mb-2 text-gray-800">Akses Admin</h3>
            <p className="text-center text-gray-500 text-sm mb-6">Masukkan kata sandi untuk masuk ke Dashboard Admin.</p>
            
            <input 
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLoginAttempt()}
              placeholder="Kata Sandi"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
            />
            {passwordError && <p className="text-red-500 text-xs font-bold mb-4">{passwordError}</p>}
            
            <button 
              onClick={handleAdminLoginAttempt}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg mt-2 hover:bg-blue-700 transition"
            >
              Masuk
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
