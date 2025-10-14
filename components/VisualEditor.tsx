import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface VisualEditorProps {
  htmlContent: string;
  onContentChange: (content: string) => void;
  className?: string;
  isEditMode?: boolean;
  onEditModeChange?: (enabled: boolean) => void;
}

interface ElementData {
  id: string;
  tag: string;
  content: string;
  styles: Record<string, string>;
  position: { x: number; y: number; width: number; height: number };
}

const VisualEditor: React.FC<VisualEditorProps> = ({
  htmlContent,
  onContentChange,
  className = '',
  isEditMode = false,
  onEditModeChange
}) => {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [elements, setElements] = useState<ElementData[]>([]);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (htmlContent && editorRef.current) {
      editorRef.current.innerHTML = htmlContent;
      extractElements();
    }
  }, [htmlContent]);

  const extractElements = () => {
    if (!editorRef.current) return;

    const elementsData: ElementData[] = [];
    const walker = document.createTreeWalker(
      editorRef.current,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      const element = node as Element;
      if (element.tagName !== 'DIV' || !element.innerHTML.trim()) continue;

      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        elementsData.push({
          id: `elem_${Date.now()}_${Math.random()}`,
          tag: element.tagName.toLowerCase(),
          content: element.innerHTML,
          styles: extractStyles(element),
          position: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          }
        });
      }
    }

    setElements(elementsData);
  };

  const extractStyles = (element: Element): Record<string, string> => {
    const computedStyle = window.getComputedStyle(element);
    const styles: Record<string, string> = {};

    // Extract key styles
    const styleProps = [
      'backgroundColor', 'color', 'fontSize', 'fontWeight', 'padding',
      'margin', 'borderRadius', 'border', 'boxShadow', 'display',
      'flexDirection', 'justifyContent', 'alignItems', 'width', 'height'
    ];

    styleProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'none' && value !== '0px') {
        styles[prop] = value;
      }
    });

    return styles;
  };

  const handleElementClick = (e: React.MouseEvent, elementData: ElementData) => {
    e.stopPropagation();
    setSelectedElement(elementData);
    setEditPanelOpen(true);
  };

  const handleContentEdit = (newContent: string) => {
    if (!selectedElement) return;

    const updatedElements = elements.map(elem =>
      elem.id === selectedElement.id
        ? { ...elem, content: newContent }
        : elem
    );

    setElements(updatedElements);

    // Update the actual HTML
    if (editorRef.current) {
      const element = editorRef.current.querySelector(`[data-element-id="${selectedElement.id}"]`) as HTMLElement;
      if (element) {
        element.innerHTML = newContent;
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleStyleChange = (property: string, value: string) => {
    if (!selectedElement) return;

    const updatedStyles = { ...selectedElement.styles, [property]: value };
    const updatedElement = { ...selectedElement, styles: updatedStyles };

    setSelectedElement(updatedElement);

    const updatedElements = elements.map(elem =>
      elem.id === selectedElement.id ? updatedElement : elem
    );

    setElements(updatedElements);

    // Apply styles to actual element
    if (editorRef.current) {
      const element = editorRef.current.querySelector(`[data-element-id="${selectedElement.id}"]`) as HTMLElement;
      if (element) {
        Object.entries(updatedStyles).forEach(([prop, val]) => {
          element.style.setProperty(prop, val);
        });
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  const renderElementOverlay = (elementData: ElementData) => {
    const isSelected = selectedElement?.id === elementData.id;

    return (
      <div
        key={elementData.id}
        className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-purple-500 ring-opacity-100' : 'ring-1 ring-purple-500 ring-opacity-0 hover:ring-opacity-50'
        }`}
        style={{
          left: elementData.position.x,
          top: elementData.position.y,
          width: elementData.position.width,
          height: elementData.position.height,
          zIndex: isSelected ? 10 : 5
        }}
        onClick={(e) => handleElementClick(e, elementData)}
        data-element-id={elementData.id}
      >
        {/* Element label */}
        <div className={`absolute -top-6 left-0 text-xs px-2 py-1 rounded text-white ${
          isSelected ? 'bg-purple-600' : 'bg-gray-700'
        }`}>
          {elementData.tag.toUpperCase()}
        </div>

        {/* Resize handles */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full cursor-nw-resize"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full cursor-ne-resize"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full cursor-sw-resize"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full cursor-se-resize"></div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Instructions */}
      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="edit" className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Visual Editor</h3>
        </div>
        <p className="text-sm text-gray-300">
          Click on any element in the preview below to edit its content and styles. Use the panel that appears to make changes.
        </p>
      </div>

      {/* Preview Area */}
      <div className="relative">
        <div
          ref={editorRef}
          className={`min-h-[500px] bg-white/5 backdrop-blur-xl rounded-xl border-2 border-dashed transition-colors ${
            isEditMode
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-white/20'
          } p-4 overflow-auto`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />

        {/* Element Overlays */}
        {isEditMode && elements.map(renderElementOverlay)}

        {/* Edit Panel */}
        {isEditMode && selectedElement && (
          <div className="absolute top-0 right-0 w-80 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <h3 className="text-lg font-bold text-white mb-4">Edit Element</h3>

            {/* Content Editor */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Content
              </label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => handleContentEdit(e.target.value)}
                className="w-full h-24 bg-white/10 backdrop-blur-xl rounded-lg p-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20"
                placeholder="Edit HTML content..."
              />
            </div>

            {/* Style Controls */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Quick Styles</h4>

              {/* Background Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Background</label>
                <input
                  type="color"
                  value={selectedElement.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-full h-8 rounded bg-transparent border border-white/20"
                />
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                <input
                  type="color"
                  value={selectedElement.styles.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="w-full h-8 rounded bg-transparent border border-white/20"
                />
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Border Radius</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={parseInt(selectedElement.styles.borderRadius || '0px')}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value + 'px')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isEditMode && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-sm text-purple-300">
            💡 Click on any element to select and edit it. Use the panel on the right to modify styles and content.
          </p>
        </div>
      )}
    </div>
  );
};

export default VisualEditor;