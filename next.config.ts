import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드 표시("N")가 사이드바 계정 메뉴·패널 저장 버튼 같은 모서리 버튼을 가려서 끈다.
  // 오류가 나면 뜨는 오류 화면은 그대로 나온다.
  devIndicators: false,
};

export default nextConfig;
