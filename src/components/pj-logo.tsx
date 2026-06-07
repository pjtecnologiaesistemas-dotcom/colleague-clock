import { cn } from "@/lib/utils";

/**
 * Logo oficial PJ Tecnologia — hexágono com gradiente azul,
 * borda cyan com brilho e o texto "PJ".
 * Reproduz fielmente o ícone usado nas notificações do app.
 */
export function PjLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 192 192"
      role="img"
      aria-label="PJ Tecnologia"
      className={cn("block", className)}
    >
      <defs>
        <radialGradient id="pj-bg" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#0d3878" />
          <stop offset="100%" stopColor="#050d1a" />
        </radialGradient>
        <linearGradient id="pj-hex-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d3878" />
          <stop offset="100%" stopColor="#051225" />
        </linearGradient>
        <linearGradient id="pj-hex-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00eaff" />
          <stop offset="50%" stopColor="#0088cc" />
          <stop offset="100%" stopColor="#00c8f8" />
        </linearGradient>
        <filter id="pj-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Fundo circular */}
      <circle cx="96" cy="96" r="96" fill="url(#pj-bg)" />

      {/* Hexágono preenchido */}
      <polygon
        points="96,28 154.9,62 154.9,130 96,164 37.1,130 37.1,62"
        fill="url(#pj-hex-fill)"
      />
      {/* Borda externa cyan com brilho */}
      <polygon
        points="96,28 154.9,62 154.9,130 96,164 37.1,130 37.1,62"
        fill="none"
        stroke="url(#pj-hex-stroke)"
        strokeWidth="3"
        filter="url(#pj-glow)"
      />
      {/* Anel interno sutil */}
      <polygon
        points="96,42.3 144.3,70 144.3,122 96,149.7 47.7,122 47.7,70"
        fill="none"
        stroke="rgba(0,200,248,.18)"
        strokeWidth="1"
      />

      {/* Bolinhas nos vértices */}
      {[
        [96, 28],
        [154.9, 62],
        [154.9, 130],
        [96, 164],
        [37.1, 130],
        [37.1, 62],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#00eaff" opacity="0.8" />
      ))}

      {/* Texto "PJ" */}
      <g
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="54"
        textAnchor="middle"
        filter="url(#pj-glow)"
      >
        <text x="81" y="115" fill="#eef4ff">P</text>
        <text x="111" y="115" fill="#00eaff">J</text>
      </g>
    </svg>
  );
}