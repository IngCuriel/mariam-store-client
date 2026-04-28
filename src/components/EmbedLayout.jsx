import React from 'react';
import { Outlet } from 'react-router-dom';

/** Layout mínimo para vistas embebidas desde el POS (iframe). */
export default function EmbedLayout() {
  return (
    <main className="app-main app-main--embed">
      <Outlet />
    </main>
  );
}
