'use client';

import { BarChart2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto w-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Monitor system performance and query accuracy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <BarChart2 className="w-5 h-5" /> Total Queries
          </div>
          <div className="text-3xl font-bold text-white">1,248</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <CheckCircle2 className="w-5 h-5" /> Cache Hit Rate
          </div>
          <div className="text-3xl font-bold text-white">42.5%</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Clock className="w-5 h-5" /> Avg Latency
          </div>
          <div className="text-3xl font-bold text-white">840ms</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <AlertTriangle className="w-5 h-5" /> Hallucinations
          </div>
          <div className="text-3xl font-bold text-white">4.2%</div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <p className="text-slate-400">Detailed charts and graphs would be rendered here using Recharts.</p>
      </div>
    </div>
  );
}
