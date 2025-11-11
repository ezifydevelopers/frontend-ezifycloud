import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, Lock, Sparkles } from 'lucide-react';
import { commentAPI, workspaceAPI } from '@/lib/api';
import { CreateCommentInput } from '@/types/workspace';
import { useToast } from '@/hooks/use-toast';
import { MentionInput, extractMentionedUserIds } from './MentionInput';
import { AITextGenerator } from '@/components/ai/AITextGenerator';
import { RichTextEditor } from './comments/RichTextEditor';
import { EmojiPicker } from './comments/EmojiPicker';
import { CommentFileAttachment, CommentFile } from './comments/CommentFileAttachment';

interface CommentFormProps {
  itemId: string;
  parentId?: string;
  workspaceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  itemChanges?: Record<string, unknown>;
  previousComments?: Array<{ 
    content: string; 
    author?: string;
    user?: { name: string; email?: string };
  }>;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  itemId,
  parentId,
  workspaceId,
  onSuccess,
  onCancel,
  placeholder = 'Type @ to mention someone...',
  itemChanges,
  previousComments,
}) => {
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; profilePicture?: string }>>([]);
  const [attachedFiles, setAttachedFiles] = useState<CommentFile[]>([]);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const editorRef = useRef<{ insertText: (text: string) => void; focus: () => void }>(null);

  useEffect(() => {
    if (workspaceId) {
      workspaceAPI.getWorkspaceMembers(workspaceId).then((response) => {
        if (response.success && response.data) {
          const membersData = Array.isArray(response.data) ? response.data : [];
          const formattedMembers = membersData.map((member: Record<string, unknown>) => ({
            id: String(member.userId || (member.user && typeof member.user === 'object' && 'id' in member.user ? member.user.id : '')),
            name: String(
              member.user && typeof member.user === 'object' && 'name' in member.user
                ? member.user.name
                : member.email || 'Unknown'
            ),
            email: String(
              member.user && typeof member.user === 'object' && 'email' in member.user
                ? member.user.email
                : member.email || ''
            ),
            profilePicture: member.user && typeof member.user === 'object' && 'profilePicture' in member.user
              ? String(member.user.profilePicture || '')
              : undefined,
          }));
          setUsers(formattedMembers);
        }
      }).catch((error) => {
        console.error('Error fetching workspace members:', error);
      });
    }
  }, [workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extract plain text from HTML for validation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    if (!plainText.trim() && attachedFiles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Use mentionedUserIds from the editor callback, or extract from content as fallback
      const mentions = mentionedUserIds.length > 0 
        ? mentionedUserIds 
        : (users.length > 0 ? extractMentionedUserIds(plainText, users) : []);
      
      const commentData: CreateCommentInput = {
        itemId,
        content: content.trim(), // Store as HTML
        isPrivate,
        mentions: mentions.length > 0 ? mentions : undefined,
        ...(parentId && { parentId }),
      };

      const response = await commentAPI.createComment(commentData);

      // Upload files after comment creation
      if (response.success && response.data && attachedFiles.length > 0) {
        const commentId = (response.data as any).id;
        for (const file of attachedFiles) {
          if (file.fileData) {
            try {
              await commentAPI.uploadCommentFile({
                commentId,
                itemId,
                fileName: file.fileName,
                fileData: file.fileData,
                mimeType: file.mimeType,
                fileSize: file.fileSize,
              });
            } catch (error) {
              console.error('Error uploading file:', error);
              // Continue even if file upload fails
            }
          }
        }
      }

      if (response.success) {
        // Note: Mention notifications are automatically created by the backend
        // when a comment with mentions is created (see commentService.ts)

        toast({
          title: 'Success',
          description: 'Comment added successfully',
        });
        setContent('');
        setIsPrivate(false);
        setAttachedFiles([]);
        onSuccess?.();
      } else {
        throw new Error(response.message || 'Failed to create comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="comment-content">Comment</Label>
        <AITextGenerator
          type="comment"
          context={{
            itemName: `Item ${itemId}`,
            previousComments: previousComments || [],
            columnValues: itemChanges || {},
            itemData: itemChanges || {},
            mode: itemChanges && Object.keys(itemChanges).length > 0 ? 'suggest' : undefined,
          }}
          onGenerated={(text) => {
            // Insert AI-generated text into the rich text editor
            if (editorRef.current) {
              editorRef.current.insertText(text);
            }
            setContent(text);
          }}
          trigger={
            <Button variant="ghost" size="sm" type="button">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Suggest
            </Button>
          }
        />
      </div>
      <div className="space-y-2">
        <RichTextEditor
          ref={editorRef}
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          rows={3}
          users={users}
          onMentionSelect={setMentionedUserIds}
          onAttachFile={() => {
            document.getElementById('comment-file-input')?.click();
          }}
          onInsertEmoji={() => {}}
          disabled={submitting}
        />
        
        {/* Emoji Picker - Integrated in toolbar */}

        {/* File Attachments */}
        <CommentFileAttachment
          files={attachedFiles}
          onFilesChange={setAttachedFiles}
          itemId={itemId}
          disabled={submitting}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="private"
            checked={isPrivate}
            onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            disabled={submitting}
          />
          <Label htmlFor="private" className="text-sm cursor-pointer flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Private comment
          </Label>
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={submitting || !content.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
};