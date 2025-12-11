import React, { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface BeatParticle {
  angle: number; // Angle for radial positioning
  radius: number; // Distance from center
  speed: number; // Rotation speed
  size: number;
  opacity: number;
  color: string;
  pulsePhase: number;
}

// Separate interface for explosion particles
interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  progress: number;
}

interface BeatSyncAnimationProps {
  isActive: boolean;
  timer: number;
  maxTime: number;
  intensity?: number; // Base number of particles (will be multiplied by settings)
  triggerExplosion?: boolean; // New prop to trigger explosion
  onExplosionComplete?: () => void; // Callback when explosion finishes
  showExplosion?: boolean; // Force show explosion even when isActive is false
}

const BeatSyncAnimation: React.FC<BeatSyncAnimationProps> = ({
  isActive,
  timer,
  maxTime,
  intensity = 40,
  triggerExplosion = false,
  onExplosionComplete,
  showExplosion = false
}) => {
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<BeatParticle[]>([]);
  const explosionParticlesRef = useRef<ExplosionParticle[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const beatInterval = 250; // 0.25 seconds = 250ms
  const explosionStartTimeRef = useRef<number | null>(null);
  const explosionTriggeredRef = useRef<boolean>(false);
  const explosionInProgressRef = useRef<boolean>(false);

  // Calculate color based on timer progress (green -> orange -> red)
  const getColorByTimer = (timeLeft: number, maxTimeValue: number): string => {
    const progress = 1 - (timeLeft / maxTimeValue); // 0 = fresh, 1 = almost done
    
    if (progress < 0.3) {
      // Green phase (0% - 30% elapsed)
      const intensity = Math.max(0.5, 1 - progress * 0.5);
      return `rgba(34, 197, 94, ${intensity})`; // Green with varying opacity
    } else if (progress < 0.7) {
      // Orange phase (30% - 70% elapsed)
      const intensity = Math.max(0.6, 1 - (progress - 0.3) * 0.3);
      return `rgba(249, 115, 22, ${intensity})`; // Orange with varying opacity
    } else {
      // Red phase (70% - 100% elapsed)
      const intensity = Math.max(0.7, 1 - (progress - 0.7) * 0.2);
      return `rgba(239, 68, 68, ${intensity})`; // Red with varying opacity
    }
  };

  // Simple beat detection based on time intervals
  const detectBeat = (): boolean => {
    const currentTime = Date.now();
    const timeSinceLastBeat = currentTime - lastBeatTimeRef.current;
    
    if (timeSinceLastBeat >= beatInterval) {
      lastBeatTimeRef.current = currentTime;
      return true;
    }
    
    return false;
  };

  // Handle explosion trigger - Create separate explosion particles
  useEffect(() => {
    console.log('[BeatSyncAnimation] useEffect triggered, triggerExplosion:', triggerExplosion, 'isActive:', isActive);
    if (triggerExplosion && !explosionTriggeredRef.current) {
      console.log('[BeatSyncAnimation] Triggering explosion - creating explosion particles');
      explosionTriggeredRef.current = true;
      explosionInProgressRef.current = true;
      explosionStartTimeRef.current = Date.now();
      
      const canvas = canvasRef.current;
      if (canvas && particlesRef.current.length > 0) {
        console.log('[BeatSyncAnimation] Creating explosion particles from', particlesRef.current.length, 'circling particles');
        
        // Create explosion particles based on current circling particle positions
        explosionParticlesRef.current = particlesRef.current.map((particle, index) => {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          
          // Current position of circling particle
          const currentX = centerX + Math.cos(particle.angle) * particle.radius;
          const currentY = centerY + Math.sin(particle.angle) * particle.radius;
          
          // Calculate direction vector from center to particle
          const directionX = currentX - centerX;
          const directionY = currentY - centerY;
          const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
          
          // Normalize and extend to screen edges
          const normalizedX = directionX / directionLength;
          const normalizedY = directionY / directionLength;
          const screenEdgeDistance = Math.max(canvas.width, canvas.height) * 0.6;
          const targetX = centerX + normalizedX * screenEdgeDistance;
          const targetY = centerY + normalizedY * screenEdgeDistance;
          
          // Calculate velocity towards target
          const velocityX = (targetX - currentX) * 0.02; // Speed of explosion
          const velocityY = (targetY - currentY) * 0.02;
          
          console.log(`[BeatSyncAnimation] Explosion particle ${index}: (${currentX.toFixed(1)}, ${currentY.toFixed(1)}) -> (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
          
          return {
            x: currentX,
            y: currentY,
            vx: velocityX,
            vy: velocityY,
            size: particle.size,
            opacity: particle.opacity,
            color: particle.color,
            progress: 0
          };
        });
        
        console.log('[BeatSyncAnimation] Created', explosionParticlesRef.current.length, 'explosion particles');
      } else {
        console.log('[BeatSyncAnimation] No canvas or particles available for explosion');
      }
      
      // Reset trigger after explosion duration
      setTimeout(() => {
        explosionTriggeredRef.current = false;
        console.log('[BeatSyncAnimation] Explosion trigger reset after timeout');
      }, 3000);
    }
  }, [triggerExplosion, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Define safe zone (center area where quiz content is)
    const getSafeZone = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Safe zone is roughly the size of the quiz content area
      const safeZoneWidth = Math.min(canvas.width * 0.6, 800);
      const safeZoneHeight = Math.min(canvas.height * 0.7, 600);
      
      return {
        x: centerX - safeZoneWidth / 2,
        y: centerY - safeZoneHeight / 2,
        width: safeZoneWidth,
        height: safeZoneHeight,
        centerX,
        centerY
      };
    };

    // Initialize particles in radial pattern around safe zone
    const initParticles = () => {
      // Apply animation intensity setting (0-1 scale)
      const actualIntensity = Math.max(0, Math.floor(intensity * settings.animationIntensity));
      console.log('[BeatSyncAnimation] Initializing particles, base intensity:', intensity, 'actual intensity:', actualIntensity, 'setting:', settings.animationIntensity);
      particlesRef.current = [];
      const safeZone = getSafeZone();
      
      for (let i = 0; i < actualIntensity; i++) {
        // Distribute particles in rings around the safe zone
        const ringNumber = Math.floor(i / 10) + 1;
        const angleInRing = (i % 10) * (Math.PI * 2 / 10);
        
        // Start particles outside the safe zone
        const minRadius = Math.max(safeZone.width, safeZone.height) / 2 + 50;
        const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 50;
        const radius = minRadius + (ringNumber * 80) % (maxRadius - minRadius);
        
        const particle = {
          angle: angleInRing + Math.random() * 0.5,
          radius: radius,
          speed: (Math.random() - 0.5) * 0.02 + 0.01,
          size: Math.random() * 4 + 2,
          opacity: Math.random() * 0.4 + 0.3,
          color: getColorByTimer(timer, maxTime),
          pulsePhase: Math.random() * Math.PI * 2
        };
        
        particlesRef.current.push(particle);
      }
      console.log('[BeatSyncAnimation] Initialized', particlesRef.current.length, 'particles');
    };

    // Initialize particles if active or if we need them for explosions
    // But don't re-initialize if explosion is already in progress
    // Only initialize if: (active AND no explosion) OR (showing explosion AND no particles) OR (no particles at all)
    const shouldInitialize = 
      (isActive && !explosionInProgressRef.current) || 
      (showExplosion && particlesRef.current.length === 0) || 
      (particlesRef.current.length === 0 && !explosionInProgressRef.current);
      
    if (shouldInitialize) {
      console.log('[BeatSyncAnimation] Initializing particles, intensity:', intensity, 'explosionInProgress:', explosionInProgressRef.current, 'shouldInitialize:', shouldInitialize);
      initParticles();
    }

  // Animation loop
    const animate = () => {
      // Continue animation during explosions or when active
      if ((!isActive && !showExplosion) && particlesRef.current.length === 0) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isBeat = detectBeat();
      const currentColor = getColorByTimer(timer, maxTime);
      const safeZone = getSafeZone();
      const centerX = safeZone.centerX;
      const centerY = safeZone.centerY;

      // Draw safe zone indicator (subtle outline) - only if no active explosion
      const hasExplosionParticles = explosionParticlesRef.current.length > 0;
      if (!hasExplosionParticles) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
        ctx.setLineDash([]);
      }

      // Update and draw normal particles (only if no explosion is in progress)
      if (!explosionInProgressRef.current) {
        particlesRef.current = particlesRef.current.filter(particle => {
          // Normal circling animation
          const beatMultiplier = isBeat ? 2 : 1;
          const pulseIntensity = Math.sin(Date.now() * 0.008 + particle.pulsePhase) * 0.3 + 0.7;
          
          // Update particle angle (rotation around center)
          particle.angle += particle.speed * beatMultiplier;

          // Calculate position based on angle and radius
          const x = centerX + Math.cos(particle.angle) * particle.radius;
          const y = centerY + Math.sin(particle.angle) * particle.radius;

          // Update color based on timer
          particle.color = currentColor;

          // Draw particle as glowing circle
          ctx.save();
          
          const size = particle.size * pulseIntensity;
          const alpha = particle.opacity * pulseIntensity;
          
          // Outer glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.globalAlpha = alpha * 0.3;
          ctx.beginPath();
          ctx.arc(x, y, size * 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Core particle
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Beat flash effect
          if (isBeat) {
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = size * 4;
            ctx.fill();
          }
          
          ctx.restore();

          return true; // Keep particle
        });
      }

      // Update and draw explosion particles
      explosionParticlesRef.current = explosionParticlesRef.current.filter(particle => {
        // Update position based on velocity
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.progress += 0.02; // Explosion progress
        
        if (particle.progress >= 1) {
          console.log('[BeatSyncAnimation] Explosion particle completed, progress:', particle.progress);
          return false; // Remove particle when explosion is complete
        }
        
        // More visible explosion with better opacity curve
        const alpha = Math.max(0.1, (1 - particle.progress) * particle.opacity * 1.5);
        const size = particle.size * (1 + particle.progress * 0.5); // Grow during explosion
        
        // Draw explosion particle with enhanced visibility
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        // Enhanced trailing effect
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 4;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add explosion burst effect
        if (particle.progress < 0.3) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();

        return true; // Keep particle during explosion
      });

      // Draw connecting arcs between particles on the same ring (only for non-exploding particles)
      if (particlesRef.current.length > 0 && !explosionInProgressRef.current) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        const particlesByRing: { [key: number]: BeatParticle[] } = {};
        particlesRef.current.forEach(particle => {
          const ringNumber = Math.floor((particle.radius - Math.max(safeZone.width, safeZone.height) / 2 - 50) / 80);
          if (!particlesByRing[ringNumber]) {
            particlesByRing[ringNumber] = [];
          }
          particlesByRing[ringNumber].push(particle);
        });

        Object.values(particlesByRing).forEach(ringParticles => {
          if (ringParticles.length > 1) {
            ringParticles.forEach((particle, index) => {
              const nextParticle = ringParticles[(index + 1) % ringParticles.length];
              const x1 = centerX + Math.cos(particle.angle) * particle.radius;
              const y1 = centerY + Math.sin(particle.angle) * particle.radius;
              const x2 = centerX + Math.cos(nextParticle.angle) * nextParticle.radius;
              const y2 = centerY + Math.sin(nextParticle.angle) * nextParticle.radius;
              
              ctx.globalAlpha = 0.1;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            });
          }
        });
      }

      // Call explosion complete callback when all particles are done exploding
      if (explosionStartTimeRef.current && explosionParticlesRef.current.length === 0) {
        const explosionElapsed = Date.now() - explosionStartTimeRef.current;
        if (explosionElapsed > 500 && onExplosionComplete) {
          onExplosionComplete();
          explosionStartTimeRef.current = null;
          explosionInProgressRef.current = false;
          console.log('[BeatSyncAnimation] Explosion completed and cleanup done');
        }
      }

      // Continue animation as long as we have particles OR explosion is in progress
      const shouldContinue = particlesRef.current.length > 0 || explosionParticlesRef.current.length > 0 || explosionInProgressRef.current;
      if (shouldContinue) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        console.log('[BeatSyncAnimation] No particles left and no explosion in progress, stopping animation');
      }
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, timer, maxTime, intensity, onExplosionComplete]);

  // Reset particles when timer resets (new question)
  useEffect(() => {
    // Only reset particles if timer is at max (new question) and animation is active
    // and no explosion is currently in progress
    if (timer === maxTime && isActive) {
      // Reset beat timing for new question
      lastBeatTimeRef.current = Date.now();
      
      // Only reset particles if no explosion is in progress
      if (!explosionInProgressRef.current) {
        console.log('[BeatSyncAnimation] Resetting particles for new question');
        particlesRef.current = [];
      } else {
        console.log('[BeatSyncAnimation] Skipping particle reset - explosion in progress');
      }
    }
  }, [timer, maxTime, isActive]);
  
  // Clear particles only when component is truly inactive AND no explosion is in progress
  useEffect(() => {
    if (!isActive && !showExplosion) {
      // Check if explosion is in progress
      if (!explosionInProgressRef.current && particlesRef.current.length > 0) {
        console.log('[BeatSyncAnimation] Clearing particles - component fully inactive');
        particlesRef.current = [];
      }
    }
  }, [isActive, showExplosion]);

  // Only render canvas if there are particles to show or we're waiting for an explosion
  const shouldRender = isActive || showExplosion || particlesRef.current.length > 0;
  
  if (!shouldRender) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
        overflow: 'hidden'
      }}
    />
  );
};

export default BeatSyncAnimation;