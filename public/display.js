import { database } from './firebase-config.js';
import { ref, onChildAdded, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const chatDisplay = document.getElementById('chatDisplay');
const bigPopup = document.getElementById('bigPopup');
const popupMessage = document.getElementById('popupMessage');

function loadMessages() {
    const messagesRef = ref(database, 'messages');
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        addMessageToDisplay(message);
    });
}

function loadBigMessages() {
    const bigMessagesRef = ref(database, 'bigMessages');
    onChildAdded(bigMessagesRef, (snapshot) => {
        const data = snapshot.val();
        showBigPopup(data.message);
    });
}

function addMessageToDisplay(message) {
    const div = document.createElement('div');
    div.className = 'display-message';
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
    
    chatDisplay.insertBefore(div, chatDisplay.firstChild);
    
    if (chatDisplay.children.length > 20) {
        chatDisplay.removeChild(chatDisplay.lastChild);
    }
}

function showBigPopup(message) {
    popupMessage.textContent = message;
    bigPopup.classList.remove('d-none');
    
    setTimeout(() => {
        bigPopup.classList.add('d-none');
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

loadMessages();
loadBigMessages();
