// components/FBXViewer/CharacterPanel.jsx
import React, { useState } from 'react';

export default function CharacterPanel({
  fileNames,
  fbxFiles,
  showCharacter,
  characterScales,
  loadingProgress,
  animationDetails,
  isPanelCollapsed,
  onFileSelection,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCharacterVisibility,
  onUnloadCharacter,
  onScaleChange,
}) {
  const [expandedCharacter, setExpandedCharacter] = useState([true, true]); // Both expanded by default

  // Check if loading for each character individually - with safe array access
  const isLoadingCharacter1 = loadingProgress?.[0]?.isLoading || false;
  const isLoadingCharacter2 = loadingProgress?.[1]?.isLoading || false;

  const toggleCharacterExpanded = (index) => {
    setExpandedCharacter(prev => {
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  };

  // Debug: Log the animationDetails prop
  console.log('CharacterPanel received animationDetails:', animationDetails);

  return (
    <div className={`character-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h2>Characters</h2>
      </div>
      
      {!isPanelCollapsed && (
        <div className="panel-content">
          <div className="character-section">
            <div 
              className="character-toggle-header"
              onClick={() => toggleCharacterExpanded(0)}
            >
              <span className={`toggle-arrow ${expandedCharacter[0] ? 'expanded' : ''}`}>
                ▶
              </span>
              <h3>Character 1</h3>
              {fbxFiles[0] && (
                <span className="character-status">●</span>
              )}
            </div>
            
            {expandedCharacter[0] && (
              <div className="character-details">
                <div 
                  className="file-drop-area"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, 0)}
                >
                  {fbxFiles[0] && (
                    <button 
                      className="unload-button-overlay"
                      onClick={() => onUnloadCharacter(0)}
                      title="Unload character"
                    >
                      ✕
                    </button>
                  )}
                  <input
                    type="file"
                    id="file-input-0"
                    className="file-input-hidden"
                    accept=".fbx"
                    onChange={(e) => onFileSelection(e, 0)}
                  />
                  <label htmlFor="file-input-0" className="file-input-label">
                    <span className="file-input-name">
                      {isLoadingCharacter1 ? "Loading..." : fileNames[0]}
                    </span>
                    {!fbxFiles[0] && !isLoadingCharacter1 && (
                      <span className="file-drop-message">drag and drop</span>
                    )}
                  </label>
                </div>
                
                {/* Controls - only show when file is loaded and not loading */}
                {fbxFiles[0] && !isLoadingCharacter1 && (
                  <div className="character-controls">
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="show-character-1"
                        checked={showCharacter[0]}
                        onChange={() => onToggleCharacterVisibility(0)}
                      />
                      <label htmlFor="show-character-1">Show</label>
                    </div>
                    
                    <div className="scale-control">
                      <label htmlFor="scale-1">Scale: {characterScales[0].toFixed(2)}</label>
                      <input
                        type="range"
                        id="scale-1"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={characterScales[0]}
                        onChange={(e) => onScaleChange(0, parseFloat(e.target.value))}
                        className="scale-slider"
                      />
                    </div>
                  </div>
                )}

                {/* Animation details - only show when loaded and has animation data */}
                {fbxFiles[0] && !isLoadingCharacter1 && animationDetails?.[0] && (
                  <div className="animation-details">
                    <h4>Animation Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{animationDetails[0].name || 'Unnamed'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{animationDetails[0].duration.toFixed(2)}s</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Frames:</span>
                      <span className="detail-value">{animationDetails[0].totalFrames}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">FPS:</span>
                      <span className="detail-value">{animationDetails[0].fps}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Tracks:</span>
                      <span className="detail-value">{animationDetails[0].trackCount}</span>
                    </div>
                  </div>
                )}

                {/* Debug info - remove this later */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
                    Debug: fbxFiles[0]={fbxFiles[0] ? 'YES' : 'NO'}, 
                    loading={isLoadingCharacter1 ? 'YES' : 'NO'}, 
                    animDetails={animationDetails?.[0] ? 'YES' : 'NO'}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="character-section">
            <div 
              className="character-toggle-header"
              onClick={() => toggleCharacterExpanded(1)}
            >
              <span className={`toggle-arrow ${expandedCharacter[1] ? 'expanded' : ''}`}>
                ▶
              </span>
              <h3>Character 2</h3>
              {fbxFiles[1] && (
                <span className="character-status">●</span>
              )}
            </div>
            
            {expandedCharacter[1] && (
              <div className="character-details">
                <div 
                  className="file-drop-area"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, 1)}
                >
                  {fbxFiles[1] && (
                    <button 
                      className="unload-button-overlay"
                      onClick={() => onUnloadCharacter(1)}
                      title="Unload character"
                    >
                      ✕
                    </button>
                  )}
                  <input
                    type="file"
                    id="file-input-1"
                    className="file-input-hidden"
                    accept=".fbx"
                    onChange={(e) => onFileSelection(e, 1)}
                  />
                  <label htmlFor="file-input-1" className="file-input-label">
                    <span className="file-input-name">
                      {isLoadingCharacter2 ? "Loading..." : fileNames[1]}
                    </span>
                    {!fbxFiles[1] && !isLoadingCharacter2 && (
                      <span className="file-drop-message">drag and drop</span>
                    )}
                  </label>
                </div>
                
                {/* Controls - only show when file is loaded and not loading */}
                {fbxFiles[1] && !isLoadingCharacter2 && (
                  <div className="character-controls">
                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="show-character-2"
                        checked={showCharacter[1]}
                        onChange={() => onToggleCharacterVisibility(1)}
                      />
                      <label htmlFor="show-character-2">Show</label>
                    </div>
                    
                    <div className="scale-control">
                      <label htmlFor="scale-2">Scale: {characterScales[1].toFixed(2)}</label>
                      <input
                        type="range"
                        id="scale-2"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={characterScales[1]}
                        onChange={(e) => onScaleChange(1, parseFloat(e.target.value))}
                        className="scale-slider"
                      />
                    </div>
                  </div>
                )}

                {/* Animation details - only show when loaded and has animation data */}
                {fbxFiles[1] && !isLoadingCharacter2 && animationDetails?.[1] && (
                  <div className="animation-details">
                    <h4>Animation Details</h4>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{animationDetails[1].name || 'Unnamed'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{animationDetails[1].duration.toFixed(2)}s</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Total Frames:</span>
                      <span className="detail-value">{animationDetails[1].totalFrames}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">FPS:</span>
                      <span className="detail-value">{animationDetails[1].fps}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Tracks:</span>
                      <span className="detail-value">{animationDetails[1].trackCount}</span>
                    </div>
                  </div>
                )}

                {/* Debug info - remove this later */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
                    Debug: fbxFiles[1]={fbxFiles[1] ? 'YES' : 'NO'}, 
                    loading={isLoadingCharacter2 ? 'YES' : 'NO'}, 
                    animDetails={animationDetails?.[1] ? 'YES' : 'NO'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}