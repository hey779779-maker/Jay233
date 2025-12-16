import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, LoaderCircle, Download, RefreshCw, Palette, Box, Sun, Upload, X, Layers, Zap, Package, Trash2, Lock, Unlock, Dice5, Clock, Camera, Edit, Check, Copy, FileText, UserCircle, Briefcase, FileImage, LayoutGrid, CircleCheck, TrendingUp, Wand2, Shield, ShieldCheck, Shirt, ScanFace, User, ShoppingBag } from 'lucide-react';
import JSZip from 'jszip';
import { generateMarketingImage, matchProductToTrends, generateFullEcommerceSet, generateBatchProductShowcase, optimizeImageForViral, reverseEngineerPrompt } from '../services/geminiService';
import { ViralTemplate, ImageGenState, TimeFrame, MediaAsset, AIModel, ImageGenMode } from '../types';

// UPDATED: E-commerce Specific Scene Presets (Clean, Professional, Unified)
const SCENE_PRESETS = [
  { id: 'studio_white', name: '纯白影棚', label: 'Studio White', color: 'bg-slate-100 text-slate-700', prompt: 'Professional e-commerce photography, pure white background #FFFFFF, soft shadowless lighting, 8k resolution, highly detailed, clean look, product focus.' },
  { id: 'morandi', name: '高级灰调', label: 'Morandi Grey', color: 'bg-stone-100 text-stone-700', prompt: 'High-end minimalist aesthetic, soft Morandi grey tones background, concrete texture, diffuse soft box lighting, luxury vibe, matte finish.' },
  { id: 'sunlight', name: '自然光影', label: 'Natural Light', color: 'bg-orange-50 text-orange-700', prompt: 'Warm natural sunlight casting window shadows (gobo), light beige linen background, cozy lifestyle atmosphere, organic feel, morning light.' },
  { id: 'podium', name: '极简展台', label: '3D Podium', color: 'bg-indigo-50 text-indigo-700', prompt: 'Product placed on a geometric pedestal, soft pastel colors, 3D blender render style, clean composition, commercial advertising look.' },
  { id: 'street', name: '街头随拍', label: 'Urban Street', color: 'bg-blue-50 text-blue-700', prompt: 'Blurred city street background, daylight, depth of field, fashion street snap style, realistic environment, high contrast.' },
  { id: 'nature', name: '森系户外', label: 'Nature', color: 'bg-green-50 text-green-700', prompt: 'Outdoor nature setting, surrounded by green leaves and stones, dappled sunlight, fresh organic atmosphere, eco-friendly vibe.' },
];

interface ImageGeneratorProps {
  savedState?: ImageGenState;
  onStateChange?: (newState: ImageGenState) => void;
  timeFrame?: TimeFrame;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ savedState, onStateChange, timeFrame }) => {
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reverseInputRef = useRef<HTMLInputElement>(null);

  const updateState = (updates: Partial<ImageGenState>) => {
    if (onStateChange && savedState) {
      onStateChange({ ...savedState, ...updates });
    }
  };

  const state = savedState || {
    mode: 'standard', 
    productName: '',
    sceneDescription: '',
    atmosphere: 'studio_white',
    selectedBatchStyles: ['studio_white', 'sunlight'],
    uploadedImages: [], 
    imageCount: 4,
    seed: Math.floor(Math.random() * 1000000),
    subjectLock: true,
    generatedImages: [],
    generatedScript: null,
    finalPrompt: '',
    viralTemplates: [],
    selectedTemplate: null,
    activeModel: null,
    customModelFace: null,
    detailPageAssets: undefined,
    batchResults: undefined
  } as ImageGenState;

  const uploadedImages = Array.isArray(state.uploadedImages) ? state.uploadedImages : [];
  const generatedImages = Array.isArray(state.generatedImages) ? state.generatedImages : [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isFace: boolean = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files) as File[];
      const promises = fileList.map(file => new Promise<{result: string, file: File}>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ result: reader.result as string, file });
          reader.readAsDataURL(file);
      }));

      Promise.all(promises).then(results => {
          if (isFace) {
             const faceImages = results.map(r => r.result);
             updateState({ customModelFace: faceImages });
          } else {
             const newAssets: MediaAsset[] = results.map(r => ({
                id: Date.now().toString() + Math.random(),
                type: 'image',
                data: r.result,
                name: r.file.name
             }));
             updateState({ uploadedImages: [...uploadedImages, ...newAssets] });
          }
      });
    }
  };

  const removeImage = (id: string) => {
    updateState({ uploadedImages: uploadedImages.filter(img => img.id !== id) });
  };

  const toggleBatchStyle = (styleId: string) => {
      const currentStyles = state.selectedBatchStyles || [];
      if (currentStyles.includes(styleId)) {
          updateState({ selectedBatchStyles: currentStyles.filter(s => s !== styleId) });
      } else {
          updateState({ selectedBatchStyles: [...currentStyles, styleId] });
      }
  };

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      alert("请先上传产品图 (挂拍图/人台图)");
      return;
    }
    setLoading(true);
    updateState({ generatedImages: [], generatedScript: null, detailPageAssets: undefined });

    try {
      const refImages = uploadedImages.map(img => img.data);
      let images: { url: string; label?: string }[] = [];

      // Get the prompt for the selected atmosphere
      const presetPrompt = SCENE_PRESETS.find(s => s.id === state.atmosphere)?.prompt || "";
      const fullSceneDescription = `${state.sceneDescription} ${presetPrompt}`;

      // 1. DETAIL PAGE MODE (FULL 9-SET)
      if (state.mode === 'detail-page') {
         // Pass the FULL SCENE DESCRIPTION to ensure consistency across all 9 angles
         const results = await generateFullEcommerceSet(
            `${state.productName}. SCENE: ${fullSceneDescription}`, 
            refImages, 
            state.seed
         );
         images = results; // Should contain 9 images with labels
      } 
      // 2. BATCH MODE (Generate Main Images in multiple styles)
      else if (state.mode === 'batch') {
         if (!state.selectedBatchStyles || state.selectedBatchStyles.length === 0) {
             alert("请至少选择一种风格进行批量生成");
             setLoading(false);
             return;
         }
         // Map style IDs back to prompts for the batch function
         const stylePrompts = state.selectedBatchStyles.map(styleId => {
             const preset = SCENE_PRESETS.find(p => p.id === styleId);
             return preset ? preset.prompt : styleId;
         });
         
         const results = await generateBatchProductShowcase(
            `${state.productName} ${state.sceneDescription}`,
            refImages,
            state.seed,
            state.selectedBatchStyles // We pass IDs here, mapping is handled inside or labels are just the IDs
         );
         images = results.filter(r => r.image).map(r => ({ 
             url: r.image, 
             label: SCENE_PRESETS.find(p => p.id === r.style)?.name || r.style 
         }));
      }
      // 3. MAIN IMAGE / STANDARD / MODEL MODES
      else {
         const finalPrompt = `${state.productName}, ${state.sceneDescription}. Atmosphere: ${fullSceneDescription}`;
         updateState({ finalPrompt });

         const rawImages = await generateMarketingImage(
            finalPrompt,
            refImages,
            state.imageCount, 
            state.seed,
            state.subjectLock, 
            undefined, 
            state.activeModel ? { 
               description: state.activeModel.description, 
               faceImage: state.activeModel.id === 'custom' ? state.customModelFace || undefined : undefined 
            } : undefined,
            false,
            state.mode
         );
         const label = SCENE_PRESETS.find(s => s.id === state.atmosphere)?.name;
         images = rawImages.map(url => ({ url, label: label }));
      }
      
      updateState({ generatedImages: images });
    } catch (e) {
      console.error(e);
      alert("生成失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;
    const zip = new JSZip();
    
    generatedImages.forEach((img, idx) => {
        const base64Data = img.url.split(',')[1];
        const fileName = `${state.productName || 'product'}_${img.label || 'image'}_${idx + 1}.png`;
        zip.file(fileName, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `DataFlow_Assets_${Date.now()}.zip`;
    link.click();
  };

  const MODE_CONFIG = {
     'standard': { icon: Camera, label: '电商主图', desc: '生成 1-4 张高点击率主图' },
     'detail-page': { icon: LayoutGrid, label: '详情页全套', desc: '全套 9 张：正面/侧面/细节/场景/海报' },
     'mannequin': { icon: User, label: '人台转真人', desc: '人台图 -> 真实模特上身' },
     'batch': { icon: Layers, label: '批量测款', desc: '一次生成多种风格进行 A/B 测试' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* HEADER BAR */}
      <div className="lg:col-span-12 bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
                <Wand2 className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800">AIGC 电商视觉引擎</h2>
                <p className="text-xs text-slate-500">专业级商拍：主图生成 • 详情页套图 • 模特替换</p>
             </div>
         </div>
         <div className="flex gap-2">
            <button 
               onClick={() => updateState({ seed: Math.floor(Math.random() * 1000000) })}
               className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
               <Dice5 className="w-3 h-3" /> 随机种子 {state.seed % 1000}
            </button>
         </div>
      </div>

      {/* Left Sidebar: Controls */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* 1. Workflow Selection */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
           <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-wider">第一步：选择生成模式</label>
           <div className="grid grid-cols-2 gap-3">
              {(Object.entries(MODE_CONFIG) as [ImageGenMode, any][]).map(([key, conf]) => (
                 <button
                    key={key}
                    onClick={() => updateState({ mode: key })}
                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left h-20 relative overflow-hidden ${state.mode === key ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:shadow-sm'}`}
                 >
                    <div className="flex items-center gap-2 mb-1 w-full z-10">
                        <conf.icon className={`w-4 h-4 ${state.mode === key ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-bold ${state.mode === key ? 'text-indigo-800' : 'text-slate-600'}`}>{conf.label}</span>
                    </div>
                    <span className={`text-[10px] leading-tight z-10 ${state.mode === key ? 'text-indigo-600/80' : 'text-slate-400'}`}>{conf.desc}</span>
                 </button>
              ))}
           </div>
        </div>

        {/* 2. Asset Upload */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
               <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-indigo-500" />
                  上传产品原图
               </label>
               <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">建议白底/挂拍</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((img) => (
                <div key={img.id} className="aspect-[3/4] relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={img.data} alt="ref" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {uploadedImages.length < 5 && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all text-slate-400 group"
                >
                  <div className="p-2 bg-slate-100 rounded-full group-hover:bg-white mb-2 transition-colors">
                     <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-center leading-tight">点击上传</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e)} accept="image/*" multiple className="hidden" />
        </div>

        {/* 3. Scene Configuration */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-5">
             {/* Scene Input */}
             <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center justify-between">
                   <span>产品名称 & 附加描述</span>
                   <span className="text-[10px] text-indigo-500 cursor-pointer hover:underline" onClick={() => reverseInputRef.current?.click()}>反推风格 &gt;</span>
                   <input type="file" ref={reverseInputRef} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if(file) {
                         const reader = new FileReader();
                         reader.onloadend = async () => {
                            const res = await reverseEngineerPrompt(reader.result as string);
                            updateState({ sceneDescription: res.prompt });
                         };
                         reader.readAsDataURL(file);
                      }
                   }} accept="image/*" className="hidden" />
                </label>
                <div className="space-y-2">
                   <input
                      type="text"
                      value={state.productName}
                      onChange={(e) => updateState({ productName: e.target.value })}
                      placeholder="产品名称 (如：法式复古连衣裙)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                   <textarea 
                      value={state.sceneDescription}
                      onChange={(e) => updateState({ sceneDescription: e.target.value })}
                      placeholder={state.mode === 'mannequin' ? "例如：巴黎街头，阳光明媚，自然走动..." : "例如：旁边放着咖啡杯，杂志，营造松弛感..."}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs h-16 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>

             {/* Preset Selector */}
             <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block flex justify-between">
                   {state.mode === 'batch' ? '选择批量风格 (多选)' : '选择拍摄场景 (单选)'}
                   {state.mode === 'batch' && <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 rounded">已选 {state.selectedBatchStyles?.length || 0}</span>}
               </label>
               
               <div className="grid grid-cols-2 gap-2">
                  {SCENE_PRESETS.map((style) => {
                     const isSelected = state.mode === 'batch' 
                        ? state.selectedBatchStyles?.includes(style.id) 
                        : state.atmosphere === style.id;
                     
                     return (
                        <button
                           key={style.id}
                           onClick={() => {
                               if (state.mode === 'batch') {
                                   toggleBatchStyle(style.id);
                               } else {
                                   updateState({ atmosphere: style.id });
                               }
                           }}
                           className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-left flex items-center justify-between group ${
                              isSelected
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                           }`}
                        >
                           <div className="flex flex-col">
                              <span>{style.name}</span>
                              <span className={`text-[9px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>{style.label}</span>
                           </div>
                           {isSelected && <Check className="w-3 h-3" />}
                        </button>
                     );
                  })}
               </div>
             </div>

             {/* Quantity Slider (Only for Standard Mode) */}
             {state.mode === 'standard' && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-500">生成数量</label>
                        <span className="text-xs font-bold text-indigo-600">{state.imageCount} 张</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="4" 
                        step="1" 
                        value={state.imageCount}
                        onChange={(e) => updateState({ imageCount: parseInt(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                 </div>
             )}
             
             <button
               onClick={handleGenerate}
               disabled={loading}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center justify-center gap-2 transition-all mt-4 group"
             >
               {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />}
               {loading 
                  ? 'AI 正在拍摄中...' 
                  : state.mode === 'batch' 
                     ? `批量生成 ${state.selectedBatchStyles?.length || 0} 种风格` 
                     : state.mode === 'detail-page'
                        ? '一键生成全套详情页 (9张)'
                        : '开始生成'}
             </button>
        </div>
      </div>

      {/* Right Content: Studio Viewport */}
      <div className="lg:col-span-8 space-y-4">
         {/* Status Bar */}
         <div className="flex justify-between items-center text-xs text-slate-500 px-2">
            <div className="flex items-center gap-4">
               <span>状态: {loading ? <span className="text-indigo-600 font-bold animate-pulse">渲染中...</span> : <span className="text-green-600 font-bold">就绪</span>}</span>
               {generatedImages.length > 0 && <span>已生成: {generatedImages.length} 张</span>}
            </div>
            <div className="flex gap-4">
               <span>分辨率: <span className="font-bold text-slate-700">2048 x 2048</span></span>
               <span>模式: <span className="font-bold text-slate-700">{state.mode === 'detail-page' ? '详情页套图' : '主图生成'}</span></span>
            </div>
         </div>

         {/* Viewport Area */}
         <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[600px] flex flex-col p-6 relative">
            {generatedImages.length > 0 ? (
               <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CircleCheck className="w-5 h-5 text-green-500" /> 
                        {state.mode === 'detail-page' ? '详情页套图结果' : '生成结果'}
                     </h3>
                     <button onClick={handleDownloadAll} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-2">
                        <Download className="w-3 h-3" /> 打包下载
                     </button>
                  </div>

                  {/* Grid Layout - 3x3 for Detail Page, Flexible for others */}
                  <div className={`grid gap-4 ${state.mode === 'detail-page' ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-3'}`}>
                    {generatedImages.map((img, idx) => (
                       <div 
                          key={idx} 
                          className="group relative aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-zoom-in border border-slate-100"
                          onClick={() => setSelectedImageIndex(idx)}
                       >
                          <img src={img.url} className="w-full h-full object-cover" />
                          
                          {/* Label Badge */}
                          {img.label && (
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold border border-white/20">
                                  {img.label}
                              </div>
                          )}

                          {/* Hover Actions */}
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                             <a href={img.url} download={`image_${idx}.png`} onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-slate-700 shadow-lg hover:bg-white flex items-center gap-1">
                                <Download className="w-3 h-3" /> 保存
                             </a>
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  {loading ? (
                     <>
                        <LoaderCircle className="w-16 h-16 animate-spin text-indigo-500 mb-6" />
                        <h3 className="text-xl font-bold text-slate-600">
                            {state.mode === 'detail-page' ? '正在生成全套详情页...' : 'AI 正在渲染商拍图...'}
                        </h3>
                        <p className="text-sm mt-2 text-center max-w-sm">
                            {state.mode === 'detail-page' 
                                ? '正在按顺序生成：主图 -> 侧面 -> 细节 -> 场景 -> 海报 (共9张)...' 
                                : '正在计算光影、材质反射与场景融合...'}
                        </p>
                     </>
                  ) : (
                     <>
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                           <Camera className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-400">等待拍摄指令</h3>
                        <p className="text-sm mt-2 max-w-xs text-center text-slate-400">
                           请在左侧选择模式，上传产品图并选择场景。AI 将自动为您生成专业级电商素材。
                        </p>
                     </>
                  )}
               </div>
            )}
         </div>
      </div>

      {/* Lightbox */}
      {selectedImageIndex !== null && (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImageIndex(null)}>
            <img 
               src={generatedImages[selectedImageIndex].url} 
               className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" 
               onClick={(e) => e.stopPropagation()} 
            />
            {generatedImages[selectedImageIndex].label && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full font-bold backdrop-blur-md">
                    {generatedImages[selectedImageIndex].label}
                </div>
            )}
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
               <X className="w-8 h-8" />
            </button>
         </div>
      )}
    </div>
  );
};

export default ImageGenerator;