import React, { useState, useEffect, useRef } from 'react';
import { Video, Film, LoaderCircle, Sparkles, AlertCircle, RefreshCw, ExternalLink, CreditCard, Upload, Wand2, X, Image as ImageIcon, Settings2, Info, Clock, PlayCircle, Camera, Move, Zap, Aperture, Save, RotateCcw, TriangleAlert, Crown, CircleCheck, Key, Search, ShieldCheck, ShieldAlert, ChevronDown, Plus, Layers, Palette, Grid, Sun } from 'lucide-react';
import { generateVeoVideo, extractVideoScript, validateVeoAccess } from '../services/geminiService';
import { AspectRatio } from '../types';

// --- NEW: 30+ MAINSTREAM VIDEO FILTERS / STYLES ---
const VIDEO_STYLES = [
  {
    category: 'Commercial (商业大片)',
    icon: Camera,
    items: [
      { id: 'cinematic-pan', name: '电影推拉', prompt: 'Cinematic slow push-in, high-end commercial look, smooth motion.' },
      { id: 'apple-style', name: '极简白底', prompt: 'Apple product commercial style, pure white background, soft shadowless lighting, clean minimal.' },
      { id: 'luxury-dark', name: '奢华黑金', prompt: 'Luxury dark atmosphere, golden rim lighting, elegant reflection, premium watch advertisement style.' },
      { id: 'macro-detail', name: '微距特写', prompt: 'Extreme close-up macro shot, shallow depth of field, revealing texture details, slow focus pull.' },
      { id: 'orbit-360', name: '360°环绕', prompt: 'Smooth 360 degree orbit around the product, keeping subject in center focus.' },
      { id: 'fast-cut', name: '动感卡点', prompt: 'Fast-paced rhythmic transitions, energetic motion, dynamic lighting changes.' }
    ]
  },
  {
    category: 'Social (社交爆款)',
    icon: PlayCircle,
    items: [
      { id: 'tiktok-viral', name: '抖音爆款', prompt: 'TikTok trending style, bright saturated colors, high contrast, engaging and catchy.' },
      { id: 'vlog-handheld', name: '手持Vlog', prompt: 'Authentic handheld camera shake, POV perspective, natural lifestyle vibe, immersive.' },
      { id: 'unboxing', name: '沉浸开箱', prompt: 'First person POV unboxing experience, satisfying movement, ASMR visual trigger.' },
      { id: 'fashion-snap', name: '街拍快闪', prompt: 'Street fashion snap style, urban background, flash photography feel, trendy.' },
      { id: 'soft-filter', name: '磨皮柔光', prompt: 'Soft beauty filter, dreamy haze, pastel tones, Xiaohongshu aesthetic.' },
      { id: 'split-screen', name: '分屏互动', prompt: 'Dynamic split screen effect, showing different angles simultaneously, pop art style.' }
    ]
  },
  {
    category: 'Retro (复古胶片)',
    icon: Film,
    items: [
      { id: 'vhs-90s', name: '90s VHS', prompt: '1990s VHS tape aesthetic, glitch lines, chromatic aberration, lo-fi nostalgic.' },
      { id: 'hk-movie', name: '港风滤镜', prompt: 'Wong Kar-wai style, neon green and red tint, moody atmosphere, motion blur, cinematic grain.' },
      { id: 'film-16mm', name: '16mm胶片', prompt: 'Vintage 16mm film look, dust and scratches, warm kodak colors, nostalgic grain.' },
      { id: 'polaroid', name: '宝丽来', prompt: 'Polaroid aesthetics, high contrast, faded blacks, vintage white frame border effect.' },
      { id: 'black-white', name: '经典黑白', prompt: 'Classic Black and White film noir, high contrast lighting, dramatic shadows, timeless.' },
      { id: 'y2k', name: '千禧Y2K', prompt: 'Y2K aesthetic, metallic textures, futuristic cyber vibes, neon pink and blue.' }
    ]
  },
  {
    category: 'Artistic (艺术特效)',
    icon: Palette,
    items: [
      { id: 'cyberpunk', name: '赛博朋克', prompt: 'Cyberpunk city night, neon rain, futuristic reflections, blue and pink lighting.' },
      { id: 'anime', name: '日漫风格', prompt: 'Japanese anime style, cel shaded, vibrant colors, Makoto Shinkai sky.' },
      { id: 'oil-painting', name: '油画质感', prompt: 'Animated oil painting style, visible brush strokes, artistic impressionism.' },
      { id: 'sketch', name: '素描手绘', prompt: 'Pencil sketch animation, rough lines, paper texture background, artistic.' },
      { id: 'claymation', name: '黏土定格', prompt: 'Stop motion claymation style, plasticine texture, playful and cute.' },
      { id: 'low-poly', name: '低多边形', prompt: 'Low poly 3D render, geometric shapes, minimalist digital art style.' }
    ]
  },
  {
    category: 'Nature (光影氛围)',
    icon: Sun,
    items: [
      { id: 'golden-hour', name: '落日余晖', prompt: 'Golden hour lighting, warm sun flare, romantic atmosphere, long shadows.' },
      { id: 'underwater', name: '深海潜游', prompt: 'Underwater view, caustics light patterns, bubbles, floating weightless feel.' },
      { id: 'forest-dapple', name: '林间斑驳', prompt: 'Forest setting, dappled sunlight through leaves, organic nature vibe.' },
      { id: 'rainy-day', name: '雨夜霓虹', prompt: 'Rainy window reflection, cozy atmosphere, blurred city lights in background.' },
      { id: 'drone-view', name: '上帝视角', prompt: 'Aerial drone shot, high angle looking down, epic scale, gliding movement.' },
      { id: 'slow-mo', name: '极致慢动作', prompt: 'Super slow motion (phantom flex), fluid movement, capturing droplets or dust.' }
    ]
  }
];

const VEO_MODELS = [
    { id: 'veo-2.0-generate-preview-001', name: 'Veo 2.0 (Stable)', badge: 'Recommended', desc: '稳定版模型，兼容性最好 (默认)' },
    { id: 'veo-3.1-fast-generate-preview', name: 'Veo Fast 3.1', badge: 'New', desc: '最新极速版 (如报错 404 请切换回 2.0)' },
    { id: 'veo-3.1-generate-preview', name: 'Veo Pro 3.1', badge: 'High Res', desc: '高画质预览版 (需白名单权限)' },
];

const DEFAULT_MODELS = {
    fast: 'gemini-2.5-flash', // Free/Demo
    quality: 'veo-2.0-generate-preview-001' // Changed default to 2.0 to prevent 404s
};

const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  // Model Configuration State
  const [modelType, setModelType] = useState<'quality' | 'fast'>('fast');
  const [activeModelId, setActiveModelId] = useState(DEFAULT_MODELS.fast);
  
  // Custom API Key State - NOW USING GLOBAL KEY
  const [customApiKey, setCustomApiKey] = useState('');
  
  // Testing State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<{status: 'success' | 'partial' | 'error' | null, message: string}>({ status: null, message: '' });

  const [duration, setDuration] = useState<number>(5);
  
  // Style Selection State
  const [activeCategory, setActiveCategory] = useState<string>(VIDEO_STYLES[0].category);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('cinematic-pan');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzingVideo, setAnalyzingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [showSettings, setShowSettings] = useState(false);
  
  // Inputs
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  // CHANGED: Multi-image array for product
  const [productImages, setProductImages] = useState<string[]>([]);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkKeyStatus();
    const storedKey = localStorage.getItem('global_gemini_api_key');
    if (storedKey) setCustomApiKey(storedKey);
    
    const handleStorageChange = () => {
        const newKey = localStorage.getItem('global_gemini_api_key');
        if (newKey !== customApiKey) {
            setCustomApiKey(newKey || '');
            if (newKey) setKeyStatus('valid');
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update active model ID when type changes
  useEffect(() => {
      if (modelType === 'fast') {
          setActiveModelId(DEFAULT_MODELS.fast);
      } else {
          if (!activeModelId.includes('veo')) {
              setActiveModelId(DEFAULT_MODELS.quality);
          }
      }
      setError(null);
  }, [modelType]);

  // Progress Simulation
  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgress(0);
      const baseTime = modelType === 'fast' ? 5000 : 180000; 
      const scale = duration / 5;
      const estimatedDuration = baseTime * (1 + Math.log2(scale)); 
      const step = 100 / (estimatedDuration / 500); 
      
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return 95;
          return prev + step;
        });
      }, 500);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading, modelType, duration]);

  const checkKeyStatus = async () => {
    const storedKey = localStorage.getItem('global_gemini_api_key');
    if (storedKey) {
        setKeyStatus('valid');
        return;
    }
    try {
      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        setKeyStatus(hasKey ? 'valid' : 'invalid');
      }
    } catch (e) {
      console.error("Key check failed", e);
    }
  };
  
  const handleSaveCustomKey = (val: string) => {
      const cleanKey = val.trim();
      setCustomApiKey(cleanKey);
      if (cleanKey) {
          localStorage.setItem('global_gemini_api_key', cleanKey);
          setKeyStatus('valid');
      } else {
          localStorage.removeItem('global_gemini_api_key');
          setKeyStatus('invalid');
      }
      setKeyTestResult({ status: null, message: '' });
  };

  const handleTestKey = async () => {
      if (!customApiKey) return;
      setIsTestingKey(true);
      setKeyTestResult({ status: null, message: '正在连接 Google Cloud...' });
      try {
          const result = await validateVeoAccess(customApiKey);
          if (result.basic) {
              setKeyTestResult({ 
                  status: 'success', 
                  message: '连接成功！全站功能已激活' 
              });
              setKeyStatus('valid');
          } else {
              setKeyTestResult({ 
                  status: 'error', 
                  message: `连接失败: ${result.error || 'Key 无效'}` 
              });
              setKeyStatus('invalid');
          }
      } catch (e) {
          setKeyTestResult({ status: 'error', message: '网络错误或 Key 格式不正确' });
      } finally {
          setIsTestingKey(false);
      }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        if (file.size > 50 * 1024 * 1024) {
           alert("视频文件过大，请上传 50MB 以内的片段。");
           return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
           setUploadedVideo(reader.result as string);
        };
        reader.readAsDataURL(file);
     }
  };

  // CHANGED: Support multiple product images
  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
       Array.from(files).forEach((file: any) => {
           const reader = new FileReader();
           reader.onloadend = () => {
               if (reader.result) {
                   setProductImages(prev => [...prev, reader.result as string]);
               }
           };
           reader.readAsDataURL(file);
       });
    }
    // Clear input to allow re-uploading same file if needed
    if (productInputRef.current) productInputRef.current.value = '';
 };

 const removeProductImage = (index: number) => {
     setProductImages(prev => prev.filter((_, i) => i !== index));
 };

  const handleExtractScript = async () => {
     if (!uploadedVideo && productImages.length === 0) return;
     setAnalyzingVideo(true);
     try {
        // Pass both video and ALL product images
        const script = await extractVideoScript(uploadedVideo, productImages);
        
        let stylePrompt = "";
        // Find selected style prompt
        for (const cat of VIDEO_STYLES) {
            const found = cat.items.find(i => i.id === selectedStyleId);
            if (found) stylePrompt = found.prompt;
        }
        
        let finalPrompt = "";
        if (productImages.length > 0) {
           finalPrompt = `Commercial Product Video. \n\nCORE SUBJECT:\nShow the exact product from the uploaded image(s). Maintain its color, material, and logo visibility.\n\nAI ANALYSIS & MOVEMENT:\n${script}\n\nFILTER STYLE:\n${stylePrompt}\n\nQUALITY:\n4k resolution, photorealistic lighting, no CGI artifacts.`;
        } else {
           finalPrompt = `Cinematic Video. \n\nSCENE:\n${script}\n\nFILTER STYLE:\n${stylePrompt}\n\nQUALITY:\nPhotorealistic, 4k.`;
        }
        setPrompt(finalPrompt);
     } catch (e) {
        console.error(e);
        alert("视频分析失败");
     } finally {
        setAnalyzingVideo(false);
     }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        if (productImages.length > 0 || uploadedVideo) {
            await handleExtractScript();
            if (!prompt.trim()) { 
                alert("请先填写生成指令，或点击'智能缝合'按钮自动生成。"); 
                return; 
            }
        } else {
            return;
        }
    }
    
    setLoading(true);
    setError(null);
    setVideoUrl(null);

    const aiStudio = (window as any).aistudio;

    let finalPrompt = prompt;
    if (!prompt.includes('FILTER STYLE')) {
        let stylePrompt = "";
        for (const cat of VIDEO_STYLES) {
            const found = cat.items.find(i => i.id === selectedStyleId);
            if (found) stylePrompt = found.prompt;
        }
        finalPrompt += `\n\nFILTER STYLE: ${stylePrompt}`;
    }

    try {
      if (!customApiKey && aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) await aiStudio.openSelectKey();
      }

      // Pass the activeModelId AND the customApiKey (if any)
      // Note: We use the FIRST image as the primary reference for Veo, 
      // but the prompt (generated from all images) guides the 3D structure.
      const url = await generateVeoVideo(
          finalPrompt, 
          aspectRatio, 
          activeModelId, 
          productImages.length > 0 ? productImages[0] : undefined, 
          duration,
          customApiKey || undefined
      );
      
      setVideoUrl(url);
      setKeyStatus('valid');

    } catch (err: any) {
      console.error("Video Generation Error:", err);
      let errorMsg = err.message || "未知错误";
      
      // AUTO FALLBACK LOGIC
      if ((errorMsg === 'VEO_MODEL_NOT_FOUND' || errorMsg.includes('404')) && activeModelId.includes('3.1')) {
          console.log("Model 3.1 not found (404). Attempting auto-fallback to Veo 2.0...");
          try {
             const fallbackId = 'veo-2.0-generate-preview-001';
             const fallbackUrl = await generateVeoVideo(
                  finalPrompt, 
                  aspectRatio, 
                  fallbackId, 
                  productImages.length > 0 ? productImages[0] : undefined, 
                  duration,
                  customApiKey || undefined
             );
             setVideoUrl(fallbackUrl);
             setKeyStatus('valid');
             setActiveModelId(fallbackId); 
             setLoading(false);
             return; 
          } catch (fallbackErr: any) {
             console.error("Fallback failed:", fallbackErr);
             errorMsg = "VEO_MODEL_NOT_FOUND";
          }
      }

      if (errorMsg.includes('VEO_MODEL_NOT_FOUND')) {
         setKeyStatus('invalid'); 
         setError("MODEL_NOT_FOUND");
         return;
      }
      if (errorMsg.includes('VEO_PERMISSION_DENIED')) {
         setKeyStatus('invalid');
         setError("PERMISSION_ISSUE");
         return;
      }
      if (errorMsg.includes('INVALID_API_KEY')) {
          setKeyStatus('invalid');
          setError("Key 无效");
          return;
      }
      
      if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED')) errorMsg = "权限不足 (403): 请检查该 Key 是否已启用 Veo API。";
      else if (errorMsg.includes('429') || errorMsg.includes('VEO_QUOTA_EXCEEDED')) errorMsg = "请求过于频繁 (Quota Exceeded)，请稍后再试。";

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedTime = () => {
     let time = modelType === 'fast' ? 45 : 180;
     if (duration > 5) time = time * (1 + Math.log2(duration/5));
     if (time < 60) return `${Math.ceil(time)} 秒`;
     return `${Math.ceil(time/60)} 分钟`;
  };

  const isVeoMode = activeModelId.toLowerCase().includes('veo');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg"><Film className="w-6 h-6 text-red-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">AI 视频创作 (Veo Studio)</h2>
              <p className="text-sm text-slate-500">商业级视频生成：支持双流输入、30+ 滤镜风格与时长定制</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                title="高级配置 (Model Settings)"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              
              {keyStatus === 'valid' && !error ? (
                 <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1.5 rounded-lg flex items-center gap-1 border border-green-100"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Key 活跃</span>
              ) : (
                 <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer border border-amber-100 hover:bg-amber-100" onClick={() => setShowSettings(true)}>
                    <RefreshCw className="w-3 h-3" /> 配置 Key
                 </span>
              )}
          </div>
        </div>

        {/* --- INFO BANNER --- */}
        {!isVeoMode ? (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="p-1.5 bg-slate-200 rounded-full"><Info className="w-4 h-4 text-slate-600" /></div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-700">演示模式 (Fast / Free)</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">使用免费模型模拟生成流程。生成的视频将为测试样本。</p>
                </div>
            </div>
        ) : (
            <div className="mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 animate-in fade-in">
                <div className="p-1.5 bg-indigo-200 rounded-full"><Crown className="w-4 h-4 text-indigo-700" /></div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-indigo-800">专业模式 (Veo / Paid Key)</h4>
                    <p className="text-[10px] text-indigo-600 leading-tight">将调用 Veo 模型生成真实视频。请确保您在设置中绑定了付费 API Key。</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: CONFIGURATION */}
          <div className="space-y-6">
            
            {/* 1. Dual Upload Area */}
            <div className="space-y-4">
              
              {/* Product Gallery (Multi-Image) */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 justify-between">
                    <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> 1. 产品实物 (支持多角度)</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">建议上传: 正面/侧面/细节</span>
                 </label>
                 
                 <div className="grid grid-cols-4 gap-2">
                    {/* Upload Button */}
                    <div 
                        onClick={() => productInputRef.current?.click()} 
                        className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-slate-400 hover:text-indigo-500"
                    >
                        <Plus className="w-5 h-5 mb-1" />
                        <span className="text-[9px]">上传图片</span>
                    </div>
                    
                    {/* Image List */}
                    {productImages.map((img, idx) => (
                        <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            {idx === 0 && (
                                <div className="absolute top-0 left-0 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-br font-bold shadow-sm">
                                    主参考
                                </div>
                            )}
                            <button 
                                onClick={() => removeProductImage(idx)}
                                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                 </div>
                 <input type="file" ref={productInputRef} onChange={handleProductUpload} accept="image/*" multiple className="hidden" />
              </div>

              {/* Reference Video */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Video className="w-3 h-3" /> 2. 参考视频 (可选)
                 </label>
                 <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-24 relative group hover:border-red-400 transition-all">
                    {!uploadedVideo ? (
                       <div onClick={() => videoInputRef.current?.click()} className="w-full h-full flex items-center justify-center gap-2 cursor-pointer text-slate-400 hover:bg-slate-100 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-[10px]">上传参考运镜/节奏视频</span>
                       </div>
                    ) : (
                       <div className="w-full h-full bg-black relative flex items-center justify-center">
                          <video src={uploadedVideo} className="h-full object-contain" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <span className="text-white text-xs font-bold flex items-center gap-1"><CircleCheck className="w-3 h-3" /> 已上传</span>
                          </div>
                          <button onClick={() => setUploadedVideo(null)} className="absolute top-2 right-2 p-1 bg-white/20 text-white rounded-full hover:bg-red-600 z-10"><X className="w-3 h-3" /></button>
                       </div>
                    )}
                 </div>
                 <input type="file" ref={videoInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" />
              </div>
            </div>

            {/* 2. Filter & Style Selector (Grouped) */}
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Palette className="w-3 h-3" /> 3. 滤镜与风格 (Video Filters)
               </label>
               
               {/* Category Tabs */}
               <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                   {VIDEO_STYLES.map(cat => (
                       <button
                          key={cat.category}
                          onClick={() => setActiveCategory(cat.category)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 transition-all ${activeCategory === cat.category ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                       >
                           <cat.icon className="w-3 h-3" />
                           {cat.category.split(' ')[0]}
                       </button>
                   ))}
               </div>

               {/* Grid of Filters */}
               <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
                  {VIDEO_STYLES.find(c => c.category === activeCategory)?.items.map(style => (
                     <button
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        className={`p-2 rounded-lg border text-left transition-all relative overflow-hidden group ${selectedStyleId === style.id ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                     >
                        <div className="relative z-10">
                            <span className={`text-[10px] font-bold block ${selectedStyleId === style.id ? 'text-indigo-700' : 'text-slate-700'}`}>{style.name}</span>
                            <span className="text-[8px] text-slate-400 line-clamp-1">{style.id}</span>
                        </div>
                        {selectedStyleId === style.id && (
                            <div className="absolute top-0 right-0 p-1">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            </div>
                        )}
                     </button>
                  ))}
               </div>
            </div>

            {/* Smart Synthesis Button */}
            <button
               onClick={handleExtractScript}
               disabled={!uploadedVideo && productImages.length === 0}
               className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
               {analyzingVideo ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
               {analyzingVideo ? 'AI 正在融合多角度特征...' : '4. 智能融合 (Multimodal Fusion)'}
            </button>

            {/* Prompt Editor */}
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="在此输入或自动生成视频指令..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none resize-none font-mono"
            />

            {/* Settings */}
            <div className="grid grid-cols-3 gap-3">
               <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">比例</label>
                  <div className="flex bg-slate-100 rounded p-0.5">
                     {['16:9', '9:16'].map(r => (
                        <button key={r} onClick={() => setAspectRatio(r as any)} className={`flex-1 py-1 text-[10px] rounded ${aspectRatio === r ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{r}</button>
                     ))}
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">时长</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full py-1 text-xs bg-slate-100 rounded border-transparent focus:border-red-500">
                     {[5, 10, 30, 60].map(s => <option key={s} value={s}>{s}秒</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">模型选择</label>
                  <div className="flex bg-slate-100 rounded p-0.5">
                     <button onClick={() => setModelType('fast')} className={`flex-1 py-1 text-[10px] rounded flex items-center justify-center gap-1 ${modelType === 'fast' ? 'bg-white shadow text-slate-700' : 'text-slate-500'}`}>
                         ⚡ Fast
                     </button>
                     <button onClick={() => setModelType('quality')} className={`flex-1 py-1 text-[10px] rounded flex items-center justify-center gap-1 ${modelType === 'quality' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}>
                         🎥 Pro
                     </button>
                  </div>
               </div>
            </div>

            {/* Generate Button & Errors */}
            <div className="space-y-3">
               {error && (
                  <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 border ${
                    error === "PERMISSION_ISSUE" || error === "MODEL_NOT_FOUND" ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-red-50 text-red-800 border-red-100"
                  }`}>
                     <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error === "PERMISSION_ISSUE" ? "需付费 Key 权限 (403)" : 
                         error === "MODEL_NOT_FOUND" ? "模型 ID 无效 (404)" :
                         "生成请求失败"}
                     </div>
                     
                     <p className="leading-relaxed opacity-90">
                        {error === "PERMISSION_ISSUE" 
                           ? "您的 Key 似乎没有 Veo API 的访问权限。请确保 GCP 项目已启用 Vertex AI 且 Billing 已激活。" 
                           : error === "MODEL_NOT_FOUND" 
                                ? `当前模型 (${activeModelId}) 不存在或无权访问。建议切换到 Veo 2.0 (Stable)。`
                                : error}
                     </p>

                     {(error === "PERMISSION_ISSUE" || error === "MODEL_NOT_FOUND" || error === "Key 无效") && (
                        <div className="flex gap-3 mt-2 flex-wrap">
                           {error === "MODEL_NOT_FOUND" && (
                               <button 
                                  onClick={() => { 
                                      setActiveModelId('veo-2.0-generate-preview-001'); 
                                      setError(null); 
                                  }} 
                                  className="px-4 py-2 bg-indigo-600 text-white border border-indigo-700 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-sm"
                               >
                                  <RefreshCw className="w-3 h-3" /> 
                                  切换到 Veo 2.0 (Stable)
                               </button>
                           )}
                           <button 
                              onClick={() => setShowSettings(true)} 
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center gap-1"
                           >
                              <Key className="w-3 h-3" /> 检查 Key / 模型
                           </button>
                           <button 
                              onClick={() => setModelType('fast')} 
                              className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded-lg font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
                           >
                              <RotateCcw className="w-3 h-3" /> 返回演示模式
                           </button>
                        </div>
                     )}
                  </div>
               )}
               
               <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full py-4 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                      !isVeoMode 
                      ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-200' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200'
                  }`}
               >
                  {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {loading 
                    ? `渲染中... (${Math.round(progress)}%)` 
                    : !isVeoMode 
                        ? '模拟生成 (免费演示版)' 
                        : '立即生成 (消耗额度)'}
               </button>
            </div>
          </div>

          {/* RIGHT: PREVIEW STAGE */}
          <div className="bg-slate-950 rounded-xl overflow-hidden relative min-h-[600px] border border-slate-800 shadow-2xl flex flex-col items-center justify-center">
             {videoUrl ? (
                <div className="w-full h-full flex flex-col animate-in fade-in duration-700">
                   <video src={videoUrl} controls autoPlay loop className="flex-1 w-full h-full object-contain bg-black" />
                   <div className="bg-slate-900 p-4 flex justify-between items-center border-t border-slate-800">
                      <div className="text-xs text-slate-400">
                         <span className="text-white font-bold">{isVeoMode ? activeModelId : 'Demo Mode'}</span> • {aspectRatio} • {duration}s
                      </div>
                      <a href={videoUrl} download target="_blank" className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded hover:bg-slate-200 transition-colors flex items-center gap-2">
                         <ExternalLink className="w-3 h-3" /> 下载 MP4
                      </a>
                   </div>
                </div>
             ) : (
                <div className="text-center p-8 max-w-sm">
                   {loading ? (
                      <div className="space-y-6">
                         <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                               <span className="text-xl font-bold text-white">{Math.round(progress)}%</span>
                            </div>
                         </div>
                         <div>
                            <h3 className="text-white font-bold text-lg mb-1">{isVeoMode ? 'Veo 正在进行物理渲染...' : '正在生成演示样本...'}</h3>
                            <p className="text-slate-500 text-xs">预计剩余: {getEstimatedTime()}</p>
                         </div>
                         <div className="text-[10px] text-slate-600 bg-slate-900 p-3 rounded border border-slate-800">
                            正在计算 {VIDEO_STYLES.flatMap(c=>c.items).find(i=>i.id===selectedStyleId)?.name} 风格与 {productImages.length} 个视角的融合...
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-4 opacity-40">
                         <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                            <PlayCircle className="w-10 h-10 text-white" />
                         </div>
                         <p className="text-slate-400 text-sm">配置左侧参数，点击生成预览</p>
                      </div>
                   )}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* ADVANCED SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Settings2 className="w-5 h-5 text-indigo-600" />
                          高级配置 (Settings)
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      {/* Model ID Selector - NEW COMPONENT */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Model Selection (Veo Version)</label>
                          <div className="space-y-2">
                              {VEO_MODELS.map(m => (
                                  <div 
                                    key={m.id}
                                    onClick={() => setActiveModelId(m.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        activeModelId === m.id 
                                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                      <div className="flex justify-between items-center mb-1">
                                          <div className="flex items-center gap-2">
                                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${activeModelId === m.id ? 'border-indigo-600' : 'border-slate-300'}`}>
                                                  {activeModelId === m.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                                              </div>
                                              <span className={`text-sm font-bold ${activeModelId === m.id ? 'text-indigo-900' : 'text-slate-700'}`}>{m.name}</span>
                                          </div>
                                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                              m.badge.includes('High Res') ? 'bg-purple-100 text-purple-700' : m.badge.includes('New') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                          }`}>{m.badge}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 pl-5">{m.desc}</p>
                                  </div>
                              ))}
                              
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-bold pl-5">Custom ID</span>
                                  </div>
                                  <input 
                                     type="text" 
                                     value={activeModelId}
                                     onChange={(e) => setActiveModelId(e.target.value)}
                                     placeholder="Or type custom model ID..."
                                     className="w-full mt-1 p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* API Key Management - NOW WITH INPUT & TEST */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Account & Billing (Global Project)</label>
                          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 mb-4">
                              <div className="flex items-start gap-2 mb-3">
                                  <Crown className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-indigo-800 leading-relaxed">
                                      如需切换到新的 AI Studio 项目，请在此输入新的 <b>Google Cloud API Key</b>。此操作将影响整个应用的计费项目。
                                  </p>
                              </div>
                              <div className="relative">
                                  <input 
                                     type="text"
                                     value={customApiKey}
                                     onChange={(e) => handleSaveCustomKey(e.target.value)}
                                     placeholder="Paste API Key starting with AIza..."
                                     className="w-full pl-3 pr-20 py-3 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                  />
                                  <button 
                                     onClick={handleTestKey}
                                     disabled={!customApiKey || isTestingKey}
                                     className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-[10px] font-bold transition-colors disabled:opacity-50"
                                  >
                                     {isTestingKey ? '检测中...' : '测试连接'}
                                  </button>
                              </div>
                              
                              {/* Test Result Feedback */}
                              {keyTestResult.status && (
                                  <div className={`mt-2 p-2 rounded text-xs flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-1 ${
                                      keyTestResult.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                      {keyTestResult.status === 'success' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                      {keyTestResult.message}
                                  </div>
                              )}

                              <p className="text-[10px] text-indigo-400 mt-2">
                                 Key 将仅存储在本地浏览器中 (LocalStorage)，不会上传服务器。
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                      <button 
                          onClick={() => { setActiveModelId(DEFAULT_MODELS.fast); setModelType('fast'); }}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                          <RotateCcw className="w-3 h-3" /> 恢复默认
                      </button>
                      <button 
                          onClick={() => setShowSettings(false)}
                          className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black flex items-center gap-2 shadow-sm"
                      >
                          <Save className="w-3 h-3" /> 保存并关闭
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default VideoStudio;