// components/FBXViewer/index.jsx - Dynamic Panel Height
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
  const controlsRef = useRef(null);
  const panelRef = useRef(null);
  
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

  // Dynamic height calculation for panel
  const updatePanelHeight = useCallback(() => {
    if (controlsRef.current && panelRef.current) {
      const controlsHeight = controlsRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const panelTop = 80; // Panel top position
      const padding = 20; // Safety padding
      
      const availableHeight = viewportHeight - panelTop - controlsHeight - padding;
      panelRef.current.style.height = `${Math.max(200, availableHeight)}px`; // Minimum 200px height
    }
  }, []);

  // Update panel height on mount and resize
  useEffect(() => {
    const handleResize = () => {
      updatePanelHeight();
    };

    // Initial calculation
    updatePanelHeight();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Also update when controls might change height due to content
    const observer = new ResizeObserver(updatePanelHeight);
    if (controlsRef.current) {
      observer.observe(controlsRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updatePanelHeight]);

  // Update panel height when controls content changes
  useEffect(() => {
    // Delay to ensure DOM is updated
    const timeoutId = setTimeout(updatePanelHeight, 100);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, duration, currentTime, updatePanelHeight]);

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
      {/* Floating title overlay */}
      <div className="viewer-title">
        <h1>3D Animation Viewer</h1>
      </div>

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
            ref={panelRef}
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
          ref={controlsRef}
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