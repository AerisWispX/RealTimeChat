window.onload = function () {
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    var chatInstance = getQueryParam('instance') || 'defaultInstance';

    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAoe85bjSIeIOHqlFSgg_7lp6kSwoju-Pk",
    authDomain: "darkdevilcodex1.firebaseapp.com",
    databaseURL: "https://darkdevilcodex1-default-rtdb.firebaseio.com",
    projectId: "darkdevilcodex1",
    storageBucket: "darkdevilcodex1.firebasestorage.app",
    messagingSenderId: "696597319137",
    appId: "1:696597319137:web:b972902d9acfa042d116a0",
    measurementId: "G-GZPNC2PJSP"
  };
    firebase.initializeApp(firebaseConfig);
    var db = firebase.database();

    function generateRandomName() {
        const names = ['John', 'Jane', 'Alex', 'Sam', 'Taylor', 'Jordan', 'Chris', 'Morgan', 'Casey', 'Riley'];
        return names[Math.floor(Math.random() * names.length)];
    }

    function generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    const MEME_CHAT = {
        userId: generateRandomName(),
        color: generateRandomColor(),
        avatar: '',
        pinnedMessageHidden: false,

        sendMessage: function (message) {
            db.ref('chat_instances/' + chatInstance + '/messages').push({
                userId: this.userId,
                color: this.color,
                avatar: this.avatar,
                message: message
            });
        },

        sendEmoji: function (emoji) {
            db.ref('chat_instances/' + chatInstance + '/likes').push({
                userId: this.userId,
                color: this.color,
                emoji: emoji
            });
        },

        createBubble: function (emoji) {
            var bubbleContainer = document.querySelector('.bubble-container');
            var bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.textContent = emoji;

            bubble.style.left = Math.random() * 100 + '%';

            bubbleContainer.appendChild(bubble);

            setTimeout(function () {
                bubble.remove();
            }, 2000);
        },

        votePoll: function (pollId, optionIndex) {
            db.ref('chat_instances/' + chatInstance + '/polls/' + pollId + '/votes/' + this.userId).set(optionIndex);
        },

        replyToMessage: function (messageId, replyContent) {
            db.ref('chat_instances/' + chatInstance + '/messages').push({
                userId: this.userId,
                color: this.color,
                avatar: this.avatar,
                message: replyContent,
                replyTo: messageId
            });
        },

        setUserStatus: function (status) {
            db.ref('chat_instances/' + chatInstance + '/users/' + this.userId).set({
                color: this.color,
                avatar: this.avatar,
                status: status
            });
        },

        setTypingStatus: function (isTyping) {
            db.ref('chat_instances/' + chatInstance + '/typing/' + this.userId).set(isTyping);
        },

        hidePinnedMessage: function() {
            this.pinnedMessageHidden = true;
            var pinnedMessageContainer = document.getElementById('pinned_message_container');
            if (pinnedMessageContainer) {
                pinnedMessageContainer.style.display = 'none';
            }
        },

        updateUserProfile: function (newUsername, newAvatar) {
            if (newUsername) this.userId = newUsername;
            if (newAvatar) this.avatar = newAvatar;
            this.setUserStatus('online');
            db.ref('chat_instances/' + chatInstance + '/users/' + this.userId).update({
                color: this.color,
                avatar: this.avatar
            });
        }
    };

    var chatInput = document.getElementById('chat_input');
    var chatInputSend = document.getElementById('chat_input_send');
    var likeButton = document.getElementById('like_button');
    var emojiPicker = document.getElementById('emoji_picker');
    var chatContentContainer = document.getElementById('chat_content_container');
    var userSettings = document.getElementById('user_settings');
    var settingsModal = document.getElementById('settings_modal');
    var closeSettings = document.getElementById('close_settings');
    var saveSettings = document.getElementById('save_settings');
    var usernameInput = document.getElementById('username_input');
    var avatarInput = document.getElementById('avatar_input');

    chatInput.addEventListener('input', function () {
        chatInputSend.disabled = !chatInput.value.trim();
    });

    chatInputSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    likeButton.addEventListener('click', function () {
        emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function (event) {
        if (!emojiPicker.contains(event.target) && event.target !== likeButton) {
            emojiPicker.style.display = 'none';
        }
    });

    emojiPicker.addEventListener('click', function (event) {
        if (event.target.classList.contains('emoji')) {
            var emoji = event.target.textContent;
            MEME_CHAT.sendEmoji(emoji);
        }
    });

    userSettings.addEventListener('click', function() {
        settingsModal.style.display = settingsModal.style.display === 'block' ? 'none' : 'block';
    });

    closeSettings.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    saveSettings.addEventListener('click', function() {
        var newUsername = usernameInput.value.trim();
        var newAvatar = avatarInput.value.trim();
        MEME_CHAT.updateUserProfile(newUsername, newAvatar);
        settingsModal.style.display = 'none';
    });

    document.addEventListener('click', function(event) {
        if (!settingsModal.contains(event.target) && event.target !== userSettings) {
            settingsModal.style.display = 'none';
        }
    });

    window.addEventListener('beforeunload', function () {
        MEME_CHAT.setUserStatus('offline');
    });

    MEME_CHAT.setUserStatus('online');

    var typingTimer;
    chatInput.addEventListener('input', function () {
        clearTimeout(typingTimer);
        MEME_CHAT.setTypingStatus(true);

        typingTimer = setTimeout(function () {
            MEME_CHAT.setTypingStatus(false);
        }, 1000);
    });

    db.ref('chat_instances/' + chatInstance + '/likes').on('child_added', function (snapshot) {
        var emojiData = snapshot.val();
        MEME_CHAT.createBubble(emojiData.emoji);
    });

    db.ref('chat_instances/' + chatInstance + '/messages').on('child_added', function (snapshot) {
        var messageData = snapshot.val();
        displayMessage(messageData, snapshot.key);
    });

    db.ref('chat_instances/' + chatInstance + '/pinnedMessage').on('value', function (snapshot) {
        var pinnedMessageId = snapshot.val();
        if (pinnedMessageId && !MEME_CHAT.pinnedMessageHidden) {
            db.ref('chat_instances/' + chatInstance + '/messages/' + pinnedMessageId).once('value', function (messageSnapshot) {
                var messageData = messageSnapshot.val();
                if (messageData) {
                    displayPinnedMessage(messageData);
                }
            });
        } else {
            var pinnedMessageContainer = document.getElementById('pinned_message_container');
            if (pinnedMessageContainer) {
                pinnedMessageContainer.style.display = 'none';
            }
        }
    });

    db.ref('chat_instances/' + chatInstance + '/polls').on('child_added', function (snapshot) {
        var pollData = snapshot.val();
        displayPoll(pollData, snapshot.key);
    });

    db.ref('chat_instances/' + chatInstance + '/typing').on('value', function (snapshot) {
        updateTypingIndicator(snapshot.val());
    });

    function displayMessage(messageData, messageId) {
        var messageContainer = document.createElement('div');
        messageContainer.classList.add('message_container');
        messageContainer.dataset.messageId = messageId;

        var userContainer = document.createElement('div');
        userContainer.classList.add('message_user_container');
        userContainer.style.color = messageData.color;

        var statusSpan = document.createElement('span');
        statusSpan.classList.add('user_status', 'online');
        userContainer.appendChild(statusSpan);

        if (messageData.avatar) {
            var avatarImg = document.createElement('img');
            avatarImg.src = messageData.avatar;
            avatarImg.classList.add('user_avatar');
            userContainer.appendChild(avatarImg);
        }

        userContainer.appendChild(document.createTextNode(messageData.userId));

        var contentContainer = document.createElement('div');
        contentContainer.classList.add('message_content_container');
        contentContainer.textContent = messageData.message;

        messageContainer.appendChild(userContainer);
        messageContainer.appendChild(contentContainer);

        if (messageData.replyTo) {
            db.ref('chat_instances/' + chatInstance + '/messages/' + messageData.replyTo).once('value', function (replySnapshot) {
                var replyData = replySnapshot.val();
                if (replyData) {
                    var replyContainer = document.createElement('div');
                    replyContainer.classList.add('reply_container');
                    replyContainer.textContent = `${replyData.userId}: ${replyData.message}`;
                    contentContainer.insertBefore(replyContainer, contentContainer.firstChild);
                }
            });
        }

        var actionsContainer = document.createElement('div');
        actionsContainer.classList.add('message_actions');

        var replyButton = document.createElement('button');
        replyButton.classList.add('message_action');
        replyButton.textContent = 'Reply';
        replyButton.addEventListener('click', function () {
            chatInput.value = `@${messageData.userId} `;
            chatInput.dataset.replyTo = messageId;
            chatInput.focus();
        });

        actionsContainer.appendChild(replyButton);
        messageContainer.appendChild(actionsContainer);

        chatContentContainer.appendChild(messageContainer);

        chatContentContainer.scrollTop = chatContentContainer.scrollHeight;
    }
    const themeSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const chatContainer = document.getElementById('chat_container');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        chatContainer.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeSwitch.checked = true;
        }
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            chatContainer.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
            localStorage.setItem('theme', 'dark');
        } else {
            chatContainer.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }

    function switchTheme(e) {
        if (e.target.checked) {
            chatContainer.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            chatContainer.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }    
    }

    themeSwitch.addEventListener('change', switchTheme, false);


    function displayPinnedMessage(messageData) {
        var existingPinnedMessage = document.getElementById('pinned_message_container');
        if (existingPinnedMessage) {
            existingPinnedMessage.remove();
        }

        var pinnedMessageContainer = document.createElement('div');
        pinnedMessageContainer.id = 'pinned_message_container';
        pinnedMessageContainer.classList.add('pinned_message');

        var pinnedIcon = document.createElement('span');
        pinnedIcon.textContent = '📌 ';

        var userContainer = document.createElement('span');
        userContainer.style.color = messageData.color;
        userContainer.textContent = messageData.userId + ': ';

        var contentContainer = document.createElement('span');
        contentContainer.textContent = messageData.message;

        var closeButton = document.createElement('button');
        closeButton.textContent = '✖';
        closeButton.classList.add('close_button');
        closeButton.addEventListener('click', function() {
            MEME_CHAT.hidePinnedMessage();
        });

        pinnedMessageContainer.appendChild(pinnedIcon);
        pinnedMessageContainer.appendChild(userContainer);
        pinnedMessageContainer.appendChild(contentContainer);
        pinnedMessageContainer.appendChild(closeButton);

        chatContentContainer.insertBefore(pinnedMessageContainer, chatContentContainer.firstChild);
    }

    function displayPoll(pollData, pollId) {
        var pollContainer = document.createElement('div');
        pollContainer.classList.add('poll_container');

        var questionElement = document.createElement('div');
        questionElement.classList.add('poll_question');
        questionElement.textContent = pollData.question;
        pollContainer.appendChild(questionElement);

        pollData.options.forEach((option, index) => {
            var optionElement = document.createElement('div');
            optionElement.classList.add('poll_option');
            optionElement.textContent = option;
            optionElement.addEventListener('click', function() {
                MEME_CHAT.votePoll(pollId, index);
            });
            pollContainer.appendChild(optionElement);
        });

        chatContentContainer.appendChild(pollContainer);
        chatContentContainer.scrollTop = chatContentContainer.scrollHeight;

        db.ref('chat_instances/' + chatInstance + '/polls/' + pollId + '/votes').on('value', function(snapshot) {
            var votes = snapshot.val() || {};
            updatePollResults(pollContainer, votes, pollData.options);
        });
    }

    function updatePollResults(pollContainer, votes, options) {
        var totalVotes = Object.keys(votes).length;
        var optionCounts = options.map(() => 0);

        Object.values(votes).forEach(vote => {
            if (vote >= 0 && vote < options.length) {
                optionCounts[vote]++;
            }
        });

        var optionElements = pollContainer.querySelectorAll('.poll_option');
        optionElements.forEach((optionElement, index) => {
            var voteCount = optionCounts[index];
            var percentage = totalVotes > 0 ? (voteCount / totalVotes * 100).toFixed(1) : 0;
            optionElement.textContent = `${options[index]} (${voteCount} votes, ${percentage}%)`;
        });
    }

    function sendMessage() {
        var message = chatInput.value.trim();
        if (message) {
            var replyTo = chatInput.dataset.replyTo;
            if (replyTo) {
                MEME_CHAT.replyToMessage(replyTo, message);
                delete chatInput.dataset.replyTo;
            } else {
                MEME_CHAT.sendMessage(message);
            }
            chatInput.value = '';
            chatInputSend.disabled = true;
        }
    }
    

        function updateTypingIndicator(typingUsers) {
            var typingIndicator = document.getElementById('typing_indicator');
            var typingUserIds = Object.keys(typingUsers).filter(userId => typingUsers[userId] && userId !== MEME_CHAT.userId);

            if (typingUserIds.length > 0) {
                typingIndicator.textContent = `${typingUserIds.join(', ')} ${typingUserIds.length === 1 ? 'is' : 'are'} typing...`;
            } else {
                typingIndicator.textContent = '';
            }
        }
    };
