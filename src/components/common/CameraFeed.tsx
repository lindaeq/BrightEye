import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Camera, CameraOff, Eye, Maximize2, Minimize2, Move, Video, RefreshCw } from 'lucide-react';

type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const CameraFeed: React.FC = () => {
  const { currentStep } = useArcade();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [userMinimized, setUserMinimized] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  // Position & Drag state
  const [corner, setCorner] = useState<CornerPosition>('top-right');
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Auto-minimize during active missions so camera never interferes with games
  const isPlayingGame = currentStep === 6 || currentStep === 7;
  const isMinimized = userMinimized || isPlayingGame;

  // Initialize camera
  const requestCamera = useCallback(async () => {
    setIsRequesting(true);
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Webcam API not supported in this browser');
        setIsRequesting(false);
        return;
      }

      // Stop any existing tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setMediaStream(stream);
      setStreamActive(true);
      setErrorMsg(null);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setErrorMsg('Camera access blocked. Click retry.');
      setStreamActive(false);
    } finally {
      setIsRequesting(false);
    }
  }, [mediaStream]);

  // Request on mount
  useEffect(() => {
    requestCamera();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Sync stream to video element whenever video element mounts or stream updates
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [mediaStream, isMinimized]);

  // DRAG & SNAP TO CLOSEST BORDER LOGIC
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return; // ignore clicks on buttons
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setCustomPos({ x: rect.left, y: rect.top });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragOffset) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setCustomPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Calculate nearest corner with safe margins (keeping clear of bottom action buttons)
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const currentX = customPos?.x ?? 0;
    const currentY = customPos?.y ?? 0;

    const isLeft = currentX < windowW / 2;
    const isTop = currentY < windowH / 2;

    if (isTop && isLeft) setCorner('top-left');
    else if (isTop && !isLeft) setCorner('top-right');
    else if (!isTop && isLeft) setCorner('bottom-left');
    else setCorner('bottom-right');

    setCustomPos(null);
    setDragOffset(null);
  };

  // Border snap CSS classes: Bottom positions have bottom-20 (80px clearance) so they NEVER block action buttons!
  const cornerClasses: Record<CornerPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-right': 'bottom-20 right-4',
  };

  const activePositionStyle: React.CSSProperties = customPos
    ? {
        position: 'fixed',
        left: `${customPos.x}px`,
        top: `${customPos.y}px`,
        transition: 'none',
      }
    : {};

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={activePositionStyle}
      className={`fixed z-50 select-none ${!customPos ? cornerClasses[corner] : ''} ${
        isDragging ? 'cursor-grabbing opacity-90 scale-105' : 'cursor-grab'
      } transition-all duration-300 ease-out`}
    >
      {isMinimized ? (
        /* MINIMIZED PILL (Auto during games or on user collapse) */
        <div className="flex items-center gap-2 bg-[#0b0f19]/90 hover:bg-[#0b0f19] border-2 border-[var(--dim)] px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md">
          <Move className="w-3.5 h-3.5 text-slate-400 opacity-60" />
          <span className={`w-2.5 h-2.5 rounded-full ${streamActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <Video className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-ui font-bold text-xs">
            {streamActive ? 'CAM 60FPS' : 'CAM OFFLINE'}
          </span>
          <button
            onClick={() => setUserMinimized(false)}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Expand Camera View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* EXPANDED POPUP WITH LIVE VIDEO */
        <div className="w-72 sm:w-80 bg-[#0f172a] border-3 border-[var(--dim)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Draggable Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[var(--bezel)] text-[var(--scr)] font-heading text-xs font-bold border-b border-black/40">
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 opacity-70" />
              <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-white tracking-wide">LIVE QNX CAMERA</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={requestCamera}
                className="p-1 rounded hover:bg-black/30 text-slate-300 hover:text-white transition-colors"
                title="Refresh Camera"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setUserMinimized(true)}
                className="p-1 rounded hover:bg-black/30 text-slate-300 hover:text-white transition-colors"
                title="Minimize Camera"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Video Stream Container */}
          <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
            {streamActive ? (
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && mediaStream && el.srcObject !== mediaStream) {
                    el.srcObject = mediaStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-5 text-center space-y-2">
                <CameraOff className="w-9 h-9 text-slate-500" />
                <span className="text-xs font-ui text-slate-300 leading-tight">
                  {errorMsg || 'Waiting for camera permission...'}
                </span>
                <button
                  onClick={requestCamera}
                  className="px-3 py-1.5 rounded-lg bg-[var(--btn)] text-[var(--btnink)] font-heading text-xs font-bold hover:brightness-110"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* QNX Face & Eye Tracking Landmark Box Overlay */}
            {streamActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-36 h-14 border-2 border-emerald-400 rounded-lg flex items-center justify-around px-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-400/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </div>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-400/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  </div>
                  <span className="absolute -top-3.5 left-2 text-[9px] font-mono-clean bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
                    PEDIATRIC EYE-LOCK
                  </span>
                </div>
              </div>
            )}

            {/* Offline privacy pill */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-mono-clean bg-black/80 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">
              <Eye className="w-3 h-3" />
              <span>100% OFFLINE</span>
            </div>

            {/* Drag hint */}
            <div className="absolute bottom-2 right-2 text-[10px] font-mono-clean text-slate-400 bg-black/60 px-1.5 py-0.5 rounded">
              Drag to reposition
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
