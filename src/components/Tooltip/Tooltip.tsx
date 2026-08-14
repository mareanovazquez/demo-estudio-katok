import React from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  position = 'top',
  children,
}) => {
  if (!text) return <>{children}</>;

  // Si children es un solo elemento React válido, clonarlo e inyectar data-tooltip
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      'data-tooltip': text,
      'data-tooltip-pos': position,
    });
  }

  // De lo contrario, envolver en un span
  return (
    <span data-tooltip={text} data-tooltip-pos={position} style={{ display: 'inline-flex' }}>
      {children}
    </span>
  );
};
