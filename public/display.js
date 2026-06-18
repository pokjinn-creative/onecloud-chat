import { database } from './firebase-config.js';
import { ref, onChildAdded, onChildRemoved, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const chatDisplay = document.getElementById('chatDisplay');
const bigPopup = document.getElementById('bigPopup');
const popupMessage = document.getElementById('popupMessage');

const TWELVE_HOURS = 12 * 60 * 60 * 1000;
let initialLoadComplete = false;
let initialMessageCount = 0;

function loadMessages() {
    const messagesRef = ref(database, 'messages');
    
    // First get all existing messages to know the count for animation delays
    get(messagesRef).then((snapshot) => {
        const count = snapshot.size;
        initialMessageCount = count;
        
        // Now listen for child added
        onChildAdded(messagesRef, (snapshot) => {
            const message = snapshot.val();
            const messageId = snapshot.key;
            
            // Auto delete messages older than 12 hours
            const now = Date.now();
            if (now - message.timestamp > TWELVE_HOURS) {
                remove(ref(database, 'messages/' + messageId));
                return;
            }
            
            let delay = 0;
            if (!initialLoadComplete) {
                // Apply delay for initial messages
                delay = initialMessageCount * 50; // 50ms per message
                initialMessageCount--;
                if (initialMessageCount <= 0) {
                    initialLoadComplete = true;
                }
            }
            
            setTimeout(() => {
                addMessageToDisplay(message, messageId);
            }, delay);
        });
    });
    
    onChildRemoved(messagesRef, (snapshot) => {
        const messageId = snapshot.key;
        removeMessageFromDisplay(messageId);
    });
}

function loadBigMessages() {
    const bigMessagesRef = ref(database, 'bigMessages');
    onChildAdded(bigMessagesRef, (snapshot) => {
        const data = snapshot.val();
        // Handle both old (string) and new (object) formats
        if (typeof data === 'string') {
            showBigPopup({ message: data, sender: 'One Cloud Coffee & Eatery' });
        } else {
            showBigPopup(data);
        }
    });
}

function addMessageToDisplay(message, messageId) {
  const div = document.createElement('div');
  div.className = `display-message gender-${message.gender}`;
  div.id = `msg-${messageId}`; // Add ID for easy removal
  const date = new Date(message.timestamp);
  const timeStr = date.toLocaleTimeString('id-ID');
  const genderIcon = message.gender === 'male' ? '♂️' : '♀️';
  
  div.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
          <div>
              <span class="nickname">
                  <span class="gender-icon">${genderIcon}</span>
                  by <span class="username">${escapeHtml(message.nickname)}</span>
              </span>
          </div>
          <span class="timestamp">${timeStr}</span>
      </div>
      <div class="content">${escapeHtml(message.content)}</div>
      <div class="message-footer mt-3" style="font-style: italic; font-size: 0.9rem; color: rgba(255,255,255,0.8);">
          sent via One Cloud ChitChat
      </div>
  `;
  
  chatDisplay.appendChild(div);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
  
  if (chatDisplay.children.length > 20) {
      chatDisplay.removeChild(chatDisplay.firstChild);
  }
}

function removeMessageFromDisplay(messageId) {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
        element.remove();
    }
}

function showBigPopup(data) {
  document.getElementById('popupMessage').textContent = data.message;
  document.getElementById('popupSender').textContent = `— ${data.sender || 'One Cloud ChitChat'}`;
  bigPopup.classList.remove('d-none');
  
  setTimeout(() => {
      bigPopup.classList.add('d-none');
  }, 8000); // Show for 8 seconds
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

loadMessages();
loadBigMessages();
