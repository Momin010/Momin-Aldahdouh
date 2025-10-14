import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import type { Message } from '../types';

interface MessageContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  message: Message | null;
  messageIndex: number;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  visible, x, y, message, onClose, onDelete, onEdit
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };
      // A small timeout to prevent the same click that opened the menu from closing it
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 10);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [visible, onClose]);

  if (!visible || !message) {
    return null;
  }

  const menuStyle: React.CSSProperties = {
    top: `${y}px`,
    left: `${x}px`,
    position: 'fixed',
    transform: 'translate(10px, 10px)', // Offset from cursor
  };

  // Adjust position if it overflows the viewport
  if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      if (x + menuRect.width > window.innerWidth) {
          menuStyle.left = `${x - menuRect.width - 10}px`;
      }
      if (y + menuRect.height > window.innerHeight) {
          menuStyle.top = `${y - menuRect.height - 10}px`;
      }
  }

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="z-50 w-48 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 animate-scaleIn"
      onClick={e => e.stopPropagation()}
    >
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-white/10 transition-colors"
          >
            <Icon name="edit" className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </li>
        <li>
          <button
            onClick={() => handleAction(onDelete)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 rounded-md hover:bg-red-500/20 transition-colors"
          >
            <Icon name="trash" className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default MessageContextMenu;
