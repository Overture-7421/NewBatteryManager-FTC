import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TOTAL_MS = 2400;
const SPLIT_START_MS = Math.round(TOTAL_MS * 0.65);
const VIEWBOX_SIZE = 4280;
const PATH_D = "M2085 3954 c-107 -16 -212 -39 -295 -65 -127 -40 -335 -144 -438 -219 l-83 -60 -484 0 -484 0 221 -386 c174 -305 219 -391 215 -412 -2 -15 -15 -74 -28 -132 -20 -92 -23 -130 -23 -315 0 -178 3 -225 22 -311 125 -578 536 -1035 1085 -1206 l106 -33 166 -292 c92 -160 172 -299 179 -309 11 -15 35 23 187 287 l174 303 99 28 c850 243 1337 1109 1106 1967 l-22 79 202 352 c111 194 204 359 207 366 4 12 -67 14 -455 14 l-460 0 -111 75 c-181 122 -364 200 -578 246 -76 17 -140 22 -288 24 -104 2 -203 1 -220 -1z m485 -129 c162 -36 412 -136 495 -199 18 -14 -72 -15 -795 -16 l-815 0 80 47 c145 85 349 156 520 182 94 15 427 6 515 -14z m-1441 -342 c-8 -10 -37 -44 -66 -77 -78 -87 -151 -197 -214 -323 l-57 -112 -138 242 c-76 133 -144 252 -152 265 l-14 22 327 0 c310 0 327 -1 314 -17z m2158 -28 c68 -60 167 -179 237 -288 66 -100 136 -247 135 -280 0 -12 -254 -463 -562 -1002 l-562 -980 -45 -9 c-70 -14 -396 -10 -464 6 l-59 13 -550 964 -551 963 18 52 c56 162 184 361 325 508 l93 98 967 0 966 0 52 -45z m591 -201 l-141 -246 -53 102 c-61 116 -143 234 -227 326 l-59 64 310 0 311 0 -141 -246z m-142 -616 c27 -142 25 -418 -5 -558 -65 -305 -194 -544 -410 -761 -157 -156 -313 -259 -513 -338 -146 -57 -183 -140 385 854 281 492 514 895 518 895 4 0 15 -42 25 -92z m-2411 -818 c268 -470 489 -858 492 -863 8 -14 -130 43 -237 99 -483 251 -791 760 -790 1307 0 162 22 340 40 320 4 -4 226 -393 495 -863z m963 -1045 c94 1 172 0 172 -1 0 -1 -46 -81 -101 -179 -56 -97 -105 -173 -110 -168 -6 7 -166 282 -201 346 -8 17 -6 17 29 10 21 -4 116 -8 211 -8z";

const LogoSvg = ({ variant = 'solid', className }) => (
  <svg
    viewBox="0 0 4280 4280"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    {variant === 'gradient' && (
      <defs>
        <linearGradient id="overtureGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    )}
    <g
      transform="translate(0.000000,4280.000000) scale(1.000000,-1.000000)"
      fill={variant === 'gradient' ? 'url(#overtureGradient)' : 'currentColor'}
      stroke="none"
    >
      <path d={PATH_D} />
    </g>
  </svg>
);

const LogoHalf = ({ direction, splitRatio }) => {
  const isLeft = direction === 'left';
  const splitPercent = splitRatio * 100;
  const clipPath = isLeft
    ? `inset(0 ${100 - splitPercent}% 0 0)`
    : `inset(0 0 0 ${splitPercent}%)`;
  const moveX = isLeft ? '-120vw' : '120vw';

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ x: 0 }}
      animate={{ x: [0, 0, moveX] }}
      transition={{ duration: TOTAL_MS / 1000, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.65, 1] }}
      style={{ clipPath, transformOrigin: '50% 50%' }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: TOTAL_MS / 1000, ease: 'easeInOut', times: [0, 0.7, 1] }}
      >
        <LogoSvg className="w-full h-full text-white" variant="solid" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: TOTAL_MS / 1000, ease: 'easeInOut', times: [0, 0.7, 1] }}
      >
        <LogoSvg className="w-full h-full" variant="gradient" />
      </motion.div>
    </motion.div>
  );
};

const IntroOverlay = ({ onFinish }) => {
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [dimBackground, setDimBackground] = useState(true);
  const pathRef = useRef(null);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const frame = requestAnimationFrame(() => {
      const bbox = path.getBBox();
      const centerX = bbox.x + bbox.width / 2;
      const ratio = Math.min(0.8, Math.max(0.2, centerX / VIEWBOX_SIZE));
      setSplitRatio(ratio);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const splitTimer = setTimeout(() => {
      setDimBackground(false);
    }, SPLIT_START_MS);
    const timer = setTimeout(() => {
      onFinish?.();
    }, TOTAL_MS + 150);
    return () => {
      clearTimeout(timer);
      clearTimeout(splitTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <motion.div
        className="absolute inset-0 bg-black"
        initial={false}
        animate={{ opacity: dimBackground ? 1 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: TOTAL_MS / 1000, ease: 'easeInOut', times: [0, 0.5, 1] }}
      />

      <svg
        className="absolute w-0 h-0"
        viewBox="0 0 4280 4280"
        aria-hidden="true"
      >
        <g transform="translate(0.000000,4280.000000) scale(1.000000,-1.000000)">
          <path ref={pathRef} d={PATH_D} />
        </g>
      </svg>

      <div
        className="relative flex items-center justify-center"
        style={{ width: 'min(90vmin, 900px)', height: 'min(90vmin, 900px)' }}
      >
        <LogoHalf direction="left" splitRatio={splitRatio} />
        <LogoHalf direction="right" splitRatio={splitRatio} />
      </div>
    </div>
  );
};

export default IntroOverlay;
