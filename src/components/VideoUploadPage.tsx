import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Progress } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import Masonry from 'react-masonry-css';
import VideoItem, { VideoData } from './VideoItem';
import { v4 as uuidv4 } from 'uuid';
import {getVideoDuration, generateCover, processInBatches, formatDuration} from '../utils/videoUtils';

const { Dragger } = Upload;

const VideoUploadPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  // 批处理状态与进度
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // 上传前过滤非视频文件，并添加到 videos 数组（初始时 processed 为 false）
  const handleBeforeUpload = (file: File) => {
    if (!file.type.startsWith('video/')) {
      message.error('请上传视频文件');
      return false;
    }
    const videoUrl = URL.createObjectURL(file);
    const newVideo: VideoData = {
      id: uuidv4(),
      file,
      videoUrl,
      cover: '', // 初始化为空，后续生成封面更新
      duration: 0, // 初始时长为 0
      processed: false, // 标识还未处理
      uploadProgress: 0,
      uploading: false,
      uploadStatus: 'pending',
    };
    setVideos((prev) => [...prev, newVideo]);
    return false; // 阻止 antd 自动上传
  };

  // 处理单个视频：获取时长、生成封面，然后更新 video 对象，并标记为已处理
  const processVideo = async (video: VideoData): Promise<void> => {
    try {
      const duration = await getVideoDuration(video.videoUrl);
      const cover = await generateCover(video.videoUrl);
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id
            ? { ...v, duration, cover, processed: true }
            : v
        )
      );
    } catch (e) {
      console.error('处理视频失败，ID:', video.id, e);
      // 即使出错，也标记为 processed，避免重复处理
      setVideos((prev) =>
        prev.map((v) =>
          v.id === video.id ? { ...v, processed: true } : v
        )
      );
    } finally {
      setProcessingProgress((prev) => prev + 1);
    }
  };

  // 批量处理所有未处理的视频（限制并发数量，比如每次处理 10 个）
  const startProcessing = async () => {
    const unprocessed = videos.filter((v) => !v.processed);
    if (unprocessed.length === 0) return;
    setTotalToProcess(unprocessed.length);
    setProcessingProgress(0);
    setProcessing(true);
    await processInBatches(unprocessed, 10, async (video) => {
      await processVideo(video);
    });
    setProcessing(false);
  };

  // 每次 videos 发生变化时，如果有未处理的视频，则启动批处理
  useEffect(() => {
    const unprocessed = videos.filter((v) => !v.processed);
    if (!processing && unprocessed.length > 0) {
      startProcessing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  // 模拟上传操作（这里代码保持不变）
  const handleSubmit = () => {
    if (videos.length === 0) {
      message.warning('请先上传视频');
      return;
    }

    setSubmitting(true);

    const updatedVideos = videos.map((video) => ({
      ...video,
      uploading: true,
      uploadStatus: 'uploading',
      uploadProgress: 0,
    }));

    console.log(updatedVideos);

  };

  // react-masonry-css 布局断点设置
  const breakpointColumnsObj = {
    // 当浏览器宽度 > 2560 像素时（例如 2K/2.5K/3K/4K 甚至更高分辨率），用 6 列
    default: 6,

    // MacBook Pro 14" 分辨率约 3024px 宽（实际设备像素密度会更高，但逻辑宽度常见在 1440 ~ 1728 之间，视缩放而定）
    // 这里 2560 表示“当宽度 <= 2560 像素时”的断点
    2560: 6,

    // 常见 1080p 或 1920 宽度
    1920: 5,

    // 常见 1440 宽度
    1440: 3,

    // 平板或窄屏笔记本
    1024: 2,

    // 小屏手机等
    768: 2,
    500: 1,
  };

  // 计算所有视频总时长（单位：秒），并格式化为 HH:mm:SS
  const totalDurationSeconds = videos.reduce((acc, v) => acc + v.duration, 0);
  const totalDurationFormatted = formatDuration(totalDurationSeconds);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>视频上传，所有视频总时长：{totalDurationFormatted}</h1>

      <Dragger
        multiple
        accept="video/*"
        beforeUpload={handleBeforeUpload}
        showUploadList={false}
        style={{ marginBottom: 24, padding: '40px' }}
      >
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p className="ant-upload-text">
          拖拽视频到此区域，或点击上传
        </p>
      </Dragger>

      {/* 处理进度条 */}
      {(processing || totalToProcess > 0) && (
        <div style={{ marginBottom: 20 }}>
          <Progress
            percent={
              totalToProcess > 0
                ? (processingProgress / totalToProcess) * 100
                : 0
            }
            format={() =>
              `${processingProgress} / ${totalToProcess} 个视频处理完毕`
            }
          />
        </div>
      )}

      <div style={{ marginTop: 24, marginBottom: 24, textAlign: 'center' }}>
        <Button type="primary" onClick={handleSubmit} loading={submitting}>
          提交上传
        </Button>
      </div>

      {videos.length > 0 && (
        <>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {videos.map((video) => (
              <VideoItem key={video.id} video={video} setVideos={setVideos} />
            ))}
          </Masonry>
        </>
      )}
    </div>
  );
};

export default VideoUploadPage;
