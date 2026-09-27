#!/usr/bin/env node

/**
 * Renders Tilt Wave Studios promo to MP4 using Puppeteer
 * Usage: node render-mp4-puppeteer.js
 *
 * Prerequisites:
 *   npm install puppeteer ffmpeg-static
 *
 * Output: tilt-wave-promo.mp4 (H.264, yuv420p, 30fps)
 */

const puppeteer = require('puppeteer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const CONFIG = {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 30,
    outputFile: 'tilt-wave-promo.mp4'
};

const totalFrames = CONFIG.fps * CONFIG.duration;

async function renderFrames() {
    console.log(`🎬 Tilt Wave Studios - Promo Renderer`);
    console.log(`📐 ${CONFIG.width}×${CONFIG.height} @ ${CONFIG.fps}fps × ${CONFIG.duration}s = ${totalFrames} frames`);
    console.log();

    let browser;
    try {
        // Launch headless browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set viewport to exact dimensions
        await page.setViewport({
            width: CONFIG.width,
            height: CONFIG.height,
            deviceScaleFactor: 1
        });

        // Load HTML file
        const htmlPath = `file://${path.resolve('tilt-wave-promo.html')}`;
        console.log(`📄 Loading: ${htmlPath}`);
        await page.goto(htmlPath, { waitUntil: 'networkidle2' });

        // Wait for font to load
        await page.evaluate(() => {
            return document.fonts.ready;
        });

        console.log(`🖼️  Rendering ${totalFrames} frames...`);

        // Collect all frame PNGs in memory
        const frameBuffers = [];

        for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
            const t = frameNum / CONFIG.fps;

            // Call renderAt function to draw the frame
            await page.evaluate((time) => {
                window.renderAt(time);
            }, t);

            // Capture frame as PNG buffer
            const screenshot = await page.screenshot({
                type: 'png',
                omitBackground: true
            });

            frameBuffers.push(screenshot);

            // Progress indicator
            if ((frameNum + 1) % 30 === 0) {
                const progress = (((frameNum + 1) / totalFrames) * 100).toFixed(1);
                console.log(`  ⏳ ${frameNum + 1}/${totalFrames} (${progress}%)`);
            }
        }

        await browser.close();

        console.log(`✅ All frames captured. Encoding to MP4...`);

        // Encode frames to MP4 using ffmpeg
        await encodeMP4(frameBuffers);

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}

function encodeMP4(frameBuffers) {
    return new Promise((resolve, reject) => {
        // Create readable stream from frame buffers
        let frameIndex = 0;
        const stream = new Readable({
            read() {
                if (frameIndex < frameBuffers.length) {
                    this.push(frameBuffers[frameIndex++]);
                } else {
                    this.push(null);
                }
            }
        });

        ffmpeg.setFfmpegPath(ffmpegStatic);

        ffmpeg()
            .input(stream)
            .inputFormat('image2pipe')
            .inputOption('-f', 'png_pipe')
            .inputOption('-framerate', String(CONFIG.fps))
            .output(CONFIG.outputFile)
            .outputOptions([
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-preset fast',
                '-crf 18'
            ])
            .on('progress', (progress) => {
                if (progress.frames) {
                    const pct = ((progress.frames / totalFrames) * 100).toFixed(1);
                    process.stderr.write(`\r  ⏳ Encoding: ${progress.frames}/${totalFrames} (${pct}%)`);
                }
            })
            .on('end', () => {
                console.log(`\n✅ MP4 saved: ${CONFIG.outputFile}`);
                const stats = fs.statSync(CONFIG.outputFile);
                const mb = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`📦 File size: ${mb} MB`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`\n❌ Encoding error:`, err.message);
                reject(err);
            })
            .run();
    });
}

renderFrames().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
