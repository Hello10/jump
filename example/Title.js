import React from 'react';

import useTheme from './useTheme';

export default function Title () {
  const theme = useTheme();
  return <h1>{theme.name}</h1>;
}
