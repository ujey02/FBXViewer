// hooks/useAnimationControl.js
import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

export function useAnimationControl(threeSceneHelpers, animationMixers, showCharacter, duration) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const { getAllAnimationActions, resetClock } = threeSceneHelpers;

  // Update animation actions when play state or loop mode changes
  useEffect(() => {
    console.log(`Animation play state changed to: ${isPlaying}, loop: ${loop}`);
    
    getAllAnimationActions().forEach((action, index) => {
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
      resetClock();
    }
    
  }, [isPlaying, loop, showCharacter, getAllAnimationActions, resetClock]);

  // Animation frame callback for updating progress
  const handleAnimationFrame = useCallback((delta) => {
    if (isPlaying && animationMixers) {
      let maxDuration = 0;
      let maxCurrentTime = 0;
      
      animationMixers.forEach((mixer, index) => {
        if (mixer && showCharacter[index]) {
          mixer.update(delta);
          
          const action = getAllAnimationActions()[index];
          if (action && action._clip) {
            const clipDuration = action._clip.duration;
            const time = action.time;
            
            if (clipDuration > maxDuration) {
              maxDuration = clipDuration;
              maxCurrentTime = time;
            }
          }
        }
      });
      
      if (maxDuration > 0) {
        const progressValue = Math.min((maxCurrentTime / maxDuration) * 100, 100);
        setProgress(progressValue);
        setCurrentTime(maxCurrentTime);
        
        if (maxCurrentTime >= maxDuration && !loop) {
          console.log("All animations reached end, pausing");
          setIsPlaying(false);
        }
      }
    }
  }, [isPlaying, animationMixers, showCharacter, loop, getAllAnimationActions]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (currentTime >= duration && duration > 0) {
      // Reset and play
      getAllAnimationActions().forEach((action) => {
        if (action) {
          action.stop();
          action.reset();
          action.time = 0;
          action.enabled = true;
          action.timeScale = 1.0;
          action.setEffectiveWeight(1.0);
          action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
          action.play();
          action.paused = false;
        }
      });
      setProgress(0);
      setCurrentTime(0);
      resetClock();
      setIsPlaying(true);
      return;
    }
    
    setIsPlaying(prev => !prev);
  }, [currentTime, duration, getAllAnimationActions, resetClock, loop]);

  // Reset animation
  const resetAnimation = useCallback(() => {
    console.log("Resetting all animations");
    
    getAllAnimationActions().forEach((action, index) => {
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
    resetClock();
  }, [loop, isPlaying, getAllAnimationActions, resetClock]);

  // Handle progress bar click for seeking
  const handleProgressBarClick = useCallback((e, progressBarRef) => {
    if (!progressBarRef.current || duration <= 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = (clickPosition / rect.width) * 100;
    const seekTime = (percentage / 100) * duration;
    
    console.log(`Seeking to ${seekTime.toFixed(2)}s (${percentage.toFixed(2)}%)`);
    
    getAllAnimationActions().forEach((action) => {
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
  }, [duration, isPlaying, getAllAnimationActions]);

  return {
    isPlaying,
    loop,
    progress,
    currentTime,
    setLoop,
    togglePlay,
    resetAnimation,
    handleProgressBarClick,
    handleAnimationFrame,
  };
}