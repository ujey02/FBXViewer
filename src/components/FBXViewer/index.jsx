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
  
  // Character visibility and scale state
  const [showCharacter, setShowCharacter] = useState([true, true]);
  const [characterScales, setCharacterScales] = useState([1.0, 1.0]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

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
    unloadFile,
  } = useFileHandler();

  // Load FBX files
  const {
    scenes,
    animationMixers,
    duration,
    loadingProgress,
    animationDetails,
    loadFBX,
    unloadCharacter,
    updateCharacterScale,
    repositionCharacters,
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

  // Start animation loop
  useEffect(() => {
    const cleanup = threeSceneHelpers.startAnimationLoop(handleAnimationFrame);
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [threeSceneHelpers]);

  // Update animation callback when it changes
  useEffect(() => {
    if (threeSceneHelpers.updateAnimationCallback) {
      threeSceneHelpers.updateAnimationCallback(handleAnimationFrame);
    }
  }, [handleAnimationFrame, threeSceneHelpers]);

  // Load FBX files when they change - sync to current time if playing
  useEffect(() => {
    fbxFiles.forEach((file, index) => {
      if (file && file !== scenes[index]) {
        console.log(`Loading file at index ${index} because it's new or changed`);
        // Pass current time to sync new character to current playback position
        loadFBX(file, index, currentTime);
      }
    });
  }, [fbxFiles, scenes, loadFBX, currentTime]);

  // Reposition characters when visibility changes
  useEffect(() => {
    repositionCharacters();
  }, [showCharacter, repositionCharacters]);

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

  // Handle character unload
  const handleUnloadCharacter = useCallback((index) => {
    unloadCharacter(index);
    unloadFile(index);
  }, [unloadCharacter, unloadFile]);

  // Handle scale change
  const handleScaleChange = useCallback((index, scale) => {
    setCharacterScales(prev => {
      const newScales = [...prev];
      newScales[index] = scale;
      return newScales;
    });
    updateCharacterScale(index, scale);
  }, [updateCharacterScale]);

  // Handle progress bar click with ref
  const onProgressBarClick = useCallback((e) => {
    handleProgressBarClick(e, progressBarRef);
  }, [handleProgressBarClick]);

  // Toggle panel collapse
  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  return (
    <div className="fbx-viewer-container">
      <header className="viewer-header">
        <h1>3D FBX Motion Viewer</h1>
      </header>

      {/* Menu toggle button */}
      <button 
        className="panel-toggle-button"
        onClick={togglePanel}
        title={isPanelCollapsed ? "Expand panel" : "Collapse panel"}
      >
        {isPanelCollapsed ? '▶' : '◀'}
      </button>
      
      <main className="viewer-main">
        <div className="viewer-content">
            <CharacterPanel
            fileNames={fileNames}
            fbxFiles={fbxFiles}
            showCharacter={showCharacter}
            characterScales={characterScales}
            loadingProgress={loadingProgress}
            animationDetails={animationDetails}
            isPanelCollapsed={isPanelCollapsed}
            onFileSelection={handleFileSelection}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onToggleCharacterVisibility={handleToggleCharacterVisibility}
            onUnloadCharacter={handleUnloadCharacter}
            onScaleChange={handleScaleChange}
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