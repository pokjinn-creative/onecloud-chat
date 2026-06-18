import { database } from './firebase-config.js';
import { ref, push, onChildAdded, onChildRemoved, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let currentUser = null;
let lastMessageTime = 0;
const COOLDOWN_TIME = 30000;
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const chatPage = document.getElementById('chatPage');
const userInfo = document.getElementById('userInfo');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const emoticonBtn = document.getElementById('emoticonBtn');
const emoticonPicker = document.getElementById('emoticonPicker');
const cooldownTimer = document.getElementById('cooldownTimer');
const timerSpan = document.getElementById('timer');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = document.getElementById('nickname').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    if (nickname) {
        currentUser = { nickname, gender, id: Date.now().toString() };
        userInfo.textContent = `Halo, ${nickname} (${gender === 'male' ? 'Laki-laki' : 'Perempuan'})`;
        loginPage.classList.add('d-none');
        chatPage.classList.remove('d-none');
        loadMessages();
    }
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

emoticonBtn.addEventListener('click', () => {
    emoticonPicker.classList.toggle('d-none');
});

document.querySelectorAll('.emoticon').forEach(emoticon => {
    emoticon.addEventListener('click', () => {
        messageInput.value += emoticon.textContent;
        emoticonPicker.classList.add('d-none');
    });
});

function sendMessage() {
    if (!currentUser) return;
    
    const now = Date.now();
    if (now - lastMessageTime < COOLDOWN_TIME) {
        showCooldown(now);
        return;
    }
    
    const content = messageInput.value.trim();
    if (content) {
        const messagesRef = ref(database, 'messages');
        push(messagesRef, {
            nickname: currentUser.nickname,
            gender: currentUser.gender,
            content: content,
            timestamp: now,
            userId: currentUser.id
        });
        messageInput.value = '';
        lastMessageTime = now;
    }
}

function showCooldown(startTime) {
    const remaining = Math.ceil((COOLDOWN_TIME - (Date.now() - startTime)) / 1000);
    cooldownTimer.classList.remove('d-none');
    timerSpan.textContent = remaining;
    
    const interval = setInterval(() => {
        const left = Math.ceil((COOLDOWN_TIME - (Date.now() - startTime)) / 1000);
        if (left <= 0) {
            clearInterval(interval);
            cooldownTimer.classList.add('d-none');
        } else {
            timerSpan.textContent = left;
        }
    }, 1000);
}

function loadMessages() {
    const messagesRef = ref(database, 'messages');
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        
        // Auto delete messages older than 12 hours
        const now = Date.now();
        if (now - message.timestamp > TWELVE_HOURS) {
            remove(ref(database, 'messages/' + messageId));
            return;
        }
        
        addMessageToDisplay(message, messageId);
    });
    onChildRemoved(messagesRef, (snapshot) => {
        const messageId = snapshot.key;
        removeMessageFromDisplay(messageId);
    });
}

function addMessageToDisplay(message, messageId) {
  const div = document.createElement('div');
  div.className = 'chat-message';
  div.id = `msg-${messageId}`; // Add ID for easy removal
  const date = new Date(message.timestamp);
  const timeStr = date.toLocaleTimeString('id-ID');
  const genderClass = message.gender === 'male' ? 'gender-male' : 'gender-female';
  const genderText = message.gender === 'male' ? '♂️' : '♀️';
  
  div.innerHTML = `
      <div class="message-header">
          <span class="${genderClass}">${genderText} by ${message.nickname}</span>
          <span>${timeStr}</span>
      </div>
      <div class="message-content">${escapeHtml(message.content)}</div>
      <div class="message-footer text-muted small mt-2" style="font-style: italic;">
          sent via One Cloud ChitChat
      </div>
  `;
  
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeMessageFromDisplay(messageId) {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
        element.remove();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
