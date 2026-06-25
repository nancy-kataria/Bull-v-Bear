import { useState } from 'react';
interface RiskPillProps {
  tag: string;
  relatedSentence?: string;
  onHover: (tag: string | null) => void;
  active: boolean;
}

export default function RiskPill({ tag, onHover, active }: RiskPillProps) {
  const [hovered, setHovered] = useState(false);

  const handleEnter = () => {
    setHovered(true);
    onHover(tag);
  };
  const handleLeave = () => {
    setHovered(false);
    onHover(null);
  };

  return (
    <span
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-medium cursor-pointer
        border transition-all duration-200
        ${active || hovered
          ? 'bg-bear-dim border-bear text-bear-bright shadow-[0_0_10px_rgba(239,68,68,0.3)]'
          : 'bg-navy-700 border-neutral-border text-neutral-label hover:border-bear/50 hover:text-bear-bright'
        }
      `}
    >
      {tag}
    </span>
  );
}
