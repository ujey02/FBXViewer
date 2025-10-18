// hooks/useFBXLoader.js - Fixed positioning based on visibility
import { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { VIEWER_CONFIG } from '../config/viewerConfig';

export function useFBXLoader(threeSceneHelpers, showCharacter, isPlaying, loop) {
  const [scenes, setScenes] = useState([null, null]);
  const [animationMixers, setAnimationMixers] = useState([null, null]);
  const [duration, setDuration] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState([
    { total: 0, loaded: 0, isLoading: false },
    { total: 0, loaded: 0, isLoading: false }
  ]);
  const [animationDetails, setAnimationDetails] = useState([null, null]);
  const [boneList, setBoneList] = useState([[], []]); // Store bone names for each character

  // Debug: Log animationDetails changes
  useEffect(() => {
    console.log('animationDetails state updated:', animationDetails);
  }, [animationDetails]);

  const {
    addCharacterToScene,
    removeCharacterFromScene,
    getCharacter,
    removeBoneHelper,
    setAnimationAction,
    setAnimation,
  } = threeSceneHelpers;

  // Position character based on visibility state, not just existence
  const positionCharacter = useCallback((object, index) => {
    // Check current visibility state (what should be visible)
    const character1Visible = showCharacter[0] && getCharacter(0) !== null;
    const character2Visible = showCharacter[1] && getCharacter(1) !== null;
    
    console.log(`Positioning character ${index}:`, {
      character1Visible,
      character2Visible,
      showCharacter: showCharacter
    });
    
    // Position side by side only if both characters are visible
    const bothVisible = character1Visible && character2Visible;
    
    if (bothVisible) {
      // Both characters visible: position left and right
      object.position.x = index === 0 ? -2.0 : 2.0;
    } else {
      // Only one character visible: center it
      object.position.x = 0;
    }
    
    object.position.y = 0;
    object.position.z = 0;
    object.rotation.y = 0; // Keep facing forward
    
    console.log(`Character ${index} positioned at x=${object.position.x}`);
  }, [showCharacter, getCharacter]);

  // Reposition all existing characters based on current visibility
  const repositionCharacters = useCallback(() => {
    console.log('Repositioning all characters, showCharacter:', showCharacter);
    
    const character1 = getCharacter(0);
    const character2 = getCharacter(1);
    
    // Count how many characters are currently VISIBLE (not just existing)
    const visibleCount = showCharacter.filter(visible => visible).length;
    const character1Visible = showCharacter[0];
    const character2Visible = showCharacter[1];
    
    console.log('Visibility check:', {
      character1Exists: character1 !== null,
      character2Exists: character2 !== null,
      character1Visible,
      character2Visible,
      visibleCount
    });
    
    // Position character 1 if it exists
    if (character1) {
      if (character2 && character2Visible && character1Visible) { // 캐릭터 2가 존할 경우
        // Both visible: character 1 goes left
        character1.position.x = -2.0;
      } else if (character1Visible) {
        // Only character 1 visible: center it
        character1.position.x = 0;
      }
      // If character 1 is not visible, don't reposition (it's hidden anyway)
      
      character1.position.y = 0;
      character1.position.z = 0;
      character1.rotation.y = 0;
      console.log(`Character 1 repositioned to x=${character1.position.x}`);
    }
    
    // Position character 2 if it exists
    if (character2) {
      if (character1 && character1Visible && character2Visible) {
        // Both visible: character 2 goes right
        character2.position.x = 2.0;
      } else if (character2Visible) {
        // Only character 2 visible: center it
        character2.position.x = 0;
      }
      // If character 2 is not visible, don't reposition (it's hidden anyway)
      
      character2.position.y = 0;
      character2.position.z = 0;
      character2.rotation.y = 0;
      console.log(`Character 2 repositioned to x=${character2.position.x}`);
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
      removeBoneHelper(index); // Also remove bone helper

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
        object.scale.set(VIEWER_CONFIG.BASE_SCALE, VIEWER_CONFIG.BASE_SCALE, VIEWER_CONFIG.BASE_SCALE);
        positionCharacter(object, index);

        // Extract bone list (remove duplicates)
        const bonesSet = new Set();
        object.traverse((child) => {
          if (child.isBone) {
            bonesSet.add(child.name);
          }
        });
        const bones = Array.from(bonesSet).sort(); // Convert to array and sort alphabetically

        // Store bone list
        setBoneList(prev => {
          const newBoneList = [...prev];
          newBoneList[index] = bones;
          console.log(`Extracted ${bones.length} unique bones from character ${index}:`, bones);
          return newBoneList;
        });

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
        
        // Reposition all characters after loading
        setTimeout(() => repositionCharacters(), 0);
        
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
      removeBoneHelper(index); // Also remove bone helper
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

    // Clear bone list
    setBoneList(prev => {
      const newBoneList = [...prev];
      newBoneList[index] = [];
      return newBoneList;
    });

    // Clear animation references
    setAnimationAction(index, null);
    setAnimation(index, null);

    // Reposition remaining characters
    setTimeout(() => repositionCharacters(), 0);
  }, [getCharacter, removeCharacterFromScene, removeBoneHelper, setAnimationAction, setAnimation, repositionCharacters]);

  // Update character scale
  const updateCharacterScale = useCallback((index, scale) => {
    const character = getCharacter(index);
    if (character) {
      character.scale.set(
        VIEWER_CONFIG.BASE_SCALE * scale,
        VIEWER_CONFIG.BASE_SCALE * scale,
        VIEWER_CONFIG.BASE_SCALE * scale
      );
    }
  }, [getCharacter]);

  // Calculate character height (bounding box height)
  const calculateCharacterHeight = useCallback((index) => {
    const character = getCharacter(index);
    if (!character) return 0;

    // Create a bounding box for the character
    const box = new THREE.Box3().setFromObject(character);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Return the Y height (accounting for current scale)
    return size.y;
  }, [getCharacter]);

  return {
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
  };
}