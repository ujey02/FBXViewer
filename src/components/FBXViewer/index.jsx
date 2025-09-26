// components/FBXViewer/index.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useThreeScene } from '../../hooks/useThreeScene';
import { useFileHandler } from '../../hooks/useFileHandler';
import { useFBXLoader } from '../../hooks/useFBXLoader';
import { useAnimationControl } from '../../hooks/useAnimationControl';
import CharacterPanel from './CharacterPanel';
import ViewerCanvas from './ViewerCanvas';
import PlaybackControls from './PlaybackControls';
import './FBXViewer.css';

export default function FBXViewer() {
  // DOM references
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // Character visibility state
  const [showCharacter, setShowCharacter] = useState([true, true]);

  // Initialize Three.js scene
  const threeSceneHelpers = useThreeScene(containerRef, mountRef);

  // Handle file operations
  const {
    fbxFiles,
    fileNames,
    handleFileSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileHandler();

  // Load FBX files
  const {
    scenes,
    animationMixers,
    duration,
    loadingProgress,
    loadFBX,
  } = useFBXLoader(threeSceneHelpers, showCharacter, false, true);

  // Handle animation controls
  const {
    isPlaying,
    loop,
    progress,
    currentTime,
    setLoop,
    togglePlay,
    resetAnimation,
    handleProgressBarClick,
    handleAnimationFrame,
  } = useAnimationControl(threeSceneHelpers, animationMixers, showCharacter, duration);

  // Start animation loop - FIXED: only start once and don't depend on handleAnimationFrame
  useEffect(() => {
    const cleanup = threeSceneHelpers.startAnimationLoop(handleAnimationFrame);
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [threeSceneHelpers]); // Remove handleAnimationFrame dependency

  // Update animation callback when it changes
  useEffect(() => {
    if (threeSceneHelpers.updateAnimationCallback) {
      threeSceneHelpers.updateAnimationCallback(handleAnimationFrame);
    }
  }, [handleAnimationFrame, threeSceneHelpers]);

  // Load FBX files when they change
  useEffect(() => {
    fbxFiles.forEach((file, index) => {
      if (file && file !== scenes[index]) {
        console.log(`Loading file at index ${index} because it's new or changed`);
        loadFBX(file, index);
      }
    });
  }, [fbxFiles, scenes, loadFBX]);

  // Handle character visibility toggle
  const handleToggleCharacterVisibility = useCallback((index) => {
    setShowCharacter(prev => {
      const newShowCharacter = [...prev];
      newShowCharacter[index] = !newShowCharacter[index];
      
      // Immediately handle visibility
      const character = threeSceneHelpers.getCharacter(index);
      if (character) {
        if (newShowCharacter[index]) {
          threeSceneHelpers.addCharacterToScene(character, index);
        } else {
          threeSceneHelpers.removeCharacterFromScene(index);
        }
      }
      
      return newShowCharacter;
    });
  }, [threeSceneHelpers]);

  // Handle progress bar click with ref
  const onProgressBarClick = useCallback((e) => {
    handleProgressBarClick(e, progressBarRef);
  }, [handleProgressBarClick]);

  return (
    <div className="fbx-viewer-container">
      <header className="viewer-header">
        <h1>3D FBX Motion Viewer</h1>
      </header>
      
      <main className="viewer-main">
        <div className="viewer-content">
            <CharacterPanel
            fileNames={fileNames}
            fbxFiles={fbxFiles}
            showCharacter={showCharacter}
            loadingProgress={loadingProgress}
            onFileSelection={handleFileSelection}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onToggleCharacterVisibility={handleToggleCharacterVisibility}
            />
            
            <ViewerCanvas
            containerRef={containerRef}
            mountRef={mountRef}
            />
        </div>

        
        <PlaybackControls
          isPlaying={isPlaying}
          loop={loop}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          progressBarRef={progressBarRef}
          onTogglePlay={togglePlay}
          onReset={resetAnimation}
          onLoopToggle={() => setLoop(!loop)}
          onProgressBarClick={onProgressBarClick}
        />
      </main>
    </div>
  );
}