import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Activity, LayoutGrid, Video, Users, Image as ImageIcon, ChevronDown, Monitor, Sidebar, LineChart, Settings, X, Key, Save, CircleCheck, Zap, Download, Upload, Clipboard, Trash2, RotateCcw, Shield } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import VideoStudio from './components/VideoStudio';
import InfluencerSearch from './components/InfluencerSearch';
import ImageGenerator from './components/ImageGenerator';
import AdMonitor from './components/AdMonitor';
import { TrendItem, ImageGenState, TimeFrame, SearchConfig } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'video' | 'influencer' | 'image' | 'monitor'>('dashboard');
  const [lastAnalysis, setLastAnalysis] = useState<TrendItem[]>([]);
  
  // Global Settings State
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalKey, setGlobalKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [importRef, setImportRef] = useState<HTMLInputElement | null>(null);

  // New: Auth Headers State - Pre-filled with the provided NewRank (WeChat Video) Cookie
  const [customCookie, setCustomCookie] = useState('sajssdk_2015_cross_new_user=1; token=2B4E973FAC8C409985A1267AA7B736ED; tfstk=gOIiLmmafBG5zPlUqj-_7IsP27ap1htX-snvMnd48BRBkNn9knbc_BI9khJ9gmXDOndOXNQmCMfoDcF_5toDDnP8wuERCAtX07e3mX2oCKpmQclvgvoeDKmnh1jFCOtjdT0iydW_mi1sNI-VgH8eFKKq0C52T2RBhKlw3cyhLBOeQcJ20D-eUK3qQs-4K9RB3nRVgFyhLB920Il660ROpTjUMdE48cxmqMJMSQWwstBhYc8s5tRn0mSHmFArmBmq0MvG3_8bkcrkTNQVXHSaTbtFFwCwK3qmnpblLhJGGui6bTWFuFj0kYOf-97J-wMTCpjGEivkRXyMGGCGmFszwDON-MsDXwFi2ITVJGT5XWoM4a69XZ5U3mRc8KSPr2uzA7oXL-IElqTwdpA-C6hHrRAGkrw3K48B7p9a7J2nlNTwdpA8KJ0zPFJBQP5..; NR_MAIN_SOURCE_RECORD={"locationSearch":"","locationHref":"https://data.newrank.cn/","referrer":"https://newrank.cn/","source":"","keyword":"","firstReferrer":"https://newrank.cn/","firstLocation":"https://data.newrank.cn/"}; auth_n=3D9sh1bQx+Ym2jp/ny/XQcZwSnG6WHcwrbNG1rANl9zGBsL3Y6O+CuYt0WXLHlP+; Hm_lvt_1431a1bfefec9457e504e1b22adec281=1765829612; Hm_lpvt_1431a1bfefec9457e504e1b22adec281=1765829612; HMACCOUNT=CF030823E8C71D30; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22nr_5junnh6h4%22%2C%22first_id%22%3A%2219b23a49a67581-01df337b1e69359-1d525631-1405320-19b23a49a68170b%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E8%87%AA%E7%84%B6%E6%90%9C%E7%B4%A2%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTliMjNhNDlhNjc1ODEtMDFkZjMzN2IxZTY5MzU5LTFkNTI1NjMxLTE0MDUzMjAtMTliMjNhNDlhNjgxNzBiIiwiJGlkZW50aXR5X2xvZ2luX2lkIjoibnJfNWp1bm5oNmg0In0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22nr_5junnh6h4%22%7D%7D; _uab_collina=176582962047233431496284');
  const [customUA, setCustomUA] = useState('');

  // Load global key on mount & Listen for updates from other components (like VideoStudio)
  useEffect(() => {
    const updateKey = () => {
        const savedKey = localStorage.getItem('global_gemini_api_key');
        if (savedKey) setGlobalKey(savedKey);
        else setGlobalKey('');

        // Only load saved cookie if it exists, otherwise default to the preset one
        const savedCookie = localStorage.getItem('global_auth_cookie');
        if (savedCookie) setCustomCookie(savedCookie);

        const savedUA = localStorage.getItem('global_auth_ua');
        if (savedUA) setCustomUA(savedUA);
    };
    
    // Initial Load
    updateKey();

    // Listen to local changes (polled/event based)
    const handleStorage = () => updateKey();
    window.addEventListener('storage', handleStorage);
    
    // Polling to ensure sync across components in the same window
    const interval = setInterval(() => {
        const current = localStorage.getItem('global_gemini_api_key') || '';
        if (current !== globalKey) {
            setGlobalKey(current);
        }
    }, 1000);

    return () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
    };
  }, [globalKey]);

  const handleSaveGlobalKey = () => {
    const cleanKey = globalKey.trim();
    if (cleanKey) {
        localStorage.setItem('global_gemini_api_key', cleanKey);
    } else {
        localStorage.removeItem('global_gemini_api_key');
        setGlobalKey('');
    }

    // Save Auth Headers
    if (customCookie.trim()) localStorage.setItem('global_auth_cookie', customCookie.trim());
    else localStorage.removeItem('global_auth_cookie');

    if (customUA.trim()) localStorage.setItem('global_auth_ua', customUA.trim());
    else localStorage.removeItem('global_auth_ua');

    setKeySaved(true);
    // Dispatch storage event manually for same-tab updates
    window.dispatchEvent(new Event('storage'));
    
    // Update global config with new headers immediately
    setGlobalConfig(prev => ({
        ...prev,
        authHeaders: {
            cookie: customCookie.trim(),
            userAgent: customUA.trim()
        }
    }));

    setTimeout(() => setKeySaved(false), 2000);
    setTimeout(() => setShowGlobalSettings(false), 800);
  };

  const handleClearKey = () => {
      setGlobalKey('');
      localStorage.removeItem('global_gemini_api_key');
  };

  // --- NEW: Paste from Clipboard ---
  const handlePasteKey = async () => {
      try {
          const text = await navigator.clipboard.readText();
          if (text) setGlobalKey(text.trim());
      } catch (err) {
          alert("无法读取剪贴板，请尝试手动使用 Ctrl+V 粘贴。");
      }
  };

  // --- NEW: Backup & Restore Logic ---
  const handleExportData = () => {
      const backupData: any = {};
      // Collect all local storage items related to the app
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('df_') || key === 'global_gemini_api_key' || key.startsWith('global_auth_'))) {
              backupData[key] = localStorage.getItem(key);
          }
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DataFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              let count = 0;
              Object.keys(data).forEach(key => {
                  if (key.startsWith('df_') || key === 'global_gemini_api_key' || key.startsWith('global_auth_')) {
                      localStorage.setItem(key, data[key]);
                      count++;
                  }
              });
              alert(`成功恢复了 ${count} 项数据！页面将刷新以应用更改。`);
              window.location.reload();
          } catch (err) {
              alert("备份文件格式错误，无法恢复。");
          }
      };
      reader.readAsText(file);
  };

  const handleResetApp = () => {
      if (confirm("确定要清空所有数据（包括 Key 和历史记录）并重置吗？此操作无法撤销。")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  // GLOBAL CONFIGURATION (The "Timeline" Source of Truth)
  const [globalConfig, setGlobalConfig] = useState<SearchConfig>({
    timeFrame: TimeFrame.LAST_7_DAYS,
    benchmarkAccount: '',
    minSales: 300,
    priceRange: { min: 200, max: 2000 },
    dailyLimit: 20,
    keyword: '',
    platform: 'xiaohongshu', // Default Platform
    authHeaders: {
        cookie: localStorage.getItem('global_auth_cookie') || 'sajssdk_2015_cross_new_user=1; token=2B4E973FAC8C409985A1267AA7B736ED; tfstk=gOIiLmmafBG5zPlUqj-_7IsP27ap1htX-snvMnd48BRBkNn9knbc_BI9khJ9gmXDOndOXNQmCMfoDcF_5toDDnP8wuERCAtX07e3mX2oCKpmQclvgvoeDKmnh1jFCOtjdT0iydW_mi1sNI-VgH8eFKKq0C52T2RBhKlw3cyhLBOeQcJ20D-eUK3qQs-4K9RB3nRVgFyhLB920Il660ROpTjUMdE48cxmqMJMSQWwstBhYc8s5tRn0mSHmFArmBmq0MvG3_8bkcrkTNQVXHSaTbtFFwCwK3qmnpblLhJGGui6bTWFuFj0kYOf-97J-wMTCpjGEivkRXyMGGCGmFszwDON-MsDXwFi2ITVJGT5XWoM4a69XZ5U3mRc8KSPr2uzA7oXL-IElqTwdpA-C6hHrRAGkrw3K48B7p9a7J2nlNTwdpA8KJ0zPFJBQP5..; NR_MAIN_SOURCE_RECORD={"locationSearch":"","locationHref":"https://data.newrank.cn/","referrer":"https://newrank.cn/","source":"","keyword":"","firstReferrer":"https://newrank.cn/","firstLocation":"https://data.newrank.cn/"}; auth_n=3D9sh1bQx+Ym2jp/ny/XQcZwSnG6WHcwrbNG1rANl9zGBsL3Y6O+CuYt0WXLHlP+; Hm_lvt_1431a1bfefec9457e504e1b22adec281=1765829612; Hm_lpvt_1431a1bfefec9457e504e1b22adec281=1765829612; HMACCOUNT=CF030823E8C71D30; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22nr_5junnh6h4%22%2C%22first_id%22%3A%2219b23a49a67581-01df337b1e69359-1d525631-1405320-19b23a49a68170b%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E8%87%AA%E7%84%B6%E6%90%9C%E7%B4%A2%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fwww.google.com%2F%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTliMjNhNDlhNjc1ODEtMDFkZjMzN2IxZTY5MzU5LTFkNTI1NjMxLTE0MDUzMjAtMTliMjNhNDlhNjgxNzBiIiwiJGlkZW50aXR5X2xvZ2luX2lkIjoibnJfNWp1bm5oNmg0In0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22nr_5junnh6h4%22%7D%7D; _uab_collina=176582962047233431496284',
        userAgent: localStorage.getItem('global_auth_ua') || ''
    }
  });

  const [imageGenState, setImageGenState] = useState<ImageGenState>({
    mode: 'standard',
    productName: '',
    sceneDescription: '',
    atmosphere: 'studio_white',
    selectedBatchStyles: ['studio_white', 'sunlight'],
    uploadedImages: [], 
    imageCount: 4,
    seed: 12345,
    subjectLock: false,
    generatedImages: [],
    generatedScript: null,
    finalPrompt: '',
    viralTemplates: [],
    selectedTemplate: null,
    activeModel: null,
    customModelFace: null
  });

  const handleDataAnalyzed = (data: TrendItem[]) => {
    setLastAnalysis(data);
  };

  const openSidePanel = () => {
     alert("在实际插件中，此按钮将打开侧边栏模式，提供更宽敞的数据视图。");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative">
      {/* Header - Compact Mode for Plugins */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-black rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                DataFlow Pro
              </h1>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
            {[
              { id: 'dashboard', icon: LayoutGrid, label: '爆款' },
              { id: 'monitor', icon: LineChart, label: '投流' },
              { id: 'influencer', icon: Users, label: '达人' },
              { id: 'image', icon: ImageIcon, label: '图生' },
              { id: 'video', icon: Video, label: '视频' },
            ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`p-2 rounded-md transition-all flex items-center gap-1 ${
                   activeTab === tab.id 
                     ? 'bg-white text-indigo-600 shadow-sm' 
                     : 'text-slate-500 hover:text-slate-700'
                 }`}
                 title={tab.label}
               >
                 <tab.icon className="w-4 h-4" />
                 <span className="text-xs font-medium hidden md:inline">{tab.label}</span>
               </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
             <button 
                onClick={() => setShowGlobalSettings(true)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${globalKey ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                title="全局设置 / 切换账号"
             >
                <Settings className="w-4 h-4" />
                {globalKey ? 'Key已激活' : '配置Key'}
             </button>
             <button 
                onClick={openSidePanel}
                className="hidden md:flex p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                title="打开侧边栏"
             >
                <Sidebar className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 py-4">
        <div className="transition-opacity duration-300">
          {activeTab === 'dashboard' ? (
            <Dashboard 
              config={globalConfig} 
              setConfig={setGlobalConfig} 
              onDataAnalyzed={handleDataAnalyzed} 
            />
          ) : activeTab === 'monitor' ? (
             <AdMonitor />
          ) : activeTab === 'influencer' ? (
             <InfluencerSearch 
               globalTimeFrame={globalConfig.timeFrame}
               platform={globalConfig.platform}
             />
          ) : activeTab === 'image' ? (
             <ImageGenerator 
                savedState={imageGenState}
                onStateChange={setImageGenState}
                timeFrame={globalConfig.timeFrame}
             />
          ) : activeTab === 'video' ? (
            <VideoStudio />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ChatBot contextData={lastAnalysis} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Settings Modal */}
      {showGlobalSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                              <Settings className="w-5 h-5 text-indigo-600" />
                              全局设置 (Global Settings)
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">项目迁移 / API Key / 数据备份</p>
                      </div>
                      <button onClick={() => setShowGlobalSettings(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  
                  <div className="p-6 space-y-6 bg-white overflow-y-auto">
                      
                      {/* 1. API KEY SECTION */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-white rounded-lg shadow-sm">
                                <Key className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div className="flex-1">
                                  <h4 className="font-bold text-indigo-900 text-sm mb-1">配置 Google API Key</h4>
                                  <p className="text-xs text-indigo-700/80 leading-relaxed mb-4">
                                      绑定 Key 后可开启所有 AI 功能。Key 仅保存在本地，安全无忧。
                                  </p>
                                  
                                  <div className="relative">
                                      <textarea 
                                          value={globalKey}
                                          onChange={(e) => setGlobalKey(e.target.value)}
                                          placeholder="在此粘贴 Key (以 AIzaSy 开头)..."
                                          className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm h-16 resize-none"
                                      />
                                      <div className="absolute right-2 bottom-2 flex gap-1">
                                          {globalKey ? (
                                              <button 
                                                onClick={handleClearKey}
                                                className="p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-red-100 hover:text-red-500 transition-colors"
                                                title="清除 Key"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                          ) : (
                                              <button 
                                                onClick={handlePasteKey}
                                                className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded hover:bg-indigo-200 flex items-center gap-1"
                                                title="从剪贴板读取"
                                              >
                                                <Clipboard className="w-3 h-3" /> 粘贴
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* 2. ADVANCED DATA ACCESS (COOKIE INJECTION) */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                              <Shield className="w-24 h-24 text-slate-900" />
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-slate-600" />
                              高级数据源授权 (Auth Injection)
                          </h4>
                          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                              在此处粘贴第三方平台 (如蝉妈妈/小红书网页版/新榜) 的 <b>Cookie</b>。AI 将模拟已登录的会员身份访问接口，绕过反爬盾，获取真实的后台数据。
                          </p>
                          
                          <div className="space-y-3">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Session Cookie (Required)</label>
                                  <input 
                                      type="password" 
                                      value={customCookie}
                                      onChange={(e) => setCustomCookie(e.target.value)}
                                      placeholder="粘贴 Cookie 字符串 (e.g. session=abc...)"
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">User-Agent (Optional)</label>
                                  <input 
                                      type="text" 
                                      value={customUA}
                                      onChange={(e) => setCustomUA(e.target.value)}
                                      placeholder="Mozilla/5.0..."
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* 3. MIGRATION SECTION */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                          <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                              <RotateCcw className="w-4 h-4 text-slate-600" />
                              数据备份与迁移 (Migration)
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                              <button 
                                  onClick={handleExportData}
                                  className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all group"
                              >
                                  <Download className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 mb-1" />
                                  <span className="text-xs font-bold text-slate-600">导出数据备份</span>
                                  <span className="text-[9px] text-slate-400">保存为 JSON 文件</span>
                              </button>
                              
                              <div className="relative">
                                  <input 
                                      type="file" 
                                      accept=".json"
                                      className="hidden"
                                      ref={(el) => setImportRef(el)}
                                      onChange={handleImportData}
                                  />
                                  <button 
                                      onClick={() => importRef?.click()}
                                      className="w-full h-full flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all group"
                                  >
                                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-green-600 mb-1" />
                                      <span className="text-xs font-bold text-slate-600">导入/恢复数据</span>
                                      <span className="text-[9px] text-slate-400">从 JSON 文件恢复</span>
                                  </button>
                              </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-200">
                              <button 
                                  onClick={handleResetApp}
                                  className="w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
                              >
                                  <Trash2 className="w-3 h-3" /> 清空所有数据并重置应用
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                      <button 
                         onClick={() => setShowGlobalSettings(false)}
                         className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700"
                      >
                         关闭
                      </button>
                      <button 
                         onClick={handleSaveGlobalKey}
                         className={`px-6 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${keySaved ? 'bg-green-600 shadow-green-200' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}
                      >
                         {keySaved ? <CircleCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                         {keySaved ? '配置已保存' : '保存配置'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;