import React, { useState } from 'react';
import { Image, Button, Progress } from 'antd';
import FrameSelectorModal from './FrameSelectorModal';

export interface VideoData {
  id: string;
  file: File;
  videoUrl: string;
  cover: string;
  duration: number; // 单位：秒
  processed: boolean;
  uploadProgress: number;
  uploading: boolean;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
}

interface VideoItemProps {
  video: VideoData;
  setVideos: React.Dispatch<React.SetStateAction<VideoData[]>>;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, setVideos }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCoverUpdate = (newCover: string) => {
    // 更新当前视频对象的 cover 字段
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, cover: newCover } : v))
    );
  };

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <Image
        width="100%"
        src={video.cover || 'https://via.placeholder.com/200?text=Generating+Cover'}
        preview={{
          destroyOnClose: true,
          imageRender: () => (
            <video muted width="100%" controls src={video.videoUrl} />
          ),
          toolbarRender: () => null,
        }}
        style={{ borderRadius: '8px' }}
      />
      {/* 悬浮操作按钮 */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <Button size="small" onClick={() => setModalVisible(true)}>
          自定义封面
        </Button>
      </div>
      {/* 上传进度条 */}
      {video.uploading && (
        <Progress
          percent={video.uploadProgress}
          size="small"
          status={video.uploadStatus === 'error' ? 'exception' : 'normal'}
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            right: '8px',
          }}
        />
      )}
      <FrameSelectorModal
        visible={modalVisible}
        videoUrl={video.videoUrl}
        onClose={() => setModalVisible(false)}
        onSelectCover={handleCoverUpdate}
      />
    </div>
  );
};

export default VideoItem;
