import Link from 'next/link';
import { ArrowRight, FileText, Shield, Zap, Database, History, Search } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-[#f1f5f9] font-sans selection:bg-[#1e40af] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e40af] rounded flex items-center justify-center font-bold text-white">L</div>
          <span className="font-bold text-xl tracking-tight">LexRAG</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth" className="text-sm font-medium hover:text-white transition-colors">Sign In</Link>
          <Link href="/auth" className="text-sm font-medium bg-[#1e40af] hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Based on IEEE-published research
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Ask your contracts <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#1e40af]">anything.</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl">
            LexRAG answers with 87% accuracy and cites every source. Enterprise-grade legal document analysis powered by advanced RAG architecture.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth" className="flex items-center gap-2 bg-[#1e40af] hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all hover:scale-105">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all">
              Read the Paper ↗
            </a>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-32 py-12 border-y border-white/10">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">87.4%</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider">Answer Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">94.1%</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider">Citation Precision</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">4.2%</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider">Hallucination Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">&lt;1.2s</div>
            <div className="text-sm text-slate-400 uppercase tracking-wider">Response Time</div>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Upload</h3>
              <p className="text-slate-400">Drag-drop your PDFs and Word docs. Processed and vector-indexed in seconds.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Ask</h3>
              <p className="text-slate-400">Type your question in plain English. Our LLM understands complex legal nuances.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Verify</h3>
              <p className="text-slate-400">Every answer shows the exact source clause it came from with verifiable UUIDs.</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16">Enterprise-Grade Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<Search />} title="Semantic Search" desc="Understands meaning, not just keywords." />
            <FeatureCard icon={<Shield />} title="Zero Hallucination*" desc="UUID-verified citations, every time." />
            <FeatureCard icon={<Database />} title="Multi-Tenant Security" desc="Your documents are mathematically isolated." />
            <FeatureCard icon={<Zap />} title="Streaming Answers" desc="First token in under 400ms." />
            <FeatureCard icon={<History />} title="Conversation Memory" desc="Remembers your last 10 questions." />
            <FeatureCard icon={<FileText />} title="Full Audit Log" desc="Every query logged for compliance." />
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-32 overflow-x-auto">
          <h2 className="text-3xl font-bold text-center mb-16">The LexRAG Advantage</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-slate-400 font-medium">Feature</th>
                <th className="p-4 text-slate-400 font-medium">Keyword Search</th>
                <th className="p-4 text-slate-400 font-medium">Fine-tuned AI</th>
                <th className="p-4 text-[#1e40af] font-bold bg-blue-500/10 rounded-t-lg">LexRAG</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="p-4 font-medium">Answer Accuracy</td>
                <td className="p-4 text-slate-400">71.2%</td>
                <td className="p-4 text-slate-400">64.8%</td>
                <td className="p-4 font-bold text-emerald-400 bg-blue-500/5">87.4% ✓</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 font-medium">Hallucination Rate</td>
                <td className="p-4 text-slate-400">18.3%</td>
                <td className="p-4 text-slate-400">22.1%</td>
                <td className="p-4 font-bold text-emerald-400 bg-blue-500/5">4.2% ✓</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 font-medium">Source Citations</td>
                <td className="p-4 text-slate-400">Partial</td>
                <td className="p-4 text-slate-400">None</td>
                <td className="p-4 font-bold text-emerald-400 bg-blue-500/5">94.1% ✓</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 font-medium">Data Security</td>
                <td className="p-4 text-slate-400">Basic</td>
                <td className="p-4 text-slate-400">Risk of leak</td>
                <td className="p-4 font-bold text-emerald-400 bg-blue-500/5">Zero-trust ✓</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Response Speed</td>
                <td className="p-4 text-slate-400">Fast</td>
                <td className="p-4 text-slate-400">Slow</td>
                <td className="p-4 font-bold text-emerald-400 bg-blue-500/5 rounded-b-lg">&lt; 1.2s ✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <footer className="border-t border-white/10 py-12 text-center text-slate-500">
        <p>© 2026 LexRAG. Based on IEEE research.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-start gap-4">
      <div className="text-[#1e40af] mt-1">{icon}</div>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}
