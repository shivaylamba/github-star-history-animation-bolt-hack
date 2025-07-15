import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, Download, Play, Settings, Loader2, CheckCircle, Image } from 'lucide-react';
import { StarHistoryData } from '../types';
// @ts-ignore
import GIF from 'gif.js';

interface VideoGeneratorProps {
  data: StarHistoryData;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ data }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [generatingGif, setGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
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

  const handleGenerateGif = async () => {
    setGeneratingGif(true);
    setGifProgress(0);
    
    try {
      await generateGifAnimation();
    } catch (error) {
      console.error('GIF generation failed:', error);
    } finally {
      setGeneratingGif(false);
    }
  };

  const generateGifAnimation = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800; // Smaller size for GIF to reduce file size
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Initialize GIF.js
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js'
      });
      
      // Animation settings for GIF - longer duration for better visibility
      const animationDuration = 6000; // 6 seconds for GIF
      const fps = 20; // Higher FPS for smoother animation
      const frameDelay = 1000 / fps;
      const totalFrames = (animationDuration / 1000) * fps;
      
      // Sort history data by date
      const sortedHistory = [...data.history].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Ensure we have at least 2 data points for animation
      if (sortedHistory.length < 2) {
        // Add a starting point with 0 stars if we only have one data point
        const firstDate = new Date(sortedHistory[0]?.date || data.createdAt);
        const startDate = new Date(firstDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before
        sortedHistory.unshift({ date: startDate.toISOString(), stars: 0 });
      }
      
      // Chart dimensions (scaled for smaller canvas)
      const chartX = 80;
      const chartY = 120;
      const chartWidth = canvas.width - 160;
      const chartHeight = 300;
      const maxStars = Math.max(...sortedHistory.map(h => h.stars));
      
      // Time-based positioning
      const startTime = new Date(sortedHistory[0].date).getTime();
      const endTime = new Date(sortedHistory[sortedHistory.length - 1].date).getTime();
      const totalTimeSpan = endTime - startTime;
      
      const getChartCoordinates = (dataPoint: { date: string; stars: number }, index: number) => {
        let xPosition;
        if (totalTimeSpan > 0) {
          const pointTime = new Date(dataPoint.date).getTime();
          const timeProgress = (pointTime - startTime) / totalTimeSpan;
          xPosition = chartX + timeProgress * chartWidth;
        } else {
          xPosition = chartX + (index / Math.max(1, sortedHistory.length - 1)) * chartWidth;
        }
        
        const yPosition = chartY + chartHeight - (dataPoint.stars / maxStars) * chartHeight;
        return { x: xPosition, y: yPosition };
      };
      
      // Generate frames
      let currentFrame = 0;
      
      const generateFrame = () => {
        const animationProgress = currentFrame / totalFrames;
        setGifProgress(Math.floor(animationProgress * 100));
        
        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title (smaller font for GIF)
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.repo, canvas.width / 2, 40);
        
        // Subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText('Star Growth Animation', canvas.width / 2, 65);
        
        // Chart background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);
        
        // Grid lines
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 6; i++) {
          const y = chartY + (chartHeight / 6) * i;
          ctx.beginPath();
          ctx.moveTo(chartX, y);
          ctx.lineTo(chartX + chartWidth, y);
          ctx.stroke();
        }
        
        // Calculate current animation state
        const totalDataPoints = sortedHistory.length;
        
        // For the first 10% of animation, show just the starting point
        if (animationProgress < 0.1) {
          const startPoint = sortedHistory[0];
          const coords = getChartCoordinates(startPoint, 0);
          
          // Draw starting point
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          // Show starting star count
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 28px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⭐ ${startPoint.stars.toLocaleString()} Stars`, canvas.width / 2, canvas.height - 80);
          
          // Show starting date
          const startDate = new Date(startPoint.date);
          ctx.fillStyle = '#64748b';
          ctx.font = '14px Arial, sans-serif';
          ctx.fillText(
            startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), 
            canvas.width / 2, 
            canvas.height - 55
          );
        } else {
          // Main animation: gradually reveal more data points
          const adjustedProgress = (animationProgress - 0.1) / 0.9; // Normalize to 0-1
          const visiblePointsCount = Math.max(1, Math.min(totalDataPoints, Math.ceil(totalDataPoints * adjustedProgress)));
          
          // Calculate current interpolated values for smooth animation
          let currentStars = 0;
          let currentDate = sortedHistory[0].date;
          
          if (visiblePointsCount >= totalDataPoints) {
            // Show final values
            currentStars = sortedHistory[totalDataPoints - 1].stars;
            currentDate = sortedHistory[totalDataPoints - 1].date;
          } else if (visiblePointsCount > 1) {
            // Interpolate between data points for smooth star counting
            const exactIndex = (totalDataPoints - 1) * adjustedProgress;
            const lowerIndex = Math.floor(exactIndex);
            const upperIndex = Math.min(lowerIndex + 1, totalDataPoints - 1);
            const fraction = exactIndex - lowerIndex;
            
            const lowerPoint = sortedHistory[lowerIndex];
            const upperPoint = sortedHistory[upperIndex];
            
            // Smooth interpolation of star count
            currentStars = Math.floor(lowerPoint.stars + (upperPoint.stars - lowerPoint.stars) * fraction);
            currentDate = upperPoint.date;
          } else {
            currentStars = sortedHistory[0].stars;
            currentDate = sortedHistory[0].date;
          }
        
          // Draw animated line with gradual progression
          if (visiblePointsCount > 1) {
            const lineGradient = ctx.createLinearGradient(chartX, 0, chartX + chartWidth, 0);
            lineGradient.addColorStop(0, '#3b82f6');
            lineGradient.addColorStop(1, '#8b5cf6');
            
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            // Draw line up to current visible points
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
            
            // Draw data points up to current visible points
            ctx.fillStyle = '#3b82f6';
            for (let i = 0; i < visiblePointsCount; i++) {
              const dataPoint = sortedHistory[i];
              const coords = getChartCoordinates(dataPoint, i);
              
              ctx.beginPath();
              ctx.arc(coords.x, coords.y, 3, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
            
            // Highlight the current/latest point with a larger dot
            if (visiblePointsCount > 0) {
              const currentPoint = sortedHistory[Math.min(visiblePointsCount - 1, totalDataPoints - 1)];
              const currentCoords = getChartCoordinates(currentPoint, Math.min(visiblePointsCount - 1, totalDataPoints - 1));
              
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(currentCoords.x, currentCoords.y, 5, 0, 2 * Math.PI);
              ctx.fill();
              
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
          
          // Star count (animated counting)
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 28px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⭐ ${currentStars.toLocaleString()} Stars`, canvas.width / 2, canvas.height - 80);
          
          // Show current date
          const displayDate = new Date(currentDate);
          ctx.fillStyle = '#3b82f6';
          ctx.font = '14px Arial, sans-serif';
          ctx.fillText(
            displayDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), 
            canvas.width / 2, 
            canvas.height - 55
          );
        }
        
        // Additional info
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Arial, sans-serif';
        const infoText = `${data.language} • Created ${new Date(data.createdAt).getFullYear()}`;
        ctx.fillText(infoText, canvas.width / 2, canvas.height - 30);
        
        // Add frame to GIF
        gif.addFrame(canvas, { delay: frameDelay });
        
        currentFrame++;
        
        if (currentFrame <= totalFrames) {
          // Continue generating frames
          setTimeout(generateFrame, 10);
        } else {
          // Render GIF
          gif.on('finished', (blob: Blob) => {
            setGifBlob(blob);
            resolve();
          });
          
          gif.on('progress', (progress: number) => {
            setGifProgress(Math.floor(50 + progress * 50)); // 50-100% for GIF rendering
          });
          
          gif.render();
        }
      };
      
      generateFrame();
    });
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

  const handleDownloadGif = () => {
    if (gifBlob) {
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.repo.replace('/', '-')}-star-history.gif`;
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
    { label: 'FPS', value: '30' },
    { label: 'GIF Duration', value: '4 seconds' },
    { label: 'GIF Size', value: '800x600' }
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

            <motion.button
              onClick={handleGenerateGif}
              disabled={generatingGif}
              whileHover={{ scale: generatingGif ? 1 : 1.02 }}
              whileTap={{ scale: generatingGif ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {generatingGif ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating GIF... {gifProgress}%
                </>
              ) : gifBlob ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  GIF Generated
                </>
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  Generate GIF
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

            {gifBlob && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleDownloadGif}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download GIF
              </motion.button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p>Generate both video and GIF formats of your repository's star growth animation. GIFs are perfect for social media and have smaller file sizes.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoGenerator;