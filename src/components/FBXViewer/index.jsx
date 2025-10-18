// components/FBXViewer/index.jsx - Dynamic Panel Height
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useThreeScene } from '../../hooks/useThreeScene';
import { useFileHandler } from '../../hooks/useFileHandler';
import { useFBXLoader } from '../../hooks/useFBXLoader';
import { useAnimationControl } from '../../hooks/useAnimationControl';
import CharacterPanel from './CharacterPanel';
import ViewerCanvas from './ViewerCanvas';
import PlaybackControls from './PlaybackControls';
import { VIEWER_CONFIG } from '../../config/viewerConfig';
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
  const [showBone, setShowBone] = useState([false, false]);
  const [selectedBone, setSelectedBone] = useState([null, null]); // Selected bone for each character
  const [characterScales, setCharacterScales] = useState([1.0, 1.0]);
  const [normalizeScale, setNormalizeScale] = useState([false, false]); // Normalize scale to height=1
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
    boneList,
    loadFBX,
    unloadCharacter,
    updateCharacterScale,
    calculateCharacterHeight,
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
    handleAnimationFrame: baseHandleAnimationFrame,
  } = useAnimationControl(threeSceneHelpers, animationMixers, showCharacter, duration);

  // Enhanced animation frame handler that also updates highlighted bones
  const handleAnimationFrame = useCallback((delta) => {
    baseHandleAnimationFrame(delta);
    // Update highlighted bone positions for both characters
    threeSceneHelpers.updateHighlightedBone(0);
    threeSceneHelpers.updateHighlightedBone(1);
  }, [baseHandleAnimationFrame, threeSceneHelpers]);

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
    }, [showCharacter]);

  // Handle character visibility toggle
  const handleToggleCharacterVisibility = useCallback((index) => {
    setShowCharacter(prev => {
      const newShowCharacter = [...prev];
      newShowCharacter[index] = !newShowCharacter[index];
      
      // Get the character object
      const character = threeSceneHelpers.getCharacter(index);
      
      if (character) {
        if (newShowCharacter[index]) {
          // Show character: add to scene and ensure positioning is correct
          threeSceneHelpers.addCharacterToScene(character, index);
          // Trigger repositioning for all characters
          setTimeout(() => repositionCharacters(), 0);
        } else {
          // Hide character: remove from scene
          threeSceneHelpers.removeCharacterFromScene(index);
          // Trigger repositioning for remaining characters
          setTimeout(() => repositionCharacters(), 0);
        }
      }
      
      return newShowCharacter;
    });
  }, [threeSceneHelpers, repositionCharacters]);

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

    const character = threeSceneHelpers.getCharacter(index);
    if (character) {
      if (normalizeScale[index]) {
        // In normalize mode: apply scale with normalization
        const height = calculateCharacterHeight(index);
        if (height > 0) {
          const normalizedScale = (VIEWER_CONFIG.NORMALIZED_HEIGHT / height) * scale;
          character.scale.set(
            VIEWER_CONFIG.BASE_SCALE * normalizedScale,
            VIEWER_CONFIG.BASE_SCALE * normalizedScale,
            VIEWER_CONFIG.BASE_SCALE * normalizedScale
          );
        }
      } else {
        // Normal mode: just apply scale directly
        updateCharacterScale(index, scale);
      }
    }
  }, [updateCharacterScale, threeSceneHelpers, normalizeScale, calculateCharacterHeight]);

  // Handle bone visibility toggle
  const handleToggleBoneVisibility = useCallback((index) => {
    setShowBone(prev => {
      const newShowBone = [...prev];
      newShowBone[index] = !newShowBone[index];

      // Get the character object
      const character = threeSceneHelpers.getCharacter(index);

      if (character) {
        if (newShowBone[index]) {
          // Show bones: add bone helper to scene
          threeSceneHelpers.addBoneHelper(character, index);
        } else {
          // Hide bones: remove bone helper from scene
          threeSceneHelpers.removeBoneHelper(index);
          // Also remove highlighted bone and clear selection
          threeSceneHelpers.removeHighlightedBone(index);
          setSelectedBone(prevSelected => {
            const newSelected = [...prevSelected];
            newSelected[index] = null;
            return newSelected;
          });
        }
      }

      return newShowBone;
    });
  }, [threeSceneHelpers]);

  // Handle bone selection from dropdown
  const handleBoneSelection = useCallback((index, boneName) => {
    setSelectedBone(prev => {
      const newSelectedBone = [...prev];
      newSelectedBone[index] = boneName;
      return newSelectedBone;
    });

    // Highlight the selected bone
    if (boneName) {
      threeSceneHelpers.highlightBone(index, boneName);
    } else {
      threeSceneHelpers.removeHighlightedBone(index);
    }
  }, [threeSceneHelpers]);

  // Handle normalize toggle
  const handleToggleNormalize = useCallback((index) => {
    const newNormalize = !normalizeScale[index];

    setNormalizeScale(prev => {
      const updated = [...prev];
      updated[index] = newNormalize;
      return updated;
    });

    // Apply scale change immediately
    const character = threeSceneHelpers.getCharacter(index);
    if (character) {
      if (newNormalize) {
        // Normalize: calculate height and scale to normalized height
        const height = calculateCharacterHeight(index);
        if (height > 0) {
          const normalizedScale = (VIEWER_CONFIG.NORMALIZED_HEIGHT / height) * characterScales[index];
          character.scale.set(
            VIEWER_CONFIG.BASE_SCALE * normalizedScale,
            VIEWER_CONFIG.BASE_SCALE * normalizedScale,
            VIEWER_CONFIG.BASE_SCALE * normalizedScale
          );
          console.log(`Normalized character ${index} to height=${VIEWER_CONFIG.NORMALIZED_HEIGHT}, height was ${height.toFixed(2)}, applied scale: ${normalizedScale.toFixed(4)}`);
        }
      } else {
        // Denormalize: use the user's scale setting
        updateCharacterScale(index, characterScales[index]);
        console.log(`Denormalized character ${index}, applied scale: ${characterScales[index].toFixed(2)}`);
      }
    }
  }, [normalizeScale, threeSceneHelpers, calculateCharacterHeight, characterScales, updateCharacterScale]);

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
            showBone={showBone}
            selectedBone={selectedBone}
            boneList={boneList}
            characterScales={characterScales}
            normalizeScale={normalizeScale}
            loadingProgress={loadingProgress}
            animationDetails={animationDetails}
            isPanelCollapsed={isPanelCollapsed}
            onFileSelection={handleFileSelection}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onToggleCharacterVisibility={handleToggleCharacterVisibility}
            onToggleBoneVisibility={handleToggleBoneVisibility}
            onBoneSelection={handleBoneSelection}
            onToggleNormalize={handleToggleNormalize}
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