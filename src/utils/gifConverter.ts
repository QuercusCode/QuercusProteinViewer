import GIF from 'gif.js';
// @ts-ignore
import workerScript from 'gif.js/dist/gif.worker.js?raw';

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
        const timeoutId = setTimeout(() => {
            reject(new Error("GIF conversion timed out after 30s"));
            cleanup();
        }, 30000);

        // 1. Setup Video Element
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;
        video.playsInline = true;

        // Make it slightly visible to prevent throttling, but off-screen
        Object.assign(video.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '2px', // Needs size
            height: '2px',
            opacity: '0.01', // Needs non-zero opacity
            pointerEvents: 'none',
            zIndex: '-100'
        });
        document.body.appendChild(video);

        // Create worker blob
        const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);

        const cleanup = () => {
            clearTimeout(timeoutId);
            if (video.parentNode) document.body.removeChild(video);
            URL.revokeObjectURL(video.src);
            URL.revokeObjectURL(workerUrl);
        };

        // 2. Wait for metadata to know dimensions/duration
        video.onloadedmetadata = () => {
            console.log("GIF: Metadata loaded", video.videoWidth, video.videoHeight, video.duration);
            const width = video.videoWidth || 800;
            const height = video.videoHeight || 600;
            const duration = video.duration;

            if (duration === Infinity || isNaN(duration)) {
                console.warn("Video duration unavailable or infinite.");
            }

            // 3. Setup GIF Encoder
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: workerUrl, // Use embedded blob URL
                background: '#ffffff'
            });

            // 4. Setup Canvas for Frame Capture
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
                cleanup();
                reject(new Error("Canvas 2D context failed"));
                return;
            }

            // 5. Playback Loop
            const fps = 10; // GIF FPS
            const interval = 1 / fps;
            let lastCaptureTime = -interval; // Ensure first frame (0s) is captured

            gif.on('finished', (blob: Blob) => {
                console.log("GIF: Finished encoding", blob.size);
                cleanup();
                if (progressCallback) progressCallback(1);
                resolve(blob);
            });

            gif.on('abort', () => {
                console.error("GIF: Aborted");
                cleanup();
                reject(new Error("GIF encoding aborted"));
            });

            if (progressCallback) {
                gif.on('progress', (_p: number) => {
                    // Encoding progress
                });
            }

            const captureFrame = () => {
                if (video.ended || video.paused) {
                    // Finished playback
                    if (video.ended) {
                        console.log("GIF: Video ended, rendering...");
                        try {
                            gif.render();
                        } catch (e) {
                            console.error("GIF Render failed", e);
                            cleanup();
                            reject(e);
                        }
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
                } else {
                    // Fallback if ended event doesn't fire for some reason
                    console.log("GIF: Time limit reached, rendering...");
                    gif.render();
                }
            };

            // Start Playback
            video.oncanplay = async () => {
                try {
                    // Ensure we start from 0
                    video.currentTime = 0;
                    console.log("GIF: Starting playback");
                    await video.play();
                    captureFrame();
                } catch (e) {
                    console.error("Video playback failed", e);
                    cleanup();
                    reject(e);
                }
            };

            video.onerror = (e) => {
                console.error("Video error", e);
                cleanup();
                reject(new Error("Video playback error"));
            };
        };

        video.onerror = (e) => {
            console.error("Video error (load)", e);
            cleanup();
            reject(new Error("Video load error"));
        };

        // Force load if needed
        video.load();
    });
};
