
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const puppeteer = require('puppeteer-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fixPath = require('fix-path');

// Fix PATH on macOS/Linux to find Chrome
fixPath();

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

let mainWindow;

// --- CONFIGURATION ---
// Attempt to find Google Chrome automatically. 
// Users typically have Chrome installed, which is better than downloading Chromium (100MB+).
const getChromePath = () => {
  const platform = process.platform;
  if (platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  } else if (platform === 'win32') {
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else {
    return '/usr/bin/google-chrome';
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    frame: false, // Frameless for custom UI feel
    titleBarStyle: 'hidden',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading local resources if needed
    }
  });

  // Load Vite dev server or build
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(startUrl);
    // mainWindow.webContents.openDevTools(); // Optional: Debugging
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS (THE BACKEND LOGIC) ---

// 1. Window Controls
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-close', () => mainWindow.close());

// 2. PUPPETEER SCRAPER (The "Deep Recon" Feature)
ipcMain.handle('puppeteer:scrape', async (event, { platform, url }) => {
  console.log(`[Puppeteer] Starting scrape for ${platform}: ${url}`);
  let browser;
  try {
    const executablePath = getChromePath();
    if (!fs.existsSync(executablePath)) {
      throw new Error(`Chrome not found at ${executablePath}. Please install Google Chrome.`);
    }

    // Launch a visible browser so the user can see it working (and manually solve Captchas if needed)
    browser = await puppeteer.launch({
      executablePath: executablePath,
      headless: false, // SHOW THE BROWSER
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
      // Use a persistent user data dir to save Login Sessions!
      userDataDir: path.join(app.getPath('userData'), 'puppeteer_session') 
    });

    const page = await browser.newPage();
    
    // Set a real User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`[Puppeteer] Navigating...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for a bit to let JS render (handling SPAs like Chanmama/XHS)
    // In a real app, we would wait for specific selectors.
    await new Promise(r => setTimeout(r, 5000));

    // Scrape Data based on Platform
    let result = {};
    
    if (platform === 'chanmama' || url.includes('chanmama')) {
       // Example: Scrape Chanmama Title and Sales
       result = await page.evaluate(() => {
          // This logic would be tailored to the specific DOM structure of Chanmama
          const title = document.title;
          const bodyText = document.body.innerText.substring(0, 500); // Grab summary
          return { title, rawData: bodyText, platform: 'chanmama' };
       });
    } else {
       // Generic Scrape
       result = await page.evaluate(() => {
          return {
             title: document.title,
             htmlSample: document.body.innerHTML.substring(0, 1000)
          };
       });
    }

    console.log(`[Puppeteer] Scrape success`);
    
    // Close automatically after 2 seconds
    setTimeout(() => browser.close(), 2000);
    
    return { success: true, data: result };

  } catch (error) {
    console.error('[Puppeteer] Error:', error);
    if (browser) browser.close();
    return { success: false, error: error.message };
  }
});

// 3. FFMPEG VIDEO GENERATOR (The "Real Video" Feature)
ipcMain.handle('ffmpeg:generate', async (event, config) => {
  const { images, duration, fps = 30 } = config;
  console.log(`[FFmpeg] Generating video from ${images.length} images...`);

  try {
    const downloadsPath = app.getPath('downloads');
    const timestamp = Date.now();
    const outputFilename = `DataFlow_Video_${timestamp}.mp4`;
    const outputPath = path.join(downloadsPath, outputFilename);
    const tempDir = path.join(app.getPath('temp'), `df_video_${timestamp}`);

    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // 1. Save Base64 images to temp files
    const imageFiles = [];
    images.forEach((base64Str, index) => {
      const match = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        const ext = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const filePath = path.join(tempDir, `img_${String(index).padStart(3, '0')}.${ext}`);
        fs.writeFileSync(filePath, buffer);
        imageFiles.push(filePath);
      }
    });

    if (imageFiles.length === 0) throw new Error("No valid images provided");

    // 2. Run FFmpeg
    // Simple slideshow: each image shows for X seconds
    // Complex filter to crossfade or just concat
    return new Promise((resolve, reject) => {
        // Create a simple input file list for ffmpeg concat demuxer
        // Duration per image calculation
        const durationPerImage = duration / imageFiles.length;
        
        // Using a complex filter for slideshow is better, but let's stick to a simple framerate loop for stability
        // Better approach for stability: Loop the first image or concat all?
        // Let's use the first image looped for the duration (simple MVP) or concat.
        
        let command = ffmpeg();
        
        // Add all images as inputs
        imageFiles.forEach(f => {
            command = command.input(f).loop(durationPerImage);
        });

        // Complex filter to concat them
        const filterStr = imageFiles.map((_, i) => `[${i}:v]`).join('') + `concat=n=${imageFiles.length}:v=1:a=0[v]`;

        command
          .complexFilter([filterStr])
          .map('[v]')
          .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p', // Compatibility
            '-shortest'
          ])
          .output(outputPath)
          .on('end', () => {
            console.log('[FFmpeg] Video finished:', outputPath);
            // Cleanup temp
            fs.rmSync(tempDir, { recursive: true, force: true });
            resolve({ success: true, path: outputPath });
          })
          .on('error', (err) => {
            console.error('[FFmpeg] Error:', err);
            reject({ success: false, error: err.message });
          })
          .run();
    });

  } catch (error) {
    console.error('[FFmpeg] Critical Error:', error);
    return { success: false, error: error.message };
  }
});
