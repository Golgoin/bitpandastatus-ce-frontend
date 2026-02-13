import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-neutrals-card_fill_primary/50 border border-roadmap-border rounded-lg p-3 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
