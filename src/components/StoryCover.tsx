import type { CoverMotif } from '../data/stories';

/**
 * Original cover artwork, drawn as SVG night scenes (no external images).
 * Each motif is a small silhouette illustration under a starry sky.
 */

const W = 160, H = 200;
const SILHOUETTE = '#03060c';
const GLOW = '#FFD98A';

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

const HUES: Record<CoverMotif, number> = {
  sea: 205, books: 222, lighthouse: 212, cabin: 226, train: 218, village: 230,
  shore: 200, island: 195, balloon: 232, garden: 208, hotel: 214, lamp: 220, custom: 215,
};

function Scene({ motif }: { motif: CoverMotif }) {
  const s = SILHOUETTE;
  switch (motif) {
    case 'sea':
      return (<>
        <rect x="0" y="128" width={W} height="72" fill="#061224" />
        <path d="M78 128h4l2 72h-8Z" fill="#9fd2ff" opacity=".25" />
        {[140, 152, 166, 182].map((y, i) => <path key={y} d={`M${10 + i * 6} ${y}q20-4 40 0t40 0t40 0`} stroke="#38B6FF" strokeOpacity={0.35 - i * 0.06} fill="none" strokeWidth="1.2" />)}
        <path d="M0 150 q30-26 62-20 q18 4 30 20Z" fill={s} />
        <rect x="20" y="132" width="6" height="7" fill={GLOW} opacity=".9" /><rect x="34" y="128" width="5" height="6" fill={GLOW} opacity=".7" />
        <path d="M108 126h22l-4 6h-14Z" fill={s} /><path d="M118 126V108l8 16Z" fill="#cfe3ff" opacity=".7" />
      </>);
    case 'books':
      return (<>
        <rect x="26" y="40" width="108" height="86" rx="4" fill="#0a1830" stroke="#243249" strokeWidth="3" />
        <path d="M80 40v86M26 83h108" stroke="#243249" strokeWidth="3" />
        {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${34 + (i * 7) % 96} ${46 + (i * 13) % 70}l-3 9`} stroke="#9fd2ff" strokeOpacity=".5" strokeLinecap="round" />)}
        <rect x="0" y="140" width={W} height="60" fill={s} />
        {[[18, 24, '#1677FF'], [44, 18, '#38B6FF'], [64, 30, '#0D47A1'], [96, 20, '#AAB7CC'], [118, 26, '#1677FF']].map(([x, h, c], i) => (
          <rect key={i} x={x as number} y={140 - (h as number) - 30} width={i % 2 ? 14 : 18} height={(h as number) + 30} rx="2" fill={c as string} opacity=".85" />
        ))}
        <path d="M120 112c6-10 22-10 26 0" stroke={GLOW} strokeWidth="2" fill="none" opacity=".7" />
      </>);
    case 'lighthouse':
      return (<>
        <path d="M86 70 L160 40 L160 86Z" fill="#cfe3ff" opacity=".14" />
        <path d="M86 70 L0 52 L0 92Z" fill="#cfe3ff" opacity=".08" />
        <path d="M72 76h20l6 84H66Z" fill="#dfe8f5" />
        <path d="M70 100h24M69 120h26M67 140h30" stroke="#1677FF" strokeWidth="5" opacity=".9" />
        <rect x="74" y="62" width="16" height="14" fill={GLOW} />
        <path d="M70 62h24l-12-10Z" fill={s} />
        <path d="M0 160 q40-14 80-6 q40 8 80-4 V200H0Z" fill={s} />
        <rect x="0" y="172" width={W} height="28" fill="#061224" opacity=".6" />
      </>);
    case 'cabin':
      return (<>
        {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${(i * 37) % 160} ${(i * 23) % 120}l-4 12`} stroke="#9fd2ff" strokeOpacity=".35" strokeLinecap="round" />)}
        <path d="M0 150l18-46 18 46Z M118 150l20-58 22 58Z M12 160l14-36 14 36Z" fill={s} />
        <path d="M44 120l36-30 36 30v40H44Z" fill={s} />
        <path d="M38 122l42-36 42 36" stroke="#243249" strokeWidth="4" fill="none" />
        <rect x="58" y="128" width="16" height="14" fill={GLOW} /><rect x="86" y="132" width="12" height="28" fill="#1b2a44" />
        <rect x="0" y="158" width={W} height="42" fill={s} />
        <path d="M100 98v-12h8v18" fill={s} />
      </>);
    case 'train':
      return (<>
        <path d="M0 140 q50-30 90-16 q40 12 70-6 V200H0Z" fill="#071226" />
        <rect x="0" y="152" width={W} height="48" fill={s} />
        <rect x="8" y="132" width="146" height="22" rx="6" fill="#0b1830" stroke="#243249" />
        {[18, 38, 58, 78, 98, 118, 136].map((x) => <rect key={x} x={x} y="137" width="12" height="8" rx="1.5" fill={GLOW} opacity={x % 3 ? 0.95 : 0.6} />)}
        <path d="M0 156h160" stroke="#38B6FF" strokeOpacity=".4" />
      </>);
    case 'village':
      return (<>
        <path d="M0 130 q40-24 80-10 q40 14 80-6 V200H0Z" fill="#071226" />
        {[[8, 136, 30], [36, 128, 26], [60, 140, 34], [92, 126, 28], [118, 136, 36]].map(([x, y, w], i) => (
          <g key={i}>
            <path d={`M${x} ${y + 12}l${w / 2}-14l${w / 2} 14v50H${x}Z`} fill={s} />
            <rect x={x + w / 2 - 4} y={y + 22} width="7" height="8" fill={GLOW} opacity={i % 2 ? 0.9 : 0.6} />
          </g>
        ))}
        <path d="M100 126v-10h5v14" fill={s} />
        <path d="M102 112c-3-8 4-12 0-20" stroke="#AAB7CC" strokeOpacity=".35" fill="none" />
      </>);
    case 'shore':
      return (<>
        <rect x="0" y="110" width={W} height="90" fill="#061224" />
        <path d="M70 110h20l14 90H56Z" fill="#cfe3ff" opacity=".18" />
        <path d="M0 170 q60-18 160 4 V200H0Z" fill="#0a1830" />
        <path d="M0 172 q60-18 160 4" stroke="#38B6FF" strokeOpacity=".5" fill="none" />
        <path d="M0 186 q40-6 80 2t80-4V200H0Z" fill={s} />
      </>);
    case 'island':
      return (<>
        <rect x="0" y="140" width={W} height="60" fill="#061224" />
        <path d="M30 146 q50-30 100 0Z" fill={s} />
        <path d="M84 126 q4-26 -6-48" stroke={s} strokeWidth="4" fill="none" />
        <path d="M78 78 q-22 0-30 14 q14-10 30-10 q-8 8-12 22 q10-14 14-24 q8 10 10 22 q2-14-6-24 q18 0 28 10 q-10-14-34-10Z" fill={s} />
        {[150, 162, 176].map((y, i) => <path key={y} d={`M${16 + i * 10} ${y}h${120 - i * 20}`} stroke="#38B6FF" strokeOpacity={0.3 - i * 0.07} />)}
      </>);
    case 'balloon':
      return (<>
        <path d="M0 160 q30-20 60-8 q30 12 50-12 q24-22 50 0 V200H0Z" fill="#071226" />
        <path d="M0 176 q40-14 80 0 t80 0 V200H0Z" fill={s} />
        <ellipse cx="80" cy="76" rx="30" ry="36" fill="#0D47A1" />
        <ellipse cx="80" cy="76" rx="16" ry="34" fill="#1677FF" />
        <ellipse cx="80" cy="76" rx="30" ry="36" fill="url(#balloonGlow)" />
        <path d="M66 106l6 18M94 106l-6 18" stroke="#AAB7CC" strokeOpacity=".6" />
        <rect x="70" y="124" width="20" height="12" rx="2" fill="#5a3b1c" />
      </>);
    case 'garden':
      return (<>
        <circle cx="80" cy="96" r="30" fill="none" stroke="#cfe3ff" strokeOpacity=".3" />
        <path d="M40 200V120a40 40 0 0 1 80 0v80h-10v-80a30 30 0 0 0-60 0v80Z" fill={s} />
        {[[46, 124], [52, 108], [64, 96], [96, 96], [108, 108], [114, 124]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#e9f3ff" opacity=".85" />)}
        <ellipse cx="80" cy="178" rx="26" ry="6" fill="#0a1830" stroke="#38B6FF" strokeOpacity=".4" />
        {[[20, 150], [140, 140], [30, 110], [128, 160]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill={GLOW} opacity=".9" />)}
      </>);
    case 'hotel':
      return (<>
        <path d="M0 140 q50-6 90 6 l70 6 V200H0Z" fill={s} />
        <rect x="30" y="86" width="84" height="58" fill="#0b1426" stroke="#243249" />
        <path d="M24 88h96l-48-22Z" fill={s} />
        {[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={38 + c * 19} y={96 + r * 15} width="9" height="8" fill={GLOW} opacity={(r === 0 && c === 3) ? 1 : (r + c) % 3 === 0 ? 0.6 : 0.1} />
        )))}
        <rect x="0" y="168" width={W} height="32" fill="#061224" />
        <path d="M10 178h140" stroke="#38B6FF" strokeOpacity=".3" />
      </>);
    case 'lamp':
      return (<>
        <rect x="0" y="146" width={W} height="54" fill="#061224" />
        <path d="M88 146h16l10 54H78Z" fill={GLOW} opacity=".16" />
        <path d="M60 146 q40-26 100-14 V146Z" fill={s} />
        <path d="M84 128l14-12 14 12v18H84Z" fill={s} />
        <rect x="93" y="131" width="9" height="8" fill={GLOW} />
        <circle cx="97" cy="135" r="12" fill={GLOW} opacity=".12" />
        <path d="M0 146h60" stroke={s} strokeWidth="3" />
        <path d="M20 160h30M100 172h40" stroke="#38B6FF" strokeOpacity=".3" />
      </>);
    default:
      return (<>
        {[150, 164, 180].map((y, i) => <path key={y} d={`M0 ${y} q40-14 80 0 t80 0 V200H0Z`} fill={i === 2 ? s : '#071226'} opacity={0.6 + i * 0.2} />)}
        <path d="M66 120c8-18 20-18 28 0" stroke="#38B6FF" strokeOpacity=".5" fill="none" />
      </>);
  }
}

export function StoryCover({ motif, seed, className = '', title }: { motif: CoverMotif; seed: string; className?: string; title?: string }) {
  const r = seeded(seed);
  const hue = HUES[motif] ?? 215;
  const stars = Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * 110, s: r() * 1.1 + 0.3, o: 0.3 + r() * 0.6 }));
  const moon = { x: 28 + r() * 104, y: 26 + r() * 22 };
  const id = `c${seed.replace(/[^a-z0-9]/gi, '')}`;
  const showMoon = motif !== 'garden';
  return (
    <svg className={`cover ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 5%)`} />
          <stop offset=".65" stopColor={`hsl(${hue} 75% 14%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 6} 80% 22%)`} />
        </linearGradient>
        <radialGradient id={`${id}moon`}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#d7e9ff" />
          <stop offset="1" stopColor="#8fbaff" />
        </radialGradient>
        <radialGradient id="balloonGlow" cx=".5" cy=".55" r=".6">
          <stop offset="0" stopColor={GLOW} stopOpacity=".55" />
          <stop offset="1" stopColor={GLOW} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      {stars.map((st, i) => <circle key={i} cx={st.x} cy={st.y} r={st.s} fill="#fff" opacity={st.o} />)}
      {showMoon && <>
        <circle cx={moon.x} cy={moon.y} r="22" fill="#38B6FF" opacity=".08" />
        <circle cx={moon.x} cy={moon.y} r="10" fill={`url(#${id}moon)`} />
      </>}
      {motif === 'garden' && <circle cx="80" cy="96" r="22" fill={`url(#${id}moon)`} opacity=".9" />}
      <Scene motif={motif} />
    </svg>
  );
}
