import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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
  const messagesEndRef = useRef(null);

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
      await fetchChats();
      setTab('chats');
    } catch (error) {
      toast.error('Failed to start chat');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch (error) {
      toast.error('Failed to send message');
      setMessageText(messageText);
    }
  };

  // Get other participant name
  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== user._id);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50, fontFamily: 'inherit' }}>
      {/* Floating Chat Heads (when collapsed) */}
      {!isOpen && (
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
          {chats.slice(0, 1).map(chat => {
            const other = getOtherParticipant(chat);
            return (
              <button
                key={chat._id}
                onClick={() => {
                  setSelectedChat(chat);
                  setIsOpen(true);
                }}
                title={other?.name}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
              >
                {getInitials(other?.name || 'U')}
                {chat.unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Main Chat Button */}
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#1F6BEB',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(31, 107, 235, 0.5)',
              transition: 'all 0.2s',
              fontSize: '24px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.15)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(31, 107, 235, 0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(31, 107, 235, 0.5)';
            }}
          >
            <UserGroupIcon style={{ width: '24px', height: '24px' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#EF4444',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700
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
          height: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 5px 40px rgba(0, 0, 0, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-1, #ffffff)',
          color: 'var(--text-primary, #000000)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: '#1F6BEB',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>Messages</h3>
              {selectedChat && (
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  {getOtherParticipant(selectedChat)?.name}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedChat(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex'
              }}
            >
              <XMarkIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Chat List / Messages */}
          {!selectedChat ? (
            <>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border, #e5e7eb)',
                padding: '0 8px',
                gap: '0',
                backgroundColor: 'var(--surface-2, #f9fafb)'
              }}>
                <button
                  onClick={() => setTab('chats')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: 'none',
                    background: tab === 'chats' ? 'white' : 'transparent',
                    borderBottom: tab === 'chats' ? '2px solid #1F6BEB' : 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: tab === 'chats' ? 600 : 500,
                    color: tab === 'chats' ? '#1F6BEB' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  Chats
                </button>
                <button
                  onClick={() => setTab('users')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: 'none',
                    background: tab === 'users' ? 'white' : 'transparent',
                    borderBottom: tab === 'users' ? '2px solid #1F6BEB' : 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: tab === 'users' ? 600 : 500,
                    color: tab === 'users' ? '#1F6BEB' : 'var(--text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  Accounts
                </button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {tab === 'chats' ? (
                  // Chats Tab
                  chats.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      No conversations yet. Check Accounts tab!
                    </div>
                  ) : (
                    chats.map(chat => {
                      const other = getOtherParticipant(chat);
                      return (
                        <button
                          key={chat._id}
                          onClick={() => setSelectedChat(chat)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: 'transparent',
                            border: '1px solid var(--border, #e5e7eb)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2, #f9fafb)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '13px' }}>
                                {other?.name}
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '250px'
                              }}>
                                {chat.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                            {chat.unreadCount > 0 && (
                              <span style={{
                                background: '#1F6BEB',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                marginLeft: '8px'
                              }}>
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )
                ) : (
                  // Available Users Tab
                  availableUsers.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '16px'
                    }}>
                      No accounts available
                    </div>
                  ) : (
                    availableUsers.map(availableUser => (
                      <button
                        key={availableUser._id}
                        onClick={() => handleStartChat(availableUser._id)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'transparent',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2, #f9fafb)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '13px' }}>
                              {availableUser.name}
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: 'var(--text-secondary)',
                              maxWidth: '250px'
                            }}>
                              {availableUser.email}
                            </p>
                          </div>
                          {availableUser.hasChat && (
                            <span style={{
                              background: 'var(--accent-subtle, #f0f6fc)',
                              color: '#1F6BEB',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              marginLeft: '8px',
                              whiteSpace: 'nowrap'
                            }}>
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )
                )}
              </div>
            </>
          ) : (
            <>
              {/* Messages List */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {loading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-secondary)'
                  }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-secondary)',
                    fontSize: '13px'
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        justifyContent: msg.sender._id === user._id ? 'flex-end' : 'flex-start',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: msg.sender._id === user._id ? '#1F6BEB' : 'var(--surface-2, #f0f0f0)',
                        color: msg.sender._id === user._id ? 'white' : 'var(--text-primary)',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        <p style={{ margin: '0 0 4px 0' }}>{msg.text}</p>
                        <p style={{
                          margin: 0,
                          fontSize: '11px',
                          opacity: 0.7
                        }}>
                          {format(new Date(msg.createdAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px',
                borderTop: '1px solid var(--border, #e5e7eb)',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    backgroundColor: 'var(--surface-2, #ffffff)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  onFocus={e => e.target.style.borderColor = '#1F6BEB'}
                  onBlur={e => e.target.style.borderColor = 'var(--border, #e5e7eb)'}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  style={{
                    padding: '8px 12px',
                    background: '#1F6BEB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: messageText.trim() ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (messageText.trim()) {
                      e.currentTarget.style.background = '#1651D6';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#1F6BEB';
                  }}
                >
                  <PaperAirplaneIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingChat;
