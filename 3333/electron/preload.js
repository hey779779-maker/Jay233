
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Navigation & System
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  
  // 1. Core Capability: Real Browser Automation (Puppeteer)
  // Sends a request to the main process to scrape a specific URL
  scrapeData: (platform, url) => ipcRenderer.invoke('puppeteer:scrape', { platform, url }),

  // 2. Core Capability: Local Video Generation (FFmpeg)
  // Sends image data and config to create a real MP4 file
  generateVideo: (config) => ipcRenderer.invoke('ffmpeg:generate', config),

  // 3. System Info
  getAppVersion: () => ipcRenderer.invoke('app:version')
});
