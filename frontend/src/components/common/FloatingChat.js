import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, UserGroupIcon, MagnifyingGlassIcon, ArrowLeftIcon, PaperClipIcon, ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const FloatingChat = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState('chats'); // 'chats' or 'users'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);

  const mediaBaseUrl = (api.defaults.baseURL || '').replace(/\/$/, '');

  // Fetch chats
  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data.data);

      // Calculate total unread
      const total = data.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (error) {
      console.error('Failed to fetch chats');
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const { data } = await api.get('/available-users');
      setAvailableUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch available users');
    }
  };

  // Fetch messages for selected chat (without showing loading on polls)
  const fetchMessages = async (showLoading = false) => {
    if (!selectedChat) return;
    try {
      if (showLoading) setLoading(true);
      const { data } = await api.get(`/chats/${selectedChat._id}/messages`);
      setMessages(data.data);

      // Mark as read
      await api.put(`/chats/${selectedChat._id}/read`);
    } catch (error) {
      console.error('Failed to fetch messages');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Start chat with a user
  const handleStartChat = async (userId) => {
    try {
      const { data } = await api.post('/chats', { userId });
      setSelectedChat(data.data);
      setSearchOpen(false);
      setSearchQuery('');
      await fetchChats();
      setTab('chats');
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  // Auto-scroll to bottom only when the user is already near the bottom,
  // so polling updates don't yank them down while reading older messages.
  const isNearBottom = () => {
    const el = messagesScrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isNearBottom()) scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Jump to bottom instantly when opening a chat
  useEffect(() => {
    if (selectedChat && isOpen) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, isOpen]);

  // Initial fetch and polling
  useEffect(() => {
    // Initial fetch
    fetchChats();
    fetchAvailableUsers();

    // Poll every 3 seconds to keep chats updated
    const interval = setInterval(() => {
      fetchChats();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch available users when window opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat && isOpen) {
      fetchMessages(true);  // Show loading only on initial fetch

      // Poll for new messages every 2 seconds (without showing loading)
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 2000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, isOpen]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      const msgText = messageText;
      setMessageText('');

      const { data } = await api.post(`/chats/${selectedChat._id}/messages`, {
        text: msgText
      });

      setMessages([...messages, data.data]);
      await fetchChats(); // Update chats list
      scrollToBottom(true); // follow your own sent message
    } catch (error) {
      toast.error('Failed to send message');
      setMessageText(messageText);
    }
  };

  // Handle file selection from the paperclip button
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  // Send the pending image/video (with optional caption)
  const handleSendFile = async () => {
    if (!pendingFile || !selectedChat) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('media', pendingFile);
      if (messageText.trim()) formData.append('text', messageText.trim());
      setMessageText('');
      setPendingFile(null);

      const token = localStorage.getItem('token');
      const { data } = await api.post(
        `/chats/${selectedChat._id}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      setMessages(prev => [...prev, data.data]);
      await fetchChats();
      scrollToBottom(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send file');
      setPendingFile(null);
    } finally {
      setUploading(false);
    }
  };

  // Get other participant name
  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user._id);
  };

  const getUserInitials = (account) => {
    const source = account?.name || account?.email || '?';
    const words = source.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  };

  const getAvatarColors = (account) => {
    const palette = [
      ['#1F6BEB', '#ffffff'],
      ['#1A7F37', '#ffffff'],
      ['#BC4C00', '#ffffff'],
      ['#6E40C9', '#ffffff'],
      ['#0E7A6E', '#ffffff'],
      ['#9A6700', '#ffffff'],
    ];
    const value = account?._id || account?.email || account?.name || 'user';
    const index = Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
    return palette[index];
  };

  const UserAvatar = ({ account, size = 34 }) => {
    const [background, color] = getAvatarColors(account);
    return (
      <div
        title={account?.name || account?.email || 'User'}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: `${Math.max(10, Math.round(size * 0.34))}px`,
          fontWeight: 800,
          border: '2px solid rgba(255,255,255,0.75)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          letterSpacing: 0,
        }}
      >
        {getUserInitials(account)}
      </div>
    );
  };

  const localDateKey = (dateValue) => format(new Date(dateValue), 'yyyy-MM-dd');

  const formatDateDivider = (dateValue) => format(new Date(dateValue), 'MMM d, yyyy');

  const formatConversationDate = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    return localDateKey(date) === localDateKey(new Date())
      ? format(date, 'h:mm a')
      : format(date, 'MMM d');
  };

  const mediaUrl = (media) => media?.url ? `${mediaBaseUrl}${media.url}` : '';

  const renderMedia = (media) => {
    if (!media || !media.url) return null;
    const url = mediaUrl(media);
    const downloadName = media.originalName || media.filename || 'file';

    const downloadBtn = (
      <a
        href={url}
        download={downloadName}
        title="Download"
        onClick={e => e.stopPropagation()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          textDecoration: 'none',
          backdropFilter: 'blur(2px)',
        }}
      >
        <ArrowDownTrayIcon style={{ width: '13px', height: '13px' }} />
        Save
      </a>
    );

    if (media.type === 'video') {
      return (
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <video
            src={url}
            controls
            style={{ width: '100%', maxWidth: '240px', borderRadius: '10px', display: 'block', background: '#000' }}
          />
          <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>{downloadBtn}</div>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', maxWidth: '100%' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <img
            src={url}
            alt={downloadName}
            style={{ width: '100%', maxWidth: '240px', maxHeight: '280px', objectFit: 'cover', borderRadius: '10px', display: 'block', cursor: 'pointer' }}
          />
        </a>
        <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>{downloadBtn}</div>
      </div>
    );
  };


  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setSelectedChat(null);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleMessages = normalizedSearch
    ? messages.filter(msg => msg.text?.toLowerCase().includes(normalizedSearch))
    : messages;

  const renderMessageText = (text) => {
    if (!normalizedSearch || !text?.toLowerCase().includes(normalizedSearch)) return text;

    const lowerText = text.toLowerCase();
    const parts = [];
    let currentIndex = 0;
    let matchIndex = lowerText.indexOf(normalizedSearch);

    while (matchIndex !== -1) {
      if (matchIndex > currentIndex) {
        parts.push(text.slice(currentIndex, matchIndex));
      }
      parts.push(
        <mark key={`${matchIndex}-${parts.length}`} style={{ background: '#fff8c5', color: '#1f2328', borderRadius: '3px', padding: '0 2px' }}>
          {text.slice(matchIndex, matchIndex + normalizedSearch.length)}
        </mark>
      );
      currentIndex = matchIndex + normalizedSearch.length;
      matchIndex = lowerText.indexOf(normalizedSearch, currentIndex);
    }

    if (currentIndex < text.length) {
      parts.push(text.slice(currentIndex));
    }

    return parts;
  };

  const panel = 'var(--surface)';
  const panelAlt = 'var(--surface-2)';
  const line = 'var(--border)';
  const primary = 'var(--text-primary)';
  const secondary = 'var(--text-secondary)';
  const muted = 'var(--text-muted)';
  const accent = 'var(--accent)';
  const accentHover = 'var(--accent-hover)';
  const accentText = 'var(--accent-text)';

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50, fontFamily: 'inherit' }}>
      {/* Floating Chat Heads (when collapsed) */}
      {!isOpen && (
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: accent,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px color-mix(in srgb, var(--accent) 45%, transparent)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 10px 28px color-mix(in srgb, var(--accent) 60%, transparent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px color-mix(in srgb, var(--accent) 45%, transparent)';
            }}
          >
            <UserGroupIcon style={{ width: '24px', height: '24px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                minWidth: '22px',
                height: '22px',
                padding: '0 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                border: '2px solid var(--surface)',
                boxSizing: 'border-box',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window (when open) */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '380px',
          height: '520px',
          maxHeight: 'calc(100vh - 40px)',
          background: panel,
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: primary,
          border: `1px solid ${line}`,
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: panel,
            borderBottom: `1px solid ${line}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              {selectedChat ? (
                <>
                  <button
                    onClick={() => setSelectedChat(null)}
                    title="Back"
                    style={{ background: 'transparent', border: 'none', color: secondary, cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.background = panelAlt}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                  <UserAvatar account={getOtherParticipant(selectedChat)} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getOtherParticipant(selectedChat)?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                      Online
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: primary }}>Messages</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: muted }}>Team conversations</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
              {selectedChat && (
                <button
                  onClick={() => setSearchOpen(true)}
                  title="Search conversation"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: secondary,
                    cursor: 'pointer',
                    padding: '6px',
                    display: 'flex',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = panelAlt}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MagnifyingGlassIcon style={{ width: '18px', height: '18px' }} />
                </button>
              )}
              <button
                onClick={handleCloseChat}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: secondary,
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  borderRadius: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = panelAlt}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <XMarkIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>

          {/* Chat List / Messages */}
          {!selectedChat ? (
            <>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: `1px solid ${line}`,
                backgroundColor: panel,
              }}>
                {[
                  { key: 'chats', label: 'Chats' },
                  { key: 'users', label: 'Accounts' },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1,
                      padding: '12px 12px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: tab === t.key ? `2px solid ${accent}` : `2px solid transparent`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: tab === t.key ? 700 : 500,
                      color: tab === t.key ? accentText : secondary,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }} className="app-scrollbar">
                {tab === 'chats' ? (
                  chats.length === 0 ? (
                    <div style={emptyState}>No conversations yet. Check Accounts tab!</div>
                  ) : (
                    chats.map(chat => {
                      const other = getOtherParticipant(chat);
                      return (
                        <button
                          key={chat._id}
                          onClick={() => handleSelectChat(chat)}
                          style={{
                            width: '100%',
                            padding: '11px 12px',
                            background: 'transparent',
                            border: `1px solid ${line}`,
                            borderRadius: '12px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '11px',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = panelAlt}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <UserAvatar account={other} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {other?.name}
                              </p>
                              <span style={{ fontSize: '11px', color: muted, whiteSpace: 'nowrap' }}>
                                {formatConversationDate(chat.lastMessageAt || chat.updatedAt || chat.createdAt)}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: secondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '210px',
                            }}>
                              {chat.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                          {chat.unreadCount > 0 && (
                            <span style={{
                              background: accent,
                              color: '#fff',
                              borderRadius: '999px',
                              minWidth: '20px',
                              height: '20px',
                              padding: '0 6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {chat.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )
                ) : (
                  availableUsers.length === 0 ? (
                    <div style={emptyState}>No accounts available</div>
                  ) : (
                    availableUsers.map(availableUser => (
                      <button
                        key={availableUser._id}
                        onClick={() => handleStartChat(availableUser._id)}
                        style={{
                          width: '100%',
                          padding: '11px 12px',
                          background: 'transparent',
                          border: `1px solid ${line}`,
                          borderRadius: '12px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '11px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = panelAlt}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <UserAvatar account={availableUser} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 3px 0', fontWeight: 600, fontSize: '13px', color: primary }}>
                            {availableUser.name}
                          </p>
                          <p style={{
                            margin: 0,
                            fontSize: '12px',
                            color: secondary,
                            maxWidth: '210px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {availableUser.email}
                          </p>
                        </div>
                        {availableUser.hasChat && (
                          <span style={{
                            background: 'var(--success-bg)',
                            color: 'var(--success)',
                            borderRadius: '999px',
                            padding: '3px 9px',
                            fontSize: '11px',
                            fontWeight: 600,
                            marginLeft: '8px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            Active
                          </span>
                        )}
                      </button>
                    ))
                  )
                )}
              </div>
            </>
          ) : (
            <>
              {searchOpen && (
                <div style={{
                  padding: '10px 12px',
                  borderBottom: `1px solid ${line}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: panelAlt,
                }}>
                  <MagnifyingGlassIcon style={{ width: '16px', height: '16px', color: secondary }} />
                  <input
                    type="text"
                    placeholder="Search conversation"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      border: `1px solid ${line}`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      background: panel,
                      color: primary,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    title="Close search"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: secondary, padding: '4px', display: 'flex', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.background = panel}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <XMarkIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              )}

              {/* Messages List */}
              <div
                ref={messagesScrollRef}
                style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 14px 6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }} className="app-scrollbar">
                {loading ? (
                  <div style={emptyState}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={emptyState}>No messages yet. Start the conversation!</div>
                ) : visibleMessages.length === 0 ? (
                  <div style={emptyState}>No messages match your search.</div>
                ) : (
                  visibleMessages.map((msg, index) => {
                    const isOwnMessage = msg.sender?._id === user._id;
                    const showDateDivider = index === 0 || localDateKey(msg.createdAt) !== localDateKey(visibleMessages[index - 1].createdAt);

                    return (
                      <React.Fragment key={msg._id}>
                        {showDateDivider && (
                          <div style={{
                            alignSelf: 'center',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: panelAlt,
                            border: `1px solid ${line}`,
                            color: secondary,
                            fontSize: '11px',
                            fontWeight: 600,
                            margin: '2px 0',
                          }}>
                            {formatDateDivider(msg.createdAt)}
                          </div>
                        )}
                        <div
                          className="chat-msg"
                          style={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: '7px',
                          }}
                        >
                          {!isOwnMessage && <UserAvatar account={msg.sender} size={26} />}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start', minWidth: 0, maxWidth: '85%' }}>
                            <div style={{
                              width: 'fit-content',
                              maxWidth: '100%',
                              padding: msg.media ? '4px' : '9px 12px',
                              borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isOwnMessage ? accent : panelAlt,
                              color: isOwnMessage ? '#fff' : primary,
                              fontSize: '13px',
                              lineHeight: '1.45',
                              boxShadow: 'var(--shadow-sm)',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflow: 'hidden',
                            }}>
                              {msg.media && (
                                <div style={{ marginBottom: msg.text ? '6px' : 0 }}>
                                  {renderMedia(msg.media)}
                                </div>
                              )}
                              {msg.text && (
                                <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{renderMessageText(msg.text)}</p>
                              )}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              marginTop: '3px',
                              padding: '0 4px',
                              fontSize: '10px',
                              color: secondary,
                              fontWeight: 500,
                            }}>
                              <span>{format(new Date(msg.createdAt), 'h:mm a')}</span>
                              {isOwnMessage && (
                                <span style={{ fontWeight: 600, color: msg.isRead ? 'var(--success)' : muted }}>
                                  {msg.isRead ? 'seen' : 'sent'}
                                </span>
                              )}
                            </div>
                          </div>
                          {isOwnMessage && <UserAvatar account={user} size={26} />}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 14px',
                borderTop: `1px solid ${line}`,
                background: panel,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {pendingFile && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    background: panelAlt,
                    border: `1px solid ${line}`,
                    fontSize: '12px',
                    color: primary,
                  }}>
                    {pendingFile.type.startsWith('image/')
                      ? <PhotoIcon style={{ width: '16px', height: '16px', color: accentText, flexShrink: 0 }} />
                      : <PaperClipIcon style={{ width: '16px', height: '16px', color: accentText, flexShrink: 0 }} />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pendingFile.name}
                    </span>
                    <button
                      onClick={() => setPendingFile(null)}
                      title="Remove"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: secondary, padding: '2px', display: 'flex', borderRadius: '4px' }}
                    >
                      <XMarkIcon style={{ width: '15px', height: '15px' }} />
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image or video"
                    disabled={uploading}
                    style={{
                      padding: '10px',
                      width: '40px',
                      height: '40px',
                      background: panelAlt,
                      color: secondary,
                      border: `1px solid ${line}`,
                      borderRadius: '50%',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!uploading) e.currentTarget.style.color = accentText; }}
                    onMouseLeave={e => e.currentTarget.style.color = secondary}
                  >
                    <PaperClipIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        pendingFile ? handleSendFile() : handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: `1px solid ${line}`,
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      backgroundColor: panelAlt,
                      color: primary,
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = accent;
                      e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = line;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={() => pendingFile ? handleSendFile() : handleSendMessage()}
                    disabled={(!messageText.trim() && !pendingFile) || uploading}
                    style={{
                      padding: '10px',
                      width: '40px',
                      height: '40px',
                      background: accent,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: ((messageText.trim() || pendingFile) && !uploading) ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: ((messageText.trim() || pendingFile) && !uploading) ? 1 : 0.5,
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { if ((messageText.trim() || pendingFile) && !uploading) e.currentTarget.style.background = accentHover; }}
                    onMouseLeave={e => e.currentTarget.style.background = accent}
                  >
                    {uploading
                      ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      : <PaperAirplaneIcon style={{ width: '17px', height: '17px' }} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const emptyState = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  textAlign: 'center',
  padding: '16px',
};

export default FloatingChat;
