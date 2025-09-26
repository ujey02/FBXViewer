// components/FBXViewer/PlaybackControls.jsx
import React from 'react';

export default function PlaybackControls({
  isPlaying,
  loop,
  progress,
  currentTime,
  duration,
  progressBarRef,
  onTogglePlay,
  onReset,
  onLoopToggle,
  onProgressBarClick,
}) {
  return (
    <div className="controls-container">
      <div className="controls-buttons">
        <button
          className="control-button"
          onClick={onTogglePlay}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button
          className="control-button"
          onClick={onReset}
        >
          Reset
        </button>
        
        <div className="loop-checkbox">
          <input
            type="checkbox"
            id="loop"
            checked={loop}
            onChange={onLoopToggle}
          />
          <label htmlFor="loop">Loop</label>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div 
        ref={progressBarRef}
        className="progress-bar-bg"
        onClick={onProgressBarClick}
      >
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="time-display">
        Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </div>
    </div>
  );
}