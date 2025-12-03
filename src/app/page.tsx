import CommerceList from "@/components/CommerceList";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              🇰🇷 대한민국 커머스 지도
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              한눈에 보는 대한민국 온라인 쇼핑 서비스 - 배송, 카테고리, 특징
              비교
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CommerceList />
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              © 2024 대한민국 커머스 지도. 이 사이트는 정보 제공 목적으로
              운영됩니다.
            </p>
            <div className="flex gap-4">
              <a
                href="/llms.txt"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                llms.txt
              </a>
              <a
                href="https://github.com/kuil09/korea-commerce-map"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
