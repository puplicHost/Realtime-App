const socket = io();

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

// Join chatroom
socket.emit('joinRoom', { username, room });

// Display room name in UI
if (roomName) roomName.innerText = room;

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  outputMessage(message);

  // Scroll down
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

// Message submit
if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get message text
    const msg = e.target.elements.msg.value;

    if (!msg) return;

    // Emit message to server
    socket.emit('message', {
      user: username,
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
  });
}

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  if (message.user === username) {
    div.classList.add('my-message'); // Optional class for styling
  }
  div.innerHTML = `<p class="meta">${message.user} <span>${message.time}</span></p>
  <p class="text">${escapeHtml(message.text)}</p>`;
  if (chatMessages) chatMessages.appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  if (roomName) roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  if (userList) {
    userList.innerHTML = `
      ${users.map(user => `<li><i class="fas fa-user-circle"></i> ${user.username}</li>`).join('')}
    `;
  }
}

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}




