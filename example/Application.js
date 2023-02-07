import React from 'react';

import useTheme from './useTheme';
import Title from './Title';
import Button from './Button';

export default function Application () {
  const theme = useTheme();

  const style = {
    light: {
      backgroundColor: '#ffffff',
      color: theme.primary
    },
    dark: {
      backgroundColor: theme.primary,
      color: '#ffffff'
    }
  }[theme.mode];

  return (
    <div
      className="Application"
      style={style}
    >
      <Title/>
      <Button/>
    </div>
  );
}
