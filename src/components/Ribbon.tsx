import React from 'react';

interface RibbonProps {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
}

const Ribbon: React.FC<RibbonProps> = ({
  text = "Sindhu Edition",
  backgroundColor = "#DC2626", // Red-600
  textColor = "#FFFFFF" // White
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '70px',
        left: '-10px',
        transform: 'rotate(-45deg)',
        backgroundColor,
        color: textColor,
        padding: '10px 40px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 1001,
        boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
        textAlign: 'center',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        whiteSpace: 'nowrap',
        minWidth: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0',
        background: `linear-gradient(135deg, ${backgroundColor} 0%, ${backgroundColor}dd 50%, ${backgroundColor} 100%)`,
        // Add ribbon-like angled ends using clip-path
        clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)',
        border: 'none'
      }}
    >
      <span style={{
        display: 'inline-block',
        transform: '', // Counter-skew the text to keep it horizontal
        paddingLeft: '15px', // Offset for the angled end
        paddingRight: '15px'
      }}>
        {text}
      </span>
    </div>
  );
};

export default Ribbon;