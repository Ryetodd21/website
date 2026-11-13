/**
 * Centralized UI strings for Monitor UNG.
 * Bahasa Indonesia — satu sumber kebenaran untuk semua label teks.
 */

export const t = {
  sidebar: {
    akademik: "Akademik",
  },
  akademik: {
    title: "Akademik",
    subtitle: "Struktur akademik (fakultas, jurusan, program studi), master mata kuliah, jadwal, dan antrian permintaan. Edit dari sini agar konsisten untuk semua mahasiswa dan dosen.",
    sectionAkademikTitle: "Struktur Akademik",
    sectionAkademikSub: "Hierarki akademik UNG. Fakultas menaungi jurusan, jurusan menaungi program studi.",
    sectionMataKuliahTitle: "Mata Kuliah",
    sectionMataKuliahSub: "Master daftar mata kuliah per program studi. Tambah atau sembunyikan dari daftar ini.",
    sectionJadwalTitle: "Jadwal Mata Kuliah",
    sectionJadwalSub: "Slot waktu perkuliahan per mata kuliah.",
    sectionAntrianTitle: "Antrian Permintaan Akademik",
    sectionAntrianSub: "Permintaan penambahan mata kuliah atau slot jadwal dari mahasiswa/dosen.",
    noteText: "Halaman Akademik adalah sumber kebenaran tunggal untuk struktur akademik UNG. Perubahan di sini akan muncul di dropdown pendaftaran, formulir tambah akun, dan laporan. Soft-delete (nonaktifkan) lebih aman dibanding hapus permanen bila baris sudah dipakai.",
  },
  dialog: {
    tambahFakultas: "Tambah Fakultas",
    editFakultas: "Edit Fakultas",
    tambahJurusan: "Tambah Jurusan",
    editJurusan: "Edit Jurusan",
    tambahProgramStudi: "Tambah Program Studi",
    editProgramStudi: "Edit Program Studi",
    tambahMataKuliah: "Tambah Mata Kuliah",
    editMataKuliah: "Edit Mata Kuliah",
    tambahJadwal: "Tambah Jadwal",
    editJadwal: "Edit Jadwal",
    batal: "Batal",
    simpan: "Simpan",
  },
  toast: {
    jadwalDiperbarui: "Jadwal diperbarui",
    jadwalDitambahkan: "Jadwal ditambahkan",
    jadwalDihapus: "Jadwal dihapus",
    jadwalDinonaktifkan: "Jadwal dinonaktifkan",
    jadwalDiaktifkan: "Jadwal diaktifkan",
  },
  label: {
    kode: "Kode",
    nama: "Nama",
    sks: "SKS",
    semester: "Semester",
    lokasiKampus: "Lokasi Kampus",
    programStudi: "Program Studi",
    keterangan: "Keterangan",
    aktif: "Aktif",
    aksi: "Aksi",
    hari: "Hari",
    mulai: "Mulai",
    selesai: "Selesai",
    ruang: "Ruang",
    fakultasInduk: "Fakultas Induk",
    jurusanInduk: "Jurusan Induk",
    mataKuliah: "Mata Kuliah",
    belumAdaData: "Belum ada data.",
    tambahProdi: "+ Tambah Prodi",
    tambahJurusan: "+ Tambah Jurusan",
    tambahMkDulu: "Tambah mata kuliah terlebih dahulu",
    tambahFakultasDulu: "Tambah fakultas terlebih dahulu",
  },
} as const;

export type TranslationKey = (typeof t)[keyof typeof t][keyof (typeof t)[keyof typeof t]];
