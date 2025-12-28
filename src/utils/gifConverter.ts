import GIF from 'gif.js';

/**
 * Converts a Video Blob to a GIF Blob by playing it locally and capturing frames.
 * This approach avoids browser video seeking bugs and NGL state issues.
 * 
 * @param videoBlob The source video (WebM/MP4) blob
 * @param progressCallback Optional callback for progress (0-1)
 * @returns Promise resolving to the GIF Blob
 */
export const convertVideoToGif = async (
    videoBlob: Blob,
    progressCallback?: (p: number) => void
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // 1. Setup Video Element
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;
        video.playsInline = true;

        // Hide it but keep it in DOM (sometimes needed for valid rendering)
        Object.assign(video.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '-100'
        });
        document.body.appendChild(video);

        // 2. Wait for metadata to know dimensions/duration
        video.onloadedmetadata = () => {
            const width = video.videoWidth || 800;
            const height = video.videoHeight || 600;
            const duration = video.duration;

            if (duration === Infinity || isNaN(duration)) {
                // If duration is unknown, we might have issues. 
                // However, for MediaRecorder blobs, it should be fine after a moment or if we set it.
                // We'll proceed and rely on 'ended' event.
                console.warn("Video duration unavailable or infinite.");
            }

            // 3. Setup GIF Encoder
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: 'gif.worker.js',
                background: '#ffffff' // Transparent? or white? White is safer.
            });

            // 4. Setup Canvas for Frame Capture
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                document.body.removeChild(video);
                reject(new Error("Canvas 2D context failed"));
                return;
            }

            // 5. Playback Loop
            const fps = 10; // GIF FPS
            const interval = 1 / fps;
            let lastCaptureTime = -interval; // Ensure first frame (0s) is captured

            gif.on('finished', (blob: Blob) => {
                document.body.removeChild(video);
                URL.revokeObjectURL(video.src);
                if (progressCallback) progressCallback(1);
                resolve(blob);
            });

            if (progressCallback) {
                gif.on('progress', (_p: number) => {
                    // gif.js progress is 0-1 for encoding
                    // We can map playback (0-0.5) and encoding (0.5-1) if we want?
                    // gif.js only reports encoding progress.
                    // Let's just pass it through, maybe scaled.
                    // Actually, let's ignore it for now or just log it.
                    // progressCallback(p); 
                });
            }

            const captureFrame = () => {
                if (video.ended || video.paused) {
                    // Finished playback
                    if (video.ended) {
                        console.log("GIF: Video ended, rendering...");
                        gif.render();
                    }
                    return;
                }

                const currentTime = video.currentTime;

                // Check if enough time passed for next frame
                if (currentTime - lastCaptureTime >= interval) {
                    // Draw current video frame to canvas
                    ctx.drawImage(video, 0, 0, width, height);

                    // Add to GIF
                    gif.addFrame(ctx, { delay: interval * 1000, copy: true });

                    lastCaptureTime = currentTime;

                    // Report "Recording" progress roughly
                    if (progressCallback && duration) {
                        progressCallback(currentTime / duration);
                    }
                }

                if (video.currentTime < duration || !video.ended) {
                    if ('requestVideoFrameCallback' in video) {
                        (video as any).requestVideoFrameCallback(captureFrame);
                    } else {
                        requestAnimationFrame(captureFrame);
                    }
                }
            };

            // Start Playback
            video.oncanplay = async () => {
                try {
                    // Ensure we start from 0
                    video.currentTime = 0;
                    await video.play();
                    captureFrame();
                } catch (e) {
                    console.error("Video playback failed", e);
                    document.body.removeChild(video);
                    reject(e);
                }
            };

            video.onerror = () => {
                document.body.removeChild(video);
                reject(new Error("Video error"));
            };
        };

        // Force load if needed
        video.load();
    });
};
