'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <main className="relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
            {/* Logo/Title */}
            <div className="mb-8 animate-fade-in">
              <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                TechC SNS
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-full"></div>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl opacity-0 animate-[fade-in_1s_ease-out_0.3s_forwards]">
              技術で繋がる、未来を創る
              <br />
              <span className="text-purple-400 font-semibold">Connect, Share, Innovate</span>
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
              <FeatureCard
                icon="🚀"
                title="革新的"
                description="最新技術を活用した次世代SNS体験"
              />
              <FeatureCard
                icon="🤝"
                title="コミュニティ"
                description="技術者同士の深い繋がりを実現"
              />
              <FeatureCard
                icon="💡"
                title="インスピレーション"
                description="新しいアイデアと出会える場所"
              />
            </div>

            {/* CTA Button */}
            <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 opacity-0 animate-[fade-in_1s_ease-out_0.6s_forwards]">
              <span className="relative z-10">今すぐ始める</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Status Badge */}
            <div className="mt-12 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 opacity-0 animate-[fade-in_1s_ease-out_0.9s_forwards]">
              <p className="text-sm text-gray-300">
                ✨ <span className="text-green-400 font-semibold">Next.js 15</span> で構築 |
                <span className="text-blue-400 font-semibold"> Vercel</span> でデプロイ済み
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-gray-400 text-sm">
            © 2025 TechC SNS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
    >
      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">
        {description}
      </p>
    </div>
  );
}
