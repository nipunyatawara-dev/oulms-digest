'use client';

import React from 'react';
import { Theme } from '@astryxdesign/core';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export function AstryxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={neutralTheme}>
      {children}
    </Theme>
  );
}
