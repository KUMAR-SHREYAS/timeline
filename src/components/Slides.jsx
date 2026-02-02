import { useEffect, useState } from "react";

const slides = [
  { title: "Start", text: "This is the beginning of the journey." },
  { title: "Checkpoint One", text: "First milestone achieved." },
  { title: "Checkpoint Two", text: "Momentum builds." },
  { title: "Finish", text: "Journey completed." },
];

export default function Slides({ active, setActive }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let t;
    if (active !== null) {
      // Short delay so the SVG zoom timeline can finish and the slide pops in
      t = setTimeout(() => setShow(true), 150);
    } else {
      setShow(false);
    }

    return () => clearTimeout(t);
  }, [active]);

  if (active === null) return null;

  return (
    // 1. OVERLAY: 'grid place-items-center' forces strict center alignment
    <div 
      onClick={() => setActive(null)}
      className={`fixed inset-0 z-50 grid place-items-center p-4 transition-all duration-500 ${
        show ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      {/* 2. THE WINDOW: "Pop" Animation (scale-50 -> scale-100) */}
      <div 
        className={`bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl shadow-2xl border border-pink-100 flex flex-col transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
          show ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 to-transparent">
          <div>
            <span className="text-xs font-bold text-pink-400 tracking-wider uppercase">Checkpoint</span>
            <h3 className="text-2xl font-bold text-gray-800 leading-none mt-1">
              {slides[active].title}
            </h3>
          </div>
          
          <button 
            onClick={() => setActive(null)} 
            className="group w-10 h-10 rounded-full bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 border border-gray-100 flex items-center justify-center transition-all shadow-sm"
          >
            <span className="group-hover:rotate-90 transition-transform duration-300 text-lg">✕</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col gap-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                className="w-40 h-28 object-cover rounded-lg shrink-0 border border-gray-100 shadow-sm snap-center hover:scale-105 transition-transform duration-300"
                src={`https://picsum.photos/400/300?random=${active * 10 + i}`}
                alt="Memory"
              />
            ))}
          </div>

          <p className="text-gray-600 leading-relaxed text-lg">
            {slides[active].text}
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex justify-between items-center text-sm text-gray-400">
           <span>Step {active + 1} of {slides.length}</span>
           <button onClick={() => setActive(null)} className="hover:text-gray-600 font-medium">Close View</button>
        </div>

      </div>
    </div>
  );
}