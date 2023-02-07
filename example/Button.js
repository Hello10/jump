import React from 'react';

import useTheme from './useTheme';

export default function Button () {
  const theme = useTheme();
  return (
    <button
      onClick={theme.toggleMode}
      style={{
        borderColor: theme.primary,
        color: theme.primary
      }}
    >
      toggle
    </button>
  );
}
