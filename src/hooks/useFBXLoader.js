// hooks/useFBXLoader.js
import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export function useFBXLoader(threeSceneHelpers, showCharacter, isPlaying, loop) {
  const [scenes, setScenes] = useState([null, null]);
  const [animationMixers, setAnimationMixers] = useState([null, null]);
  const [duration, setDuration] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState({ total: 0, loaded: 0 });

  const {
    addCharacterToScene,
    removeCharacterFromScene,
    getCharacter,
    setAnimationAction,
    setAnimation,
  } = threeSceneHelpers;

  // Position character based on how many exist
  const positionCharacter = useCallback((object, index) => {
    const character1Exists = getCharacter(0) !== null;
    const character2Exists = getCharacter(1) !== null;
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
  }, [getCharacter]);

  // Load FBX file
  const loadFBX = useCallback((file, index) => {
    if (!file) return;
    
    console.log(`Loading FBX file for index ${index}:`, file);
    setLoadingProgress({ total: 100, loaded: 0 });
    
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
  }, [isPlaying, loop, showCharacter, positionCharacter, getCharacter, removeCharacterFromScene, setAnimationAction, setAnimation, addCharacterToScene]);

  return {
    scenes,
    animationMixers,
    duration,
    loadingProgress,
    loadFBX,
  };
}