
export enum TimeFrame {
  TODAY = '今天 (24H飙升)',
  LAST_3_DAYS = '近3天 (黑马榜)',
  LAST_7_DAYS = '近7天 (稳健爆款)',
}

// ... (Keep ALL existing types, I will append the Window extension at the end)

export type Platform = 'xiaohongshu' | 'douyin' | 'taobao' | 'wechat';

export type AdPlatform = 'juguang' | 'qianchuan' | 'qianfan' | 'tecent';

export interface AuthHeaders {
  cookie: string;
  userAgent: string;
}

export interface SearchConfig {
  timeFrame: TimeFrame;
  benchmarkAccount: string;
  minSales: number;
  priceRange: {
    min: number;
    max: number;
  };
  dailyLimit: number;
  keyword?: string;
  platform: Platform;
  authHeaders?: AuthHeaders; 
}

// ... (Rest of existing types unchanged for brevity, assume they are here) ...
// ... Copy all your existing types here ...

export interface DouyinMetrics {
  sevenDaySales: number;
  cvr: number;
  commissionRate: number;
  gpm: number;
  livePeakUser: number;
  audienceGenders: { male: number; female: number };
}

export interface XhsMetrics {
  cesScore: number;
  collectRate: number;
  interactCount: { likes: number; collects: number; comments: number; shares: number };
  viralRate: number;
  noteType: 'video' | 'image';
  keywords: string[];
}

export interface WeChatMetrics {
  readCount: number;
  forwardCount: number;
  friendLikes: number;
  newRankIndex: number;
  estimatedAdValue: number;
}

export type PlatformMetrics = DouyinMetrics | XhsMetrics | WeChatMetrics;

export interface DailyMetric {
  date: string;
  sales: number;
  engagement: number;
}

export interface CrawlLog {
    timestamp: string;
    message: string;
    status: 'info' | 'success' | 'error' | 'warning' | 'encrypted';
}

export interface TrendItem {
  id: string;
  title: string;
  price: number;
  sales: number; 
  engagement: number; 
  trendScore: number;
  summary: string;
  tags: string[];
  url?: string;
  imageUrl?: string;
  history: DailyMetric[]; 
  confidence: 'high' | 'medium' | 'low'; 
  platformMetrics?: PlatformMetrics; 
  trafficSource?: { search: number; recommend: number; followers: number };
  viralVelocity?: 'explosive' | 'fast' | 'stable' | 'declining';
  crawlingStatus?: 'success' | 'partial' | 'blocked';
  crawlingLogs?: CrawlLog[];
  [key: string]: any;
}

export interface HistorySession {
  id: string;
  timestamp: number;
  keyword: string;
  platform: Platform;
  resultCount: number;
  config: SearchConfig;
  results: TrendItem[];
}

export interface NoteScript {
  title: string; 
  titleOptions: TitleOption[]; 
  videoScenes?: VideoScene[]; 
  content: string;
  topics: string[];
  safetyCheck: SafetyCheck; 
  viralDNA?: ViralDNA;
}

export interface VideoScene {
  sceneNumber: number;
  visual: string; 
  audio: string; 
  camera: string; 
  duration: string; 
}

export interface ViralDNA {
  hookType: string; 
  emotionalTriggers: string[]; 
  interactionBait: string; 
}

export interface TitleOption {
  text: string;
  style: string; 
  predictedCTR: number;
  recommended: boolean;
}

export interface SafetyCheck {
  score: number; 
  status: 'safe' | 'warning' | 'danger';
  riskyWords: string[];
  suggestion: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export type AspectRatio = '16:9' | '9:16';

export interface Influencer {
  id: string;
  name: string;
  avatar: string;
  fanCount: string;
  category: string;
  engagementRate: string;
  commercialValue: number;
  recentTags: string[];
  description: string;
  liveGmv?: string;     
}

export interface ProductSale {
  title: string;
  price: number;
  volume: string;
  revenue: string;
  date: string;
  img?: string;
}

export interface InfluencerNote {
  title: string;
  cover: string;
  likes: number;
  comments: number;
  url: string;
}

export interface InfluencerDetail {
  recentSales: ProductSale[];
  recentNotes: InfluencerNote[];
  fanGrowthData: {date: string, fans: number}[];
}

export type ScriptStyle = '种草测评' | '干货科普' | '情感共鸣' | '沉浸式Vlog';
export type TargetAudience = '通用人群' | '学生党/贫民窟女孩' | '精致宝妈' | '职场打工人' | '富婆/贵妇' | '成分党/专家' | '精致男性';

export interface ImageGenState {
  mode: ImageGenMode;
  productName: string;
  sceneDescription: string;
  atmosphere: string;
  selectedBatchStyles: string[];
  uploadedImages: MediaAsset[]; 
  imageCount: number;
  seed: number; 
  subjectLock: boolean; 
  generatedImages: { url: string; label?: string }[];
  detailPageAssets?: { header?: string; feature?: string; scene?: string }; 
  generatedScript: NoteScript | null;
  finalPrompt: string;
  viralTemplates: ViralTemplate[];
  selectedTemplate: null;
  activeModel: AIModel | null;
  customModelFace: string[] | null; 
  batchResults?: { image: string; style: string }[];
}

export type ImageGenMode = 'standard' | 'mannequin' | 'model-swap' | 'batch' | 'detail-page';

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  data: string; 
  name: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string; 
  avatar: string; 
}

export interface ViralTemplate {
  name: string;
  description: string; 
  matchScore: number;
}

export interface ProductPrediction {
  platform: Platform;
  score: number; 
  level: 'S+' | 'S' | 'A' | 'B' | 'C';
  analysis: string;
  pros: string[];
  cons: string[];
  suggestions: string[];
}

export interface DiagnosisResult {
  score: number; 
  level: 'S' | 'A' | 'B' | 'C' | 'D';
  overview: string;
  radar: {
    platformWeight: number; 
    userExperience: number; 
    commercialConversion: number; 
    contentVerticality: number; 
    visualEsthetics: number; 
  };
  problems: string[]; 
  solutions: string[]; 
}

export interface AdCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'learning' | 'failed';
  platform: AdPlatform;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; 
  cvr: number; 
  roi: number;
  cpc: number; 
  targetAudienceScore: number; 
}

export interface OptimizationSuggestion {
  id: string;
  type: 'bid' | 'creative' | 'audience' | 'budget';
  action: string;
  reason: string;
  impactPrediction: string;
  status: 'pending' | 'applied';
}

export interface StrategicPlan {
  month: number;
  category: string;
  historicalAnalysis: YearlyData[]; 
  prediction2025: {
    coreKeywords: string[];
    contentDirection: string;
    productFocus: string;
    opportunity: string;
  };
}

export interface YearlyData {
  year: string;
  context: string;
  keywords: YearKeyword[];
}

export interface YearKeyword {
  keyword: string;
  volume: number;
  growth: number;
  tag: string;
}

export interface StrategyItem {
  title: string;
  action: string;
  reason: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- ELECTRON EXTENSION ---
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      close: () => void;
      scrapeData: (platform: string, url: string) => Promise<{ success: boolean; data: any; error?: string }>;
      generateVideo: (config: { images: string[]; duration: number }) => Promise<{ success: boolean; path: string; error?: string }>;
      getAppVersion: () => Promise<string>;
    };
  }
}
