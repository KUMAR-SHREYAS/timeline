import React, { useState, useRef, useMemo, useEffect } from "react";

/* =========================================
   1. HELPER FUNCTIONS & MATH
   ========================================= */

// Generates the smooth S-curve SVG path
const generateSegment = (start, end) => {
  const midY = (start.y + end.y) / 2;
  const cp1 = `${start.x},${midY}`;
  const cp2 = `${end.x},${midY}`;
  return `C ${cp1} ${cp2} ${end.x},${end.y}`;
};

// Calculates physical distance between points (Pythagorean)
const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Helper: Process Image URL (Google Drive & Photos support)
const processImageUrl = (url) => {
  if (!url) return "";
  
  // 1. Handle Google Drive links
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  // 2. Handle Google Photos Shortlinks (Webpages)
  if (url.includes("photos.app.goo.gl") || url.includes("photos.google.com/share")) {
    return "https://via.placeholder.com/400x300/f2e8cf/5c4b4b?text=See+Instructions+Below";
  }
  
  return url;
};

/* =========================================
   2. SUB-COMPONENTS
   ========================================= */

// --- Image Slider Popup ---
function ImageSlider({ slides, onTextChange, onAddImages, onDeleteSlide }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevCountRef = useRef(slides.length);
  const textareaRef = useRef(null);

  // Auto-switch to new slide when added
  useEffect(() => {
    if (slides.length > prevCountRef.current) {
      setCurrentIndex(prevCountRef.current);
    } else if (currentIndex >= slides.length) {
      setCurrentIndex(Math.max(0, slides.length - 1));
    }
    prevCountRef.current = slides.length;
  }, [slides.length]); 

  // Auto-resize textarea when text or slide changes
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

  // --- Handle Multiple File Uploads ---
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

  // Handle deletion with confirmation
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent slider from reacting
    if (window.confirm("Are you sure you want to delete this picture?")) {
      onDeleteSlide(currentIndex);
    }
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || { text: "", img: "" };
  const isGooglePhotosShare = currentSlide.img.includes("photos.app.goo.gl") || currentSlide.img.includes("photos.google.com/share");

  return (
    <div className="w-full flex flex-col items-center gap-2">
      
      {/* 1. SLIDER CONTAINER */}
      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#dcd1b2] shadow-inner bg-gray-100 group">
        
        {/* Image */}
        <img 
          src={processImageUrl(currentSlide.img)} 
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500"
          onError={(e) => e.target.src = "https://via.placeholder.com/300x200?text=Image+Error"}
        />

        

        {/* Delete Slide Button (Updated with SVG for visibility) */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-50 font-bold border-2 border-white transition-transform hover:scale-110 cursor-pointer"
          title="Remove this photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 2. CONTROLS ROW */}
      <div className="w-full flex gap-2 items-center justify-center">
        {/* Upload Button */}
        <label 
          className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-sm font-bold shadow flex items-center gap-2 transition-transform active:scale-95 flex-1 justify-center"
          title="Upload photos from computer"
        >
          <span>📂+</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleUpload} />
        </label>
      </div>

      {/* 3. GOOGLE PHOTOS INSTRUCTION */}
      {isGooglePhotosShare && (
        <div className="text-[9px] text-red-600 bg-red-50 p-2 rounded w-full text-center leading-tight border border-red-100">
          <strong>⚠️ Webpage link detected.</strong><br/>
          Right Click the Photo ➡ Select <strong>"Copy Image Address"</strong> ➡ Paste that instead.
        </div>
      )}

      {/* 4. CAPTION INPUT WITH NAVIGATION */}
      <div className="w-full flex items-center gap-1">
        {slides.length > 1 && (
          <button 
            onClick={prevSlide}
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-full min-w-[24px] h-6 flex items-center justify-center transition-colors font-bold text-lg leading-none pb-1 self-start mt-2"
            title="Previous"
          >
            &lt;
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={currentSlide.text}
          onChange={(e) => {
            onTextChange(currentIndex, e.target.value);
            e.target.style.height = 'auto'; // Reset height
            e.target.style.height = e.target.scrollHeight + 'px'; // Set to scrollHeight
          }}
          className="font-hand text-sm font-bold text-center text-gray-800 bg-transparent w-full resize-none focus:outline-none focus:bg-white/50 rounded p-1 border border-transparent focus:border-gray-300 transition-colors flex-1 overflow-hidden"
          rows={1}
          placeholder="Write caption..."
        />

        {slides.length > 1 && (
          <button 
            onClick={nextSlide}
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-full min-w-[24px] h-6 flex items-center justify-center transition-colors font-bold text-lg leading-none pb-1 self-start mt-2"
            title="Next"
          >
            &gt;
          </button>
        )}
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
function MovingHeart({ pathStr, ratio }) {
  if (!pathStr) return null;
  const cssPath = `path("${pathStr.replace(/\s+/g, " ").trim()}")`;

  return (
    <g
      style={{
        offsetPath: cssPath,
        offsetDistance: `${ratio * 100}%`,
        willChange: "offset-distance", 
        transition: "offset-distance 1.2s cubic-bezier(0.25, 1, 0.5, 1)", 
        offsetRotate: "0deg", 
      }}
    >
      <path
        d="M12 21s-6.7-4.35-9.5-8.28C.6 9.7 2.1 6 5.6 6c2 0 3.2 1.2 3.9 2.3C10.2 7.2 11.4 6 13.4 6c3.5 0 5 3.7 3.1 6.7C18.7 16.65 12 21 12 21z"
        fill="#dc2626"
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
        fill={active ? "#ef4444" : "#9ca3af"}
        className={`transition-transform duration-300 origin-center ${
          selected ? "scale-[2.3] stroke-2 stroke-black/10" : "scale-[2.0] hover:scale-[2.15]"
        }`}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </g>
  );
}

/* =========================================
   3. THE TIMELINE EDITOR (Main Logic)
   ========================================= */

function TimelineEditor({ initialNodes, onExit }) {
  const [nodes, setNodes] = useState(initialNodes || []);
  const [selectedId, setSelectedId] = useState(nodes.length > 0 ? nodes[0].id : null);
  const [isAdding, setIsAdding] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0, align: 'left' });
  const svgRef = useRef(null);

  // --- POPUP POSITION STATE ---
  const [popupPlacement, setPopupPlacement] = useState({ vertical: 'top', xOffset: 0 });

  // --- CALCULATE DYNAMIC POPUP POSITION ---
  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`node-${selectedId}`);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const popupWidth = 320; // Updated Width
    
    // 1. Vertical Logic (Viewport-aware)
    // If < 300px from top of screen, show below. Otherwise show above.
    const newVertical = (rect.top < 300) ? 'bottom' : 'top';
    
    // 2. Horizontal Logic (Viewport-aware)
    // Keep the box fully on screen
    let xOffset = 0;
    const halfWidth = popupWidth / 2;
    const distToLeft = rect.left;
    const distToRight = window.innerWidth - rect.right;

    if (distToLeft < halfWidth) {
      // Too close to left edge, push right
      xOffset = halfWidth - distToLeft + 10; // 10px buffer
    } else if (distToRight < halfWidth) {
      // Too close to right edge, push left
      xOffset = -(halfWidth - distToRight + 10);
    }
    
    setPopupPlacement({ vertical: newVertical, xOffset });
  }, [selectedId]); 

  // --- SAVE ---
  const saveTimeline = () => {
    if (nodes.length === 0) return alert("Nothing to save yet!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `timeline_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- ACTIONS ---
  const deleteNode = (id) => {
    if (window.confirm("Are you sure you want to delete this checkpoint?")) {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, isHidden: true } : n));
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
        // Updated logic: if removing last image, revert to placeholder instead of deleting slide object entirely if count is 1
        const remaining = n.slides.filter((_, i) => i !== slideIndex);
        if (remaining.length === 0) {
           return { ...n, slides: [{ text: "New Note", img: "https://via.placeholder.com/300x200?text=Text+Only" }] };
        }
        return { ...n, slides: remaining };
      }
      return n;
    }));
  };

  // --- PATH & LAYOUT ---
  const fullPathString = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      d += " " + generateSegment(nodes[i - 1], nodes[i]);
    }
    return d;
  }, [nodes]);

  const progressRatio = useMemo(() => {
    if (nodes.length < 2 || !selectedId) return 0;
    let totalLength = 0;
    let targetLength = 0;
    for (let i = 1; i < nodes.length; i++) {
      const segLen = getDistance(nodes[i-1], nodes[i]);
      totalLength += segLen;
      if (nodes.findIndex(n => n.id === selectedId) >= i) {
         targetLength += segLen;
      }
    }
    if (totalLength === 0) return 0;
    if (nodes[0].id === selectedId) return 0;
    return targetLength / totalLength;
  }, [nodes, selectedId]);

  const lastNode = nodes.length > 0 ? nodes[nodes.length - 1] : { y: 100 };
  const canvasHeight = Math.max(window.innerHeight - 300, lastNode.y + 500);

  const handleCanvasClick = (e) => {
    if (!isAdding) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 10 || x > rect.width - 10) return alert("Too close to edge!");
    if (nodes.length > 0) {
      if (y <= lastNode.y + 20) {
        return alert("Please click lower down to maintain timeline flow.");
      }
    }

    const isFirst = nodes.length === 0;
    const newNode = {
      id: Date.now(),
      x, y,
      label: isFirst ? "Start" : `Step ${nodes.length + 1}`,
      status: "completed",
      slides: [
        { 
          text: isFirst ? "Journey Begins! 🚀" : "New Milestone 🚩", 
          img: `https://picsum.photos/id/${(nodes.length + 1) * 11}/300/200` 
        }
      ]
    };

    setNodes([...nodes, newNode]);
    setIsAdding(false);
    setSelectedId(newNode.id); 
    
    const isRightSide = x > (rect.width / 2);
    setBtnPos({ x, y, align: isRightSide ? 'left' : 'right' });
  };

  useEffect(() => {
    if (nodes.length > 0) {
      const last = nodes[nodes.length - 1];
      const isRightSide = last.x > (svgRef.current?.getBoundingClientRect().width / 2); 
      setBtnPos({ x: last.x, y: last.y, align: isRightSide ? 'left' : 'right' });
    }
  }, [nodes]);

  const selectedNode = nodes.find(n => n.id === selectedId);
  const isTimelineEmpty = nodes.length === 0;

  // Derive popup position props
  const isPopBottom = popupPlacement.vertical === 'bottom';
  const popupTranslate = isPopBottom 
    ? `translate(calc(-50% + ${popupPlacement.xOffset}px), 30px)` 
    : `translate(calc(-50% + ${popupPlacement.xOffset}px), -135%)`;

  return (
    <div className="relative w-full h-screen bg-[#fafaf9] overflow-y-auto cursor-default">
      
      {/* --- TOP BAR (Fixed) --- */}
      <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md py-4 px-10 md:px-20 lg:px-48 flex justify-between items-center z-[100] shadow-sm">
        <button 
          onClick={onExit}
          className="text-gray-600 font-hand font-bold text-lg hover:text-red-500 flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          ← Exit
        </button>
        
        <button 
          onClick={saveTimeline}
          className="bg-gray-800 text-white px-5 py-2 rounded-lg font-hand font-bold shadow hover:bg-black transition-all flex gap-2 items-center hover:scale-105"
        >
          <span>💾</span> Save
        </button>
      </div>

      {/* --- MAIN SCROLLABLE AREA --- */}
      <div className="w-full flex flex-col items-center min-h-screen pt-32 pb-20 gap-8">
        
        <div className="max-w-2xl w-full text-center px-4">
          <p className="text-gray-400 font-hand text-xl">
            {isTimelineEmpty 
              ? "Your journey is waiting to begin..." 
              : isAdding 
                ? "👇 Click anywhere on the parchment to place point" 
                : "Add checkpoints or click hearts to edit"}
          </p>
        </div>

        {/* --- TIMELINE CONTAINER (Removed box styling) --- */}
        <div 
          className="relative w-full max-w-2xl mt-12"
          style={{ height: canvasHeight }}
        >
          
          <div className="relative w-[90%] mx-auto h-full">

            {/* ADD BUTTON */}
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
                onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); }}
                className={`rounded-full font-hand font-bold shadow-xl whitespace-nowrap transition-all border-2 border-white/50 ${
                  isTimelineEmpty
                    ? "px-8 py-4 text-xl bg-green-600 text-white hover:bg-green-700 animate-bounce hover:scale-110"
                    : isAdding 
                      ? "px-5 py-2 text-sm bg-[#ef4444] text-white animate-pulse ring-4 ring-red-200 scale-105" 
                      : "px-5 py-2 text-sm bg-[#3b82f6] text-white hover:bg-blue-600 hover:scale-105"
                }`}
              >
                {isAdding 
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
              className={`transition-colors duration-300 rounded-lg ${isAdding ? "cursor-crosshair bg-[#f2e8cf]/90" : "bg-[#f2e8cf]"}`}
              onClick={handleCanvasClick}
            >
              {/* Background Pattern */}
              <defs>
                <pattern id="heart-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <text x="0" y="10" fontSize="8" opacity="0.15" transform="rotate(-15)">❤️</text>
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#heart-pattern)" pointerEvents="none" />

              {nodes.length > 1 && (
                <path
                  d={fullPathString}
                  fill="none"
                  stroke="#5c4b4b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  className="opacity-40"
                />
              )}

              {nodes.length > 1 && (
                <MovingHeart pathStr={fullPathString} ratio={progressRatio} />
              )}

              {nodes.map((node) => {
                // Skip rendering visual elements if hidden, but keep node for path logic
                if (node.isHidden) return null;
                
                return (
                  <g 
                    key={node.id} 
                    id={`node-${node.id}`} // Used for getBoundingClientRect
                    className="cursor-pointer group"
                    onClick={(e) => { e.stopPropagation(); setSelectedId(node.id); }}
                  >
                    <Heart 
                      x={node.x} 
                      y={node.y} 
                      active={node.status === "completed"} 
                      selected={selectedId === node.id} 
                    />
                    {/* Text Label */}
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
                );
              })}
            </svg>

            {/* Popup Logic */}
            {selectedNode && (
              <div
                className={`absolute parchment-box z-10 ${isPopBottom ? 'pop-bottom' : 'pop-top'}`}
                style={{
                  left: selectedNode.x,
                  top: selectedNode.y,
                  transform: popupTranslate, 
                }}
              >
                {/* Header Row: Title Input + Delete Button */}
                <div className="flex items-center gap-2 mb-2 border-b border-[#dcd1b2] pb-1">
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                    className="font-hand text-xl font-bold text-center text-[#5c4b4b] bg-transparent w-full focus:outline-none focus:border-[#5c4b4b] placeholder-gray-400"
                    placeholder="Enter Title..."
                  />
                  <button 
                    onClick={() => deleteNode(selectedNode.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                    title="Delete Checkpoint"
                  >
                    🗑️
                  </button>
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

  const startNew = () => {
    setTimelineData([]);
    setView('editor');
  };

  const loadFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedNodes = JSON.parse(e.target.result);
        setTimelineData(loadedNodes);
        setView('editor');
      } catch (err) {
        alert("Error loading file. Please ensure it is a valid JSON timeline.");
      }
    };
    reader.readAsText(file);
  };

  if (view === 'editor') {
    return <TimelineEditor key={Date.now()} initialNodes={timelineData} onExit={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-6 text-center">
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
          0% { opacity: 0; transform: translate(-50%, -110%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, -135%) scale(1); }
        }
        .pop-top {
          animation: popTop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom center;
        }

        @keyframes popBottom {
          0% { opacity: 0; transform: translate(-50%, 10px) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%, 30px) scale(1); }
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