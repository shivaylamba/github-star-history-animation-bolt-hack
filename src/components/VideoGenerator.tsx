import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, Download, Play, Settings, Loader2, CheckCircle } from 'lucide-react';
import { StarHistoryData } from '../types';

interface VideoGeneratorProps {
  data: StarHistoryData;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ data }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerateVideo = async () => {
    setGenerating(true);
    setProgress(0);
    setGenerated(false);
    
    try {
      await generateCanvasVideo();
    } catch (error) {
      console.error('Video generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateCanvasVideo = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(videoBlob);
        setGenerated(true);
        resolve();
      };
      
      mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder error'));
      };
      
      mediaRecorder.start();
      
      // Animation settings
      const animationDuration = 8000; // 8 seconds
      const fps = 30;
      const totalFrames = (animationDuration / 1000) * fps;
      let currentFrame = 0;
      
      // Sort history data by date to ensure proper chronological order
      const sortedHistory = [...data.history].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Pre-calculate chart dimensions and scaling
      const chartX = 200;
      const chartY = 280;
      const chartWidth = canvas.width - 400;
      const chartHeight = 500;
      const maxStars = Math.max(...sortedHistory.map(h => h.stars));
      
      // Calculate time-based positions for each data point
      const startTime = new Date(sortedHistory[0].date).getTime();
      const endTime = new Date(sortedHistory[sortedHistory.length - 1].date).getTime();
      const totalTimeSpan = endTime - startTime;
      
      // Create coordinate mapping function that matches the chart component exactly
      const getChartCoordinates = (dataPoint: { date: string; stars: number }, index: number) => {
        // Use time-based positioning if we have a meaningful time span
        let xPosition;
        if (totalTimeSpan > 0) {
          const pointTime = new Date(dataPoint.date).getTime();
          const timeProgress = (pointTime - startTime) / totalTimeSpan;
          xPosition = chartX + timeProgress * chartWidth;
        } else {
          // Fallback to index-based positioning
          xPosition = chartX + (index / Math.max(1, sortedHistory.length - 1)) * chartWidth;
        }
        
        const yPosition = chartY + chartHeight - (dataPoint.stars / maxStars) * chartHeight;
        return { x: xPosition, y: yPosition };
      };
      
      const animate = () => {
        currentFrame++;
        const animationProgress = Math.min(currentFrame / totalFrames, 1);
        
        // Update progress state
        const progressPercent = Math.floor(animationProgress * 100);
        setProgress(progressPercent);
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add subtle gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 72px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.repo, canvas.width / 2, 120);
        
        // Draw subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = '36px Arial, sans-serif';
        ctx.fillText('Star Growth History', canvas.width / 2, 180);
        
        // Draw chart background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);
        
        // Draw grid lines
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
          const y = chartY + (chartHeight / 10) * i;
          ctx.beginPath();
          ctx.moveTo(chartX, y);
          ctx.lineTo(chartX + chartWidth, y);
          ctx.stroke();
        }
        
        // Calculate how many data points to show based on animation progress
        const totalDataPoints = sortedHistory.length;
        const visiblePointsCount = Math.max(1, Math.floor(totalDataPoints * animationProgress));
        
        // Draw animated chart line using actual data points with proper time-based positioning
        if (totalDataPoints > 1 && visiblePointsCount > 1) {
          // Create gradient for the line (matching the chart component)
          const lineGradient = ctx.createLinearGradient(chartX, 0, chartX + chartWidth, 0);
          lineGradient.addColorStop(0, '#3b82f6');
          lineGradient.addColorStop(1, '#8b5cf6');
          
          ctx.strokeStyle = lineGradient;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          
          // Draw the line using actual data points with time-based positioning
          for (let i = 0; i < visiblePointsCount; i++) {
            const dataPoint = sortedHistory[i];
            const coords = getChartCoordinates(dataPoint, i);
            
            if (i === 0) {
              ctx.moveTo(coords.x, coords.y);
            } else {
              ctx.lineTo(coords.x, coords.y);
            }
          }
          ctx.stroke();
          
          // Draw data points with white borders
          ctx.fillStyle = '#3b82f6';
          for (let i = 0; i < visiblePointsCount; i++) {
            const dataPoint = sortedHistory[i];
            const coords = getChartCoordinates(dataPoint, i);
            
            // Draw point
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // White border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
        
        // Draw current stats using the actual data
        const currentStars = visiblePointsCount > 0 && visiblePointsCount <= totalDataPoints 
          ? sortedHistory[visiblePointsCount - 1].stars 
          : 0;
        
        // Star count
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 64px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⭐ ${currentStars.toLocaleString()} Stars`, canvas.width / 2, canvas.height - 150);
        
        // Additional info
        ctx.fillStyle = '#64748b';
        ctx.font = '32px Arial, sans-serif';
        const infoText = `${data.language} • Created ${new Date(data.createdAt).getFullYear()}`;
        ctx.fillText(infoText, canvas.width / 2, canvas.height - 80);
        
        // Continue animation or stop
        if (animationProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Add a small delay before stopping
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500);
        }
      };
      
      animate();
    });
  };

  const handleDownload = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.repo.replace('/', '-')}-star-history.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const videoSettings = [
    { label: 'Duration', value: '8 seconds' },
    { label: 'Resolution', value: '1920x1080' },
    { label: 'Format', value: 'WebM' },
    { label: 'FPS', value: '30' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
    >
      <div className="flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-purple-500" />
        <h3 className="text-xl font-semibold text-gray-800">Video Generation</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Video Preview */}
        <div className="space-y-4">
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white relative overflow-hidden">
            {generated && videoBlob ? (
              <video 
                controls 
                className="w-full h-full object-cover rounded-xl"
                src={URL.createObjectURL(videoBlob)}
              />
            ) : !generated ? (
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-sm opacity-90">Video Preview</p>
                <p className="text-xs opacity-70 mt-1">Generate video to see preview</p>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Video Generated!</p>
              </div>
            )}
            
            {/* Animated background */}
            {!generated && (
              <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
              </div>
            )}
          </div>

          {generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating video...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Settings & Controls */}
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Video Settings
            </h4>
            <div className="space-y-3">
              {videoSettings.map((setting, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">{setting.label}</span>
                  <span className="text-sm font-medium text-gray-800">{setting.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              onClick={handleGenerateVideo}
              disabled={generating}
              whileHover={{ scale: generating ? 1 : 1.02 }}
              whileTap={{ scale: generating ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Video... {progress}%
                </>
              ) : generated ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Video Generated
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </motion.button>

            {generated && videoBlob && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleDownload}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Video
              </motion.button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p>The generated video will show an animated chart of your repository's real star growth over time, perfect for sharing on social media platforms.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoGenerator;