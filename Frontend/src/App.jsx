import React, { useState, useEffect, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, AlertTriangle, Play, Pause } from 'lucide-react';

// API Configuration
const API_URL = 'http://localhost:5000/api';

// Color mapping for detection classes
const classColors = {
  'NO-Hardhat': '#ef4444',
  'NO-Safety Vest': '#ef4444',
  'NO-Mask': '#ef4444',
  'NO-Gloves': '#ef4444',
  'NO-Goggles': '#ef4444',
  'Hardhat': '#22c55e',
  'Safety Vest': '#22c55e',
  'Mask': '#22c55e',
  'Gloves': '#22c55e',
  'Goggles': '#22c55e',
  'Fall-Detected': '#ef4444',
  'Person': '#3b82f6',
  'Ladder': '#3b82f6',
  'Safety Cone': '#3b82f6'
};

function App() {
  const [systemStatus, setSystemStatus] = useState('checking');
  const [currentFile, setCurrentFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ violations: 0, compliant: 0 });

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Check backend health
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setSystemStatus(data.status === 'healthy' && data.model_loaded ? 'online' : 'warning');
    } catch (error) {
      setSystemStatus('offline');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCurrentFile(file);
    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);
    setDetections([]);
    setNotifications([]);

    if (isVideoFile) {
      loadVideo(file);
    } else {
      processImage(file);
    }
  };

  const processImage = async (file) => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_URL}/detect`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setDetections(data.detections);
          drawDetections(ctx, data.detections, canvas.width, canvas.height);
          updateStats(data.detections);
          generateNotifications(data.detections);
        }
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        setIsProcessing(false);
      }
    };
  };

  const loadVideo = (file) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
    };
  };

  const togglePlayPause = () => {
    const video = videoRef.current;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      processVideoFrame();
    } else {
      video.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const processVideoFrame = async () => {
    if (!isPlaying) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      try {
        const response = await fetch(`${API_URL}/detect`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          setDetections(data.detections);
          drawDetections(ctx, data.detections, canvas.width, canvas.height);
          updateStats(data.detections);
          generateNotifications(data.detections);
        }
      } catch (error) {
        console.error('Frame detection error:', error);
      }

      if (isPlaying && !video.ended) {
        animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      }
    }, 'image/jpeg', 0.8);
  };

  const drawDetections = (ctx, detections, width, height) => {
    const video = videoRef.current;

    if (isVideo && video && !video.paused) {
      ctx.drawImage(video, 0, 0, width, height);
    }

    detections.forEach(det => {
      const color = classColors[det.class] || '#3b82f6';

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(det.x, det.y, det.w, det.h);

      const label = `${det.class} ${Math.round(det.confidence * 100)}%`;
      ctx.font = 'bold 14px Arial';
      const textWidth = ctx.measureText(label).width;
      const padding = 8;

      ctx.fillStyle = color;
      ctx.fillRect(
        Math.max(0, det.x),
        Math.max(0, det.y - 26),
        textWidth + padding,
        26
      );

      ctx.fillStyle = '#ffffff';
      ctx.fillText(
        label,
        Math.max(0, det.x) + padding / 2,
        Math.max(18, det.y - 7)
      );
    });
  };

  const updateStats = (detections) => {
    let violations = 0;
    let compliant = 0;

    detections.forEach(det => {
      if (det.class.startsWith('NO-')) {
        violations++;
      } else if (['Hardhat', 'Safety Vest', 'Mask', 'Gloves', 'Goggles'].includes(det.class)) {
        compliant++;
      }
    });

    setStats({ violations, compliant });
  };

  const generateNotifications = (detections) => {
    const newNotifications = [];

    const falls = detections.filter(d => d.class === 'Fall-Detected');
    if (falls.length > 0) {
      newNotifications.push({
        id: 'fall',
        type: 'critical',
        icon: <AlertTriangle size={16} />,
        text: 'Fall detected'
      });
    }

    const violations = detections.filter(d => d.class.startsWith('NO-'));
    const violationTypes = [...new Set(violations.map(v => v.class.replace('NO-', '')))];
    
    violationTypes.forEach(type => {
      newNotifications.push({
        id: type,
        type: 'warning',
        icon: <AlertCircle size={16} />,
        text: `Missing ${type}`
      });
    });

    setNotifications(newNotifications);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            PPE Detection System
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <span>Real-time Safety Monitoring</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              systemStatus === 'online' ? 'bg-green-500/20 text-green-400' :
              systemStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {systemStatus === 'online' ? '● Online' : 
               systemStatus === 'warning' ? '● Warning' : '● Offline'}
            </span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-lg p-12 text-center cursor-pointer transition-all hover:bg-blue-500/5"
          >
            <Upload className="mx-auto mb-4 text-slate-400" size={48} strokeWidth={1.5} />
            <h3 className="text-lg font-semibold mb-2">Upload Image or Video</h3>
            <p className="text-slate-400 text-sm">Click to browse • Supports JPG, PNG, MP4, AVI</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {currentFile && (
            <p className="text-slate-400 text-center mt-3 text-sm">📁 {currentFile.name}</p>
          )}
        </div>

        {/* Detection View */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Detection View</h2>
            {isVideo && currentFile && (
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
            <video ref={videoRef} className="hidden" muted />
            
            {!currentFile && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <Upload size={64} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="text-lg">No file selected</p>
                <p className="text-sm mt-1">Upload to begin detection</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-slate-300">Processing...</p>
              </div>
            )}

            {/* Subtle Notifications Bar */}
            {notifications.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm ${
                      notif.type === 'critical' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}
                  >
                    {notif.icon}
                    <span>{notif.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats and Detections */}
        {detections.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-400" size={20} />
                    <span className="text-slate-300">Violations</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{stats.violations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={20} />
                    <span className="text-slate-300">Compliant</span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">{stats.compliant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Detected</span>
                  <span className="text-xl font-semibold text-slate-300">{detections.length}</span>
                </div>
              </div>
            </div>

            {/* Detections List */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Detected Objects</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {detections.map((det, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: classColors[det.class] || '#3b82f6' }}
                      />
                      <span className="text-sm font-medium">{det.class}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {(det.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;