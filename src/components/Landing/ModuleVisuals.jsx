import React from "react";

const O = "#f97316";
const O2 = "#fdba74";
const W = "rgba(255,255,255,0.85)";
const DIM = "rgba(255,255,255,0.18)";
const dots = { strokeDasharray: "0.1 5", strokeLinecap: "round" };
const fine = { strokeDasharray: "0.1 3.2", strokeLinecap: "round" };

const Frame = ({ children, id }) => (
  <svg viewBox="0 0 320 190" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id={`dp-${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.10)" />
      </pattern>
      <radialGradient id={`gl-${id}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={O} stopOpacity="0.35" />
        <stop offset="100%" stopColor={O} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="320" height="190" fill={`url(#dp-${id})`} />
    <ellipse cx="160" cy="98" rx="120" ry="80" fill={`url(#gl-${id})`} />
    {children}
  </svg>
);

const Web = () => (
  <Frame id="web">
    <rect x="62" y="30" width="196" height="132" rx="10" fill="rgba(7,18,63,0.6)" stroke={O} strokeWidth="2" style={fine} />
    <line x1="62" y1="50" x2="258" y2="50" stroke={O} strokeWidth="1.5" style={fine} />
    {[76, 86, 96].map((x) => <circle key={x} cx={x} cy="40" r="2.6" fill={O2} />)}
    <rect x="76" y="62" width="70" height="40" rx="5" fill="none" stroke={W} strokeWidth="1.6" style={fine}>
      <animate attributeName="stroke" values={`${W};${O};${O};${W}`} keyTimes="0;0.1;0.3;0.4" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="156" y="62" width="88" height="10" rx="3" fill={DIM}>
      <animate attributeName="fill" values={`${DIM};${O};${DIM}`} keyTimes="0;0.5;0.7" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="156" y="78" width="64" height="8" rx="3" fill={DIM} />
    <rect x="156" y="92" width="76" height="8" rx="3" fill={DIM} />
    <rect x="76" y="112" width="168" height="10" rx="3" fill={DIM} />
    <rect x="76" y="130" width="54" height="18" rx="5" fill="none" stroke={O2} strokeWidth="1.6">
      <animate attributeName="fill" values={`rgba(0,0,0,0);${O};rgba(0,0,0,0)`} keyTimes="0;0.85;1" dur="4s" repeatCount="indefinite" />
    </rect>
    <rect x="64" y="52" width="192" height="2" fill={O} opacity="0.8">
      <animate attributeName="y" values="52;158;52" dur="4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.1;0.9;1" dur="4s" repeatCount="indefinite" />
    </rect>
    <g>
      <path d="M0 0 L0 16 L4.5 12 L8 19 L11 17.5 L7.6 11 L13 11 Z" fill="#fff" stroke={O} strokeWidth="1.2" />
      <animateMotion dur="4s" repeatCount="indefinite" keyPoints="0;0.33;0.66;1" keyTimes="0;0.3;0.7;1" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" path="M110 80 L210 66 L104 138 L110 80" />
    </g>
  </Frame>
);

const Doc = () => (
  <Frame id="doc">
    <path d="M110 22 h78 l26 26 v120 a6 6 0 0 1 -6 6 h-98 a6 6 0 0 1 -6 -6 v-140 a6 6 0 0 1 6 -6z" fill="rgba(7,18,63,0.6)" stroke={O} strokeWidth="2" style={fine} />
    <path d="M188 22 v26 h26" fill="none" stroke={O} strokeWidth="1.6" style={fine} />
    {[64, 88, 112, 136].map((y, i) => (
      <g key={y}>
        <rect x="140" y={y - 4} width={i % 2 ? 50 : 62} height="7" rx="3" fill={DIM} />
        <rect x="120" y={y - 7} width="12" height="12" rx="3" fill="none" stroke={W} strokeWidth="1.4" />
        <path d={`M122.5 ${y - 1} l3 3 l5 -6`} fill="none" stroke={O} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12" strokeDashoffset="12">
          <animate attributeName="stroke-dashoffset" values="12;12;0;0;12" keyTimes={`0;${0.1 + i * 0.15};${0.18 + i * 0.15};0.9;1`} dur="5s" repeatCount="indefinite" />
        </path>
      </g>
    ))}
    <g>
      <circle r="17" fill="rgba(249,115,22,0.12)" stroke={O2} strokeWidth="2.2" />
      <line x1="12" y1="12" x2="26" y2="26" stroke={O2} strokeWidth="4" strokeLinecap="round" />
      <animateMotion dur="5s" repeatCount="indefinite" path="M232 70 C 250 100, 220 130, 236 150 C 250 130, 250 90, 232 70" />
    </g>
  </Frame>
);

const Regression = () => (
  <Frame id="reg">
    <g transform="translate(160 86)">
      <g>
        <circle r="52" fill="none" stroke={O} strokeWidth="2.4" style={dots} />
        <path d="M-6 -58 L6 -52 L-6 -46" fill="none" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6 46 L-6 52 L6 58" fill="none" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />
      </g>
      <circle r="34" fill="none" stroke={W} strokeWidth="1.6" style={fine}>
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="14s" repeatCount="indefinite" />
      </circle>
      <circle r="12" fill={O}>
        <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="20" fill="none" stroke={O2} strokeWidth="1.2">
        <animate attributeName="r" values="12;30" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
    <line x1="40" y1="166" x2="280" y2="166" stroke={W} strokeWidth="1.5" style={fine} />
    {[60, 110, 160, 210, 260].map((x, i) => (
      <circle key={x} cx={x} cy="166" r="5" fill={DIM} stroke={O} strokeWidth="1.4">
        <animate attributeName="fill" values={`${DIM};${O};${O};${DIM}`} keyTimes={`0;${0.1 + i * 0.16};0.92;1`} dur="5s" repeatCount="indefinite" />
      </circle>
    ))}
  </Frame>
);

const Mobile = () => (
  <Frame id="mob">
    <rect x="122" y="14" width="76" height="162" rx="14" fill="rgba(7,18,63,0.7)" stroke={O} strokeWidth="2.2" style={fine} />
    <rect x="148" y="22" width="24" height="5" rx="2.5" fill={O2} />
    <clipPath id="mob-clip"><rect x="130" y="34" width="60" height="130" rx="6" /></clipPath>
    <g clipPath="url(#mob-clip)">
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(0 ${i * 52})`}>
            <rect x="134" y="38" width="52" height="24" rx="4" fill={i % 2 ? DIM : "rgba(249,115,22,0.5)"} />
            <rect x="134" y="68" width="34" height="5" rx="2.5" fill={DIM} />
            <rect x="134" y="77" width="44" height="5" rx="2.5" fill={DIM} />
          </g>
        ))}
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -156" dur="6s" repeatCount="indefinite" />
      </g>
    </g>
    <circle cx="160" cy="110" r="6" fill="none" stroke="#fff" strokeWidth="2">
      <animate attributeName="r" values="4;22" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
    </circle>
    {[56, 82, 238, 264].map((x, i) => (
      <circle key={x} cx={x} cy="95" r="4" fill={O}>
        <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
      </circle>
    ))}
    <line x1="64" y1="95" x2="116" y2="95" stroke={O} strokeWidth="1.6" style={fine} />
    <line x1="204" y1="95" x2="256" y2="95" stroke={O} strokeWidth="1.6" style={fine} />
  </Frame>
);

const Api = () => {
  const ends = [42, 95, 148];
  return (
    <Frame id="api">
      <rect x="40" y="70" width="56" height="50" rx="10" fill="rgba(7,18,63,0.7)" stroke={O} strokeWidth="2" />
      <text x="68" y="101" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="15" fill={O2}>{"{ }"}</text>
      {ends.map((y, i) => {
        const d = `M96 95 C 150 95, 170 ${y}, 222 ${y}`;
        return (
          <g key={y}>
            <path d={d} fill="none" stroke={W} strokeWidth="1.5" style={fine} />
            <rect x="222" y={y - 14} width="62" height="28" rx="8" fill="rgba(7,18,63,0.7)" stroke={O2} strokeWidth="1.6" />
            <rect x="232" y={y - 3} width="30" height="6" rx="3" fill={DIM} />
            <circle cx="272" cy={y} r="4" fill={O}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            <circle r="4.5" fill={O}>
              <animateMotion dur="1.8s" begin={`${i * 0.6}s`} repeatCount="indefinite" path={d} />
            </circle>
            <circle r="3" fill="#fff" opacity="0.8">
              <animateMotion dur="1.8s" begin={`${i * 0.6 + 0.9}s`} repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path={d} />
            </circle>
          </g>
        );
      })}
    </Frame>
  );
};

const Db = () => (
  <Frame id="db">
    {[0, 1, 2].map((i) => {
      const y = 50 + i * 38;
      return (
        <g key={i}>
          <path d={`M108 ${y} v26 a52 13 0 0 0 104 0 v-26`} fill="rgba(7,18,63,0.75)" stroke={O} strokeWidth="2" style={fine} />
          <ellipse cx="160" cy={y} rx="52" ry="13" fill="rgba(7,18,63,0.9)" stroke={O} strokeWidth="2" />
          {[130, 146, 162, 178, 194].map((x, j) => (
            <circle key={x} cx={x} cy={y + 20} r="2.2" fill={O2}>
              <animate attributeName="opacity" values="0.15;1;0.15" dur="1.6s" begin={`${(i * 5 + j) * 0.11}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      );
    })}
    <ellipse cx="160" cy="160" rx="66" ry="17" fill="none" stroke={O2} strokeWidth="2">
      <animate attributeName="cy" values="170;36" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="3s" repeatCount="indefinite" />
    </ellipse>
  </Frame>
);

const Security = () => (
  <Frame id="sec">
    <clipPath id="sec-clip">
      <path d="M160 18 L222 40 V92 C222 132 194 160 160 174 C126 160 98 132 98 92 V40 Z" />
    </clipPath>
    <path d="M160 18 L222 40 V92 C222 132 194 160 160 174 C126 160 98 132 98 92 V40 Z" fill="rgba(7,18,63,0.75)" stroke={O} strokeWidth="2.4" style={fine} />
    <g clipPath="url(#sec-clip)">
      {[22, 44, 66].map((r) => <circle key={r} cx="160" cy="96" r={r} fill="none" stroke={DIM} strokeWidth="1" />)}
      <g>
        <path d="M160 96 L160 6 A90 90 0 0 1 238 51 Z" fill="rgba(249,115,22,0.35)" />
        <line x1="160" y1="96" x2="160" y2="6" stroke={O} strokeWidth="2" />
        <animateTransform attributeName="transform" type="rotate" from="0 160 96" to="360 160 96" dur="3.6s" repeatCount="indefinite" />
      </g>
      {[[186, 70, 0.4], [138, 124, 1.6], [176, 132, 2.6]].map(([x, y, b]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill={O2}>
          <animate attributeName="opacity" values="0;1;0" dur="3.6s" begin={`${b}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>
    <path d="M146 96 l10 10 l18 -20" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
  </Frame>
);

const Perf = () => (
  <Frame id="perf">
    <path d="M86 128 A74 74 0 0 1 234 128" fill="none" stroke={W} strokeWidth="2" style={fine} />
    <path d="M86 128 A74 74 0 0 1 234 128" fill="none" stroke={O} strokeWidth="6" strokeLinecap="round" strokeDasharray="232" strokeDashoffset="232">
      <animate attributeName="stroke-dashoffset" values="232;70;120;30;232" dur="5s" repeatCount="indefinite" />
    </path>
    <g>
      <line x1="160" y1="128" x2="160" y2="70" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <animateTransform attributeName="transform" type="rotate" values="-80 160 128;30 160 128;-10 160 128;65 160 128;-80 160 128" dur="5s" repeatCount="indefinite" />
    </g>
    <circle cx="160" cy="128" r="7" fill={O} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <rect key={i} x={100 + i * 16} y="150" width="9" height="24" rx="2" fill={i > 5 ? O : O2} opacity="0.85">
        <animate attributeName="height" values={`6;${14 + ((i * 7) % 20)};8;${18 + ((i * 5) % 12)};6`} dur="2.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
        <animate attributeName="y" values={`168;${160 - ((i * 7) % 20)};166;${156 - ((i * 5) % 12)};168`} dur="2.4s" begin={`${i * 0.12}s`} repeatCount="indefinite" />
      </rect>
    ))}
  </Frame>
);

const Git = () => {
  const branch = "M60 120 C 110 120, 110 62, 160 62 S 210 120, 260 120";
  return (
    <Frame id="git">
      <line x1="30" y1="120" x2="290" y2="120" stroke={W} strokeWidth="2.4" style={dots} />
      <path d={branch} fill="none" stroke={O} strokeWidth="2.4" style={dots} />
      {[40, 100, 220, 280].map((x) => <circle key={x} cx={x} cy="120" r="6" fill="rgba(7,18,63,1)" stroke="#fff" strokeWidth="2" />)}
      {[128, 160, 192].map((x) => <circle key={x} cx={x} cy={x === 160 ? 62 : 66} r="6" fill="rgba(7,18,63,1)" stroke={O} strokeWidth="2" />)}
      <circle r="5" fill={O}>
        <animateMotion dur="3.2s" repeatCount="indefinite" path={branch} />
      </circle>
      <circle cx="260" cy="120" r="9" fill="none" stroke={O2} strokeWidth="2">
        <animate attributeName="r" values="6;20" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.85;0.9;1" dur="3.2s" repeatCount="indefinite" />
      </circle>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={110 + i * 6} y={146 + i * 10} width={90 - i * 20} height="5" rx="2.5" fill={DIM}>
          <animate attributeName="fill" values={`${DIM};${O};${DIM}`} dur="2.4s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </Frame>
  );
};

// SAP: a central agent node fanning out to SAP modules, scanning each in turn.
const Sap = () => {
  const mods = [
    ["FI", 62, 44],
    ["SD", 258, 44],
    ["MM", 62, 146],
    ["PP", 258, 146],
    ["CO", 160, 22],
    ["WM", 160, 170],
  ];
  return (
    <Frame id="sap">
      <circle cx="160" cy="96" r="58" fill="none" stroke={W} strokeWidth="1.5" style={dots}>
        <animateTransform attributeName="transform" type="rotate" from="0 160 96" to="360 160 96" dur="16s" repeatCount="indefinite" />
      </circle>
      {mods.map(([label, x, y], i) => (
        <g key={label}>
          <line x1="160" y1="96" x2={x} y2={y} stroke={O} strokeWidth="1.6" style={fine} />
          <circle r="3" fill={O2}>
            <animateMotion dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={`M160 96 L${x} ${y}`} />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <rect x={x - 19} y={y - 12} width="38" height="24" rx="6" fill="rgba(7,18,63,0.9)" stroke={O} strokeWidth="1.8">
            <animate attributeName="fill" values={`rgba(7,18,63,0.9);${O};rgba(7,18,63,0.9);rgba(7,18,63,0.9)`} keyTimes="0;0.06;0.16;1" dur="3s" begin={`${i * 0.5 + 0.9}s`} repeatCount="indefinite" />
          </rect>
          <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace" fill="#fff">{label}</text>
        </g>
      ))}
      <rect x="132" y="80" width="56" height="32" rx="9" fill={O} />
      <text x="160" y="100" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="ui-monospace, monospace" fill="#fff">SAP</text>
      <rect x="128" y="76" width="64" height="40" rx="12" fill="none" stroke={O2} strokeWidth="1.4">
        <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
      </rect>
    </Frame>
  );
};

const VISUALS = {
  "AI SAP Testing": Sap,
  "Web Testing": Web,
  "Business Validation": Doc,
  "Regression Testing": Regression,
  "Mobile App Testing": Mobile,
  "API Testing": Api,
  "DB Testing": Db,
  "Security Testing (VAPT)": Security,
  "Performance Testing": Perf,
  "GitHub Code Testing": Git,
};

export default function ModuleVisual({ title }) {
  const V = VISUALS[title] || Web;
  return <V />;
}
