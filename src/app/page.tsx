import type { Metadata } from "next";
import { LandingView } from "./_components/landing-view";

export const metadata: Metadata = {
  title: "Monitor UNG · Sistem Monitoring Distraksi Belajar Mahasiswa",
  description:
    "Pahami kebiasaan digital mahasiswa melalui aktivitas smartphone, jadwal kuliah, " +
    "dan konteks kampus. Aplikasi Android untuk mahasiswa, dashboard untuk dosen dan admin UNG.",
  openGraph: {
    title: "Monitor UNG · Sistem Monitoring Distraksi Belajar",
    description:
      "Kenali pola aktivitas mahasiswa dan dukung pendampingan akademik dengan data yang kontekstual.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingView />;
}
