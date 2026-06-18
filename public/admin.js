import { database } from './firebase-config.js';
import { ref, push, remove, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const messagesList = document.getElementById('messagesList');
const usersList = document.getElementById('usersList');
const filteredWordsList = document.getElementById('filteredWordsList');
const filterWordInput = document.getElementById('filterWordInput');
const addFilterBtn = document.getElementById('addFilterBtn');
const bigMessageInput = document.getElementById('bigMessageInput');
const bigMessageSender = document.getElementById('bigMessageSender');
const sendBigMessageBtn = document.getElementById('sendBigMessageBtn');
const wipeChatBtn = document.getElementById('wipeChatBtn');

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

let users = new Map();
let filteredWords = [];

function loadMessages() {
    const messagesRef = ref(database, 'messages');
    onValue(messagesRef, (snapshot) => {
        messagesList.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const messageId = childSnapshot.key;
            
            // Auto delete messages older than 12 hours
            const now = Date.now();
            if (now - message.timestamp > TWELVE_HOURS) {
                remove(ref(database, 'messages/' + messageId));
                return;
            }
            
            const div = document.createElement('div');
            div.className = 'mb-2 p-2 border rounded';
            const date = new Date(message.timestamp);
            const timeStr = date.toLocaleString('id-ID');
            
            div.innerHTML = `
                <div class="d-flex justify-content-between">
                    <strong>${message.nickname}</strong>
                    <small>${timeStr}</small>
                </div>
                <div>${escapeHtml(message.content)}</div>
                <div class="mt-1">
                    <button class="btn btn-sm btn-danger delete-msg" data-id="${messageId}">Hapus</button>
                </div>
            `;
            
            messagesList.appendChild(div);
            
            if (!users.has(message.userId)) {
                users.set(message.userId, { nickname: message.nickname, gender: message.gender, id: message.userId });
            }
        });
        
        document.querySelectorAll('.delete-msg').forEach(btn => {
            btn.addEventListener('click', () => {
                remove(ref(database, 'messages/' + btn.dataset.id));
            });
        });
        
        renderUsersList();
    });
}

function wipeAllChat() {
    if (confirm('Yakin ingin menghapus semua chat?')) {
        const messagesRef = ref(database, 'messages');
        set(messagesRef, null);
    }
}

function renderUsersList() {
    usersList.innerHTML = '';
    users.forEach((user, id) => {
        const div = document.createElement('div');
        div.className = 'mb-2 p-2 border rounded d-flex justify-content-between align-items-center';
        div.innerHTML = `
            <span>${user.nickname} (${user.gender === 'male' ? 'L' : 'P'})</span>
            <div class="btn-group">
                <button class="btn btn-sm btn-warning mute-user" data-id="${id}">Mute</button>
                <button class="btn btn-sm btn-danger ban-user" data-id="${id}">Ban</button>
            </div>
        `;
        usersList.appendChild(div);
    });
}

function loadFilteredWords() {
    const filteredRef = ref(database, 'filteredWords');
    onValue(filteredRef, (snapshot) => {
        filteredWords = [];
        filteredWordsList.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const word = childSnapshot.val();
            filteredWords.push(word);
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-1 p-1 bg-light rounded';
            div.innerHTML = `
                <span>${escapeHtml(word)}</span>
                <button class="btn btn-sm btn-danger remove-filter" data-id="${childSnapshot.key}">Hapus</button>
            `;
            filteredWordsList.appendChild(div);
        });
        
        document.querySelectorAll('.remove-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                remove(ref(database, 'filteredWords/' + btn.dataset.id));
            });
        });
    });
}

addFilterBtn.addEventListener('click', () => {
    const word = filterWordInput.value.trim().toLowerCase();
    if (word) {
        push(ref(database, 'filteredWords'), word);
        filterWordInput.value = '';
    }
});

sendBigMessageBtn.addEventListener('click', () => {
    const message = bigMessageInput.value.trim();
    const sender = bigMessageSender.value.trim() || 'One Cloud ChitChat';
    if (message) {
        push(ref(database, 'bigMessages'), {
            message: message,
            sender: sender,
            timestamp: Date.now()
        });
        bigMessageInput.value = '';
        bigMessageSender.value = '';
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

wipeChatBtn.addEventListener('click', wipeAllChat);

loadMessages();
loadFilteredWords();
