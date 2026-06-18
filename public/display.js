import { database } from './firebase-config.js';
import { ref, onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const chatDisplay = document.getElementById('chatDisplay');
const bigPopup = document.getElementById('bigPopup');
const popupMessage = document.getElementById('popupMessage');

function loadMessages() {
    const messagesRef = ref(database, 'messages');
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        addMessageToDisplay(message, messageId);
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
        showBigPopup(data.message);
    });
}

function addMessageToDisplay(message, messageId) {
    const div = document.createElement('div');
    div.className = 'display-message';
    div.id = `msg-${messageId}`; // Add ID for easy removal
    const date = new Date(message.timestamp);
    const timeStr = date.toLocaleTimeString('id-ID');
    const genderClass = message.gender === 'male' ? 'text-primary' : 'text-danger';
    const genderIcon = message.gender === 'male' ? '♂️' : '♀️';
    
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <span class="nickname ${genderClass}">${genderIcon} ${escapeHtml(message.nickname)}</span>
            </div>
            <span class="timestamp">${timeStr}</span>
        </div>
        <div class="content">${escapeHtml(message.content)}</div>
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
    document.getElementById('popupSender').textContent = `— ${data.sender || 'One Cloud Coffee & Eatery'}`;
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
