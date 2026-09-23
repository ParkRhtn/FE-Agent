import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드 표시가 왼쪽 아래 사이드바의 계정 메뉴를 가리지 않게
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
