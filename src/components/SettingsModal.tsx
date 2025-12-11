import React from 'react';
import { X, Volume2, Zap, RotateCcw } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleMusicVolumeChange = (_event: Event, newValue: number | number[]) => {
    const volume = Array.isArray(newValue) ? newValue[0] : newValue;
    updateSettings({ musicVolume: volume });
  };

  const handleAnimationIntensityChange = (_event: Event, newValue: number | number[]) => {
    const intensity = Array.isArray(newValue) ? newValue[0] : newValue;
    updateSettings({ animationIntensity: intensity });
  };

  const handleReset = () => {
    resetSettings();
  };

  const getVolumePercentage = (value: number) => {
    return Math.round(value * 100);
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-8">
            {/* Music Volume Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Music Volume</h3>
              </div>
              
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => handleMusicVolumeChange(e, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span>{getVolumePercentage(settings.musicVolume)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Animation Intensity Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Animation Intensity</h3>
              </div>
              
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.animationIntensity}
                  onChange={(e) => handleAnimationIntensityChange(e, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Off</span>
                  <span>{getVolumePercentage(settings.animationIntensity)}%</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;