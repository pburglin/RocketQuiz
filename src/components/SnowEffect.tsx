import React, { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SnowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  drift: number; // Horizontal drift for wind effect
}

interface SnowEffectProps {
  intensity?: number; // Number of snowflakes
  maxSize?: number;
  minSize?: number;
}

const SnowEffect: React.FC<SnowEffectProps> = ({
  intensity = 150,
  maxSize = 8,
  minSize = 2
}) => {
  const { settings } = useSettings();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<SnowParticle[]>([]);

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

    // Apply animation intensity setting (0-1 scale)
    const actualIntensity = Math.max(0, Math.floor(intensity * settings.animationIntensity));
    console.log('[SnowEffect] Initializing snow particles, base intensity:', intensity, 'actual intensity:', actualIntensity, 'setting:', settings.animationIntensity);
    
    // Initialize snow particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < actualIntensity; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height, // Start above the visible area
          vx: (Math.random() - 0.5) * 0.5, // Very slow horizontal movement
          vy: Math.random() * 1 + 0.5, // Slow downward velocity
          size: Math.random() * (maxSize - minSize) + minSize,
          opacity: Math.random() * 0.8 + 0.2, // Varying transparency
          drift: Math.random() * 0.3 - 0.15 // Subtle wind drift
        });
      }
    };

    initParticles();

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle position
        particle.x += particle.vx + particle.drift;
        particle.y += particle.vy;
        
        // Reset particle if it goes off screen
        if (particle.y > canvas.height + 10) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -10) {
          particle.x = canvas.width + 10;
        }
        if (particle.x > canvas.width + 10) {
          particle.x = -10;
        }

        // Draw snowflake
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle sparkle effect for larger snowflakes
        if (particle.size > 4) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 0.5, particle.y);
          ctx.lineTo(particle.x + particle.size * 0.5, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 0.5);
          ctx.lineTo(particle.x, particle.y + particle.size * 0.5);
          ctx.stroke();
        }
        
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
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
  }, [intensity, maxSize, minSize, settings.animationIntensity]);

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
        zIndex: 999,
        overflow: 'hidden'
      }}
    />
  );
};

export default SnowEffect;