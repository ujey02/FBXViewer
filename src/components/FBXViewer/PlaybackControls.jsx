// components/FBXViewer/PlaybackControls.jsx - forwardRef version
import React, { forwardRef, useState, useCallback } from 'react';

const PlaybackControls = forwardRef(({
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
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(null);

  const calculateProgress = useCallback((e) => {
    if (!progressBarRef.current) return null;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (clickPosition / rect.width) * 100));
    return percentage;
  }, [progressBarRef]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    const newProgress = calculateProgress(e);
    if (newProgress !== null) {
      setDragProgress(newProgress);
    }
    onProgressBarClick(e);
  }, [onProgressBarClick, calculateProgress]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newProgress = calculateProgress(e);
      if (newProgress !== null) {
        setDragProgress(newProgress);
      }
      onProgressBarClick(e);
    }
  }, [isDragging, onProgressBarClick, calculateProgress]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragProgress(null);
  }, []);

  // Add global mouse up listener to handle mouse up outside the progress bar
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [isDragging, handleMouseUp, handleMouseMove]);

  return (
    <div ref={ref} className="controls-container">
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
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${isDragging && dragProgress !== null ? dragProgress : progress}%`,
            transition: 'none'
          }}
        ></div>
      </div>
      
      <div className="time-display">
        Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';

export default PlaybackControls;