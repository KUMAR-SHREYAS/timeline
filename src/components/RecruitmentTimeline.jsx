import React, { useState, useRef, useLayoutEffect } from "react";

const WIDTH = 520;
const HEIGHT = 500;

const rawData = [
  { id: 1, label: "Jan 15", status: "completed", content: "Application opened!" },
  { id: 2, label: "Feb 3", status: "completed", content: "Initial screening phase." },
  { id: 3, label: "Mar 10", status: "completed", content: "Technical interviews." },
  { id: 4, label: "Apr 8", status: "completed", content: "Final evaluation." },
  { id: 5, label: "May 22", status: "completed", content: "Offers sent." },
  { id: 6, label: "Jun 12", status: "completed", content: "Onboarding." },
  { id: 7, label: "Jul 29", status: "completed", content: "Team integration." },
  { id: 8, label: "Aug 15", status: "upcoming", content: "Next milestone." }
];

const PATH = `
M 100 80 C 180 40 240 60 260 90 S 420 130 420 130 C 480 200 460 240 440 260 C 380 310 420 330 400 350 C 340 400 323 377 265 332 C 167 271 153 309 136 333 C 87 375 182 463 300 450
`;

/* --- COMPONENT: MOVING HEART (CSS VERSION) --- */
function MovingHeart({ pathStr, ratio }) {
  // 1. Clean the path string for CSS (remove newlines/extra spaces)
  const cssPath = `path("${pathStr.replace(/\s+/g, " ").trim()}")`;

  return (
    <g
      style={{
        // 2. This ties the element to the path
        offsetPath: cssPath,
        // 3. Move to the specific % along the line
        offsetDistance: `${ratio * 100}%`,
        // 4. Smoothly animate any changes to offsetDistance
        transition: "offset-distance 1s ease-in-out",
        // 5. Keep heart upright (0deg) or follow line (auto)
        offsetRotate: "0deg", 
      }}
    >
      <path
        d="M12 21s-6.7-4.35-9.5-8.28C.6 9.7 2.1 6 5.6 6c2 0 3.2 1.2 3.9 2.3C10.2 7.2 11.4 6 13.4 6c3.5 0 5 3.7 3.1 6.7C18.7 16.65 12 21 12 21z"
        fill="#dc2626"
        // Center the heart icon on the line
        transform="translate(-12, -12)" 
      />
    </g>
  );
}

function Heart({ x, y, active, selected }) {
  if (x === undefined || y === undefined) return null;
  return (
    <g transform={`translate(${x - 10},${y - 10})`}>
      <path
        d="M12 21s-6.7-4.35-9.5-8.28C.6 9.7 2.1 6 5.6 6c2 0 3.2 1.2 3.9 2.3C10.2 7.2 11.4 6 13.4 6c3.5 0 5 3.7 3.1 6.7C18.7 16.65 12 21 12 21z"
        fill={active ? "#ef4444" : "#9ca3af"}
        className={`transition-transform duration-300 ${
          selected ? "scale-125" : "scale-100 hover:scale-110"
        }`}
      />
    </g>
  );
}

export default function RecruitmentTimeline() {
  const [points, setPoints] = useState(rawData);
  const [selectedId, setSelectedId] = useState(rawData[0].id);
  const pathRef = useRef(null);

  // Auto-map points to the SVG line
  useLayoutEffect(() => {
    if (pathRef.current) {
      const path = pathRef.current;
      const totalLength = path.getTotalLength();

      const mappedPoints = rawData.map((point, index) => {
        const ratio = index / (rawData.length - 1);
        const lengthOnLine = totalLength * ratio;
        const pointOnLine = path.getPointAtLength(lengthOnLine);

        return {
          ...point,
          x: pointOnLine.x,
          y: pointOnLine.y,
          ratio: ratio, 
        };
      });
      setPoints(mappedPoints);
    }
  }, []);

  const selectedPoint = points.find((p) => p.id === selectedId);

  return (
    <div className="flex justify-center p-6 bg-gray-50 min-h-screen">
      <div className="relative bg-[#f2e8cf] rounded-xl shadow-lg p-6 w-full max-w-3xl">
        <h2 className="text-center text-3xl mb-4 font-hand text-gray-800">
          Recruitment Timeline
        </h2>

        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full overflow-visible">
          {/* Background Path */}
          <path
            ref={pathRef}
            d={PATH}
            fill="none"
            stroke="#3b2f2f"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 4"
            className="opacity-60"
          />

          {/* ANIMATED HEART 
            We just pass the PATH string and the current ratio (0 to 1).
            CSS handles the movement from Previous -> Current automatically.
          */}
          <MovingHeart 
            pathStr={PATH} 
            ratio={selectedPoint ? selectedPoint.ratio : 0} 
          />

          {/* Interactive Points */}
          {points.map((p) => (
            <g
              key={p.id}
              className="cursor-pointer group"
              onClick={() => setSelectedId(p.id)}
            >
              <Heart
                x={p.x}
                y={p.y}
                active={p.status === "completed"}
                selected={selectedId === p.id}
              />
              {p.x && (
                <text
                  x={p.x}
                  y={p.y - 18}
                  textAnchor="middle"
                  className="font-hand text-xs font-bold fill-gray-700 transition-all group-hover:-translate-y-1"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Pop-up Info Box */}
        {selectedPoint && selectedPoint.x && (
          <div
            className="absolute parchment-box animate-scale z-10"
            style={{
              left: `${(selectedPoint.x / WIDTH) * 100}%`,
              top: `${(selectedPoint.y / HEIGHT) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <h3 className="font-hand text-xl font-bold mb-1 border-b border-gray-400/30 pb-1">
              {selectedPoint.label}
            </h3>
            <p className="font-hand text-sm leading-relaxed text-gray-800">
              {selectedPoint.content}
            </p>
            <div className="parchment-arrow"></div>
          </div>
        )}
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');
        .font-hand { font-family: "Indie Flower", cursive; }
        
        .parchment-box {
          background: #f2e8cf;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e6dcc0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          max-width: 200px;
        }
        .parchment-arrow {
          position: absolute;
          left: 50%; bottom: 0;
          width: 12px; height: 12px;
          background: #f2e8cf;
          box-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          transform: translate(-50%, 50%) rotate(45deg);
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -110%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -130%) scale(1); }
        }
        .animate-scale {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}