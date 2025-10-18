// components/FBXViewer/CharacterPanel.jsx - Bright Modern Design with forwardRef
import React, { useState, forwardRef } from 'react';

const CharacterPanel = forwardRef(({
  fileNames,
  fbxFiles,
  showCharacter,
  showBone,
  selectedBone,
  boneList,
  characterScales,
  normalizeScale,
  loadingProgress,
  animationDetails,
  isPanelCollapsed,
  onFileSelection,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCharacterVisibility,
  onToggleBoneVisibility,
  onBoneSelection,
  onToggleNormalize,
  onUnloadCharacter,
  onScaleChange,
}, ref) => {
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

  return (
    <div ref={ref} className={`character-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
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
                      <span className="file-drop-message">Drag & drop FBX file</span>
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
                      <label htmlFor="show-character-1">Show Character</label>
                    </div>

                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="show-bone-1"
                        checked={showBone[0]}
                        onChange={() => onToggleBoneVisibility(0)}
                      />
                      <label htmlFor="show-bone-1">Show Bone</label>
                    </div>

                    {/* Bone dropdown - only show when show bone is enabled */}
                    {showBone[0] && boneList[0] && boneList[0].length > 0 && (
                      <div className="bone-select-control">
                        <label htmlFor="bone-select-1">Select Bone:</label>
                        <select
                          id="bone-select-1"
                          value={selectedBone[0] || ''}
                          onChange={(e) => onBoneSelection(0, e.target.value || null)}
                          className="bone-dropdown"
                        >
                          <option value="">-- Select a bone --</option>
                          {boneList[0].map((boneName, idx) => (
                            <option key={idx} value={boneName}>
                              {boneName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="normalize-1"
                        checked={normalizeScale[0]}
                        onChange={() => onToggleNormalize(0)}
                      />
                      <label htmlFor="normalize-1">Normalize</label>
                    </div>

                    <div className="scale-control">
                      <label htmlFor="scale-1">Scale: {characterScales[0].toFixed(2)}</label>
                      <input
                        type="range"
                        id="scale-1"
                        min="0.5"
                        max="10.0"
                        step="0.1"
                        value={characterScales[0]}
                        onChange={(e) => onScaleChange(0, parseFloat(e.target.value))}
                        className="scale-slider"
                        disabled={normalizeScale[0]}
                      />
                    </div>
                  </div>
                )}

                {/* Animation details - only show when loaded and has animation data */}
                {fbxFiles[0] && !isLoadingCharacter1 && animationDetails?.[0] && (
                  <div className="animation-details">
                    <h4>Animation Info</h4>
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
                      <span className="file-drop-message">Drag & drop FBX file</span>
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
                      <label htmlFor="show-character-2">Show Character</label>
                    </div>

                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="show-bone-2"
                        checked={showBone[1]}
                        onChange={() => onToggleBoneVisibility(1)}
                      />
                      <label htmlFor="show-bone-2">Show Bone</label>
                    </div>

                    {/* Bone dropdown - only show when show bone is enabled */}
                    {showBone[1] && boneList[1] && boneList[1].length > 0 && (
                      <div className="bone-select-control">
                        <label htmlFor="bone-select-2">Select Bone:</label>
                        <select
                          id="bone-select-2"
                          value={selectedBone[1] || ''}
                          onChange={(e) => onBoneSelection(1, e.target.value || null)}
                          className="bone-dropdown"
                        >
                          <option value="">-- Select a bone --</option>
                          {boneList[1].map((boneName, idx) => (
                            <option key={idx} value={boneName}>
                              {boneName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="checkbox-container">
                      <input
                        type="checkbox"
                        id="normalize-2"
                        checked={normalizeScale[1]}
                        onChange={() => onToggleNormalize(1)}
                      />
                      <label htmlFor="normalize-2">Normalize</label>
                    </div>

                    <div className="scale-control">
                      <label htmlFor="scale-2">Scale: {characterScales[1].toFixed(2)}</label>
                      <input
                        type="range"
                        id="scale-2"
                        min="0.5"
                        max="10.0"
                        step="0.1"
                        value={characterScales[1]}
                        onChange={(e) => onScaleChange(1, parseFloat(e.target.value))}
                        className="scale-slider"
                        disabled={normalizeScale[1]}
                      />
                    </div>
                  </div>
                )}

                {/* Animation details - only show when loaded and has animation data */}
                {fbxFiles[1] && !isLoadingCharacter2 && animationDetails?.[1] && (
                  <div className="animation-details">
                    <h4>Animation Info</h4>
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

CharacterPanel.displayName = 'CharacterPanel';

export default CharacterPanel;