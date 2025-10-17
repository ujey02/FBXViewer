// hooks/useThreeScene.js - Bright Modern 3D Scene
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
    boneHelpers: [null, null],
    highlightedBoneNames: [null, null], // Store currently highlighted bone names
    animationActions: [null, null],
    animations: [null, null],
  });

  const animationFrameRef = useRef(null);
  const currentAnimationCallback = useRef(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !containerRef.current) return;
    
    console.log("Initializing bright Three.js scene");
    
    // Create scene with bright background
    const scene = new THREE.Scene();
    // Bright gradient-like background using fog
    scene.background = new THREE.Color(0xf0f8ff); // Alice blue - very bright
    scene.fog = new THREE.Fog(0xe6f3ff, 50, 100); // Subtle bright fog for depth
    
    // Enhanced lighting setup for bright scene
    // Bright ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    // Primary directional light (key light)
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 2048;
    directionalLight1.shadow.mapSize.height = 2048;
    scene.add(directionalLight1);
    
    // Secondary directional light (fill light)
    const directionalLight2 = new THREE.DirectionalLight(0xe6f3ff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    scene.add(directionalLight2);
    
    // Top-down light for even illumination
    const directionalLight3 = new THREE.DirectionalLight(0xfff8dc, 0.6);
    directionalLight3.position.set(0, 15, 0);
    scene.add(directionalLight3);
    
    // Add hemisphere light for natural outdoor feel
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0xf0f8ff, 0.6);
    scene.add(hemisphereLight);
    
    // Brighter, more modern grid helper
    const gridHelper = new THREE.GridHelper(
      20, // size
      20, // divisions
      0xbdcfdc, // center line color - soft blue-gray
      0xe2eaf2  // grid color - very light blue-gray
    );
    gridHelper.position.y = 0; // At ground level
    scene.add(gridHelper);
    
    // Setup camera with better initial position
    const camera = new THREE.PerspectiveCamera(
      60, // Slightly narrower FOV for better focus
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      200
    );
    camera.position.set(0, 3, 8); // Better initial viewing angle
    
    // Setup renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enhanced renderer settings for bright, modern look
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Brighter exposure
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    
    // Set clear color to match CSS background
    renderer.setClearColor(0xf0f8ff, 1);
    
    mountRef.current.appendChild(renderer.domElement);
    
    // Enhanced orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 1.8; // Prevent going below ground
    controls.autoRotate = false;
    
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      console.log("Cleaning up bright Three.js scene");
      
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

  // Animation loop function
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
      // First remove character if it's already in the scene to avoid duplicates
      if (threeObjects.current.scene.children.includes(character)) {
        threeObjects.current.scene.remove(character);
      }
      
      // Enable shadow casting/receiving for better visual quality
      character.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance materials for brighter appearance
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.isMeshLambertMaterial || mat.isMeshPhongMaterial) {
                  mat.needsUpdate = true;
                }
              });
            } else {
              if (child.material.isMeshLambertMaterial || child.material.isMeshPhongMaterial) {
                child.material.needsUpdate = true;
              }
            }
          }
        }
      });
      
      threeObjects.current.scene.add(character);
      threeObjects.current.characters[index] = character;
      console.log(`Character ${index} added to scene`);
    }
  }, []);

  // Remove character from scene
  const removeCharacterFromScene = useCallback((index) => {
    const character = threeObjects.current.characters[index];
    if (threeObjects.current.scene && character) {
      threeObjects.current.scene.remove(character);
      console.log(`Character ${index} removed from scene`);
      threeObjects.current.characters[index] = null
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

  // Add bone helper to visualize skeleton
  const addBoneHelper = useCallback((character, index) => {
    if (!threeObjects.current.scene || !character) return;

    // Remove existing bone helper if present
    removeBoneHelper(index);

    // Find the skeleton in the character
    let skeleton = null;
    character.traverse((child) => {
      if (child.isSkinnedMesh && child.skeleton) {
        skeleton = child.skeleton;
      }
    });

    if (skeleton) {
      const boneHelper = new THREE.SkeletonHelper(character);
      boneHelper.material.linewidth = 2;

      // Use VertexColors to allow per-bone coloring
      boneHelper.material.vertexColors = true;
      boneHelper.material.needsUpdate = true;

      threeObjects.current.scene.add(boneHelper);
      threeObjects.current.boneHelpers[index] = boneHelper;

      // Initialize colors (red by default)
      updateBoneHelperColors(index);

      console.log(`Bone helper ${index} added to scene`);
    } else {
      console.warn(`No skeleton found in character ${index}`);
    }
  }, []);

  // Remove bone helper from scene
  const removeBoneHelper = useCallback((index) => {
    const boneHelper = threeObjects.current.boneHelpers[index];
    if (threeObjects.current.scene && boneHelper) {
      threeObjects.current.scene.remove(boneHelper);
      if (boneHelper.geometry) boneHelper.geometry.dispose();
      if (boneHelper.material) boneHelper.material.dispose();
      threeObjects.current.boneHelpers[index] = null;
      threeObjects.current.highlightedBoneNames[index] = null;
      console.log(`Bone helper ${index} removed from scene`);
    }
  }, []);

  // Get bone helper reference
  const getBoneHelper = useCallback((index) => {
    return threeObjects.current.boneHelpers[index];
  }, []);

  // Update bone helper colors based on highlighted bone
  const updateBoneHelperColors = useCallback((index) => {
    const boneHelper = threeObjects.current.boneHelpers[index];
    const character = threeObjects.current.characters[index];
    const highlightedBoneName = threeObjects.current.highlightedBoneNames[index];

    if (!boneHelper || !character) return;

    const geometry = boneHelper.geometry;
    const colors = [];

    // Build a map of bone names to their indices in the skeleton helper
    const bones = [];
    character.traverse((child) => {
      if (child.isBone) {
        bones.push(child);
      }
    });

    // Color each line segment
    const positions = geometry.attributes.position;
    const numVertices = positions.count;

    for (let i = 0; i < numVertices; i += 2) {
      // Each pair of vertices forms a line (bone)
      // Get the bone index from the skeleton helper
      const boneIndex = Math.floor(i / 2);

      let color;
      if (highlightedBoneName && bones[boneIndex] && bones[boneIndex].name === highlightedBoneName) {
        // Cyan for highlighted bone
        color = new THREE.Color(0x00ffff);
      } else {
        // Red for all other bones
        color = new THREE.Color(0xff0000);
      }

      // Add color for both vertices of the line segment
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
  }, []);

  // Highlight a specific bone by coloring it in the skeleton helper
  const highlightBone = useCallback((characterIndex, boneName) => {
    // Store the highlighted bone name
    threeObjects.current.highlightedBoneNames[characterIndex] = boneName;

    // Update the bone helper colors
    updateBoneHelperColors(characterIndex);

    if (boneName) {
      console.log(`Highlighted bone: ${boneName} at character ${characterIndex}`);
    }
  }, [updateBoneHelperColors]);

  // Remove highlighted bone
  const removeHighlightedBone = useCallback((index) => {
    threeObjects.current.highlightedBoneNames[index] = null;
    updateBoneHelperColors(index);
    console.log(`Removed highlighted bone for character ${index}`);
  }, [updateBoneHelperColors]);

  // Update highlighted bone position (no longer needed with direct coloring)
  const updateHighlightedBone = useCallback((index) => {
    // No-op now since we're coloring the skeleton helper directly
    // The skeleton helper automatically updates with the bones
  }, []);

  return {
    threeObjects: threeObjects.current,
    startAnimationLoop,
    stopAnimationLoop,
    updateAnimationCallback,
    addCharacterToScene,
    removeCharacterFromScene,
    getCharacter,
    addBoneHelper,
    removeBoneHelper,
    getBoneHelper,
    highlightBone,
    removeHighlightedBone,
    updateHighlightedBone,
    setAnimationAction,
    getAnimationAction,
    setAnimation,
    getAllAnimationActions,
    resetClock,
  };
}