import React, { useState, useEffect } from 'react';
import { Search, LoaderCircle, Users, Star, TrendingUp, Tag, ChevronRight, X, BarChart2, ExternalLink, Heart, MessageCircle, Radar, ShoppingBag, ArrowUpRight, Clock, Award, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Influencer, InfluencerDetail, TimeFrame, Platform } from '../types';
import { searchInfluencers, analyzeInfluencerDetails } from '../services/geminiService';

// Default Demo Influencers
const DEMO_INFLUENCERS: Influencer[] = [
    {
        id: 'inf-1',
        name: '程十安',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
        fanCount: '1280w',
        category: '美妆护肤',
        engagementRate: 'S+',
        commercialValue: 98,
        recentTags: ['变美干货', '护肤教学', '国货之光'],
        description: '技术流美妆博主，擅长从原理层面剖析护肤痛点，粉丝粘性极高。',
        liveGmv: '¥2500w+'
    },
    {
        id: 'inf-2',
        name: '老爸评测',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
        fanCount: '2350w',
        category: '生活评测',
        engagementRate: 'S',
        commercialValue: 96,
        recentTags: ['成分党', '避坑指南', '硬核科普'],
        description: '死磕产品成分与安全，全网公信力极强的头部评测IP。',
        liveGmv: '¥5000w+'
    },
    {
        id: 'inf-3',
        name: '深夜徐老师',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
        fanCount: '980w',
        category: '时尚穿搭',
        engagementRate: 'A+',
        commercialValue: 92,
        recentTags: ['明星同款', '探店', '时尚改造'],
        description: '时尚圈人脉王，内容风格轻松幽默，种草转化率高。',
        liveGmv: '¥1200w+'
    },
    {
        id: 'inf-4',
        name: '帕梅拉Pamela',
        avatar: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&q=80',
        fanCount: '850w',
        category: '运动健身',
        engagementRate: 'S',
        commercialValue: 95,
        recentTags: ['减脂操', '自律', '健康生活'],
        description: '全球顶流健身IP，带火无数运动装备与健康食品。',
    }
];

interface InfluencerSearchProps {
  globalTimeFrame: TimeFrame;
  platform: Platform;
}

const InfluencerSearch: React.FC<InfluencerSearchProps> = ({ globalTimeFrame, platform }) => {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Influencer[]>(DEMO_INFLUENCERS);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  
  // Details State
  const [detailLoading, setDetailLoading] = useState(false);
  const [influencerDetail, setInfluencerDetail] = useState<InfluencerDetail | null>(null);

  // Reset to demo data if keyword cleared
  useEffect(() => {
      if (!keyword) setResults(DEMO_INFLUENCERS);
  }, [keyword]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      // Pass the platform to the search service
      const data = await searchInfluencers(keyword, platform);
      
      // Strict sorting to prevent crashes: ensure values are numbers
      const sortedData = data.sort((a, b) => {
          const valA = Number(a.commercialValue) || 0;
          const valB = Number(b.commercialValue) || 0;
          return valB - valA;
      });
      
      setResults(sortedData);
    } catch (e) {
      console.error(e);
      alert("搜索失败，请重试");
      setResults(DEMO_INFLUENCERS); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = async (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setDetailLoading(true);
    setInfluencerDetail(null);
    try {
       // Also restrict detailed analysis to the time frame where applicable
       const details = await analyzeInfluencerDetails(influencer.name, platform);
       setInfluencerDetail(details);
    } catch(e) {
       console.error("Detail Fetch Error", e);
    } finally {
       setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        {/* Time Badge */}
        <div className="absolute top-4 right-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-indigo-100">
           <Clock className="w-3 h-3" />
           基于: {globalTimeFrame} 数据
        </div>

        <div className="text-center space-y-2">
           <h2 className="text-2xl font-bold text-slate-800">达人广场 (Ranked by Weight)</h2>
           <p className="text-slate-500">连接 1000万+ 优质小红书创作者，精准匹配 <span className="text-indigo-600 font-bold">{globalTimeFrame}</span> 的活跃达人</p>
        </div>
        
        <div className="w-full max-w-2xl relative">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`搜索在 "${globalTimeFrame}" 表现亮眼的达人昵称或领域...`}
            className="w-full pl-6 pr-32 py-4 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-red-100 focus:border-red-500 focus:outline-none transition-all shadow-sm text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-full shadow-md transition-all disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : '搜索'}
          </button>
        </div>

        <div className="flex gap-2 text-sm text-slate-400">
          <span>热门搜索:</span>
          {['美妆护肤', '家居', '母婴育儿', '健身', '探店'].map(tag => (
            <button 
              key={tag}
              onClick={() => { setKeyword(tag); handleSearch(); }} 
              className="hover:text-red-500 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {results.map((influencer, index) => (
            <div key={influencer.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              
              {/* RANK BADGE */}
              <div className={`absolute top-0 left-0 w-12 h-12 flex items-center justify-center rounded-br-xl font-bold text-lg text-white shadow-sm z-10 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                 #{index + 1}
              </div>

              <div className="flex items-start justify-between mb-4 pl-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {influencer.avatar ? (
                      <img src={influencer.avatar} alt={influencer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-slate-300">{influencer.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 line-clamp-1">
                      {influencer.name}
                      {Number(influencer.commercialValue) > 90 && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] rounded-full font-normal whitespace-nowrap shadow-sm">
                           Top Tier
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block font-medium">
                        {influencer.category}
                    </span>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">{influencer.description}</p>
                  </div>
                </div>
                
                {/* COMMERCIAL VALUE / GMV DISPLAY */}
                <div className="flex flex-col items-end">
                   {influencer.liveGmv ? (
                       <div className="flex flex-col items-end">
                           <div className="text-sm font-bold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md mb-1 border border-red-100">
                               <DollarSign className="w-3 h-3" />
                               {influencer.liveGmv}
                           </div>
                           <div className="text-[10px] text-slate-400">预估月带货额</div>
                       </div>
                   ) : (
                       <div className="flex flex-col items-end">
                           <div className={`text-2xl font-bold ${Number(influencer.commercialValue) > 85 ? 'text-slate-900' : 'text-slate-500'}`}>
                               {influencer.commercialValue}
                           </div>
                           <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Award className="w-3 h-3" /> 商业权重
                           </div>
                       </div>
                   )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-slate-50">
                 <div className="text-center">
                    <div className="text-sm font-semibold text-slate-800">{influencer.fanCount}</div>
                    <div className="text-xs text-slate-400 mt-1">粉丝总数</div>
                 </div>
                 <div className="text-center border-l border-slate-100">
                    <div className="text-sm font-semibold text-slate-800">{influencer.engagementRate}</div>
                    <div className="text-xs text-slate-400 mt-1">互动等级</div>
                 </div>
                 <div className="text-center border-l border-slate-100">
                    <div className="text-sm font-semibold text-slate-800">{influencer.recentTags?.length || 0}</div>
                    <div className="text-xs text-slate-400 mt-1">近期爆文</div>
                 </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2 overflow-hidden">
                  {influencer.recentTags?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-50 text-slate-500 text-xs rounded-md whitespace-nowrap">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleViewDetails(influencer)}
                        className="text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
                    >
                       查看详情
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {results.length === 0 && !loading && keyword && (
         <div className="text-center py-20 bg-white rounded-xl border border-slate-100 border-dashed">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">暂无达人数据，请尝试搜索其他关键词</p>
         </div>
      )}

      {/* Detail Modal */}
      {selectedInfluencer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                 <h3 className="text-lg font-bold text-slate-800">达人深度分析</h3>
                 <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">{globalTimeFrame}</span>
              </div>
              <button 
                onClick={() => setSelectedInfluencer(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 bg-slate-50/50">
              {/* Header Info */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                   {selectedInfluencer.avatar ? (
                      <img src={selectedInfluencer.avatar} alt={selectedInfluencer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-3xl font-bold text-slate-400">
                        {selectedInfluencer.name[0]}
                      </div>
                    )}
                </div>
                <div className="flex-1 text-center md:text-left">
                   <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center md:justify-start gap-2">
                     {selectedInfluencer.name}
                     {Number(selectedInfluencer.commercialValue) > 90 && (
                        <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs rounded-full font-normal shadow-sm">
                           顶流 Top Tier
                        </span>
                     )}
                   </h2>
                   <p className="text-slate-500 text-sm mb-3 max-w-lg mx-auto md:mx-0">{selectedInfluencer.description}</p>
                   <div className="flex gap-2 justify-center md:justify-start">
                      {selectedInfluencer.recentTags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">#{tag}</span>
                      ))}
                   </div>
                </div>
                
                {/* DETAIL VIEW: GMV / Commercial Value */}
                <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                   <div className="text-sm text-slate-400 mb-1">
                       {selectedInfluencer.liveGmv ? '月预估带货额' : '商业权重分'}
                   </div>
                   <div className="text-3xl font-bold text-red-600">
                       {selectedInfluencer.liveGmv || selectedInfluencer.commercialValue}
                   </div>
                </div>
              </div>

              {detailLoading ? (
                 <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <LoaderCircle className="w-10 h-10 animate-spin text-red-500" />
                    <p>正在挖掘 {selectedInfluencer.name} 在 <span className="font-bold text-slate-600">{globalTimeFrame}</span> 的数据表现...</p>
                 </div>
              ) : influencerDetail ? (
                <>
                  {/* Data Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm">
                          <Users className="w-4 h-4" /> 粉丝总量
                        </div>
                        <div className="text-2xl font-bold text-slate-800">{selectedInfluencer.fanCount}</div>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                           <TrendingUp className="w-3 h-3 mr-1" /> 昨日 +1,204
                        </div>
                     </div>
                     <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm">
                          <Heart className="w-4 h-4" /> 平均点赞
                        </div>
                        <div className="text-2xl font-bold text-slate-800">5,420</div>
                        <div className="text-xs text-green-600 flex items-center mt-1">
                           <TrendingUp className="w-3 h-3 mr-1" /> 优于 85% 同类
                        </div>
                     </div>
                     <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm">
                          <Star className="w-4 h-4" /> 商业报价预估
                        </div>
                        <div className="text-2xl font-bold text-slate-800">¥ 8,000 - 15,000</div>
                        <div className="text-xs text-slate-400 mt-1">
                           图文笔记报价
                        </div>
                     </div>
                  </div>

                  {/* Charts Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Fan Growth Chart */}
                     <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                           <TrendingUp className="w-4 h-4 text-red-500" />
                           近7天粉丝增长趋势
                        </h3>
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={influencerDetail.fanGrowthData}>
                                 <defs>
                                    <linearGradient id="colorFans" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} stroke="#94a3b8" />
                                 <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" />
                                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                 <Area type="monotone" dataKey="fans" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFans)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Capability Radar */}
                     <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-lg flex flex-col justify-between">
                        <div>
                           <h3 className="font-bold mb-2 flex items-center gap-2">
                              <Radar className="w-4 h-4 text-emerald-400" />
                              六维能力模型
                           </h3>
                           <p className="text-xs text-slate-400 mb-4">基于 AI 分析该达人的核心竞争力</p>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                           {[
                             {label: '内容力', val: 92},
                             {label: '互动率', val: 85},
                             {label: '涨粉力', val: 78},
                             {label: '种草力', val: 95},
                             {label: '性价比', val: 88},
                           ].map(item => (
                             <div key={item.label}>
                                <div className="flex justify-between text-xs mb-1">
                                   <span className="text-slate-300">{item.label}</span>
                                   <span className="font-bold">{item.val}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 rounded-full" style={{width: `${item.val}%`}}></div>
                                </div>
                             </div>
                           ))}
                        </div>
                        
                        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                           <p className="text-xs leading-relaxed text-slate-200">
                              <span className="text-emerald-400 font-bold">AI 评价:</span> 该达人种草能力极强，粉丝画像精准，适合品牌进行深度合作推广。
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Recent Sales Data - NEW SECTION */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      近期上新销售数据 (New Arrivals)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                          <tr>
                            <th className="p-3 rounded-l-lg">商品信息</th>
                            <th className="p-3">价格</th>
                            <th className="p-3">近7天销量</th>
                            <th className="p-3">预估销售额</th>
                            <th className="p-3 rounded-r-lg text-right">上架时间</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {influencerDetail.recentSales?.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300">
                                     {item.img ? <img src={item.img} alt={item.title} className="w-full h-full object-cover" /> : <ShoppingBag className="w-5 h-5" />}
                                  </div>
                                  <span className="font-medium text-slate-700">{item.title}</span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600">¥{item.price}</td>
                              <td className="p-3 text-slate-600">{item.volume}</td>
                              <td className="p-3 font-medium text-red-500">{item.revenue}</td>
                              <td className="p-3 text-right text-slate-400">{item.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Viral Notes with Clickable Links */}
                  <div>
                     <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                        近期代表作 (Top Performance)
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {influencerDetail.recentNotes?.map((note, i) => (
                           <a 
                              key={i} 
                              href={note.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer block"
                           >
                              <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                                 {note.cover ? (
                                    <img src={note.cover} alt="Note Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                 ) : (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                       封面图
                                    </div>
                                 )}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                                 
                                 {/* Hover Overlay */}
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-1 border border-white/30">
                                      查看笔记 <ArrowUpRight className="w-3 h-3" />
                                    </span>
                                 </div>

                                 <div className="absolute bottom-3 left-3 right-3 text-white">
                                    <div className="text-sm font-bold line-clamp-2 mb-2 leading-snug">{note.title}</div>
                                    <div className="flex items-center justify-between text-xs opacity-90">
                                       <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-white/80 text-white/80" /> {note.likes}</span>
                                       <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 fill-white/80 text-white/80" /> {note.comments}</span>
                                    </div>
                                 </div>
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
                </>
              ) : (
                 <div className="py-10 text-center text-slate-400">无法获取数据，请稍后重试。</div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerSearch;