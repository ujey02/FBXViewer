// hooks/useFBXLoader.js - Enhanced with positioning, scale, and time sync
import { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export function useFBXLoader(threeSceneHelpers, showCharacter, isPlaying, loop) {
  const [scenes, setScenes] = useState([null, null]);
  const [animationMixers, setAnimationMixers] = useState([null, null]);
  const [duration, setDuration] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState([
    { total: 0, loaded: 0, isLoading: false },
    { total: 0, loaded: 0, isLoading: false }
  ]);
  const [animationDetails, setAnimationDetails] = useState([null, null]);

  // Debug: Log animationDetails changes
  useEffect(() => {
    console.log('animationDetails state updated:', animationDetails);
  }, [animationDetails]);

  const {
    addCharacterToScene,
    removeCharacterFromScene,
    getCharacter,
    setAnimationAction,
    setAnimation,
  } = threeSceneHelpers;

  // Position character based on how many exist and their visibility
  const positionCharacter = useCallback((object, index) => {
    // Check current state of characters
    const character1Exists = getCharacter(0) !== null || index === 0; // Include current if loading index 0
    const character2Exists = getCharacter(1) !== null || index === 1; // Include current if loading index 1
    const character1Visible = showCharacter[0];
    const character2Visible = showCharacter[1];
    
    // Only position side by side if both will exist AND both are visible
    const bothWillExistAndVisible = character1Exists && character2Exists && character1Visible && character2Visible;
    
    if (bothWillExistAndVisible) {
      // Position characters left and right when both are visible, but keep rotation at 0
      object.position.x = index === 0 ? -2.0 : 2.0;
      object.rotation.y = 0; // Keep both characters facing forward
    } else {
      // Center character when only one is visible
      object.position.x = 0;
      object.rotation.y = 0;
    }
    
    object.position.y = 0;
    object.position.z = 0;
  }, [showCharacter, getCharacter]);

  // Reposition all existing characters when visibility changes
  const repositionCharacters = useCallback(() => {
    const character1 = getCharacter(0);
    const character2 = getCharacter(1);
    const character1Visible = showCharacter[0];
    const character2Visible = showCharacter[1];
    
    // Determine if both should be positioned side by side
    const bothExistAndVisible = character1 && character2 && character1Visible && character2Visible;
    
    if (character1) {
      if (bothExistAndVisible) {
        character1.position.x = -2.0;
        character1.rotation.y = 0; // Keep facing forward
      } else {
        character1.position.x = 0;
        character1.rotation.y = 0;
      }
      character1.position.y = 0;
      character1.position.z = 0;
    }
    
    if (character2) {
      if (bothExistAndVisible) {
        character2.position.x = 2.0;
        character2.rotation.y = 0; // Keep facing forward
      } else {
        character2.position.x = 0;
        character2.rotation.y = 0;
      }
      character2.position.y = 0;
      character2.position.z = 0;
    }
  }, [getCharacter, showCharacter]);

  // Load FBX file
  const loadFBX = useCallback((file, index, currentTime = 0) => {
    if (!file) return;
    
    console.log(`Loading FBX file for index ${index}:`, file, `currentTime: ${currentTime}`);
    
    // Set loading state for this specific character
    setLoadingProgress(prev => {
      const newProgress = [...prev];
      newProgress[index] = { total: 100, loaded: 0, isLoading: true };
      return newProgress;
    });
    
    // Remove previous character if it exists
    if (getCharacter(index)) {
      console.log(`Removing previous character at index ${index}`);
      removeCharacterFromScene(index);
      
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
    
    const loader = new FBXLoader();
    
    loader.load(
      file,
      (object) => {
        console.log(`FBX file loaded successfully for index ${index}`, object);
        
        // Scale and position the model
        object.scale.set(0.02, 0.02, 0.02);
        positionCharacter(object, index);
        
        // Setup animations
        let mixer = null;
        let action = null;
        
        if (object.animations && object.animations.length > 0) {
          console.log(`Found ${object.animations.length} animations in the FBX file`);
          
          const firstAnimation = object.animations[0];
          
          // Calculate animation details
          const animationDuration = firstAnimation.duration;
          const totalFrames = Math.round(animationDuration * 30); // Assume 30 FPS default
          
          // More robust FPS calculation
          let fps = 30; // Default FPS
          if (firstAnimation.tracks && firstAnimation.tracks.length > 0) {
            // Try to get FPS from the first track's timing
            const firstTrack = firstAnimation.tracks[0];
            if (firstTrack.times && firstTrack.times.length > 1) {
              // Calculate average time between keyframes
              const timeStep = firstTrack.times[1] - firstTrack.times[0];
              if (timeStep > 0) {
                fps = Math.round(1 / timeStep);
              }
            }
          }

          console.log("Animation details:", {
            name: firstAnimation.name,
            duration: animationDuration,
            tracks: firstAnimation.tracks ? firstAnimation.tracks.length : 0,
            totalFrames,
            fps
          });

          // Store animation details
          setAnimationDetails(prev => {
            const newDetails = [...prev];
            newDetails[index] = {
              name: firstAnimation.name || 'Unnamed Animation',
              duration: animationDuration,
              totalFrames: totalFrames,
              fps: fps,
              trackCount: firstAnimation.tracks ? firstAnimation.tracks.length : 0
            };
            console.log(`Storing animation details for character ${index}:`, newDetails[index]);
            return newDetails;
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
          
          // Start the action and set to current time if provided
          action.play();
          if (currentTime > 0) {
            action.time = Math.min(currentTime, firstAnimation.duration);
            mixer.update(0); // Apply the time immediately
          }
          action.paused = !isPlaying;
          
          console.log("Animation action created:", {
            isRunning: action.isRunning(),
            paused: action.paused,
            enabled: action.enabled,
            weight: action.getEffectiveWeight(),
            duration: firstAnimation.duration,
            startTime: currentTime
          });
          
          // Store animation duration for progress tracking (use the longest duration)
          if (firstAnimation.duration > duration) {
            setDuration(firstAnimation.duration);
          }
          
          // Store animation and action references
          setAnimation(index, firstAnimation);
          setAnimationAction(index, action);
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
        
        // Add to scene if this character should be shown
        if (showCharacter[index]) {
          addCharacterToScene(object, index);
          console.log(`Added character ${index} to scene`);
        } else {
          console.log(`Character ${index} loaded but hidden`);
        }
        
        // Reposition all characters immediately after adding new one
        repositionCharacters();
        
        // Update loading progress - completed for this character
        setLoadingProgress(prev => {
          const newProgress = [...prev];
          newProgress[index] = { total: 100, loaded: 100, isLoading: false };
          return newProgress;
        });
      },
      (xhr) => {
        // Update loading progress for this specific character
        setLoadingProgress(prev => {
          const newProgress = [...prev];
          newProgress[index] = {
            total: xhr.total,
            loaded: xhr.loaded,
            isLoading: true
          };
          return newProgress;
        });
      },
      (error) => {
        console.error(`Error loading FBX file for index ${index}:`, error);
        // Set error state for this character
        setLoadingProgress(prev => {
          const newProgress = [...prev];
          newProgress[index] = { total: 100, loaded: 0, isLoading: false };
          return newProgress;
        });
      }
    );
  }, [isPlaying, loop, showCharacter, positionCharacter, getCharacter, removeCharacterFromScene, setAnimationAction, setAnimation, addCharacterToScene, repositionCharacters, duration]);

  // Unload character
  const unloadCharacter = useCallback((index) => {
    console.log(`Unloading character ${index}`);
    
    // Remove from scene
    if (getCharacter(index)) {
      removeCharacterFromScene(index);
    }
    
    // Stop and clear animation mixer
    setAnimationMixers(prev => {
      const newMixers = [...prev];
      if (newMixers[index]) {
        newMixers[index].stopAllAction();
      }
      newMixers[index] = null;
      return newMixers;
    });
    
    // Clear scene reference
    setScenes(prev => {
      const newScenes = [...prev];
      newScenes[index] = null;
      return newScenes;
    });

    // Clear animation details
    setAnimationDetails(prev => {
      const newDetails = [...prev];
      newDetails[index] = null;
      return newDetails;
    });
    
    // Clear animation references
    setAnimationAction(index, null);
    setAnimation(index, null);
    
    // Reposition remaining characters immediately
    repositionCharacters();
  }, [getCharacter, removeCharacterFromScene, setAnimationAction, setAnimation, repositionCharacters]);

  // Update character scale
  const updateCharacterScale = useCallback((index, scale) => {
    const character = getCharacter(index);
    if (character) {
      const baseScale = 0.02;
      character.scale.set(baseScale * scale, baseScale * scale, baseScale * scale);
    }
  }, [getCharacter]);

  return {
    scenes,
    animationMixers,
    duration,
    loadingProgress,
    animationDetails,
    loadFBX,
    unloadCharacter,
    updateCharacterScale,
    repositionCharacters,
  };
}