// Decorative module illustrations for the dashboard cards (navy + orange theme).
// Pure SVG shapes — no text — so they scale cleanly and add no copy to the page.

const N = "#0c1e5b"; // navy-800
const N2 = "#3b4f8a"; // navy-500
const N1 = "#bcc6e0"; // navy-200
const N0 = "#eef1f8"; // navy-50
const O = "#f97316"; // orange-500
const O2 = "#fdba74"; // orange-300
const O1 = "#ffedd5"; // orange-100
const W = "#ffffff";

const Svg = ({ children, className = "" }) => (
  <svg
    viewBox="0 0 320 150"
    className={`h-full w-full ${className}`}
    fill="none"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
  >
    {children}
  </svg>
);

const Check = ({ x, y, r = 13, bg = O }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={bg} />
    <path
      d={`M${x - r * 0.42} ${y} l${r * 0.3} ${r * 0.3} l${r * 0.55} -${r * 0.6}`}
      stroke={W}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

export const WebIllustration = () => (
  <Svg>
    {/* back window */}
    <rect x="150" y="18" width="130" height="92" rx="10" fill={W} stroke={N1} />
    <rect x="150" y="18" width="130" height="16" rx="8" fill={N0} />
    <rect x="164" y="46" width="60" height="6" rx="3" fill={N1} />
    <rect x="164" y="58" width="96" height="6" rx="3" fill={N0} />
    <rect x="164" y="70" width="80" height="6" rx="3" fill={N0} />

    {/* main browser window */}
    <g className="illus-float">
      <rect x="44" y="30" width="172" height="108" rx="12" fill={W} stroke={N1} />
      <path d="M44 42a12 12 0 0 1 12-12h148a12 12 0 0 1 12 12v8H44z" fill={N} />
      <circle cx="58" cy="40" r="3" fill={O} />
      <circle cx="68" cy="40" r="3" fill={O2} />
      <circle cx="78" cy="40" r="3" fill={N1} />
      <rect x="92" y="35.5" width="108" height="9" rx="4.5" fill={N2} />
      {/* hero block */}
      <rect x="56" y="60" width="72" height="44" rx="8" fill={O1} />
      <circle cx="78" cy="78" r="8" fill={O2} />
      <path d="M62 100l18-14 12 9 10-7 22 12z" fill={O} opacity=".8" />
      {/* text lines */}
      <rect x="138" y="62" width="64" height="7" rx="3.5" fill={N} />
      <rect x="138" y="75" width="54" height="5" rx="2.5" fill={N1} />
      <rect x="138" y="85" width="60" height="5" rx="2.5" fill={N1} />
      <rect x="138" y="97" width="34" height="11" rx="5.5" fill={O} />
      {/* footer cards */}
      <rect x="56" y="114" width="44" height="14" rx="4" fill={N0} />
      <rect x="106" y="114" width="44" height="14" rx="4" fill={N0} />
      <rect x="156" y="114" width="46" height="14" rx="4" fill={N0} />
    </g>

    {/* cursor */}
    <path d="M176 100l0 22 6-6 5 10 5-2-5-10 8 0z" fill={N} stroke={W} strokeWidth="1.5" strokeLinejoin="round" />
    <Check x={232} y={34} />
  </Svg>
);

export const ApiIllustration = () => (
  <Svg>
    {/* client node */}
    <g className="illus-float">
      <rect x="22" y="38" width="96" height="76" rx="12" fill={W} stroke={N1} />
      <rect x="22" y="38" width="96" height="18" rx="9" fill={N} />
      <rect x="32" y="44" width="28" height="6" rx="3" fill={O} />
      <path d="M38 68q-6 0-6 6v4q0 4-4 4q4 0 4 4v4q0 6 6 6" stroke={N2} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M102 68q6 0 6 6v4q0 4 4 4q-4 0-4 4v4q0 6-6 6" stroke={N2} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="46" y="70" width="34" height="5" rx="2.5" fill={O2} />
      <rect x="46" y="80" width="46" height="5" rx="2.5" fill={N1} />
      <rect x="46" y="90" width="26" height="5" rx="2.5" fill={N1} />
    </g>

    {/* server node */}
    <rect x="206" y="30" width="92" height="28" rx="8" fill={N} />
    <rect x="206" y="62" width="92" height="28" rx="8" fill={N2} />
    <rect x="206" y="94" width="92" height="28" rx="8" fill={N} />
    {[44, 76, 108].map((y) => (
      <g key={y}>
        <circle cx="220" cy={y} r="3.5" fill={O} />
        <rect x="232" y={y - 2.5} width="34" height="5" rx="2.5" fill={N1} opacity=".6" />
        <rect x="276" y={y - 2.5} width="12" height="5" rx="2.5" fill={O2} />
      </g>
    ))}

    {/* request / response arrows */}
    <path d="M126 62h66" stroke={O} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" className="illus-dash" />
    <path d="M186 56l8 6-8 6" stroke={O} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M196 92h-66" stroke={N} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" className="illus-dash" />
    <path d="M134 86l-8 6 8 6" stroke={N} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

    {/* status badge */}
    <rect x="138" y="106" width="46" height="18" rx="9" fill="#d1fae5" />
    <circle cx="150" cy="115" r="4" fill="#10b981" />
    <rect x="158" y="112.5" width="18" height="5" rx="2.5" fill="#10b981" />
    <Check x={118} y={36} r={11} />
  </Svg>
);

export const MobileIllustration = () => (
  <Svg>
    {/* back phone */}
    <g transform="rotate(10 220 80)">
      <rect x="182" y="20" width="70" height="122" rx="14" fill={N2} />
      <rect x="188" y="30" width="58" height="102" rx="9" fill={N0} />
      <rect x="196" y="42" width="42" height="26" rx="6" fill={O2} />
      <rect x="196" y="76" width="42" height="6" rx="3" fill={N1} />
      <rect x="196" y="88" width="30" height="6" rx="3" fill={N1} />
      <rect x="196" y="104" width="42" height="12" rx="6" fill={N} />
    </g>

    {/* front phone */}
    <g className="illus-float">
      <rect x="98" y="10" width="78" height="134" rx="16" fill={N} />
      <rect x="105" y="20" width="64" height="114" rx="10" fill={W} />
      <rect x="126" y="14" width="22" height="4" rx="2" fill={N2} />
      {/* app header */}
      <rect x="112" y="28" width="50" height="8" rx="4" fill={N} />
      {/* list rows */}
      {[44, 66, 88].map((y, i) => (
        <g key={y}>
          <rect x="112" y={y} width="50" height="16" rx="5" fill={i === 1 ? O1 : N0} />
          <circle cx="121" cy={y + 8} r="4" fill={i === 1 ? O : N1} />
          <rect x="129" y={y + 5.5} width="26" height="5" rx="2.5" fill={i === 1 ? O2 : N1} />
        </g>
      ))}
      <rect x="112" y="112" width="50" height="14" rx="7" fill={O} />
    </g>

    {/* tap ripple */}
    <circle cx="137" cy="74" r="14" stroke={O} strokeWidth="2" opacity=".35" />
    <circle cx="137" cy="74" r="7" fill={O} opacity=".25" />

    {/* side bits */}
    <rect x="30" y="40" width="50" height="34" rx="9" fill={W} stroke={N1} />
    <rect x="39" y="49" width="20" height="5" rx="2.5" fill={N} />
    <rect x="39" y="59" width="32" height="5" rx="2.5" fill={N1} />
    <rect x="40" y="88" width="40" height="34" rx="9" fill={W} stroke={N1} />
    <circle cx="53" cy="105" r="6" fill={O2} />
    <rect x="63" y="102" width="10" height="6" rx="3" fill={N1} />
    <Check x={176} y={22} r={11} />
  </Svg>
);

export const DbIllustration = () => (
  <Svg>
    {/* database cylinders */}
    <g className="illus-float">
      {[96, 70, 44].map((y, i) => (
        <g key={y}>
          <path d={`M44 ${y}v20c0 8 22 14 48 14s48-6 48-14v-20`} fill={i === 1 ? N2 : N} />
          <ellipse cx="92" cy={y} rx="48" ry="14" fill={i === 2 ? N2 : "#192d69"} />
          <circle cx="62" cy={y + 22} r="3" fill={O} />
          <rect x="70" y={y + 19.5} width="22" height="5" rx="2.5" fill={N1} opacity=".5" />
        </g>
      ))}
      <ellipse cx="92" cy="44" rx="48" ry="14" fill={N2} />
      <ellipse cx="92" cy="44" rx="30" ry="7" fill={N} opacity=".35" />
    </g>

    {/* connector */}
    <path d="M146 80h28" stroke={O} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 8" className="illus-dash" />

    {/* table */}
    <rect x="180" y="30" width="118" height="100" rx="12" fill={W} stroke={N1} />
    <path d="M180 42a12 12 0 0 1 12-12h94a12 12 0 0 1 12 12v8H180z" fill={N} />
    <rect x="190" y="37" width="24" height="6" rx="3" fill={O} />
    <rect x="226" y="37" width="24" height="6" rx="3" fill={N1} />
    <rect x="262" y="37" width="24" height="6" rx="3" fill={N1} />
    {[60, 78, 96, 114].map((y, i) => (
      <g key={y}>
        {i === 2 && <rect x="184" y={y - 7} width="110" height="16" rx="5" fill={O1} />}
        <rect x="190" y={y - 2.5} width="24" height="5" rx="2.5" fill={i === 2 ? O : N2} />
        <rect x="226" y={y - 2.5} width="28" height="5" rx="2.5" fill={N1} />
        <rect x="262" y={y - 2.5} width="18" height="5" rx="2.5" fill={N1} />
      </g>
    ))}

    {/* magnifier */}
    <circle cx="276" cy="110" r="14" fill={W} stroke={O} strokeWidth="4" />
    <path d="M286 120l10 10" stroke={O} strokeWidth="5" strokeLinecap="round" />
    <Check x={140} y={34} r={11} />
  </Svg>
);
