// FBXViewer.jsx - Fixed version with proper animation playback
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './FBXViewer.css';

export default function FBXViewer() {
  // References to DOM elements
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // State for the application
  const [scenes, setScenes] = useState([null, null]);
  const [showCharacter, setShowCharacter] = useState([true, true]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationMixers, setAnimationMixers] = useState([null, null]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fbxFiles, setFbxFiles] = useState([null, null]);
  const [fileNames, setFileNames] = useState(['Drag and drop', 'Drag and drop']);
  const [loadingProgress, setLoadingProgress] = useState({ total: 0, loaded: 0 });

  // Store Three.js objects in refs to avoid unnecessary re-renders
  const threeObjects = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    clock: new THREE.Clock(),
    animations: [null, null],
    characters: [null, null],
    animationActions: [null, null],
  });

  // Animation loop function
  const animate = useCallback(() => {
    const { scene, camera, renderer, controls, clock } = threeObjects.current;
    
    if (!renderer || !scene || !camera) return;
    
    // Get delta time from clock
    const delta = clock.getDelta();
    
    // Update controls
    if (controls) {
      controls.update();
    }
    
    // Update mixers if animation is active
    if (isPlaying && animationMixers) {
      let maxDuration = 0;
      let maxCurrentTime = 0;
      
      animationMixers.forEach((mixer, index) => {
        if (mixer && showCharacter[index]) {
          mixer.update(delta);
          
          // Get the action for this mixer
          const action = threeObjects.current.animationActions[index];
          
          if (action && action._clip) {
            const clipDuration = action._clip.duration;
            const time = action.time;
            
            // Track the longest animation for UI updates
            if (clipDuration > maxDuration) {
              maxDuration = clipDuration;
              maxCurrentTime = time;
            }
            
            // Check if animation reached the end
            if (time >= clipDuration && !loop) {
              console.log(`Animation ${index} reached end, stopping`);
              // Don't stop here, let the state update handle it
            }
          }
        }
      });
      
      // Update UI state based on the longest animation
      if (maxDuration > 0) {
        const progressValue = Math.min((maxCurrentTime / maxDuration) * 100, 100);
        setProgress(progressValue);
        setCurrentTime(maxCurrentTime);
        
        // Check if we should stop playing
        if (maxCurrentTime >= maxDuration && !loop) {
          console.log("All animations reached end, pausing");
          setIsPlaying(false);
        }
      }
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, animationMixers, showCharacter, loop]);

  // Initial setup of Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    console.log("Initializing Three.js scene");
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x444444);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add grid helper for better orientation
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 2, 5);
    
    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls for camera manipulation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Store objects in ref
    threeObjects.current.scene = scene;
    threeObjects.current.camera = camera;
    threeObjects.current.renderer = renderer;
    threeObjects.current.controls = controls;
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    animate();
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Three.js scene");
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Cleanup all Three.js objects
      if (threeObjects.current.characters) {
        threeObjects.current.characters.forEach(character => {
          if (character) {
            character.traverse(child => {
              if (child.geometry) {
                child.geometry.dispose();
              }
              
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else {
                  child.material.dispose();
                }
              }
            });
          }
        });
      }
      
      // Dispose mixers
      animationMixers.forEach(mixer => {
        if (mixer) {
          mixer.stopAllAction();
        }
      });
      
      renderer.dispose();
    };
  }, [animate]);

  // Update when play state or loop mode changes
  useEffect(() => {
    console.log(`Animation play state changed to: ${isPlaying}, loop: ${loop}`);
    
    threeObjects.current.animationActions.forEach((action, index) => {
      if (action && showCharacter[index]) {
        // Set loop mode
        action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        action.clampWhenFinished = true;
        
        if (isPlaying) {
          // Ensure animation is properly configured for playback
          action.enabled = true;
          action.timeScale = 1.0;
          action.setEffectiveWeight(1.0);
          action.paused = false;
          
          // If not running, start it
          if (!action.isRunning()) {
            action.play();
          }
          
          console.log(`Started animation ${index}, running=${action.isRunning()}, paused=${action.paused}`);
        } else {
          action.paused = true;
          console.log(`Paused animation ${index}`);
        }
      }
    });
    
    // Reset clock when starting playback to ensure smooth delta time
    if (isPlaying) {
      threeObjects.current.clock.getDelta();
    }
    
  }, [isPlaying, loop, showCharacter]);

  // Function to load FBX file
  const loadFBX = useCallback((file, index) => {
    if (!file) return;
    
    console.log(`Loading FBX file for index ${index}:`, file);
    
    // Update loading state
    setLoadingProgress({ total: 100, loaded: 0 });
    
    const { scene } = threeObjects.current;
    const loader = new FBXLoader();
    
    // Remove previous character if it exists
    if (threeObjects.current.characters[index]) {
      console.log(`Removing previous character at index ${index}`);
      scene.remove(threeObjects.current.characters[index]);
      
      // Properly dispose of previous character resources
      threeObjects.current.characters[index].traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      // Stop and remove previous animation action
      if (threeObjects.current.animationActions[index]) {
        threeObjects.current.animationActions[index].stop();
        threeObjects.current.animationActions[index] = null;
      }
      
      // Clear previous character references
      threeObjects.current.characters[index] = null;
      threeObjects.current.animations[index] = null;
      
      // Update animation mixers
      setAnimationMixers(prev => {
        const newMixers = [...prev];
        if (newMixers[index]) {
          newMixers[index].stopAllAction();
        }
        newMixers[index] = null;
        return newMixers;
      });
    }
    
    // Load new FBX file
    loader.load(
      file,
      (object) => {
        console.log(`FBX file loaded successfully for index ${index}`, object);
        
        // Scale and position the model
        object.scale.set(0.02, 0.02, 0.02);
        
        // Store character reference
        threeObjects.current.characters[index] = object;
        
        // Position this character
        positionCharacter(object, index);
        
        // Setup animations
        let mixer = null;
        let action = null;
        
        if (object.animations && object.animations.length > 0) {
          console.log(`Found ${object.animations.length} animations in the FBX file`);
          
          const firstAnimation = object.animations[0];
          console.log("Animation details:", {
            name: firstAnimation.name,
            duration: firstAnimation.duration,
            tracks: firstAnimation.tracks ? firstAnimation.tracks.length : 0
          });
          
          // Create new animation mixer
          mixer = new THREE.AnimationMixer(object);
          
          // Create and configure action
          action = mixer.clipAction(firstAnimation);
          action.clampWhenFinished = true;
          action.enabled = true;
          action.timeScale = 1.0;
          action.setEffectiveWeight(1.0);
          action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
          
          // Start the action but pause it initially
          action.play();
          action.paused = !isPlaying;
          
          console.log("Animation action created:", {
            isRunning: action.isRunning(),
            paused: action.paused,
            enabled: action.enabled,
            weight: action.getEffectiveWeight(),
            duration: firstAnimation.duration
          });
          
          // Store animation duration for progress tracking
          if (firstAnimation.duration > 0) {
            setDuration(firstAnimation.duration);
          }
          
          // Store animation and action references
          threeObjects.current.animations[index] = firstAnimation;
          threeObjects.current.animationActions[index] = action;
        } else {
          console.warn(`No animations found in the FBX file for index ${index}`);
        }
        
        // Update animation mixers state
        setAnimationMixers(prev => {
          const newMixers = [...prev];
          newMixers[index] = mixer;
          return newMixers;
        });
        
        // Update scenes array
        setScenes(prev => {
          const newScenes = [...prev];
          newScenes[index] = file;
          return newScenes;
        });
        
        // Position and add to scene if this character should be shown
        positionCharacter(object, index);
        if (showCharacter[index]) {
          scene.add(object);
          console.log(`Added character ${index} to scene`);
        } else {
          console.log(`Character ${index} loaded but hidden`);
        }
        
        // Update loading progress
        setLoadingProgress({ total: 100, loaded: 100 });
      },
      (xhr) => {
        setLoadingProgress({
          total: xhr.total,
          loaded: xhr.loaded
        });
      },
      (error) => {
        console.error(`Error loading FBX file for index ${index}:`, error);
        setLoadingProgress({ total: 100, loaded: 0 });
      }
    );
  }, [isPlaying, loop, showCharacter]);

  // Function to position character based on how many are visible
  const positionCharacter = useCallback((object, index) => {
    // Count how many characters exist (regardless of visibility state)
    const character1Exists = threeObjects.current.characters[0] !== null;
    const character2Exists = threeObjects.current.characters[1] !== null;
    const bothExist = character1Exists && character2Exists;
    
    if (bothExist) {
      object.position.x = index === 0 ? -1.5 : 1.5;
      object.rotation.y = index === 0 ? Math.PI / 10 : -Math.PI / 10;
    } else {
      object.position.x = 0;
      object.rotation.y = 0;
    }
    
    object.position.y = 0;
    object.position.z = 0;
  }, []);

  // Function to reposition all characters
  const repositionAllCharacters = useCallback(() => {
    const { scene, characters } = threeObjects.current;
    
    characters.forEach((character, index) => {
      if (character) {
        const isInScene = scene.children.includes(character);
        const shouldBeVisible = showCharacter[index];
        
        if (shouldBeVisible && !isInScene) {
          // Add character to scene and position it
          positionCharacter(character, index);
          scene.add(character);
          console.log(`Added character ${index} to scene`);
        } else if (!shouldBeVisible && isInScene) {
          // Remove character from scene
          scene.remove(character);
          console.log(`Removed character ${index} from scene`);
        } else if (shouldBeVisible && isInScene) {
          // Just reposition without removing
          positionCharacter(character, index);
        }
      }
    });
  }, [showCharacter, positionCharacter]);

  // Reposition characters when visibility changes
  useEffect(() => {
    repositionAllCharacters();
  }, [showCharacter, repositionAllCharacters]);

  // Load FBX files when they change
  useEffect(() => {
    fbxFiles.forEach((file, index) => {
      if (file && file !== scenes[index]) {
        console.log(`Loading file at index ${index} because it's new or changed`);
        loadFBX(file, index);
      }
    });
  }, [fbxFiles, scenes, loadFBX]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      fbxFiles.forEach(file => {
        if (file && typeof file === 'string' && file.startsWith('blob:')) {
          URL.revokeObjectURL(file);
        }
      });
    };
  }, [fbxFiles]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    // If we reached the end, reset to the beginning
    if (currentTime >= duration && duration > 0) {
      console.log("Resetting animation to beginning");
      resetAnimation();
      setIsPlaying(true);
      return;
    }
    
    setIsPlaying(prev => !prev);
  }, [currentTime, duration]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    console.log("Resetting all animations");
    
    threeObjects.current.animationActions.forEach((action, index) => {
      if (action) {
        action.stop();
        action.reset();
        action.time = 0;
        action.enabled = true;
        action.timeScale = 1.0;
        action.setEffectiveWeight(1.0);
        action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
        
        action.play();
        action.paused = !isPlaying;
        
        console.log(`Reset animation for character ${index}`);
      }
    });
    
    setProgress(0);
    setCurrentTime(0);
    
    // Reset the clock to ensure clean delta time
    threeObjects.current.clock.getDelta();
  }, [loop, isPlaying]);

  // Handle file selection
  const handleFileSelection = useCallback((event, index) => {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.fbx')) {
      console.warn('Invalid file type. Please select a valid FBX file.');
      return;
    }
    
    console.log(`File selected for index ${index}:`, file.name);
    
    const objectUrl = URL.createObjectURL(file);
    
    setFileNames(prev => {
      const newFileNames = [...prev];
      newFileNames[index] = file.name;
      return newFileNames;
    });
    
    // Revoke old URL if it exists
    if (fbxFiles[index] && typeof fbxFiles[index] === 'string' && fbxFiles[index].startsWith('blob:')) {
      URL.revokeObjectURL(fbxFiles[index]);
    }
    
    setFbxFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = objectUrl;
      return newFiles;
    });
  }, [fbxFiles]);
  
  // Handle drag and drop
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('file-drop-hover');
  }, []);
  
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('file-drop-hover');
  }, []);
  
  const handleDrop = useCallback((event, index) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('file-drop-hover');
    
    const file = event.dataTransfer.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.fbx')) {
      console.warn('Invalid file type. Please drop a valid FBX file.');
      return;
    }
    
    console.log(`File dropped for index ${index}:`, file.name);
    
    const objectUrl = URL.createObjectURL(file);
    
    setFileNames(prev => {
      const newFileNames = [...prev];
      newFileNames[index] = file.name;
      return newFileNames;
    });
    
    setFbxFiles(prev => {
      const newFiles = [...prev];
      newFiles[index] = objectUrl;
      return newFiles;
    });
  }, []);

  // Toggle character visibility
  const handleShowCharacter = useCallback((index) => {
    setShowCharacter(prev => {
      const newShowCharacter = [...prev];
      newShowCharacter[index] = !newShowCharacter[index];
      return newShowCharacter;
    });
  }, []);

  // Handle progress bar click for seeking
  const handleProgressBarClick = useCallback((e) => {
    if (!progressBarRef.current || duration <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    const seekTime = (percentage / 100) * duration;
    
    console.log(`Seeking to ${seekTime.toFixed(2)}s (${percentage.toFixed(2)}%)`);
    
    threeObjects.current.animationActions.forEach((action) => {
      if (action) {
        action.enabled = true;
        
        if (!action.isRunning()) {
          action.play();
        }
        
        action.time = seekTime;
        action.paused = !isPlaying;
      }
    });
    
    setProgress(percentage);
    setCurrentTime(seekTime);
  }, [duration, isPlaying]);

  // Calculate loading progress percentage
  const loadingPercentage = loadingProgress.total > 0 
    ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
    : 0;

  return (
    <div className="fbx-viewer-container">
      <header className="viewer-header">
        <h1>3D FBX Motion Viewer</h1>
      </header>
      
      <main className="viewer-main">
        {/* Character Selection Panel */}
        <div className="character-panel">
          <h2>Characters</h2>
          
          <div className="character-section">
            <h3>Character 1</h3>
            <div 
              className="file-drop-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 0)}
            >
              <input
                type="file"
                id="file-input-0"
                className="file-input-hidden"
                accept=".fbx"
                onChange={(e) => handleFileSelection(e, 0)}
              />
              <label htmlFor="file-input-0" className="file-input-label">
                <span className="file-input-name">
                  {fileNames[0]}
                </span>
                {!fbxFiles[0] && (
                  <span className="file-drop-message">drag and drop</span>
                )}
              </label>
            </div>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="show-character-1"
                checked={showCharacter[0]}
                onChange={() => handleShowCharacter(0)}
              />
              <label htmlFor="show-character-1">Show</label>
            </div>
            {loadingProgress.total > 0 && loadingProgress.loaded < loadingProgress.total && (
              <div className="loading-container">
                <div className="loading-bar-bg">
                  <div 
                    className="loading-bar-fill" 
                    style={{ width: `${loadingPercentage}%` }}
                  ></div>
                </div>
                <div className="loading-text">
                  Loading: {loadingPercentage}%
                </div>
              </div>
            )}
          </div>
          
          <div className="character-section">
            <h3>Character 2</h3>
            <div 
              className="file-drop-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 1)}
            >
              <input
                type="file"
                id="file-input-1"
                className="file-input-hidden"
                accept=".fbx"
                onChange={(e) => handleFileSelection(e, 1)}
              />
              <label htmlFor="file-input-1" className="file-input-label">
                <span className="file-input-name">
                  {fileNames[1]}
                </span>
                {!fbxFiles[1] && (
                  <span className="file-drop-message">drag and drop</span>
                )}
              </label>
            </div>
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="show-character-2"
                checked={showCharacter[1]}
                onChange={() => handleShowCharacter(1)}
              />
              <label htmlFor="show-character-2">Show</label>
            </div>
          </div>
        </div>
        
        {/* 3D Viewer */}
        <div className="viewer-container">
          <div 
            ref={containerRef} 
            className="three-container"
          >
            <div ref={mountRef} className="three-mount"></div>
          </div>
          
          {/* Playback Controls */}
          <div className="controls-container">
            <div className="controls-buttons">
              <button
                className="control-button"
                onClick={togglePlay}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                className="control-button"
                onClick={resetAnimation}
              >
                Reset
              </button>
              
              <div className="loop-checkbox">
                <input
                  type="checkbox"
                  id="loop"
                  checked={loop}
                  onChange={() => setLoop(!loop)}
                />
                <label htmlFor="loop">Loop</label>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div 
              ref={progressBarRef}
              className="progress-bar-bg"
              onClick={handleProgressBarClick}
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
        </div>
      </main>
    </div>
  );
}