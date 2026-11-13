import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Monitor UNG, Sistem Monitoring Real-Time Mahasiswa";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "oklch(0.985 0.005 80)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 16,
              letterSpacing: "16%",
              color: "#000",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Monitor UNG
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              color: "oklch(0.18 0.01 260)",
              letterSpacing: "-3%",
              lineHeight: 0.95,
              fontWeight: 800,
              maxWidth: 980,
            }}
          >
            Sistem Monitoring Real-Time Distraksi Mahasiswa.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "oklch(0.18 0.01 260 / 0.6)",
              maxWidth: 880,
              marginTop: 8,
              lineHeight: 1.3,
            }}
          >
            PCA + K-Means untuk klasterisasi pola screen time, sosmed, dan game
            mahasiswa Universitas Negeri Gorontalo.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 18,
              color: "oklch(0.18 0.01 260 / 0.55)",
            }}
          >
            <div style={{ display: "flex" }}>Universitas Negeri Gorontalo</div>
            <div style={{ display: "flex" }}>monitorterop.my.id</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              letterSpacing: "22%",
              color: "#000",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "oklch(0.577 0.245 27.325)",
              }}
            />
            v0.28.0
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}