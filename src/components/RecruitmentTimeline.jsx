import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from "react";

/* =========================================
   1. HELPER FUNCTIONS & MATH
   ========================================= */

// Generates the smooth S-curve SVG path
const generateSegment = (start, end) => {
  const midY = (start.y + end.y) / 2;
  // If points are very close vertically, adjust control points to avoid loops
  const safeMidY = Math.abs(end.y - start.y) < 10 ? start.y + 20 : midY;
  
  const cp1 = `${start.x},${safeMidY}`;
  const cp2 = `${end.x},${safeMidY}`;
  return `C ${cp1} ${cp2} ${end.x},${end.y}`;
};

// Helper: Process Image URL (Google Drive & Photos support)
const processImageUrl = (url) => {
  if (!url) return "";
  
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  if (url.includes("photos.app.goo.gl") || url.includes("photos.google.com/share")) {
    return "https://via.placeholder.com/400x300/f2e8cf/5c4b4b?text=See+Instructions+Below";
  }
  
  return url;
};

/* =========================================
   2. SUB-COMPONENTS
   ========================================= */

// --- Confetti Component (Optimized with Offscreen Canvas) ---
function Confetti({ run }) {
  const canvasRef = useRef(null);
  // Keep component mounted during fade-out animation
  const [shouldRender, setShouldRender] = useState(run);

  useEffect(() => {
    if (run) {
      setShouldRender(true);
    } else {
      // Wait for 1.5s fade out before unmounting to save resources
      const timer = setTimeout(() => setShouldRender(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [run]);
  
  useEffect(() => {
    if (!shouldRender) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true }); // Optimize for transparency
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId;
    
    // Dynamic density calculation - safer limit
    // width * height / 15000 gives good density without overloading
    let maxParticles = Math.floor((width * height) / 15000); 
    maxParticles = Math.max(50, Math.min(maxParticles, 300)); // Cap at 300 for performance

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      maxParticles = Math.floor((width * height) / 15000);
      maxParticles = Math.max(50, Math.min(maxParticles, 300));
    };
    
    // Initial resize
    resize();
    window.addEventListener("resize", resize);

    // 1. PRE-RENDER EMOJIS TO OFFSCREEN CANVASES
    // Drawing text on canvas every frame is slow. Drawing images is fast.
    const shapes = ["❤️", "💖", "💕", "💞", "🌹", "✨", "🌸", 
      "🤍", "😍", "🥰", "💌","🩷","❤️","🧡","💛","💚","💚",
      "🩵","💙","💜","🖤","🩶","🤍","🤎","❤️‍🔥","❣️","💕","💞",
      "💓","💗","💖","💘","💘","💝","💟","🧣","👩‍❤️‍👨","👫","👠",
      "💍","💋","💄","👄","🫦","💃🏻","🕺","☺️","😊","😍","🥰","😘"
    ];
    const shapeCache = {};
    const cacheSize = 50; // Resolution of cached emoji

    shapes.forEach(shape => {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = cacheSize;
        pCanvas.height = cacheSize;
        const pCtx = pCanvas.getContext('2d');
        pCtx.font = `${cacheSize - 10}px serif`;
        pCtx.textAlign = "center";
        pCtx.textBaseline = "middle";
        pCtx.fillText(shape, cacheSize / 2, cacheSize / 2);
        shapeCache[shape] = pCanvas;
    });

    const particles = [];

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * -50 - 20, 
        size: Math.random() * 20 + 15, 
        shape: shapes[Math.floor(Math.random() * shapes.length)], // Store shape key
        speedY: Math.random() * 1.5 + 0.5, 
        speedX: Math.random() * 1 - 0.5,   
        swaySpeed: Math.random() * 0.02 + 0.01, 
        swayOffset: Math.random() * Math.PI * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() * 2 - 1) * 0.5 
      };
    }

    // Initial burst
    for (let i = 0; i < maxParticles / 2; i++) {
        const p = createParticle();
        p.y = Math.random() * height; 
        particles.push(p);
    }

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Maintain particle count
      if (particles.length < maxParticles) {
        const spawnRate = particles.length < maxParticles / 2 ? 3 : 1;
        for(let i=0; i<spawnRate; i++) {
             if (Math.random() < 0.1) particles.push(createParticle());
        }
      }

      particles.forEach((p, i) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * p.swaySpeed + p.swayOffset) * 0.3;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        
        // 2. USE DRAWIMAGE INSTEAD OF FILLTEXT (Much Faster)
        const cachedImg = shapeCache[p.shape];
        if (cachedImg) {
            ctx.drawImage(cachedImg, -p.size/2, -p.size/2, p.size, p.size);
        }
        
        ctx.restore();

        if (p.y > height + 50) {
           particles[i] = createParticle();
        }
      });

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
      // Clean up cache could be done here if needed, but JS GC handles canvas elements
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw", 
        height: "100vh", 
        pointerEvents: "none",
        zIndex: 9999,
        opacity: run ? 1 : 0, 
        transition: "opacity 1.5s ease-out" 
      }}
    />
  );
}

// --- Music Player Component ---
function MusicPlayer({ currentSrc, onMusicUpload, onPlayStateChange }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false); // Stop confetti on load
      if(currentSrc) {
        audioRef.current.load();
      }
    }
  }, [currentSrc]);

  const togglePlay = () => {
    if (!audioRef.current || !currentSrc) return;
    
    if (playing) {
      audioRef.current.pause();
      if (onPlayStateChange) onPlayStateChange(false);
    } else {
      audioRef.current.play();
      if (onPlayStateChange) onPlayStateChange(true);
    }
    setPlaying(!playing);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert("Audio file is too large! Please choose a file under 10MB.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onMusicUpload(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      {currentSrc && (
        <button
          onClick={togglePlay}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-hand shadow transition flex items-center gap-2"
        >
          {playing ? "⏸ Pause" : "▶ Play Song"}
        </button>
      )}

      <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg font-hand text-sm flex items-center gap-2 text-gray-700">
        <span>🎵</span>
        <span className="hidden sm:inline">{currentSrc ? "Change Song" : "Choose Song"}</span>
        <input
          type="file"
          accept="audio/*, video/mp4"
          className="hidden"
          onChange={handleFile}
        />
      </label>

      <audio
        ref={audioRef}
        src={currentSrc}
        onEnded={() => {
          setPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
        }}
      />
    </div>
  );
}

// --- Image Slider Popup ---
function ImageSlider({ slides, onTextChange, onAddImages, onDeleteSlide }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevCountRef = useRef(slides.length);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (slides.length > prevCountRef.current) {
      setCurrentIndex(prevCountRef.current);
    } else if (currentIndex >= slides.length) {
      setCurrentIndex(Math.max(0, slides.length - 1));
    }
    prevCountRef.current = slides.length;
  }, [slides.length]); 

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentIndex, slides]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleMultipleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { 
        alert(`Skipped ${file.name}: File too large (max 5MB).`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const readers = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      onAddImages(images);
      e.target.value = ""; 
    });
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("Are you sure you want to delete this picture?")) {
      onDeleteSlide(currentIndex);
    }
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || { text: "", img: "" };
  const isGooglePhotosShare = currentSlide.img.includes("photos.app.goo.gl") || currentSlide.img.includes("photos.google.com/share");

  return (
    <div className="w-full flex flex-col items-center gap-2">
      
      {/* 1. NAVIGATION ROW (Above Image) */}
      {slides.length > 1 && (
        <div className="w-full flex justify-between items-center px-2">
           <button 
              onClick={prevSlide}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-all font-bold shadow-sm"
              title="Previous"
            >
              ❮
            </button>

            <span className="text-xs font-bold text-[#5c4b4b] font-hand">
              {currentIndex + 1} of {slides.length}
            </span>

            <button 
              onClick={nextSlide}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-all font-bold shadow-sm"
              title="Next"
            >
              ❯
            </button>
        </div>
      )}
      
      {/* 2. IMAGE CONTAINER */}
      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#dcd1b2] shadow-inner bg-gray-100 group">
        <img 
          src={processImageUrl(currentSlide.img)} 
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 relative z-0"
          onError={(e) => e.target.src = "https://via.placeholder.com/300x200?text=Image+Error"}
        />
      </div>

      {/* 3. CONTROLS ROW */}
      <div className="w-full flex gap-2 items-center justify-center">
        <label 
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-sm font-bold shadow flex items-center gap-2 transition-transform active:scale-95 flex-1 justify-center"
          title="Upload photos from computer"
        >
          <span>📂+</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleUpload} />
        </label>

        <button
          type="button"
          onClick={handleDeleteClick}
          className="bg-red-500 hover:bg-red-600 text-white rounded px-3 py-1.5 shadow flex items-center justify-center transition-transform active:scale-95 z-50"
          title="Remove this photo"
        >
          ❌
        </button>
      </div>

      {isGooglePhotosShare && (
        <div className="text-[9px] text-red-600 bg-red-50 p-2 rounded w-full text-center leading-tight border border-red-100">
          <strong>⚠️ Webpage link detected.</strong><br/>
          Right Click the Photo ➡ Select <strong>"Copy Image Address"</strong> ➡ Paste that instead.
        </div>
      )}

      {/* 4. CAPTION INPUT */}
      <div className="w-full flex items-center gap-1">
        <textarea
          ref={textareaRef}
          value={currentSlide.text}
          onChange={(e) => {
            onTextChange(currentIndex, e.target.value);
            e.target.style.height = 'auto'; 
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          className="font-hand text-sm font-bold text-center text-gray-800 bg-transparent w-full resize-none focus:outline-none focus:bg-white/50 rounded p-1 border border-transparent focus:border-gray-300 transition-colors flex-1 overflow-hidden"
          rows={1}
          placeholder="Write caption..."
        />
      </div>
      
      {/* 5. DOT INDICATORS */}
      {slides.length > 1 && (
        <div className="flex gap-1 justify-center w-full">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- The Moving Heart (Animation) ---
function MovingHeart({ pathStr }) {
  const [renderPath, setRenderPath] = useState(pathStr);
  const [offset, setOffset] = useState(100);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathPropRef = useRef(pathStr);

  useEffect(() => {
    if (!pathStr) return;
    
    const prevPath = prevPathPropRef.current;
    
    // Helper to measure path length safely
    const getLen = (d) => {
      if (typeof document === 'undefined') return 0; 
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      return p.getTotalLength();
    };

    const currentLen = getLen(pathStr);

    // CASE 1: EXTENDING (Forward)
    if (prevPath && pathStr.startsWith(prevPath) && pathStr !== prevPath) {
       const prevLen = getLen(prevPath);
       const startPerc = currentLen > 0 ? (prevLen / currentLen) * 100 : 0;
       
       setRenderPath(pathStr);
       setIsTransitioning(false);
       setOffset(startPerc);

       requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setOffset(100);
        });
      });
    } 
    // CASE 2: RETRACTING (Backward)
    else if (prevPath && prevPath.startsWith(pathStr) && pathStr !== prevPath) {
        const prevLen = getLen(prevPath);
        const targetPerc = prevLen > 0 ? (currentLen / prevLen) * 100 : 100;

        // Keep rendering OLD path to animate backward
        setRenderPath(prevPath);
        setIsTransitioning(false);
        setOffset(100);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsTransitioning(true);
                setOffset(targetPerc);
            });
        });

        // After animation, swap to new path
        const timeoutId = setTimeout(() => {
            setRenderPath(pathStr);
            setIsTransitioning(false); 
            setOffset(100); // 100% of new path == targetPerc of old path
        }, 1000); 

        prevPathPropRef.current = pathStr;
        return () => clearTimeout(timeoutId);
    }
    // CASE 3: JUMP / RESET
    else if (prevPath !== pathStr) {
       setRenderPath(pathStr);
       setIsTransitioning(false);
       setOffset(0);
       
       requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setOffset(100);
        });
      });
    }

    prevPathPropRef.current = pathStr;

  }, [pathStr]);

  if (!renderPath) return null;
  const cssPath = `path("${renderPath.replace(/\s+/g, " ").trim()}")`;

  return (
    <g
      style={{
        offsetPath: cssPath,
        offsetDistance: `${offset}%`,
        transition: isTransitioning ? "offset-distance 1s ease-in-out" : "none",
        willChange: "offset-distance",
      }}
    >
      <path
        d="M12 21s-6.7-4.35-9.5-8.28C.6 9.7 2.1 6 5.6 6c2 0 3.2 1.2 3.9 2.3C10.2 7.2 11.4 6 13.4 6c3.5 0 5 3.7 3.1 6.7C18.7 16.65 12 21 12 21z"
        fill="#db2777"
        transform="translate(-24, -24) scale(2.0)"
        filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
      />
    </g>
  );
}

// --- Static Checkpoint Heart ---
function Heart({ x, y, active, selected }) {
  return (
    <g transform={`translate(${x - 24},${y - 24})`}> 
      <path
        d="M12 21s-6.7-4.35-9.5-8.28C.6 9.7 2.1 6 5.6 6c2 0 3.2 1.2 3.9 2.3C10.2 7.2 11.4 6 13.4 6c3.5 0 5 3.7 3.1 6.7C18.7 16.65 12 21 12 21z"
        fill={active ? "#ec4899" : "#9ca3af"}
        className={`transition-transform duration-300 origin-center ${
          selected ? "scale-[3.5] stroke-2 stroke-black/10" : "scale-[3.5] hover:scale-[5.5]"
        }`}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </g>
  );
}

/* =========================================
   3. THE TIMELINE EDITOR (Main Logic)
   ========================================= */

function TimelineEditor({ initialData, onExit }) {
  // Safe window dimensions state to avoid hydration mismatch
  const [windowSize, setWindowSize] = useState({ 
    width: 1200, 
    height: 800 
  });

  // Normalize nodes on init: Ensure everyone has a parentId if loading old files
  const normalizedNodes = useMemo(() => {
    let raw = initialData.nodes || [];
    if (raw.length === 0) return [];
    
    // Map existing linear structure to parent-child if parentId is missing
    return raw.map((node, index) => {
        if (node.parentId !== undefined) return node;
        // Migration logic: Parent is the previous node in array, unless it's the first node
        return {
            ...node,
            parentId: index === 0 ? null : raw[index - 1].id
        };
    });
  }, [initialData]);

  const [nodes, setNodes] = useState(normalizedNodes);
  const [music, setMusic] = useState(initialData.music || "");

  const [selectedId, setSelectedId] = useState(nodes.length > 0 ? nodes[0].id : null);
  
  // addingMode: null (none), 'sequence' (main button), 'branch' (branch button)
  const [addingMode, setAddingMode] = useState(null); 
  const [branchOriginId, setBranchOriginId] = useState(null);

  const [btnPos, setBtnPos] = useState({ x: 0, y: 0, align: 'left' });
  const svgRef = useRef(null);
  const [popupPlacement, setPopupPlacement] = useState({ vertical: 'top', xOffset: 0 });

  // Confetti State
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  // Update window size on mount
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize(); // Set initial client size
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update button position for the "Main" add button (tracks last added node)
  useEffect(() => {
    if (nodes.length > 0) {
      const last = nodes[nodes.length - 1]; // Simply track the chronologically last added
      const rect = svgRef.current?.getBoundingClientRect();
      const isRightSide = last.x > (rect ? rect.width / 2 : 500); 
      setBtnPos({ x: last.x, y: last.y, align: isRightSide ? 'left' : 'right' });
    }
  }, [nodes]);

  // Calculate popup position
  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`node-${selectedId}`);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const popupWidth = 320; 
    
    const newVertical = (rect.top < 300) ? 'bottom' : 'top';
    
    let xOffset = 0;
    const halfWidth = popupWidth / 2;
    const distToLeft = rect.left;
    const distToRight = windowSize.width - rect.right;

    if (distToLeft < halfWidth) {
      xOffset = halfWidth - distToLeft + 10; 
    } else if (distToRight < halfWidth) {
      xOffset = -(halfWidth - distToRight + 10);
    }
    
    setPopupPlacement({ vertical: newVertical, xOffset });
  }, [selectedId, windowSize.width]); 

  // --- ACTIONS ---
  const saveTimeline = () => {
    if (nodes.length === 0) return alert("Nothing to save yet!");
    const payload = { nodes, music };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `timeline_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const deleteNode = (id) => {
    if (window.confirm("Delete this checkpoint? (Children nodes will detach)")) {
      setNodes(prev => prev.filter(n => n.id !== id).map(n => {
        // If we delete a parent, its children become orphans (start of new lines)
        if (n.parentId === id) return { ...n, parentId: null };
        return n;
      }));
      setSelectedId(null);
    }
  };

  const updateNodeLabel = (id, newLabel) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label: newLabel } : n));
  };

  const updateSlideText = (nodeId, slideIndex, newText) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const newSlides = [...n.slides];
        if (newSlides[slideIndex]) newSlides[slideIndex] = { ...newSlides[slideIndex], text: newText };
        return { ...n, slides: newSlides };
      }
      return n;
    }));
  };

  const addImages = (nodeId, newImages) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const newSlides = newImages.map(img => ({ text: "", img }));
        return { ...n, slides: [...n.slides, ...newSlides] };
      }
      return n;
    }));
  };

  const deleteSlide = (nodeId, slideIndex) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const remaining = n.slides.filter((_, i) => i !== slideIndex);
        if (remaining.length === 0) {
           return { ...n, slides: [{ text: "New Note", img: "https://via.placeholder.com/300x200?text=Text+Only" }] };
        }
        return { ...n, slides: remaining };
      }
      return n;
    }));
  };

  // --- BRANCHING & PATH LOGIC ---

  // 1. Generate path for the Moving Heart (Root -> Selected Node)
  const activePathString = useMemo(() => {
    if (!selectedId || nodes.length < 2) return "";
    
    // Backtrack from selected node to a root (null parent)
    const pathNodes = [];
    let current = nodes.find(n => n.id === selectedId);
    
    while (current) {
        pathNodes.unshift(current);
        if (!current.parentId) break;
        current = nodes.find(n => n.id === current.parentId);
    }

    if (pathNodes.length < 2) return "";

    // Build path string
    let d = `M ${pathNodes[0].x} ${pathNodes[0].y}`;
    for (let i = 1; i < pathNodes.length; i++) {
        d += " " + generateSegment(pathNodes[i - 1], pathNodes[i]);
    }
    return d;

  }, [nodes, selectedId]);

  // 2. Generate all line segments for the background
  const lineSegments = useMemo(() => {
      return nodes.map(node => {
          if (!node.parentId) return null;
          const parent = nodes.find(n => n.id === node.parentId);
          if (!parent) return null; // Orphan or root
          return (
            <path
                key={`path-${node.id}`}
                d={`M ${parent.x} ${parent.y} ${generateSegment(parent, node)}`}
                fill="none"
                stroke="#5c4b4b"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 6"
                className="opacity-60"
            />
          );
      });
  }, [nodes]);

  // Handle Adding Nodes (Sequence or Branch)
  const handleCanvasClick = (e) => {
    if (!addingMode) {
      setSelectedId(null);
      return;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 10 || x > rect.width - 10) return alert("Too close to edge!");

    const isFirst = nodes.length === 0;
    
    // Determine parent: 
    // If First node -> null
    // If Branching -> branchOriginId
    // If Sequence -> Last added node (default behavior)
    let parentId = null;
    if (!isFirst) {
        if (addingMode === 'branch' && branchOriginId) {
            parentId = branchOriginId;
        } else {
            // Default: attach to last node created (linear flow)
            parentId = nodes[nodes.length - 1].id;
        }
    }

    const newNode = {
      id: Date.now(),
      x, y,
      parentId: parentId,
      label: isFirst ? "Start" : (addingMode === 'branch' ? "New Branch" : `Step ${nodes.length + 1}`),
      status: "completed",
      slides: [
        { 
          text: isFirst ? "Journey Begins! 🚀" : "New Milestone 🚩", 
          img: "https://via.placeholder.com/300x200?text=Text+Only" 
        }
      ]
    };

    setNodes([...nodes, newNode]);
    
    // Reset States
    setAddingMode(null);
    setBranchOriginId(null);
    setSelectedId(newNode.id); 
  };

  const startBranching = (fromId) => {
      setBranchOriginId(fromId);
      setAddingMode('branch');
      // Keep selected ID so popup might stay or close? Let's close it to show cursor
      setSelectedId(null); 
  };

  const lastNode = nodes.length > 0 ? nodes.reduce((prev, current) => (prev.y > current.y) ? prev : current) : { y: 100 };
  const rightMostNode = nodes.length > 0 ? nodes.reduce((prev, current) => (prev.x > current.x) ? prev : current) : { x: 0 };
  
  const canvasHeight = Math.max(windowSize.height - 100, lastNode.y + 500);
  const canvasWidth = Math.max(windowSize.width, rightMostNode.x + 500);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const isTimelineEmpty = nodes.length === 0;

  // Derive popup position props
  const isPopBottom = popupPlacement.vertical === 'bottom';
  const popupTranslate = isPopBottom 
    ? `translate(calc(-50% + ${popupPlacement.xOffset}px), 30px)` 
    : `translate(calc(-50% + ${popupPlacement.xOffset}px), -135%)`;

  return (
    <div className={`relative w-full h-screen bg-[#ffe4e1] overflow-auto ${addingMode ? 'cursor-crosshair' : 'cursor-default'}`}>
      
      {/* --- Confetti Overlay --- */}
      <Confetti run={isConfettiActive} />

      {/* --- TOP BAR (Fixed) --- */}
      <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md py-4 px-10 md:px-20 lg:px-48 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex-1 flex justify-start">
          <button 
            onClick={onExit}
            className="text-gray-600 font-hand font-bold text-lg hover:text-red-500 flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            ← Exit
          </button>
        </div>
        
        <div className="flex-none">
          <MusicPlayer 
            currentSrc={music} 
            onMusicUpload={setMusic} 
            onPlayStateChange={setIsConfettiActive} // Direct link to confetti state
          />
        </div>

        <div className="flex-1 flex justify-end">
          <button 
            onClick={saveTimeline}
            className="bg-gray-800 text-white px-5 py-2 rounded-lg font-hand font-bold shadow hover:bg-black transition-all flex gap-2 items-center hover:scale-105"
          >
            <span>💾</span> Save
          </button>
        </div>
      </div>

      <div className="w-full min-w-fit flex flex-col items-center min-h-screen pt-24 pb-20 gap-8">
        
        <div className="max-w-4xl w-full text-center px-4 sticky left-0 right-0">
          <p className="text-gray-400 font-hand text-xl">
            {isTimelineEmpty 
              ? "Your journey is waiting to begin..." 
              : addingMode === 'branch'
              ? "🌿 Branching Mode: Click anywhere to start a new path!"
              : addingMode === 'sequence'
                ? "👇 Click anywhere to place next checkpoint" 
                : null}
          </p>
          {addingMode && (
              <button 
                onClick={() => setAddingMode(null)}
                className="mt-2 text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-200"
              >
                  Cancel Placing
              </button>
          )}
        </div>

        {/* --- TIMELINE CONTAINER --- */}
        <div 
          className="relative mt-4"
          style={{ height: canvasHeight, width: canvasWidth }}
        >
          <div className="relative w-full h-full">

            {/* MAIN ADD BUTTON (Floating) */}
            <div 
              className="absolute z-50 transition-all duration-500 ease-out"
              style={{
                top: isTimelineEmpty ? '50%' : btnPos.y,
                left: isTimelineEmpty ? '50%' : btnPos.x,
                transform: isTimelineEmpty
                  ? 'translate(-50%, -50%)' 
                  : btnPos.align === 'right' 
                    ? 'translate(40px, -50%)' 
                    : 'translate(calc(-100% - 40px), -50%)'
              }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setAddingMode(addingMode ? null : 'sequence'); }}
                className={`rounded-full font-hand font-bold shadow-xl whitespace-nowrap transition-all border-2 border-white/50 ${
                  isTimelineEmpty
                    ? "px-8 py-4 text-xl bg-green-600 text-white hover:bg-green-700 animate-bounce hover:scale-110"
                    : addingMode === 'sequence'
                      ? "px-5 py-2 text-sm bg-[#ef4444] text-white animate-pulse ring-4 ring-red-200 scale-105" 
                      : "px-5 py-2 text-sm bg-[#3b82f6] text-white hover:bg-blue-600 hover:scale-105"
                }`}
              >
                {addingMode === 'sequence'
                  ? "Click on Parchment..." 
                  : isTimelineEmpty 
                    ? "📍 Start Journey Here" 
                    : "+ Checkpoint"
                }
              </button>
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height={canvasHeight}
              className={`transition-colors duration-300 rounded-lg ${addingMode ? "bg-[#f2e8cf]/90 ring-4 ring-blue-200" : "bg-[#f2e8cf]"}`}
              onClick={handleCanvasClick}
            >
              {/* Background Pattern */}
              <defs>
                <pattern id="heart-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <text x="10" y="30" fontSize="20" opacity="0.6" transform="rotate(-10 10 30)">🌸</text>
                  <text x="60" y="20" fontSize="12" opacity="0.5" transform="rotate(20 60 20)">🌺</text>
                  <text x="30" y="80" fontSize="16" opacity="1" transform="rotate(5 30 80)">🌼</text>
                  <text x="80" y="70" fontSize="24" opacity="0.6" transform="rotate(-20 80 70)">🌻</text>
                  <text x="50" y="50" fontSize="10" opacity="1">🌹</text>
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#heart-pattern)" pointerEvents="none" />

              {/* RENDER ALL LINES (BRANCHES) */}
              {lineSegments}

              {/* MOVING HEART - Follows path to selected node */}
              <MovingHeart pathStr={activePathString} />

              {nodes.map((node) => (
                  <g 
                    key={node.id} 
                    id={`node-${node.id}`} 
                    className="cursor-pointer group"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); setAddingMode(null); }}
                  >
                    <Heart 
                      x={node.x} 
                      y={node.y} 
                      active={true} 
                      selected={selectedId === node.id} 
                    />
                    <text
                      x={node.x}
                      y={node.y - 35} 
                      textAnchor="middle"
                      className="font-hand text-sm font-bold fill-gray-700 transition-all group-hover:-translate-y-1 select-none"
                      style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
            </svg>

            {/* Popup Logic */}
            {selectedNode && !addingMode && (
              <div
                className={`absolute parchment-box z-10 ${isPopBottom ? 'pop-bottom' : 'pop-top'}`}
                style={{
                  left: selectedNode.x,
                  top: selectedNode.y,
                  transform: popupTranslate, 
                }}
              >
                {/* Header Row: Title Input + Actions */}
                <div className="flex items-center gap-2 mb-2 border-b border-[#dcd1b2] pb-1">
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                    className="font-hand text-xl font-bold text-center text-[#5c4b4b] bg-transparent w-full focus:outline-none focus:border-[#5c4b4b] placeholder-gray-400"
                    placeholder="Enter Title..."
                  />
                  <div className="flex gap-1">
                    <button 
                        onClick={() => startBranching(selectedNode.id)}
                        className="text-blue-500 hover:text-white hover:bg-blue-500 p-1 rounded transition-colors"
                        title="Start New Timeline Branch Here"
                    >
                        🔀
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); deleteNode(selectedNode.id); }}
                        className="text-gray-400 hover:text-white hover:bg-red-500 p-1 rounded transition-colors"
                        title="Delete Checkpoint"
                    >
                        🗑️
                    </button>
                  </div>
                </div>
                
                {/* SLIDES WITH EDITABLE TEXT */}
                <ImageSlider 
                  slides={selectedNode.slides} 
                  onTextChange={(idx, txt) => updateSlideText(selectedNode.id, idx, txt)}
                  onAddImages={(newImages) => addImages(selectedNode.id, newImages)}
                  onDeleteSlide={(idx) => deleteSlide(selectedNode.id, idx)}
                />
                
                <div 
                  className="parchment-arrow"
                  style={{
                    bottom: isPopBottom ? "auto" : "0",
                    top: isPopBottom ? "0" : "auto",
                    transform: isPopBottom 
                      ? `translate(calc(-50% - ${popupPlacement.xOffset}px), -50%) rotate(45deg)` 
                      : `translate(calc(-50% - ${popupPlacement.xOffset}px), 50%) rotate(45deg)`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   4. APP CONTAINER
   ========================================= */

export default function App() {
  const [view, setView] = useState('home');
  const [timelineData, setTimelineData] = useState([]);
  const [editorKey, setEditorKey] = useState(0); // Stable key for resetting editor

  const startNew = () => {
    setTimelineData([]);
    setEditorKey(prev => prev + 1); // Increment key to reset editor state completely
    setView('editor');
  };

  const loadFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedNodes = JSON.parse(e.target.result);
        if (Array.isArray(loadedNodes)) {
           setTimelineData({ nodes: loadedNodes, music: "" });
        } else {
           setTimelineData(loadedNodes);
        }
        setEditorKey(prev => prev + 1); // Reset editor with new data
        setView('editor');
      } catch (err) {
        alert("Error loading file. Please ensure it is a valid JSON timeline.");
      }
    };
    reader.readAsText(file);
  };

  if (view === 'editor') {
    return <TimelineEditor key={editorKey} initialData={timelineData} onExit={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#ffe4e1] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-6xl font-hand font-bold text-gray-800 mb-4 tracking-tight">Timeline Maker</h1>
        <p className="text-gray-500 font-hand text-2xl mb-16">
          Map your journey, add milestones, and share your story.
        </p>
        
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
          <button 
            onClick={startNew}
            className="group relative bg-[#f2e8cf] border-2 border-[#e6dcc0] p-10 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all w-72 text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✨</div>
            <h3 className="font-bold text-2xl text-gray-700 mb-2 font-hand">Start New</h3>
            <p className="text-gray-500 font-hand">Begin with a blank canvas</p>
          </button>

          <label className="group relative bg-[#f2e8cf] border-2 border-[#e6dcc0] p-10 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all w-72 text-center cursor-pointer">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📂</div>
            <h3 className="font-bold text-2xl text-gray-700 mb-2 font-hand">Open File</h3>
            <p className="text-gray-500 font-hand">Load a saved JSON timeline</p>
            <input type="file" accept=".json" onChange={loadFile} className="hidden" />
          </label>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');
        .font-hand { font-family: "Indie Flower", cursive; }

        .parchment-box {
          background: #f2e8cf;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #dcd1b2;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          width: 320px;
          pointer-events: auto;
        }

        .parchment-arrow {
          position: absolute;
          left: 50%;
          width: 14px; height: 14px;
          background: #f2e8cf;
          border-bottom: 1px solid #dcd1b2;
          border-right: 1px solid #dcd1b2;
        }

        @keyframes popTop {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .pop-top {
          animation: popTop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom center;
        }

        @keyframes popBottom {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .pop-bottom {
          animation: popBottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: top center;
        }
        
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #fafaf9; }
        ::-webkit-scrollbar-thumb { background: #dcd1b2; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #b8ad90; }
      `}</style>
    </div>
  );
}