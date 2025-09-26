// components/FBXViewer/CharacterPanel.jsx
import React from 'react';

export default function CharacterPanel({
  fileNames,
  fbxFiles,
  showCharacter,
  loadingProgress,
  onFileSelection,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCharacterVisibility,
}) {
  // Calculate loading progress percentage
  const loadingPercentage = loadingProgress.total > 0 
    ? Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
    : 0;

  return (
    <div className="character-panel">
      <h2>Characters</h2>
      
      <div className="character-section">
        <h3>Character 1</h3>
        <div 
          className="file-drop-area"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 0)}
        >
          <input
            type="file"
            id="file-input-0"
            className="file-input-hidden"
            accept=".fbx"
            onChange={(e) => onFileSelection(e, 0)}
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
        
        {/* Only show checkbox if file is loaded */}
        {fbxFiles[0] && (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="show-character-1"
              checked={showCharacter[0]}
              onChange={() => onToggleCharacterVisibility(0)}
            />
            <label htmlFor="show-character-1">Show Character 1</label>
          </div>
        )}
        
        {/* Show loading progress only for character 1 */}
        {fbxFiles[0] && loadingProgress.total > 0 && loadingProgress.loaded < loadingProgress.total && (
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
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 1)}
        >
          <input
            type="file"
            id="file-input-1"
            className="file-input-hidden"
            accept=".fbx"
            onChange={(e) => onFileSelection(e, 1)}
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
        
        {/* Only show checkbox if file is loaded */}
        {fbxFiles[1] && (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="show-character-2"
              checked={showCharacter[1]}
              onChange={() => onToggleCharacterVisibility(1)}
            />
            <label htmlFor="show-character-2">Show Character 2</label>
          </div>
        )}
      </div>
      
      {/* Debug info - remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Debug: 
          <br />Files: [{fbxFiles[0] ? '✓' : '✗'}, {fbxFiles[1] ? '✓' : '✗'}]
          <br />Show: [{showCharacter[0] ? '✓' : '✗'}, {showCharacter[1] ? '✓' : '✗'}]
        </div>
      )}
    </div>
  );
}