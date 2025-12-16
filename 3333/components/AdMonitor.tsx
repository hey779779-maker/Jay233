import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { Activity, Target, Zap, TrendingUp, TriangleAlert, Play, Pause, RefreshCw, Layers, DollarSign, Brain, CircleCheck, ArrowRight, Sparkles, X, Clock, Users } from 'lucide-react';
import { AdCampaign, AdPlatform, OptimizationSuggestion } from '../types';
import { generateAdStrategy } from '../services/geminiService';

// Mock Data Generator
const generateMockCampaigns = (platform: AdPlatform): AdCampaign[] => {
    return Array.from({ length: 4 }).map((_, i) => ({
        id: `camp-${i}`,
        name: `${platform === 'qianchuan' ? '直播' : '笔记'}推广计划-${i + 1} [${['爆款', '测款', '长尾', '捡漏'][i]}]`,
        status: i === 0 ? 'active' : i === 1 ? 'learning' : 'active',
        platform: platform,
        budget: 500 + Math.random() * 2000,
        spend: 100 + Math.random() * 400,
        impressions: 5000 + Math.floor(Math.random() * 20000),
        clicks: 100 + Math.floor(Math.random() * 500),
        conversions: 5 + Math.floor(Math.random() * 30),
        ctr: 0.02 + Math.random() * 0.05,
        cvr: 0.01 + Math.random() * 0.03,
        roi: 0.8 + Math.random() * 3.0,
        cpc: 1.5 + Math.random() * 2,
        targetAudienceScore: 60 + Math.floor(Math.random() * 40)
    }));
};

const PLATFORMS: {id: AdPlatform, label: string, color: string}[] = [
    { id: 'qianchuan', label: '巨量千川 (抖音)', color: 'bg-slate-900 text-white' },
    { id: 'juguang', label: '聚光平台 (小红书)', color: 'bg-red-500 text-white' },
    { id: 'qianfan', label: '千帆 (私域)', color: 'bg-orange-500 text-white' },
    { id: 'tecent', label: '腾讯广告 (视频号)', color: 'bg-blue-500 text-white' }
];

const AdMonitor: React.FC = () => {
    const [platform, setPlatform] = useState<AdPlatform>('qianchuan');
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [autoOptimize, setAutoOptimize] = useState(false);
    const [realtimeData, setRealtimeData] = useState<any[]>([]);
    
    // NEW: Detail Modal State
    const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

    // 1. Initial Load & Platform Switch
    useEffect(() => {
        const data = generateMockCampaigns(platform);
        setCampaigns(data);
        setSuggestions([]); // Clear old suggestions
        
        // Generate mock chart data with slight variance
        const chartData = Array.from({ length: 12 }).map((_, i) => ({
            time: `${i * 2}:00`,
            roi: (1 + Math.random() * 2).toFixed(2),
            spend: Math.floor(Math.random() * 1000),
            ctr: (Math.random() * 5).toFixed(2)
        }));
        setRealtimeData(chartData);
    }, [platform]);

    // 2. AI Analysis Handler
    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const result = await generateAdStrategy(campaigns, platform);
            setSuggestions(result);
        } catch (e) {
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    // 3. Auto-Optimize Simulation & Real-time Chart Animation
    useEffect(() => {
        const interval = setInterval(() => {
            // Animate Chart: Push new data point, shift old
            setRealtimeData(prev => {
                const last = prev[prev.length - 1];
                const hour = parseInt(last.time.split(':')[0]) + 1;
                const newPoint = {
                    time: `${hour % 24}:00`,
                    roi: (Math.max(0.5, parseFloat(last.roi) + (Math.random() - 0.5))).toFixed(2),
                    spend: Math.max(0, last.spend + (Math.random() - 0.5) * 100),
                    ctr: (Math.max(0.5, parseFloat(last.ctr) + (Math.random() - 0.5) * 0.5)).toFixed(2)
                };
                return [...prev.slice(1), newPoint];
            });

            if (autoOptimize) {
                // Simulate metric changes
                setCampaigns(prev => prev.map(c => ({
                    ...c,
                    impressions: c.impressions + Math.floor(Math.random() * 100),
                    spend: c.spend + Math.random() * 10,
                    roi: Math.max(0.5, c.roi + (Math.random() - 0.5) * 0.2) // Fluctuate ROI
                })));
            }
        }, 3000); // Update every 3 seconds for "alive" feel

        return () => clearInterval(interval);
    }, [autoOptimize]);

    const applySuggestion = (id: string) => {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'applied' } : s));
    };

    // Calculate Totals
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const avgRoi = campaigns.reduce((acc, c) => acc + c.roi, 0) / (campaigns.length || 1);
    const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);

    return (
        <div className="space-y-6">
            {/* Header / Platform Switcher */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">流量操盘手</h2>
                        <p className="text-xs text-slate-500">全平台投流监控与 AI 策略自动化</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${platform === p.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Real-time Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> 实时消耗</div>
                            <div className="text-2xl font-bold text-slate-900">¥{totalSpend.toFixed(2)}</div>
                            <div className="text-[10px] text-green-500 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +12%</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> 平均 ROI</div>
                            <div className={`text-2xl font-bold ${avgRoi > 2 ? 'text-green-600' : 'text-amber-600'}`}>{avgRoi.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 mt-1">目标: 2.5</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> 转化数</div>
                            <div className="text-2xl font-bold text-slate-900">{totalConversions}</div>
                            <div className="text-[10px] text-slate-400 mt-1">CVR: {(campaigns.reduce((a,c)=>a+c.cvr,0)/campaigns.length*100).toFixed(1)}%</div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-80">
                        <h3 className="font-bold text-slate-800 text-sm mb-4">实时投放趋势 (ROI & CTR)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={realtimeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" domain={[0, 4]} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                                <Tooltip contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={2} name="ROI" dot={false} isAnimationActive={true} />
                                <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#6366f1" strokeWidth={2} name="CTR %" dot={false} isAnimationActive={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Campaigns Table */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">活跃计划列表</h3>
                            <button onClick={() => setAutoOptimize(!autoOptimize)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${autoOptimize ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {autoOptimize ? <Activity className="w-3 h-3 animate-pulse" /> : <Pause className="w-3 h-3" />}
                                {autoOptimize ? 'AI 托管中' : '托管已暂停'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="p-3">计划名称</th>
                                        <th className="p-3">状态</th>
                                        <th className="p-3">消耗</th>
                                        <th className="p-3">ROI</th>
                                        <th className="p-3">精准度</th>
                                        <th className="p-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {campaigns?.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedCampaign(c)}>
                                            <td className="p-3 font-medium text-slate-700">{c.name}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-3">¥{c.spend.toFixed(0)}</td>
                                            <td className={`p-3 font-bold ${c.roi < 1 ? 'text-red-500' : 'text-slate-700'}`}>{c.roi.toFixed(2)}</td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{width: `${c.targetAudienceScore}%`}}></div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{c.targetAudienceScore}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedCampaign(c); }} className="text-indigo-600 hover:underline">详情</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: AI Strategy Brain */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                                AI 策略中心
                            </h3>
                            <p className="text-indigo-200 text-xs mb-6">基于实时数据分析，提供包括出价调整、人群包优化、素材关停等策略建议。</p>
                            
                            <button 
                                onClick={handleAIAnalysis}
                                disabled={analyzing}
                                className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg shadow hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                {analyzing ? '策略生成中...' : '一键智能诊断'}
                            </button>
                        </div>
                    </div>

                    {/* Suggestions List */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">优化建议 ({suggestions?.filter(s=>s.status==='pending').length || 0})</h3>
                            <span className="text-[10px] text-slate-400">由 Gemini 驱动</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {suggestions?.length === 0 && !analyzing && (
                                <div className="text-center py-10 text-slate-400 text-xs">
                                    暂无待处理建议，点击上方按钮开始诊断。
                                </div>
                            )}
                            {suggestions?.map(suggestion => (
                                <div key={suggestion.id} className={`p-4 rounded-xl border transition-all ${suggestion.status === 'applied' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            suggestion.type === 'bid' ? 'bg-green-100 text-green-700' :
                                            suggestion.type === 'creative' ? 'bg-purple-100 text-purple-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {suggestion.type}
                                        </span>
                                        {suggestion.status === 'applied' && <CircleCheck className="w-4 h-4 text-green-500" />}
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{suggestion.action}</h4>
                                    <p className="text-xs text-slate-500 mb-2">{suggestion.reason}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit mb-3">
                                        <TrendingUp className="w-3 h-3" /> 预估: {suggestion.impactPrediction}
                                    </div>
                                    
                                    {suggestion.status === 'pending' && (
                                        <button 
                                            onClick={() => applySuggestion(suggestion.id)}
                                            className="w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 flex items-center justify-center gap-1 transition-colors"
                                        >
                                            采纳策略 <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Campaign Details Modal (THE FIX FOR "USELESS BUTTONS") */}
            {selectedCampaign && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedCampaign.name}</h3>
                                <div className="flex gap-2 text-xs mt-1">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{selectedCampaign.status}</span>
                                    <span className="text-slate-500">ID: {selectedCampaign.id}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Deep Dive Metrics */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">千次曝光成本 (CPM)</div>
                                    <div className="text-xl font-bold text-slate-800">¥{(selectedCampaign.spend / (selectedCampaign.impressions/1000)).toFixed(2)}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">点击成本 (CPC)</div>
                                    <div className="text-xl font-bold text-slate-800">¥{selectedCampaign.cpc.toFixed(2)}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">转化成本 (CPA)</div>
                                    <div className="text-xl font-bold text-slate-800">¥{(selectedCampaign.spend / (selectedCampaign.conversions || 1)).toFixed(2)}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-xs text-slate-400 mb-1">点击率 (CTR)</div>
                                    <div className="text-xl font-bold text-slate-800">{(selectedCampaign.ctr * 100).toFixed(2)}%</div>
                                </div>
                            </div>

                            {/* Audience Breakdown Mockup */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" /> 人群画像分析
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="h-40">
                                        <p className="text-xs text-center mb-2 text-slate-500">年龄分布</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                {name: '18-24', val: 30}, {name: '25-34', val: 45}, {name: '35+', val: 25}
                                            ]}>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                                                <Bar dataKey="val" fill="#6366f1" radius={[4,4,0,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-40">
                                        <p className="text-xs text-center mb-2 text-slate-500">地域分布 (Top 5)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={[
                                                {name: '上海', val: 80}, {name: '北京', val: 65}, {name: '杭州', val: 50}, {name: '广州', val: 40}, {name: '深圳', val: 35}
                                            ]}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={40} />
                                                <Bar dataKey="val" fill="#ef4444" radius={[0,4,4,0]} barSize={15} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Hourly Trend Mockup */}
                            <div>
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-orange-500" /> 分时数据 (24H)
                                </h4>
                                <div className="h-48 w-full bg-slate-50 rounded-xl p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={Array.from({length:24}).map((_,i) => ({
                                            hour: i, 
                                            val: Math.floor(Math.random() * 100) + (i > 18 ? 200 : 50) // Fake peak at night
                                        }))}>
                                            <defs>
                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="hour" fontSize={10} tickFormatter={(v)=>`${v}点`} interval={2} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="val" stroke="#8884d8" fillOpacity={1} fill="url(#colorVal)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdMonitor;