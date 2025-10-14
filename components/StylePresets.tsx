import React from 'react';

interface StylePreset {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  effects: {
    blur: string;
    shadow: string;
    borderRadius: string;
    gradient: string;
  };
  example: string;
}

interface StylePresetsProps {
  onApplyPreset: (preset: StylePreset) => void;
  currentPreset?: string;
  className?: string;
}

const StylePresets: React.FC<StylePresetsProps> = ({
  onApplyPreset,
  currentPreset,
  className = ''
}) => {
  const presets: StylePreset[] = [
    {
      id: 'glassmorphism',
      name: 'Glassmorphism',
      description: 'Frosted glass effect with transparency and depth',
      preview: '🪟',
      colors: {
        primary: 'rgba(147, 51, 234, 0.8)',
        secondary: 'rgba(59, 130, 246, 0.7)',
        accent: 'rgba(34, 197, 94, 0.8)',
        background: 'rgba(0, 0, 0, 0.85)',
        surface: 'rgba(255, 255, 255, 0.1)',
        text: '#ffffff',
        textMuted: 'rgba(255, 255, 255, 0.7)'
      },
      effects: {
        blur: 'backdrop-blur-lg',
        shadow: 'shadow-2xl',
        borderRadius: 'rounded-2xl',
        gradient: 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20'
      },
      example: 'Modern, translucent interfaces with depth and blur effects'
    },
    {
      id: 'claymorphism',
      name: 'Claymorphism',
      description: 'Soft, puffy elements that appear like clay',
      preview: '🏺',
      colors: {
        primary: 'rgb(244, 114, 182)',
        secondary: 'rgb(168, 85, 247)',
        accent: 'rgb(34, 197, 94)',
        background: 'rgb(243, 244, 246)',
        surface: 'rgb(255, 255, 255)',
        text: 'rgb(31, 41, 55)',
        textMuted: 'rgb(107, 114, 128)'
      },
      effects: {
        blur: '',
        shadow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_0_rgba(0,0,0,0.05)]',
        borderRadius: 'rounded-3xl',
        gradient: 'bg-gradient-to-br from-pink-200 to-purple-200'
      },
      example: 'Playful, soft, and tactile interfaces with pastel colors'
    },
    {
      id: 'neumorphism',
      name: 'Neumorphism',
      description: 'Soft, extruded elements that appear to push through the surface',
      preview: '🔘',
      colors: {
        primary: 'rgb(168, 85, 247)',
        secondary: 'rgb(59, 130, 246)',
        accent: 'rgb(34, 197, 94)',
        background: 'rgb(241, 245, 249)',
        surface: 'rgb(248, 250, 252)',
        text: 'rgb(51, 65, 85)',
        textMuted: 'rgb(100, 116, 139)'
      },
      effects: {
        blur: '',
        shadow: 'shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]',
        borderRadius: 'rounded-2xl',
        gradient: 'bg-gradient-to-br from-slate-50 to-slate-100'
      },
      example: 'Subtle, physical, and tactile interfaces with soft shadows'
    },
    {
      id: 'material',
      name: 'Material Design',
      description: 'Google\'s material design with elevation and bold colors',
      preview: '📱',
      colors: {
        primary: 'rgb(63, 81, 181)',
        secondary: 'rgb(33, 150, 243)',
        accent: 'rgb(255, 193, 7)',
        background: 'rgb(250, 250, 250)',
        surface: 'rgb(255, 255, 255)',
        text: 'rgb(33, 33, 33)',
        textMuted: 'rgb(117, 117, 117)'
      },
      effects: {
        blur: '',
        shadow: 'shadow-lg',
        borderRadius: 'rounded-lg',
        gradient: 'bg-gradient-to-br from-indigo-500 to-cyan-500'
      },
      example: 'Clean, hierarchical, and responsive interfaces with elevation'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Neon colors with dark backgrounds and futuristic aesthetics',
      preview: '⚡',
      colors: {
        primary: 'rgb(236, 72, 153)',
        secondary: 'rgb(34, 211, 238)',
        accent: 'rgb(168, 85, 247)',
        background: 'rgb(15, 23, 42)',
        surface: 'rgb(30, 41, 59)',
        text: 'rgb(248, 250, 252)',
        textMuted: 'rgb(148, 163, 184)'
      },
      effects: {
        blur: 'backdrop-blur-sm',
        shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
        borderRadius: 'rounded-xl',
        gradient: 'bg-gradient-to-br from-pink-500/30 to-cyan-500/30'
      },
      example: 'Dark, neon, and futuristic interfaces with glowing effects'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, simple, and elegant with plenty of whitespace',
      preview: '⚪',
      colors: {
        primary: 'rgb(99, 102, 241)',
        secondary: 'rgb(156, 163, 175)',
        accent: 'rgb(34, 197, 94)',
        background: 'rgb(255, 255, 255)',
        surface: 'rgb(249, 250, 251)',
        text: 'rgb(17, 24, 39)',
        textMuted: 'rgb(107, 114, 128)'
      },
      effects: {
        blur: '',
        shadow: 'shadow-sm',
        borderRadius: 'rounded-lg',
        gradient: 'bg-gradient-to-br from-slate-50 to-gray-50'
      },
      example: 'Clean, simple, and elegant interfaces with plenty of whitespace'
    }
  ];

  const applyPresetToCSS = (preset: StylePreset) => {
    const root = document.documentElement;
    Object.entries(preset.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply common classes
    const bodyClasses = [
      preset.effects.blur,
      preset.effects.shadow,
      preset.effects.borderRadius
    ].filter(Boolean).join(' ');

    document.body.className = bodyClasses;

    onApplyPreset(preset);
  };

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Style Presets</h2>
        <p className="text-gray-400 text-sm">
          Apply beautiful design themes to instantly transform your application's appearance
        </p>
      </div>

      {/* Presets Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map(preset => (
            <div
              key={preset.id}
              className={`bg-white/5 rounded-xl border-2 transition-all cursor-pointer group ${
                currentPreset === preset.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/10'
              }`}
              onClick={() => applyPresetToCSS(preset)}
            >
              {/* Preview Card */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{preset.preview}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{preset.name}</h3>
                    {currentPreset === preset.id && (
                      <span className="text-xs text-purple-400">Active</span>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                  {preset.description}
                </p>

                {/* Color Palette */}
                <div className="flex gap-1 mb-3">
                  {Object.entries(preset.colors).slice(0, 5).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: color }}
                      title={`${key}: ${color}`}
                    />
                  ))}
                </div>

                {/* Example */}
                <div className={`p-3 rounded-lg text-xs ${preset.effects.gradient} border border-white/10`}>
                  <div className="text-white font-semibold mb-1">Example</div>
                  <div className="text-gray-300">{preset.example}</div>
                </div>

                {/* Apply Button */}
                <button className={`w-full mt-3 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                  currentPreset === preset.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}>
                  {currentPreset === preset.id ? 'Applied' : 'Apply Style'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Style Editor */}
      <div className="p-6 border-t border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Custom Style Editor</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary Color */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Primary</label>
            <input
              type="color"
              defaultValue="#9333ea"
              className="w-full h-10 rounded bg-transparent border border-white/20"
              onChange={(e) => {
                document.documentElement.style.setProperty('--color-primary', e.target.value);
              }}
            />
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Secondary</label>
            <input
              type="color"
              defaultValue="#3b82f6"
              className="w-full h-10 rounded bg-transparent border border-white/20"
              onChange={(e) => {
                document.documentElement.style.setProperty('--color-secondary', e.target.value);
              }}
            />
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Accent</label>
            <input
              type="color"
              defaultValue="#22c55e"
              className="w-full h-10 rounded bg-transparent border border-white/20"
              onChange={(e) => {
                document.documentElement.style.setProperty('--color-accent', e.target.value);
              }}
            />
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Border Radius</label>
            <input
              type="range"
              min="0"
              max="50"
              defaultValue="16"
              className="w-full"
              onChange={(e) => {
                document.documentElement.style.setProperty('--border-radius', e.target.value + 'px');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylePresets;