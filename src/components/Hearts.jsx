// import { useEffect } from "react";

// export default function Hearts() {
//   useEffect(() => {
//     let trailing = false;
//     let last = 0;

//     function burst(e) {
//       // 1. THE FIX: Check if the clicked element is a checkpoint (or any button)
//       // Your Journey.jsx hearts have the class "cursor-pointer", so we check for that.
//       // We also check for buttons or links just in case you add controls later.
//       if (
//         e.target.classList.contains("cursor-pointer") || 
//         e.target.closest("button") || 
//         e.target.closest("a")
//       ) {
//         return;
//       }

//       for (let i = 0; i < 6; i++) {
//         const h = document.createElement("div");
//         h.innerHTML = "♥️";
//         h.className =
//           "absolute pointer-events-none animate-[floatFade_1.2s_ease-out_forwards]";
//         h.style.left = e.pageX + (Math.random() - 0.5) * 80 + "px";
//         h.style.top = e.pageY + (Math.random() - 0.5) * 80 + "px";
//         h.style.fontSize = 18 + Math.random() * 10 + "px";
//         document.body.appendChild(h);
//         setTimeout(() => h.remove(), 1200);
//       }
//     }

//     function move(e) {
//       if (!trailing) return;
//       if (Date.now() - last < 60) return;
//       last = Date.now();

//       const h = document.createElement("div");
//       h.innerHTML = "♥️";
//       h.className =
//         "absolute pointer-events-none animate-[floatFade_1.2s_ease-out_forwards]";
//       h.style.left = e.pageX + "px";
//       h.style.top = e.pageY + "px";
//       h.style.fontSize = "20px";
//       document.body.appendChild(h);
//       setTimeout(() => h.remove(), 1200);
//     }

//     document.body.addEventListener("click", burst);
//     document.body.addEventListener("mousedown", () => {
//       trailing = true;
//       setTimeout(() => (trailing = false), 1000);
//     });
//     document.body.addEventListener("mousemove", move);

//     return () => {
//       document.body.removeEventListener("click", burst);
//       document.body.removeEventListener("mousemove", move);
//     };
//   }, []);

//   return null;
// }