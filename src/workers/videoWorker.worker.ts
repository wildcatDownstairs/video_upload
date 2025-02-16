self.onmessage = async (event) => {
  const { videoFile, frameCount } = event.data;

  const createFrames = async () => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.crossOrigin = 'anonymous';
      video.currentTime = 0;

      const canvas = new OffscreenCanvas(160, 90);
      const ctx = canvas.getContext('2d');

      const frames: ImageBitmap[] = [];
      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const step = duration / frameCount;

        video.addEventListener('seeked', () => {
          if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = canvas.transferToImageBitmap();
          frames.push(frame);

          if (frames.length === frameCount) {
            resolve(frames);
          } else {
            video.currentTime += step;
          }
        });

        video.currentTime = 0;
      });

      video.onerror = () => reject('Failed to load video.');
    });
  };

  try {
    const frames = await createFrames();
    postMessage({ frames });
  } catch (error) {
    postMessage({ error });
  }
};
