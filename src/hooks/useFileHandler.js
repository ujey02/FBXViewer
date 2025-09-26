// hooks/useFileHandler.js - Enhanced with unload functionality
import { useState, useCallback, useEffect } from 'react';

export function useFileHandler() {
  const [fbxFiles, setFbxFiles] = useState([null, null]);
  const [fileNames, setFileNames] = useState(['Drag and drop', 'Drag and drop']);

  // Handle file selection via input
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
    setFbxFiles(prev => {
      if (prev[index] && typeof prev[index] === 'string' && prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      
      const newFiles = [...prev];
      newFiles[index] = objectUrl;
      return newFiles;
    });
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('file-drop-hover');
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('file-drop-hover');
  }, []);
  
  // Handle drop
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
      // Revoke old URL if it exists
      if (prev[index] && typeof prev[index] === 'string' && prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      
      const newFiles = [...prev];
      newFiles[index] = objectUrl;
      return newFiles;
    });
  }, []);

  // Unload file
  const unloadFile = useCallback((index) => {
    console.log(`Unloading file at index ${index}`);
    
    // Revoke URL if it exists
    setFbxFiles(prev => {
      if (prev[index] && typeof prev[index] === 'string' && prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      
      const newFiles = [...prev];
      newFiles[index] = null;
      return newFiles;
    });
    
    // Reset file name
    setFileNames(prev => {
      const newFileNames = [...prev];
      newFileNames[index] = 'Drag and drop';
      return newFileNames;
    });
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      fbxFiles.forEach(file => {
        if (file && typeof file === 'string' && file.startsWith('blob:')) {
          URL.revokeObjectURL(file);
        }
      });
    };
  }, [fbxFiles]);

  return {
    fbxFiles,
    fileNames,
    handleFileSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    unloadFile,
  };
}