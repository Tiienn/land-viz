import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'medium' | 'strong';
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, className = '', padding = 'none', shadow = 'soft' }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowClasses = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong',
  };

  const classes = `
    card
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return <div className={classes}>{children}</div>;
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  const classes = `card-header ${className}`.trim();
  return <div className={classes}>{children}</div>;
};

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  const classes = `card-content ${className}`.trim();
  return <div className={classes}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const classes = `px-4 py-3 border-t border-neutral-200 ${className}`.trim();
  return <div className={classes}>{children}</div>;
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;