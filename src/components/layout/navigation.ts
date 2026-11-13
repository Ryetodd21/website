import { Activity, BrainCircuit, ChartColumn, GraduationCap, History, LayoutDashboard, Settings, SlidersHorizontal, UserRound, Users } from "lucide-react";

export const staffNavigation = [
  { label: "Ringkasan", href: "/dashboard", icon: LayoutDashboard, group: "Utama" },
  { label: "Pemantauan", href: "/monitoring", icon: Activity, group: "Utama" },
  { label: "Mahasiswa", href: "/students", icon: Users, group: "Utama" },
  { label: "Riwayat Aktivitas", href: "/logs", icon: History, group: "Utama" },
  { label: "Laporan", href: "/reports", icon: ChartColumn, group: "Utama" },
  { label: "AI Analisis", href: "/ai", icon: BrainCircuit, group: "Analisis & akademik" },
  { label: "Akademik", href: "/akademik", icon: GraduationCap, group: "Analisis & akademik" },
  { label: "Model Analisis", href: "/models", icon: SlidersHorizontal, group: "Pengelolaan" },
  { label: "Pengaturan", href: "/settings", icon: Settings, group: "Pengelolaan" },
];

export const accountNavigation = { label: "Akun Saya", href: "/profile", icon: UserRound, group: "Akun" };
