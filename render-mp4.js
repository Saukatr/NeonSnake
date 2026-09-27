#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createCanvas } = require('canvas');

const CONFIG = {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 30,
    bpm: 120,
    colors: {
        bg: '#111217',
        text: '#f3efe6',
        orange: '#f58a3c',
        red: '#e8365d',
        blue: '#4a8cf0',
        teal: '#3fd7c8',
        lime: '#c6e14b',
        dark: '#171820'
    }
};

// Total frames
const totalFrames = CONFIG.fps * CONFIG.duration;

console.log(`🎬 Rendering ${CONFIG.duration}s promo at ${CONFIG.fps}fps (${totalFrames} frames)`);
console.log(`📐 Resolution: ${CONFIG.width}×${CONFIG.height}`);

// Initialize canvas
const canvas = createCanvas(CONFIG.width, CONFIG.height);
const ctx = canvas.getContext('2d');

// Load the renderAt function from HTML
const htmlPath = path.join(__dirname, 'tilt-wave-promo.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract the JavaScript code between <script> tags
const scriptMatch = htmlContent.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('❌ Could not extract script from HTML');
    process.exit(1);
}

const scriptCode = scriptMatch[1];

// Create a function scope with canvas context
const renderContext = {
    canvas: canvas,
    ctx: ctx,
    CONFIG: CONFIG,
    Math: Math,
    Date: Date
};

// Execute the script in the context
try {
    const funcBody = `
        ${scriptCode}
        return window.renderAt;
    `;
    const renderFunc = new Function(funcBody).call(renderContext);

    // ffmpeg process
    const ffmpeg = spawn('ffmpeg', [
        '-f', 'rawvideo',
        '-pix_fmt', 'rgba',
        '-s', `${CONFIG.width}x${CONFIG.height}`,
        '-r', String(CONFIG.fps),
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '18',
        'tilt-wave-promo.mp4'
    ]);

    ffmpeg.stdout.on('data', (data) => {
        process.stdout.write(data);
    });

    ffmpeg.stderr.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('frame=')) {
            const match = msg.match(/frame=\s*(\d+)/);
            if (match) {
                const frame = parseInt(match[1]);
                const progress = ((frame / totalFrames) * 100).toFixed(1);
                process.stderr.write(`\r⏳ Progress: ${frame}/${totalFrames} (${progress}%)`);
            }
        }
    });

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ MP4 rendered successfully: tilt-wave-promo.mp4');
            process.exit(0);
        } else {
            console.error(`\n❌ ffmpeg exited with code ${code}`);
            process.exit(1);
        }
    });

    ffmpeg.on('error', (err) => {
        console.error('❌ ffmpeg error:', err.message);
        console.error('Make sure ffmpeg is installed: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)');
        process.exit(1);
    });

    // Render frames
    console.log('🖼️  Rendering frames...');
    for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
        const t = frameNum / CONFIG.fps;

        // Call renderAt
        renderFunc(t);

        // Get image data and write to ffmpeg
        const imageData = ctx.getImageData(0, 0, CONFIG.width, CONFIG.height);
        ffmpeg.stdin.write(imageData.data);
    }

    ffmpeg.stdin.end();

} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
