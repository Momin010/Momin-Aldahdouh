import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';
import type { PreviewElement, PreviewChange, VisualEditorState } from '../types';

interface PreviewVisualEditorProps {
  htmlContent: string;
  onPreviewEdit: (change: PreviewChange) => void;
  isEnabled: boolean;
}

const PreviewVisualEditor: React.FC<PreviewVisualEditorProps> = ({
  htmlContent,
  onPreviewEdit,
  isEnabled
}) => {
  const [editorState, setEditorState] = useState<VisualEditorState>({
    isEnabled: false,
    hoveredElement: null,
    selectedElement: null,
    isEditing: false
  });

  const [elements, setElements] = useState<PreviewElement[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Parse HTML content and create element tree
  const parseHtmlToElements = useCallback((html: string): PreviewElement[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements: PreviewElement[] = [];

    const traverse = (node: Element, parentId = 'root'): PreviewElement[] => {
      const childElements: PreviewElement[] = [];

      Array.from(node.children).forEach((child, index) => {
        const elementId = `${parentId}-${child.tagName.toLowerCase()}-${index}`;
        const rect = child.getBoundingClientRect();

        const element: PreviewElement = {
          id: elementId,
          tagName: child.tagName.toLowerCase(),
          className: child.className || '',
          textContent: child.textContent?.trim() || '',
          styles: {},
          attributes: {},
          children: traverse(child, elementId),
          rect
        };

        // Extract computed styles
        const computedStyle = window.getComputedStyle(child);
        ['fontFamily', 'fontSize', 'color', 'backgroundColor', 'width', 'height'].forEach(prop => {
          element.styles[prop] = computedStyle.getPropertyValue(prop.toLowerCase().replace(/([A-Z])/g, '-$1'));
        });

        // Extract attributes
        Array.from(child.attributes).forEach(attr => {
          element.attributes[attr.name] = attr.value;
        });

        childElements.push(element);
      });

      return childElements;
    };

    return traverse(doc.body);
  }, []);

  // Update elements when HTML content changes
  useEffect(() => {
    if (htmlContent && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.body.innerHTML = htmlContent;
        setElements(parseHtmlToElements(htmlContent));
      }
    }
  }, [htmlContent, parseHtmlToElements]);

  // Handle mouse events in iframe
  useEffect(() => {
    if (!isEnabled || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument;

    if (!iframeDoc) return;

    const handleMouseOver = (e: MouseEvent) => {
      if (isResizing) return;

      const target = e.target as Element;
      if (target && target !== iframeDoc.body) {
        e.preventDefault();
        e.stopPropagation();

        const rect = target.getBoundingClientRect();
        const element: PreviewElement = {
          id: `hover-${Date.now()}`,
          tagName: target.tagName.toLowerCase(),
          className: target.className || '',
          textContent: target.textContent?.trim() || '',
          styles: {},
          attributes: {},
          children: [],
          rect
        };

        setEditorState(prev => ({ ...prev, hoveredElement: element }));
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (isResizing) return;
      setEditorState(prev => ({ ...prev, hoveredElement: null }));
    };

    const handleClick = (e: MouseEvent) => {
      if (isResizing) return;

      const target = e.target as Element;
      if (target && target !== iframeDoc.body) {
        e.preventDefault();
        e.stopPropagation();

        const rect = target.getBoundingClientRect();
        const element: PreviewElement = {
          id: `selected-${Date.now()}`,
          tagName: target.tagName.toLowerCase(),
          className: target.className || '',
          textContent: target.textContent?.trim() || '',
          styles: {},
          attributes: {},
          children: [],
          rect
        };

        setEditorState(prev => ({
          ...prev,
          selectedElement: element,
          isEditing: true
        }));
      }
    };

    iframeDoc.addEventListener('mouseover', handleMouseOver, true);
    iframeDoc.addEventListener('mouseout', handleMouseOut, true);
    iframeDoc.addEventListener('click', handleClick, true);

    return () => {
      iframeDoc.removeEventListener('mouseover', handleMouseOver, true);
      iframeDoc.removeEventListener('mouseout', handleMouseOut, true);
      iframeDoc.removeEventListener('click', handleClick, true);
    };
  }, [isEnabled, isResizing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditorState(prev => ({
          ...prev,
          selectedElement: null,
          isEditing: false
        }));
        setIsResizing(false);
        setResizeStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle resize functionality
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editorState.selectedElement) return;

    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: editorState.selectedElement.rect.width,
      height: editorState.selectedElement.rect.height
    });
  }, [editorState.selectedElement]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeStart || !editorState.selectedElement) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const newWidth = Math.max(50, resizeStart.width + deltaX);
    const newHeight = Math.max(20, resizeStart.height + deltaY);

    // Update the selected element's rect for visual feedback
    setEditorState(prev => {
      if (!prev.selectedElement) return prev;

      const updatedElement = {
        ...prev.selectedElement,
        rect: new DOMRect(
          prev.selectedElement.rect.left,
          prev.selectedElement.rect.top,
          newWidth,
          newHeight
        )
      };

      return { ...prev, selectedElement: updatedElement };
    });
  }, [isResizing, resizeStart, editorState.selectedElement]);

  const handleResizeEnd = useCallback(() => {
    if (!isResizing || !editorState.selectedElement || !resizeStart) return;

    const finalRect = editorState.selectedElement.rect;

    // Emit resize changes
    onPreviewEdit({
      elementId: editorState.selectedElement.id,
      type: 'style',
      property: 'width',
      value: `${finalRect.width}px`,
      oldValue: `${resizeStart.width}px`
    });

    onPreviewEdit({
      elementId: editorState.selectedElement.id,
      type: 'style',
      property: 'height',
      value: `${finalRect.height}px`,
      oldValue: `${resizeStart.height}px`
    });

    setIsResizing(false);
    setResizeStart(null);
  }, [isResizing, editorState.selectedElement, resizeStart, onPreviewEdit]);

  // Add global mouse event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleTextChange = (newText: string) => {
    if (editorState.selectedElement) {
      onPreviewEdit({
        elementId: editorState.selectedElement.id,
        type: 'text',
        property: 'textContent',
        value: newText,
        oldValue: editorState.selectedElement.textContent
      });
    }
  };

  const handleStyleChange = (property: string, value: string) => {
    if (editorState.selectedElement) {
      onPreviewEdit({
        elementId: editorState.selectedElement.id,
        type: 'style',
        property,
        value,
        oldValue: editorState.selectedElement.styles[property]
      });
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Hover overlay */}
      {editorState.hoveredElement && !isResizing && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
          style={{
            left: editorState.hoveredElement.rect.left,
            top: editorState.hoveredElement.rect.top,
            width: editorState.hoveredElement.rect.width,
            height: editorState.hoveredElement.rect.height,
            transition: 'all 0.2s ease-out'
          }}
        >
          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {editorState.hoveredElement.tagName}
          </div>
        </div>
      )}

      {/* Selected element overlay */}
      {editorState.selectedElement && (
        <div
          className="absolute border-2 border-green-400 bg-green-400/10"
          style={{
            left: editorState.selectedElement.rect.left,
            top: editorState.selectedElement.rect.top,
            width: editorState.selectedElement.rect.width,
            height: editorState.selectedElement.rect.height,
            transition: isResizing ? 'none' : 'all 0.2s ease-out'
          }}
        >
          {/* Resize handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full cursor-nw-resize pointer-events-auto hover:bg-green-600"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full cursor-ne-resize pointer-events-auto hover:bg-green-600"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full cursor-sw-resize pointer-events-auto hover:bg-green-600"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full cursor-se-resize pointer-events-auto hover:bg-green-600"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />

          {/* Element label */}
          <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
            {editorState.selectedElement.tagName} (editing)
          </div>
        </div>
      )}

      {/* Edit toolbar */}
      {editorState.isEditing && editorState.selectedElement && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-auto max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="edit" className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Edit Element</span>
          </div>

          {/* Text editing */}
          {editorState.selectedElement.textContent && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Content</label>
              <textarea
                value={editorState.selectedElement.textContent}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                rows={2}
                placeholder="Enter text content..."
              />
            </div>
          )}

          {/* Font controls */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select
                value={editorState.selectedElement.styles.fontFamily || 'Arial'}
                onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
              <input
                type="number"
                value={parseInt(editorState.selectedElement.styles.fontSize || '16')}
                onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="8"
                max="72"
              />
            </div>
          </div>

          {/* Color controls */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={editorState.selectedElement.styles.color || '#000000'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
              <input
                type="color"
                value={editorState.selectedElement.styles.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Size controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
              <input
                type="number"
                value={Math.round(editorState.selectedElement.rect.width)}
                onChange={(e) => handleStyleChange('width', `${e.target.value}px`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="10"
                max="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
              <input
                type="number"
                value={Math.round(editorState.selectedElement.rect.height)}
                onChange={(e) => handleStyleChange('height', `${e.target.value}px`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="10"
                max="2000"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Drag the green circles to resize. Press Esc to exit edit mode.
            </p>
          </div>
        </div>
      )}

      {/* Hidden iframe for DOM manipulation */}
      <iframe
        ref={iframeRef}
        className="absolute inset-0 w-full h-full pointer-events-auto opacity-0"
        style={{ zIndex: -1 }}
        title="Visual Editor DOM"
      />
    </div>
  );
};

export default PreviewVisualEditor;