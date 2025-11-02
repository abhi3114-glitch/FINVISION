import { useEffect, useRef } from "react";

export default function BackgroundEffect() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: width / 2, y: height / 2 };
    
    // 📱 Mobile-optimized particle count based on screen size and performance
    const getParticleDensity = () => {
      if (window.innerWidth < 768) { // Mobile
        return Math.min(15, Math.floor(width / 60));
      } else if (window.innerWidth < 1024) { // Tablet
        return Math.min(25, Math.floor(width / 50));
      } else { // Desktop
        return Math.min(40, Math.floor(width / 40));
      }
    };

    let density = getParticleDensity();

    // 🌀 Handle Resize - Mobile Optimized
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      density = getParticleDensity();
      
      // Recreate particles with new density
      particlesRef.current = [];
      createParticles();
    };

    // 🖱️ Mouse Movement for parallax - Throttled for mobile
    let mouseMoveTimeout;
    const handleMouseMove = (e) => {
      if (mouseMoveTimeout) return; // Throttle for mobile performance
      
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      mouseMoveTimeout = setTimeout(() => {
        mouseMoveTimeout = null;
      }, 16); // ~60fps throttle
    };

    // 📱 Touch support for mobile
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    // 🌌 Create Particles (with mobile-optimized settings)
    const createParticles = () => {
      const particles = [];
      for (let i = 0; i < density; i++) {
        const layer = Math.random() * 2 + 1; // depth layers 1–3
        
        // 📱 Smaller particles on mobile for better performance
        const baseRadius = window.innerWidth < 768 ? 30 : 40;
        const radiusVariation = window.innerWidth < 768 ? 50 : 60;
        
        const hue = 180 + Math.random() * 60; // cyan to blue hues
        
        // 📱 Reduced opacity on mobile for better performance and battery
        const opacity = window.innerWidth < 768 ? 0.12 : 0.18;
        
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * radiusVariation + baseRadius,
          color: `hsla(${hue}, 90%, 65%, ${opacity})`,
          dx: (Math.random() - 0.5) * 0.2 * layer, // 📱 Slower movement on mobile
          dy: (Math.random() - 0.5) * 0.2 * layer,
          layer,
        });
      }
      particlesRef.current = particles;
    };

    // 🧠 Draw Function - Mobile Optimized
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((p) => {
        // 📱 Reduced parallax effect on mobile for better performance
        const parallaxIntensity = window.innerWidth < 768 ? 0.0005 : 0.001;
        const parallaxX = (mouse.x - width / 2) * parallaxIntensity * p.layer;
        const parallaxY = (mouse.y - height / 2) * parallaxIntensity * p.layer;

        const newX = p.x + parallaxX * p.radius;
        const newY = p.y + parallaxY * p.radius;

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          newX,
          newY,
          0,
          newX,
          newY,
          p.radius
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.arc(newX, newY, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Move particles
        p.x += p.dx;
        p.y += p.dy;
        
        // 📱 Optimized boundary checking
        if (p.x < -p.radius || p.x > width + p.radius) p.dx *= -1;
        if (p.y < -p.radius || p.y > height + p.radius) p.dy *= -1;
      });
    };

    // 🚀 Animation Loop - Mobile Optimized
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    createParticles();
    animate();

    // 🧹 Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mouseMoveTimeout) {
        clearTimeout(mouseMoveTimeout);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-80 pointer-events-none"
      // 📱 Mobile performance hints
      style={{ 
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    />
  );
}