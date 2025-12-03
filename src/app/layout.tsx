import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "대한민국 커머스 지도 - Korea Commerce Map",
  description:
    "대한민국에 존재하는 커머스 서비스들의 특화 카테고리, 상호, 배송 수단, 배송 도착 보장 시간, 최소 주문 금액 등을 한눈에 비교하세요.",
  keywords: [
    "한국 커머스",
    "온라인 쇼핑",
    "쿠팡",
    "마켓컬리",
    "배달의민족",
    "새벽배송",
    "로켓배송",
    "이커머스",
  ],
  openGraph: {
    title: "대한민국 커머스 지도",
    description:
      "한눈에 보는 대한민국 온라인 쇼핑 서비스 - 배송, 카테고리, 특징 비교",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
