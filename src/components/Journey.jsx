import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Heart } from 'lucide-react';

const GSAPOverlappingGrid = () => {
  const [active, setActive] = useState(0);
  const items = [1, 2, 3, 4, 5];
  
  // Create an array of refs to target specific DOM elements
  const cardsRef = useRef([]);

  // The Container Ref for scoping GSAP (good practice)
  const containerRef = useRef(null);

  useGSAP(() => {
    // Determine the window width to calculate 10% / 90% positions precisely
    // (Or use viewport units 'vw' directly in GSAP strings)
    
    // Create a timeline for synchronized movement
    const tl = gsap.timeline({
      defaults: { 
        duration: 0.8, 
        ease: "power3.inOut" // Smooth 'journey' feel
      }
    });

    cardsRef.current.forEach((card, i) => {
      // --- 10% Logic Calculation ---
      const isLeft = i < active;
      const isRight = i > active;
      const isActive = i === active;

      let xPos = 0;
      let scaleVal = 0.8;
      let opacityVal = 0.5;
      let zIndexVal = 10;
      let rotateVal = 0; // Optional: add slight rotation for style

      if (isActive) {
        xPos = 0; // Center
        scaleVal = 1.2;
        opacityVal = 1;
        zIndexVal = 50;
        rotateVal = 0;
      } else if (isLeft) {
        // Push to 10% logic (approx -40vw)
        // We add a stagger offset (i * 20) so they don't perfectly overlap
        xPos = -window.innerWidth * 0.35 + (i * 30); 
        zIndexVal = 10 + i;
        rotateVal = -5; // Tilt left stack slightly
      } else if (isRight) {
        // Push to 90% logic (approx +40vw)
        xPos = window.innerWidth * 0.35 - ((items.length - 1 - i) * 30);
        zIndexVal = 50 - i;
        rotateVal = 5; // Tilt right stack slightly
      }

      // Animate to the calculated state
      tl.to(card, {
        x: xPos,
        scale: scaleVal,
        opacity: opacityVal,
        zIndex: zIndexVal, // GSAP handles z-index integers instantly usually, or interpolates if able
        rotation: rotateVal,
      }, 0); // The '0' ensures all cards animate simultaneously
    });

  }, { dependencies: [active], scope: containerRef }); // Re-run when 'active' changes

  return (
    <div ref={containerRef} className="w-full h-screen bg-neutral-950 flex items-center justify-center overflow-hidden relative">
      <div className="relative w-full h-full flex items-center justify-center">
        {items.map((item, i) => (
          <div
            key={i}
            ref={el => cardsRef.current[i] = el} // Assign ref
            onClick={() => setActive(i)}
            className="absolute cursor-pointer will-change-transform"
            // Initial styles are handled by GSAP, but good to set defaults
            style={{ zIndex: 10, opacity: 0 }} 
          >
            {/* Card Design */}
            <div className="w-[280px] h-[360px] bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl flex flex-col items-center justify-center gap-4 hover:border-neutral-500 transition-colors">
              <Heart 
                className={`w-12 h-12 transition-colors duration-500 ${i === active ? 'text-red-500 fill-red-500/20' : 'text-neutral-500'}`} 
              />
              <span className="text-neutral-300 font-mono text-lg">Node {item}</span>
              
              {/* Optional: Content that only shows when active */}
              <div className={`transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-xs text-neutral-400 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GSAPOverlappingGrid;