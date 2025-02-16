import React, { useRef, useState, useEffect } from 'react';
import { Modal, Slider, Button, message } from 'antd';
import { captureFrame } from '../utils/videoUtils';

interface FrameSelectorModalProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
  onSelectCover?: (coverDataUrl: string) => void;
}

const FrameSelectorModal: React.FC<FrameSelectorModalProps> = ({
                                                                 visible,
                                                                 videoUrl,
                                                                 onClose,
                                                                 onSelectCover,
                                                               }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    if (visible && videoRef.current) {
      const video = videoRef.current;
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
      };
    }
  }, [visible, videoUrl]);

  const handleTimeChange = (value: number) => {
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  const handleCapture = async () => {
    if (videoRef.current) {
      try {
        const dataUrl = await captureFrame(videoRef.current);
        if (onSelectCover) {
          onSelectCover(dataUrl);
        }
        message.success('封面已更新');
        onClose();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        message.error('捕获封面失败，请重试');
      }
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="选择视频封面"
      width={800}
    >
      <video ref={videoRef} src={videoUrl} controls style={{ width: '100%', height: '600px' }} />
      {videoDuration > 0 && (
        <Slider
          min={0}
          max={videoDuration}
          value={currentTime}
          onChange={handleTimeChange}
          tipFormatter={(value) => `${value?.toFixed(1)}s`}
          style={{ marginTop: 16 }}
        />
      )}
      <Button type="primary" onClick={handleCapture} style={{ marginTop: 16 }}>
        捕获当前帧
      </Button>
    </Modal>
  );
};

export default FrameSelectorModal;
