import React from 'react';

export default function ViewerCanvas({ containerRef, mountRef }) {
  return (
    <div className="viewer-container">
      <div 
        ref={containerRef} 
        className="three-container"
      >
        <div ref={mountRef} className="three-mount"></div>
      </div>
    </div>
  );
}