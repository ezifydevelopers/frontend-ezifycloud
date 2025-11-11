import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Smile,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './EmojiPicker';
import { MentionPicker } from './MentionPicker';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onAttachFile?: () => void;
  onInsertEmoji?: () => void;
  disabled?: boolean;
  className?: string;
  users?: User[]; // Users available for mentioning
  onMentionSelect?: (userIds: string[]) => void; // Callback when mentions change
}

export interface RichTextEditorRef {
  insertText: (text: string) => void;
  focus: () => void;
  getEditor: () => HTMLDivElement | null;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value,
  onChange,
  placeholder = 'Type your comment...',
  rows = 4,
  onAttachFile,
  onInsertEmoji,
  disabled = false,
  className,
  users = [],
  onMentionSelect,
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | undefined>();

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          onChange(editorRef.current.innerHTML);
        } else {
          // Insert at end if no selection
          editorRef.current.innerHTML += text;
          onChange(editorRef.current.innerHTML);
        }
      }
    },
    focus: () => {
      editorRef.current?.focus();
    },
    getEditor: () => editorRef.current,
  }));

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if content actually changed (avoid cursor jumping)
      const selection = window.getSelection();
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const cursorPosition = range ? range.startOffset : null;
      
      editorRef.current.innerHTML = value || '';
      
      // Restore cursor position if possible
      if (range && cursorPosition !== null && editorRef.current.firstChild) {
        try {
          const newRange = document.createRange();
          newRange.setStart(editorRef.current.firstChild, Math.min(cursorPosition, editorRef.current.firstChild.textContent?.length || 0));
          newRange.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && !isComposingRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);

      // Check for @ mentions
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const offset = range.startOffset;
          const textBeforeCursor = text.substring(0, offset);
          
          // Find @ mention
          const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
          
          if (mentionMatch && users.length > 0) {
            const query = mentionMatch[1].toLowerCase();
            setMentionQuery(query);
            setMentionStart(offset - query.length - 1);
            setSelectedMentionIndex(0);
            
            // Calculate position for mention picker
            const rect = range.getBoundingClientRect();
            setMentionPosition({
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX,
            });
            
            setShowMentionPicker(true);
          } else {
            setShowMentionPicker(false);
            setMentionStart(null);
          }
        } else {
          // Check if we're in a text node within the editor
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          let found = false;
          while ((node = walker.nextNode())) {
            const text = node.textContent || '';
            const mentionMatch = text.match(/@(\w*)$/);
            if (mentionMatch && users.length > 0) {
              const query = mentionMatch[1].toLowerCase();
              setMentionQuery(query);
              setSelectedMentionIndex(0);
              
              // Get position
              const range = document.createRange();
              range.selectNodeContents(node);
              const rect = range.getBoundingClientRect();
              setMentionPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
              });
              
              setShowMentionPicker(true);
              found = true;
              break;
            }
          }
          
          if (!found) {
            setShowMentionPicker(false);
            setMentionStart(null);
          }
        }
      }

      // Extract and notify about mentions
      if (onMentionSelect && users.length > 0) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
        const userIds: string[] = [];
        let match;
        
        while ((match = mentionRegex.exec(plainText)) !== null) {
          const userName = match[1];
          const user = users.find((u) => u.name === userName);
          if (user) {
            userIds.push(user.id);
          }
        }
        
        onMentionSelect([...new Set(userIds)]);
      }
    }
  };

  // Handle keyboard navigation for mentions
  useEffect(() => {
    if (!showMentionPicker || !editorRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const filtered = users.filter(
          (user) =>
            user.name.toLowerCase().includes(mentionQuery) ||
            user.email.toLowerCase().includes(mentionQuery)
        );
        setSelectedMentionIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const filtered = users.filter(
          (user) =>
            user.name.toLowerCase().includes(mentionQuery) ||
            user.email.toLowerCase().includes(mentionQuery)
        );
        if (filtered.length > 0 && selectedMentionIndex < filtered.length) {
          insertMention(filtered[selectedMentionIndex] || filtered[0]);
        }
      } else if (e.key === 'Escape') {
        setShowMentionPicker(false);
        editorRef.current?.focus();
      }
    };

    const editor = editorRef.current;
    editor.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMentionPicker, mentionQuery, selectedMentionIndex, users, insertMention]);

  const insertMention = React.useCallback((user: User) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const offset = range.startOffset;
      
      // Find the @ symbol
      const textBeforeCursor = text.substring(0, offset);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        const startPos = offset - mentionMatch[0].length;
        const endPos = offset;
        
        // Create mention span
        const mentionSpan = document.createElement('span');
        mentionSpan.className = 'mention';
        mentionSpan.setAttribute('data-user-id', user.id);
        mentionSpan.setAttribute('data-user-name', user.name);
        mentionSpan.textContent = `@${user.name}`;
        mentionSpan.style.color = '#3b82f6';
        mentionSpan.style.fontWeight = '500';
        mentionSpan.style.backgroundColor = '#eff6ff';
        mentionSpan.style.padding = '2px 4px';
        mentionSpan.style.borderRadius = '3px';
        
        // Replace text with mention
        const textRange = document.createRange();
        textRange.setStart(textNode, startPos);
        textRange.setEnd(textNode, endPos);
        textRange.deleteContents();
        textRange.insertNode(mentionSpan);
        
        // Move cursor after mention
        const newRange = document.createRange();
        newRange.setStartAfter(mentionSpan);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        // Add space after mention
        const spaceNode = document.createTextNode(' ');
        newRange.insertNode(spaceNode);
        newRange.setStartAfter(spaceNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        onChange(editorRef.current.innerHTML);
      }
    } else {
      // Handle case where cursor is not in a text node
      // Try to find the @ symbol in the editor content
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let foundNode: Node | null = null;
      let foundOffset = 0;
      let node: Node | null;
      
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        const mentionMatch = text.match(/@(\w*)$/);
        if (mentionMatch) {
          foundNode = node;
          foundOffset = text.length - mentionMatch[0].length;
          break;
        }
      }
      
      if (foundNode && foundNode.nodeType === Node.TEXT_NODE) {
        const text = foundNode.textContent || '';
        const mentionMatch = text.match(/@(\w*)$/);
        if (mentionMatch) {
          const startPos = text.length - mentionMatch[0].length;
          const endPos = text.length;
          
          // Create mention span
          const mentionSpan = document.createElement('span');
          mentionSpan.className = 'mention';
          mentionSpan.setAttribute('data-user-id', user.id);
          mentionSpan.setAttribute('data-user-name', user.name);
          mentionSpan.textContent = `@${user.name}`;
          mentionSpan.style.color = '#3b82f6';
          mentionSpan.style.fontWeight = '500';
          mentionSpan.style.backgroundColor = '#eff6ff';
          mentionSpan.style.padding = '2px 4px';
          mentionSpan.style.borderRadius = '3px';
          
          // Replace text with mention
          const textRange = document.createRange();
          textRange.setStart(foundNode, startPos);
          textRange.setEnd(foundNode, endPos);
          textRange.deleteContents();
          textRange.insertNode(mentionSpan);
          
          // Move cursor after mention
          const newRange = document.createRange();
          newRange.setStartAfter(mentionSpan);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Add space after mention
          const spaceNode = document.createTextNode(' ');
          newRange.insertNode(spaceNode);
          newRange.setStartAfter(spaceNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          onChange(editorRef.current.innerHTML);
        }
      }
    }
    
    setShowMentionPicker(false);
    setMentionStart(null);
    setMentionQuery('');
    setSelectedMentionIndex(0);
    editorRef.current?.focus();
  }, [onChange]);

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-slate-50">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => execCommand('bold')}
            title="Bold"
          >
            <Bold className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => execCommand('italic')}
            title="Italic"
          >
            <Italic className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => execCommand('underline')}
            title="Underline"
          >
            <Underline className="h-3 w-3" />
          </Button>
          <div className="w-px h-6 bg-slate-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <List className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-3 w-3" />
          </Button>
          <div className="w-px h-6 bg-slate-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={insertLink}
            title="Insert Link"
          >
            <Link className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={insertImage}
            title="Insert Image"
          >
            <ImageIcon className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {onInsertEmoji && (
            <div className="relative">
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  // Insert emoji at cursor position
                  if (editorRef.current) {
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      range.deleteContents();
                      const textNode = document.createTextNode(emoji);
                      range.insertNode(textNode);
                      range.setStartAfter(textNode);
                      range.setEndAfter(textNode);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      onChange(editorRef.current.innerHTML);
                    } else {
                      // Insert at end if no selection
                      editorRef.current.innerHTML += emoji;
                      onChange(editorRef.current.innerHTML);
                    }
                  }
                  setShowEmojiPicker(false);
                }}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    title="Insert Emoji"
                  >
                    <Smile className="h-3 w-3" />
                  </Button>
                }
              />
            </div>
          )}
          {onAttachFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onAttachFile}
              title="Attach File"
            >
              <Paperclip className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className={cn(
          'min-h-[80px] p-3 text-sm focus:outline-none',
          'prose prose-sm max-w-none',
          disabled && 'bg-slate-50 cursor-not-allowed opacity-50'
        )}
        style={{
          minHeight: `${rows * 20}px`,
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      {/* Mention Picker */}
      {showMentionPicker && users.length > 0 && (
        <MentionPicker
          open={showMentionPicker}
          query={mentionQuery}
          users={users}
          selectedIndex={selectedMentionIndex}
          onSelect={insertMention}
          onClose={() => setShowMentionPicker(false)}
          position={mentionPosition}
        />
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] p {
          margin: 0.5em 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
        }
        [contenteditable] .mention {
          color: #3b82f6;
          font-weight: 500;
          background-color: #eff6ff;
          padding: 2px 4px;
          border-radius: 3px;
          cursor: default;
        }
      `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

