// hooks/useThreeScene.js
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function useThreeScene(containerRef, mountRef) {
  const threeObjects = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    clock: new THREE.Clock(),
    characters: [null, null],
    animationActions: [null, null],
    animations: [null, null],
  });

  const animationFrameRef = useRef(null);
  const currentAnimationCallback = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !containerRef.current) return;
    
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
    
    // Add grid helper
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
    
    // Add orbit controls
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
    
    // Cleanup function
    return () => {
      console.log("Cleaning up Three.js scene");
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Cleanup characters
      threeObjects.current.characters.forEach(character => {
        if (character) {
          character.traverse(child => {
            if (child.geometry) child.geometry.dispose();
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
      
      renderer.dispose();
    };
  }, [containerRef, mountRef]);

  // Animation loop function - FIXED: Always use latest callback
  const startAnimationLoop = useCallback((onAnimationFrame) => {
    // Stop any existing animation loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Store the current callback
    currentAnimationCallback.current = onAnimationFrame;
    
    const animate = () => {
      const { scene, camera, renderer, controls, clock } = threeObjects.current;
      
      if (!renderer || !scene || !camera) return;
      
      const delta = clock.getDelta();
      
      if (controls) {
        controls.update();
      }
      
      // Call the animation frame callback with delta time
      // Always use the most recent callback
      if (currentAnimationCallback.current) {
        currentAnimationCallback.current(delta);
      }
      
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Return cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      currentAnimationCallback.current = null;
    };
  }, []);

  // Function to update animation callback without restarting loop
  const updateAnimationCallback = useCallback((onAnimationFrame) => {
    currentAnimationCallback.current = onAnimationFrame;
  }, []);

  // Stop animation loop
  const stopAnimationLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    currentAnimationCallback.current = null;
  }, []);

  // Add character to scene
  const addCharacterToScene = useCallback((character, index) => {
    if (threeObjects.current.scene && character) {
      threeObjects.current.scene.add(character);
      threeObjects.current.characters[index] = character;
    }
  }, []);

  // Remove character from scene
  const removeCharacterFromScene = useCallback((index) => {
    const character = threeObjects.current.characters[index];
    if (threeObjects.current.scene && character) {
      threeObjects.current.scene.remove(character);
      threeObjects.current.characters[index] = null;
    }
  }, []);

  // Get character reference
  const getCharacter = useCallback((index) => {
    return threeObjects.current.characters[index];
  }, []);

  // Store animation action
  const setAnimationAction = useCallback((index, action) => {
    threeObjects.current.animationActions[index] = action;
  }, []);

  // Get animation action
  const getAnimationAction = useCallback((index) => {
    return threeObjects.current.animationActions[index];
  }, []);

  // Store animation clip
  const setAnimation = useCallback((index, animation) => {
    threeObjects.current.animations[index] = animation;
  }, []);

  // Get all animation actions
  const getAllAnimationActions = useCallback(() => {
    return threeObjects.current.animationActions;
  }, []);

  // Reset clock (useful when starting animation)
  const resetClock = useCallback(() => {
    threeObjects.current.clock.getDelta();
  }, []);

  return {
    threeObjects: threeObjects.current,
    startAnimationLoop,
    stopAnimationLoop,
    updateAnimationCallback,
    addCharacterToScene,
    removeCharacterFromScene,
    getCharacter,
    setAnimationAction,
    getAnimationAction,
    setAnimation,
    getAllAnimationActions,
    resetClock,
  };
}