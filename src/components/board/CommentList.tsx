import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Edit,
  Trash2,
  Reply,
  Smile,
  MoreVertical,
  Lock,
  File,
  Download,
  X,
  Image as ImageIcon,
  Pin,
  PinOff,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { userAPI, commentAPI, fileAPI, aiAPI } from '@/lib/api';
import { Comment, CreateCommentInput } from '@/types/workspace';
import { AITextGenerator } from '@/components/ai/AITextGenerator';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { CommentFile } from './comments/CommentFileAttachment';

interface CommentListProps {
  itemId: string;
  onCommentCountChange?: (count: number) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😄', '🎉', '👏', '🔥', '💯'];

// Helper function to highlight mentions in HTML content
const highlightMentions = (html: string, mentionedUserIds: string[], currentUserId?: string): string => {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Find all mention spans and ensure they're highlighted
  const mentions = tempDiv.querySelectorAll('.mention, [data-user-id]');
  mentions.forEach((mention) => {
    const mentionEl = mention as HTMLElement;
    if (!mentionEl.classList.contains('mention')) {
      mentionEl.classList.add('mention');
    }
    mentionEl.style.color = '#3b82f6';
    mentionEl.style.fontWeight = '500';
    mentionEl.style.backgroundColor = '#eff6ff';
    mentionEl.style.padding = '2px 4px';
    mentionEl.style.borderRadius = '3px';
    mentionEl.style.cursor = 'default';
    
    // Highlight if current user is mentioned
    const userId = mentionEl.getAttribute('data-user-id');
    if (userId && userId === currentUserId) {
      mentionEl.style.backgroundColor = '#dbeafe';
      mentionEl.style.fontWeight = '600';
    }
  });
  
  // Also process plain text mentions (for backwards compatibility)
  const textNodes: Node[] = [];
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }
  
  textNodes.forEach((textNode) => {
    const text = textNode.textContent || '';
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    let match;
    const fragments: Node[] = [];
    
    let lastIndex = 0;
    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
      }
      
      // Create mention span
      const mentionSpan = document.createElement('span');
      mentionSpan.className = 'mention';
      mentionSpan.textContent = match[0];
      mentionSpan.style.color = '#3b82f6';
      mentionSpan.style.fontWeight = '500';
      mentionSpan.style.backgroundColor = '#eff6ff';
      mentionSpan.style.padding = '2px 4px';
      mentionSpan.style.borderRadius = '3px';
      
      // Check if this mention is for the current user
      const userName = match[1];
      // Note: We'd need user data to match by name, but for now we'll just highlight all mentions
      
      fragments.push(mentionSpan);
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragments.push(document.createTextNode(text.substring(lastIndex)));
    }
    
    // Replace the text node with fragments
    if (fragments.length > 1) {
      const parent = textNode.parentNode;
      if (parent) {
        fragments.forEach((fragment) => {
          parent.insertBefore(fragment, textNode);
        });
        parent.removeChild(textNode);
      }
    }
  });
  
  return tempDiv.innerHTML;
};

export const CommentList: React.FC<CommentListProps> = ({
  itemId,
  onCommentCountChange,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [commentFiles, setCommentFiles] = useState<Record<string, CommentFile[]>>({});
  const [filterMentions, setFilterMentions] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, { name: string; email: string }>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getItemComments(itemId);
      if (response.success && response.data) {
        const commentsData = (response.data as Comment[]) || [];
        setComments(commentsData);
        onCommentCountChange?.(commentsData.length);

        // Extract files from comments (if included in response)
        const filesMap: Record<string, CommentFile[]> = {};
        const extractFiles = (comment: Comment) => {
          if ((comment as any).files && Array.isArray((comment as any).files)) {
            filesMap[comment.id] = (comment as any).files;
          }
          if (comment.replies) {
            comment.replies.forEach(extractFiles);
          }
        };
        commentsData.forEach(extractFiles);
        setCommentFiles(filesMap);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchComments();
    }
  }, [itemId]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.reaction-picker-container')) {
        setShowReactionPicker({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmitComment = async (parentId?: string) => {
    const content = parentId ? replyContent : editContent;
    if (!content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Comment cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const commentData: CreateCommentInput = {
        itemId,
        content: content.trim(),
        parentId,
      };

      const response = parentId
        ? await commentAPI.createComment(commentData)
        : await commentAPI.updateComment(editingComment!, { content: content.trim() });

      if (response.success) {
        toast({
          title: 'Success',
          description: parentId ? 'Reply added' : 'Comment updated',
        });
        setReplyContent('');
        setReplyingTo(null);
        setEditContent('');
        setEditingComment(null);
        fetchComments();
      } else {
        throw new Error(response.message || 'Failed to save comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save comment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await commentAPI.deleteComment(commentId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Comment deleted',
        });
        fetchComments();
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleSummarizeDiscussion = async () => {
    if (comments.length < 3) {
      toast({
        title: 'Info',
        description: 'Need at least 3 comments to generate a summary',
      });
      return;
    }

    try {
      setGeneratingSummary(true);
      const response = await aiAPI.generateText({
        type: 'comment',
        context: {
          mode: 'summarize',
          previousComments: comments.map(c => ({
            content: c.content,
            author: c.user?.name || 'Unknown',
            user: {
              name: c.user?.name || 'Unknown',
              email: c.user?.email || '',
            },
          })),
        },
      });

      if (response.success && response.data) {
        setSummaryText(response.data.text);
        setShowSummary(true);
      } else {
        throw new Error(response.message || 'Failed to generate summary');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const response = await commentAPI.addReaction(commentId, emoji);
      if (response.success) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  };

  // Fetch user names for reaction tooltips
  const fetchUserNames = async (userIds: string[]) => {
    const missingUserIds = userIds.filter(id => !userCache[id] && id !== user?.id);
    if (missingUserIds.length === 0) return;

    const newCache: Record<string, { name: string; email: string }> = {};
    
    // Fetch users in parallel (limit to avoid too many requests)
    const fetchPromises = missingUserIds.slice(0, 10).map(async (userId) => {
      try {
        const response = await userAPI.getUserById(userId);
        if (response.success && response.data) {
          newCache[userId] = {
            name: response.data.name || 'Unknown',
            email: response.data.email || '',
          };
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        newCache[userId] = { name: 'Unknown', email: '' };
      }
    });

    await Promise.all(fetchPromises);
    setUserCache(prev => ({ ...prev, ...newCache }));
  };

  // Get user name from cache or use current user
  const getUserName = (userId: string): string => {
    if (userId === user?.id) return user.name || 'You';
    return userCache[userId]?.name || 'Unknown';
  };

  const handlePinComment = async (commentId: string) => {
    try {
      const response = await commentAPI.pinComment(commentId);
      if (response.success) {
        toast({
          title: 'Success',
          description: (response.data as any)?.isPinned ? 'Comment pinned' : 'Comment unpinned',
        });
        fetchComments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to pin comment',
        variant: 'destructive',
      });
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const response = await commentAPI.resolveComment(commentId, resolved);
      if (response.success) {
        toast({
          title: 'Success',
          description: resolved ? 'Comment marked as resolved' : 'Comment marked as unresolved',
        });
        fetchComments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve comment',
        variant: 'destructive',
      });
    }
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const isOwner = comment.userId === user?.id;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 border-slate-200 pl-4' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user?.profilePicture} />
            <AvatarFallback>
              {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {comment.isPinned && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {comment.isResolved && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
              <span className="font-semibold text-sm">{comment.user?.name || 'Unknown'}</span>
              {comment.isPrivate && (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
              {comment.isResolved && comment.resolvedByUser && (
                <span className="text-xs text-muted-foreground">
                  Resolved by {comment.resolvedByUser.name}
                  {comment.resolvedAt && ` ${formatDistanceToNow(new Date(comment.resolvedAt), { addSuffix: true })}`}
                </span>
              )}
            </div>

            {/* Comment Content with Mention Highlighting */}
            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: highlightMentions(comment.content, comment.mentions || [], user?.id),
              }}
            />

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Rich Text Content */}
                <div 
                  className="text-sm text-slate-700 mb-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content, comment.mentions || [], user?.id) }}
                />

                {/* File Attachments */}
                {commentFiles[comment.id] && commentFiles[comment.id].length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commentFiles[comment.id].map((file) => {
                      const isImage = file.mimeType.startsWith('image/');
                      return (
                        <div
                          key={file.id || file.fileName}
                          className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50"
                        >
                          {isImage && file.id ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:9001/api'}/comments/files/${file.id}/download`}
                              alt={file.fileName}
                              className="h-12 w-12 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 flex items-center justify-center bg-slate-200 rounded">
                              <File className="h-6 w-6 text-slate-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ''}
                            </p>
                          </div>
                          {file.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={async () => {
                                try {
                                  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';
                                  const token = localStorage.getItem('token');
                                  const response = await fetch(`${API_BASE_URL}/comments/files/${file.id}/download`, {
                                    method: 'GET',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                    },
                                  });
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.fileName;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  }
                                } catch (error) {
                                  console.error('Error downloading file:', error);
                                }
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex gap-1 mb-2 flex-wrap items-center relative">
                  {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                    <>
                      {Object.entries(comment.reactions).map(([emoji, userIds]) => {
                        const hasUserReaction = userIds.includes(user?.id || '');
                        // Fetch user names when hovering
                        const handleMouseEnter = () => {
                          fetchUserNames(userIds);
                        };
                        
                        return (
                          <TooltipProvider key={emoji}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={hasUserReaction ? "default" : "outline"}
                                  size="sm"
                                  className={`h-7 text-xs px-2 ${
                                    hasUserReaction 
                                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300' 
                                      : 'hover:bg-slate-100'
                                  }`}
                                  onClick={() => handleReaction(comment.id, emoji)}
                                  onMouseEnter={handleMouseEnter}
                                >
                                  <span className="mr-1">{emoji}</span>
                                  <span>{userIds.length}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-semibold text-xs mb-1">
                                    {emoji} {userIds.length} {userIds.length === 1 ? 'reaction' : 'reactions'}
                                  </div>
                                  <div className="text-xs space-y-0.5">
                                    {userIds.slice(0, 5).map((userId) => (
                                      <div key={userId}>
                                        {getUserName(userId)}
                                      </div>
                                    ))}
                                    {userIds.length > 5 && (
                                      <div className="text-muted-foreground">
                                        +{userIds.length - 5} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </>
                  )}
                  
                  {/* Add Reaction Button */}
                  <div className="relative reaction-picker-container">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-100"
                            onClick={() => {
                              setShowReactionPicker(prev => ({
                                ...prev,
                                [comment.id]: !prev[comment.id],
                              }));
                            }}
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>Add reaction</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Reaction Picker */}
                    {showReactionPicker[comment.id] && (
                      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-50 reaction-picker-container">
                        {COMMON_EMOJIS.map(emoji => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-lg hover:bg-slate-100"
                            onClick={() => {
                              handleReaction(comment.id, emoji);
                              setShowReactionPicker(prev => ({
                                ...prev,
                                [comment.id]: false,
                              }));
                            }}
                            title={emoji}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setReplyingTo(isReplying ? null : comment.id);
                      setReplyContent('');
                    }}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                  

                  {(isOwner || user?.role === 'admin') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditContent(comment.content);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handlePinComment(comment.id)}
                        >
                          {comment.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResolveComment(comment.id, !comment.isResolved)}
                        >
                          {comment.isResolved ? (
                            <>
                              <Circle className="h-4 w-4 mr-2" />
                              Mark as Unresolved
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark as Resolved
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Reply Form */}
                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Reply</Label>
                      <AITextGenerator
                        type="comment"
                        context={{
                          mode: 'reply' as const,
                          itemName: `Item ${itemId}`,
                          previousComments: comments
                            .filter(c => c.parentId === comment.id || c.id === comment.id)
                            .map(c => ({
                              content: c.content,
                              author: c.user?.name || 'Unknown',
                              user: {
                                name: c.user?.name || 'Unknown',
                                email: c.user?.email || '',
                              },
                            })),
                        }}
                        onGenerated={(text) => setReplyContent(text)}
                        trigger={
                          <Button variant="ghost" size="sm" type="button">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Suggest
                          </Button>
                        }
                        showModeSelector={false}
                      />
                    </div>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      rows={2}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitComment(comment.id)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter comments based on mentions filter
  const filteredComments = React.useMemo(() => {
    if (!filterMentions || !user) return comments;
    return comments.filter((comment) => 
      comment.mentions && comment.mentions.includes(user.id)
    );
  }, [comments, filterMentions, user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            Comments ({filteredComments.length})
          </span>
          {comments.some(c => c.isPinned) && (
            <Badge variant="outline" className="text-xs">
              <Pin className="h-3 w-3 mr-1" />
              {comments.filter(c => c.isPinned).length} pinned
            </Badge>
          )}
          {comments.some(c => c.isResolved) && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {comments.filter(c => c.isResolved).length} resolved
            </Badge>
          )}
          {user && comments.some(c => c.mentions && c.mentions.includes(user.id)) && (
            <Badge variant="outline" className="text-xs">
              {comments.filter(c => c.mentions && c.mentions.includes(user.id)).length} mentions
            </Badge>
          )}
        </div>
        {user && (
          <Button
            variant={filterMentions ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMentions(!filterMentions)}
            className="text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {filterMentions ? 'Show All' : 'My Mentions'}
          </Button>
        )}
        {comments.length >= 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarizeDiscussion}
            disabled={generatingSummary}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {generatingSummary ? 'Summarizing...' : 'Summarize Discussion'}
          </Button>
        )}
      </div>

      {/* Discussion Summary */}
      {showSummary && summaryText && (
        <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Discussion Summary</h3>
              </div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{summaryText}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSummary(false);
                setSummaryText(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {filteredComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {filterMentions 
            ? 'No comments mention you yet.' 
            : 'No comments yet. Be the first to comment!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

