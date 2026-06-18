import { database } from './firebase-config.js';
import { ref, push, onChildAdded, onChildRemoved, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let currentUser = null;
let lastMessageTime = parseInt(localStorage.getItem('lastMessageTime') || '0');
let lastLoginTime = parseInt(localStorage.getItem('lastLoginTime') || '0');
let cooldownInterval = null;
let loginCooldownInterval = null;
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
const logoutBtn = document.getElementById('logoutBtn');
const loginCooldownTimer = document.createElement('div');
loginCooldownTimer.className = 'mt-3 text-center text-muted';

// Insert login cooldown timer after login form
loginForm.appendChild(loginCooldownTimer);

// Check login cooldown on page load
checkLoginCooldown();

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const now = Date.now();
    
    // Check login cooldown
    if (now - lastLoginTime < COOLDOWN_TIME) {
        return;
    }
    
    const nickname = document.getElementById('nickname').value.trim();
    const gender = document.querySelector('input[name="gender"]:checked').value;
    
    if (nickname) {
        currentUser = { nickname, gender, id: Date.now().toString() };
        lastLoginTime = now;
        localStorage.setItem('lastLoginTime', lastLoginTime.toString());
        
        userInfo.textContent = `Halo, ${nickname} (${gender === 'male' ? 'Laki-laki' : 'Perempuan'})`;
        loginPage.classList.add('d-none');
        chatPage.classList.remove('d-none');
        loadMessages();
        
        // Check if message cooldown is still active
        if (now - lastMessageTime < COOLDOWN_TIME) {
            showCooldown(lastMessageTime);
        }
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    chatPage.classList.add('d-none');
    loginPage.classList.remove('d-none');
    chatContainer.innerHTML = '';
    messageInput.value = '';
    emoticonPicker.classList.add('d-none');
    
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
    cooldownTimer.classList.add('d-none');
    sendBtn.disabled = false;
    messageInput.disabled = false;
    emoticonBtn.disabled = false;
    
    checkLoginCooldown();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

emoticonBtn.addEventListener('click', () => {
    emoticonPicker.classList.toggle('d-none');
});

// Re-attach emoticon click listeners after any DOM changes
function attachEmoticonListeners() {
    document.querySelectorAll('.emoticon').forEach(emoticon => {
        emoticon.addEventListener('click', () => {
            messageInput.value += emoticon.textContent;
            emoticonPicker.classList.add('d-none');
        });
    });
}

attachEmoticonListeners();

function checkLoginCooldown() {
    const now = Date.now();
    const remaining = Math.ceil((COOLDOWN_TIME - (now - lastLoginTime)) / 1000);
    
    if (remaining > 0) {
        loginCooldownTimer.classList.remove('d-none');
        loginCooldownTimer.textContent = `Silakan tunggu ${remaining} detik untuk login kembali`;
        document.getElementById('nickname').disabled = true;
        document.querySelector('input[name="gender"]').disabled = true;
        document.querySelectorAll('input[name="gender"]').forEach(radio => radio.disabled = true);
        loginForm.querySelector('button').disabled = true;
        
        loginCooldownInterval = setInterval(() => {
            const remainingNow = Math.ceil((COOLDOWN_TIME - (Date.now() - lastLoginTime)) / 1000);
            if (remainingNow <= 0) {
                clearLoginCooldown();
            } else {
                loginCooldownTimer.textContent = `Silakan tunggu ${remainingNow} detik untuk login kembali`;
            }
        }, 1000);
    } else {
        clearLoginCooldown();
    }
}

function clearLoginCooldown() {
    loginCooldownTimer.classList.add('d-none');
    document.getElementById('nickname').disabled = false;
    document.querySelectorAll('input[name="gender"]').forEach(radio => radio.disabled = false);
    loginForm.querySelector('button').disabled = false;
    if (loginCooldownInterval) {
        clearInterval(loginCooldownInterval);
    }
}

function sendMessage() {
    if (!currentUser) return;
    
    const now = Date.now();
    if (now - lastMessageTime < COOLDOWN_TIME) {
        showCooldown(lastMessageTime);
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
        localStorage.setItem('lastMessageTime', lastMessageTime.toString());
        showCooldown(lastMessageTime);
    }
}

function showCooldown(startTime) {
    // Clear existing interval if any
    if (cooldownInterval) {
        clearInterval(cooldownInterval);
    }
    
    const updateCooldown = () => {
        const remaining = Math.ceil((COOLDOWN_TIME - (Date.now() - startTime)) / 1000);
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            cooldownTimer.classList.add('d-none');
            sendBtn.disabled = false;
            messageInput.disabled = false;
            emoticonBtn.disabled = false;
            return;
        }
        
        cooldownTimer.classList.remove('d-none');
        timerSpan.textContent = remaining;
        sendBtn.disabled = true;
        messageInput.disabled = true;
        emoticonBtn.disabled = true;
    };
    
    updateCooldown();
    cooldownInterval = setInterval(updateCooldown, 1000);
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
  div.className = `chat-message gender-${message.gender}`;
  div.id = `msg-${messageId}`; // Add ID for easy removal
  const date = new Date(message.timestamp);
  const timeStr = date.toLocaleTimeString('id-ID');
  const genderText = message.gender === 'male' ? '♂️' : '♀️';
  
  div.innerHTML = `
      <div class="message-header">
          <span>
              <span class="gender-icon">${genderText}</span>
              by <span class="username">${message.nickname}</span>
          </span>
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
