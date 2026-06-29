import React, { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiZap, FiAlertCircle } from 'react-icons/fi';
import styles from '../../styles/shared/chatbot.module.css';

// Render bot text with simple markdown: **bold** and bullet points
function BotMessage({ text }) {
  const parts = text.split('\n').map((line, i) => {
    // Bold
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet list
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return (
        <li key={i} dangerouslySetInnerHTML={{ __html: formatted.replace(/^[\*\-]\s/, '') }} />
      );
    }
    if (formatted.trim() === '') return <br key={i} />;
    return <p key={i} style={{ margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
  });

  // Wrap consecutive <li> in <ul>
  return <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{parts}</div>;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi there! 👋 I'm your Zaanvar Agent.\n\nI can help you with **Products**, **Stock**, **Purchases**, **Sales**, and **Customers**.\n\nWhat would you like to know?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [openBelow, setOpenBelow] = useState(false);

  // Draggable position state — starts at bottom-right
  const [position, setPosition] = useState({ bottom: 90, right: 30 });
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startRight: 30, startBottom: 90, moved: false });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const handleDragStart = (e) => {
    // Only drag on the button itself, not inside the open chat window
    if (isOpen) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragState.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      startRight: position.right,
      startBottom: position.bottom,
      moved: false
    };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragState.current.dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragState.current.startX;
    const dy = clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
    const BUTTON_SIZE = 60;
    const MARGIN = 10;
    // right value: distance from right edge. Keep button fully inside screen left & right
    const newRight = Math.max(MARGIN, Math.min(window.innerWidth - BUTTON_SIZE - MARGIN, dragState.current.startRight - dx));
    // bottom value: distance from bottom edge. Keep button fully inside screen top & bottom
    const newBottom = Math.max(MARGIN, Math.min(window.innerHeight - BUTTON_SIZE - MARGIN, dragState.current.startBottom - dy));
    setPosition({ right: newRight, bottom: newBottom });
  };

  const handleDragEnd = () => {
    dragState.current.dragging = false;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      // On first open (only greeting), scroll to TOP so greeting is fully visible
      if (messages.length <= 1) {
        messagesEndRef.current?.parentElement?.scrollTo({ top: 0 });
      } else {
        scrollToBottom();
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    // Don't toggle if user was dragging
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    if (!isOpen) {
      // Decide direction at the exact moment of opening
      // Space above button = viewport height - bottom offset - button height (60px)
      const spaceAbove = window.innerHeight - position.bottom - 60;
      // If less than 575px above (500px window + 75px gap), open downward
      setOpenBelow(spaceAbove < 575);
    }
    setIsOpen(prev => !prev);
    setApiError(null);
  };

  const sendMessage = async (text) => {
    const userText = (text || inputValue).trim();
    if (!userText) return;

    const updatedMessages = [...messages, { sender: 'user', text: userText }];
    setMessages(updatedMessages);
    setInputValue('');
    setIsTyping(true);
    setApiError(null);

    // Only send the last 8 messages as history to stay concise
    const historyToSend = updatedMessages.slice(-8);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: historyToSend }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || 'Something went wrong. Please try again.');
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.message || "I'm having trouble connecting right now. Please try again!"
        }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setApiError('Could not connect to the Zaanvar Agent.');
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Oops! I couldn't connect. Please check your internet and try again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    'How do I add a product?',
    'What is Short Expiry?',
    'How to see expired items?',
    'How to add a customer?',
    'What is a Purchase Order?',
    'How to create a sale invoice?',
  ];


  return (
    <div
      className={styles.chatbotContainer}
      style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}
    >
      {isOpen && (
        <div
          className={styles.chatWindow}
          style={openBelow
            ? { bottom: 'auto', top: '75px' }   // open downward
            : { bottom: '75px', top: 'auto' }    // open upward (default)
          }
        >
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>
                <FiZap />
              </div>
              <div>
                <h3 className={styles.title}>Zaanvar Agent</h3>
                <p className={styles.subtitle}>AI-powered • Always here to help</p>
              </div>
            </div>
            <button className={styles.closeButton} onClick={toggleChat}>
              <FiX />
            </button>
          </div>

          {/* API Key warning banner */}
          {apiError && apiError.includes('API Key') && (
            <div style={{
              background: '#fff3cd',
              borderBottom: '1px solid #ffc107',
              padding: '8px 15px',
              fontSize: '12px',
              color: '#856404',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <FiAlertCircle />
              Add <strong>GOOGLE_API_KEY</strong> to your <strong>.env.local</strong> file to enable AI responses.
            </div>
          )}

          {/* Messages + Suggestions inside same scrollable area */}
          <div className={styles.messagesList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${styles[msg.sender]}`}>
                <div className={`${styles.bubble} ${styles[msg.sender]}`}>
                  {msg.sender === 'bot'
                    ? <BotMessage text={msg.text} />
                    : msg.text
                  }
                </div>
              </div>
            ))}

            {/* Quick Suggestions inline — shown only before user sends first message */}
            {messages.length <= 1 && (
              <div className={styles.suggestionsInline}>
                {suggestions.map((s, i) => (
                  <button key={i} className={styles.suggestionBtn} onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={`${styles.bubble} ${styles.bot} ${styles.typingIndicator}`}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputContainer}>
            <input
              ref={inputRef}
              type="text"
              className={styles.input}
              placeholder="Ask anything about Zaanvar..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              className={styles.sendButton}
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isTyping}
            >
              <FiSend />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className={styles.chatButton}
        onClick={toggleChat}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        title="Ask Zaanvar Agent"
        style={{ cursor: isOpen ? 'pointer' : 'grab' }}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}
