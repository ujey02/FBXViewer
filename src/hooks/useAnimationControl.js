// hooks/useAnimationControl.js - Timer-based approach
import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';

export function useAnimationControl(threeSceneHelpers, animationMixers, showCharacter, duration) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const timerRef = useRef(null);

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

  // Simple progress tracking - read from Three.js actions periodically
  useEffect(() => {
    let intervalId = null;
    
    if (isPlaying || duration > 0) {
      // Update progress every 16ms (~60fps) by reading from animation actions
      intervalId = setInterval(() => {
        const actions = getAllAnimationActions();
        let maxCurrentTime = 0;
        
        // Read current time from animation actions
        actions.forEach((action, index) => {
          if (action && action._clip && showCharacter[index]) {
            const time = action.time;
            if (time > maxCurrentTime) {
              maxCurrentTime = time;
            }
          }
        });
        
        setCurrentTime(maxCurrentTime);
        
        // Calculate progress based on current time and duration
        if (duration > 0) {
          const progressValue = Math.min((maxCurrentTime / duration) * 100, 100);
          setProgress(progressValue);
          
          // Check for end of animation only when playing
          if (isPlaying && !loop && maxCurrentTime >= duration) {
            console.log("Animation reached end, pausing");
            setIsPlaying(false);
          }
        }
        
      }, 16); // ~60fps updates
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, duration, loop, showCharacter, getAllAnimationActions]);

  // Simple animation frame callback - just updates mixers, no progress tracking
  const handleAnimationFrame = useCallback((delta) => {
    if (isPlaying && animationMixers) {
      animationMixers.forEach((mixer, index) => {
        if (mixer && showCharacter[index]) {
          mixer.update(delta);
        }
      });
    }
  }, [isPlaying, animationMixers, showCharacter]);

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
    
    const actions = getAllAnimationActions();
    actions.forEach((action) => {
      if (action) {
        action.enabled = true;
        
        if (!action.isRunning()) {
          action.play();
        }
        
        action.time = seekTime;
        action.paused = !isPlaying;
      }
    });
    
    // Force update the mixers once to reflect the seek position
    if (animationMixers) {
      animationMixers.forEach((mixer, index) => {
        if (mixer && showCharacter[index]) {
          mixer.update(0); // Update with 0 delta to just apply the time change
        }
      });
    }
    
    // Update timer state
    setCurrentTime(seekTime);
    pausedTimeRef.current = seekTime;
    const progressValue = duration > 0 ? Math.min((seekTime / duration) * 100, 100) : 0;
    setProgress(progressValue);
    
  }, [duration, isPlaying, getAllAnimationActions, animationMixers, showCharacter]);

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