/**
 * 捕获 video 元素当前帧作为封面，返回 dataURL
 */
export const captureFrame = (video: HTMLVideoElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('无法获取 Canvas 上下文');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 将秒数转换为 HH:mm:SS 格式的字符串
 */
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hrs, mins, secs]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
};


/**
 * 根据视频 URL 获取视频时长（单位：秒）
 */
export const getVideoDuration = (videoUrl: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;
    // 尝试加载元数据
    tempVideo.onloadedmetadata = () => {
      resolve(tempVideo.duration);
    };
    tempVideo.onerror = () => {
      reject(new Error('加载视频元数据失败'));
    };
  });
};

/**
 * 根据视频 URL 自动生成封面（截取 0.1 秒处的帧）
 */
export const generateCover = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const tempVideoElement = document.createElement('video');
    tempVideoElement.src = videoUrl;
    // 为避免0秒黑帧，跳到 0.1 秒
    tempVideoElement.currentTime = 0.1;
    tempVideoElement.onloadeddata = async () => {
      try {
        const coverDataUrl = await captureFrame(tempVideoElement);
        resolve(coverDataUrl);
      } catch (e) {
        reject(e);
      }
    };
    tempVideoElement.onerror = () => {
      reject(new Error('视频加载失败，无法生成封面'));
    };
  });
};

/**
 * 批量处理 items，每次并发处理 limit 个，
 * processFn 为处理单个 item 的异步函数
 */
export async function processInBatches<T>(
  items: T[],
  limit: number,
  processFn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    await Promise.all(batch.map((item) => processFn(item)));
  }
}
