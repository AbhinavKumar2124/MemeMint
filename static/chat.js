document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const newChatButton = document.getElementById('newChat');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.getElementById('closeModal');
    const topicButtons = document.querySelectorAll('.topic-btn');
    const chatHistory = document.getElementById('chatHistory');
    const styleButtons = document.querySelectorAll('.style-buttons button');
    const memePreview = document.querySelector('.meme-preview');
    const previewImage = document.getElementById('previewImage');
    const previewPlaceholder = document.querySelector('.preview-placeholder');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownContent = document.querySelector('.dropdown-content');

    // Theme Toggle Functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference or use dark theme as default
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });

    // Handle history dropdown
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isVisible ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownToggle.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
        }
    });

    // Close modal when clicking outside
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal || e.target.classList.contains('modal-backdrop')) {
            imageModal.classList.remove('show');
        }
    });

    // Update preview image
    function updatePreview(imageUrl) {
        console.log('Updating preview with image:', imageUrl);
        const shareOptions = document.querySelector('.share-options');
        console.log('Share options element:', shareOptions);
        
        previewImage.src = imageUrl;
        previewImage.classList.remove('hidden');
        previewPlaceholder.classList.add('hidden');
        
        if (shareOptions) {
            console.log('Adding visible class to share options');
            shareOptions.classList.add('visible');
            console.log('Share options classes:', shareOptions.classList);
        } else {
            console.error('Share options element not found!');
        }
    }

    // Hide preview
    function hidePreview() {
        console.log('Hiding preview');
        const shareOptions = document.querySelector('.share-options');
        
        previewImage.classList.add('hidden');
        previewPlaceholder.classList.remove('hidden');
        
        if (shareOptions) {
            console.log('Removing visible class from share options');
            shareOptions.classList.remove('visible');
        }
    }

    // Load chat history
    async function loadChatHistory() {
        try {
            const response = await fetch('/chat-history');
            const history = await response.json();
            
            // Clear existing history
            chatHistory.innerHTML = '';
            
            // Add history items in reverse chronological order
            history.reverse().forEach((chat, index) => {
                if (chat && chat.length > 0) {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                    
                    // Get the first message from the chat
                    const firstMessage = chat[0].user_message;
                    const truncatedMessage = firstMessage.length > 30 
                        ? firstMessage.substring(0, 30) + '...' 
                        : firstMessage;
                    
                historyItem.innerHTML = `
                    <i class="fas fa-comment-alt mr-2"></i>
                        <span class="truncate">${truncatedMessage}</span>
                `;
                    
                historyItem.addEventListener('click', () => {
                    // Clear current chat messages
                    chatMessages.innerHTML = '';
                    
                    // Load all messages from the selected chat
                    chat.forEach(item => {
                            if (item.type === 'user') {
                        addMessage(item.user_message, 'user');
                            } else if (item.type === 'assistant') {
                        if (item.image_url) {
                            addMessage('', 'assistant', item.image_url, true);
                            updatePreview(item.image_url);
                                } else {
                                    addMessage(item.user_message, 'assistant');
                                }
                        }
                    });
                    
                    // Set current input values
                    userInput.value = chat[chat.length - 1].user_message;
                        
                        // Set active style buttons if it's a meme chat
                        if (chat[0].is_meme) {
                            setActiveStyleButton('aspectRatio', chat[0].aspect_ratio);
                            setActiveStyleButton('style', chat[0].style);
                        }
                    
                    // Close dropdown
                    dropdownContent.style.display = 'none';
                });
                    
                chatHistory.appendChild(historyItem);
                }
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
            showError('Failed to load chat history');
        }
    }

    // Set active style button
    function setActiveStyleButton(type, value) {
        const buttons = document.querySelectorAll(`.style-group:nth-child(${type === 'aspectRatio' ? '1' : '2'}) .style-buttons button`);
        buttons.forEach(button => {
            if (button.textContent.toLowerCase() === value.toLowerCase()) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // Welcome message handling
    const welcomeMessage = document.querySelector('.welcome-message');
    let hasUserInteracted = false;

    function hideWelcomeMessage() {
        if (welcomeMessage && !hasUserInteracted) {
            welcomeMessage.classList.add('hidden');
            hasUserInteracted = true;
        }
    }

    // Handle topic buttons
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const topic = button.textContent.trim();
            const message = `Generate a meme about ${topic}`;
            userInput.value = message;
            hideWelcomeMessage();
            sendMessage();
        });
    });

    // Handle style buttons
    styleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const group = button.closest('.style-buttons');
            group.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Handle image preview
    function showImagePreview(imageUrl) {
        modalImage.src = imageUrl;
        imageModal.classList.add('show');
    }

    closeModal.addEventListener('click', () => {
        imageModal.classList.remove('show');
    });

    // Add preference handling
    let currentPreference = 'speed';

    document.querySelectorAll('.preference-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.preference-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPreference = button.dataset.preference;
        });
    });

    // Handle Enter key press
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Update send button click handler
    sendButton.addEventListener('click', sendMessage);

    // Handle message sending
    async function sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        if (!message) return;

        console.log('Starting message send:', message);
        hideWelcomeMessage();

        // Add user message to chat
        console.log('Adding user message');
        addMessage(message, 'user');

        // Clear input
        userInput.value = '';

        let loadingMessage; // Declare loadingMessage outside the try block

        try {
            if (message.startsWith('.meme ')) {
                // Handle meme generation
                console.log('Generating meme');
                loadingMessage = addMessage('Generating your meme...', 'assistant');
                loadingMessage.classList.add('loading');

                // Get current style and aspect ratio
                const currentStyle = document.querySelector('.style-group:nth-child(2) .style-buttons .active').textContent.toLowerCase();
                const currentAspectRatio = document.querySelector('.style-group:first-child .style-buttons .active').textContent;

            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: message,
                    aspect_ratio: currentAspectRatio,
                    style: currentStyle,
                    preference: currentPreference
                })
            });

            const data = await response.json();
            console.log('Received response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Remove loading message
            console.log('Removing loading message');
            loadingMessage.remove();
            
            // Add AI response to chat
            console.log('Adding AI response with image');
                addMessage('', 'assistant', data.image_url, true);
                // Update preview
            console.log('Updating preview');
                updatePreview(data.image_url);
            } else {
                // Handle regular chat message
                console.log('Sending regular chat message');
                loadingMessage = addMessage('Thinking...', 'assistant');
                loadingMessage.classList.add('loading');

                const response = await fetch('/chat-message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message
                    })
                });

                const data = await response.json();
                console.log('Received response:', data);
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Remove loading message
                loadingMessage.remove();
                
                // Add AI response to chat
                addMessage(data.response, 'assistant');
            }
            
            // Only reload chat history when needed (e.g., after new chat)
            // await loadCurrentChat();
            // await loadChatHistory();
        } catch (error) {
            console.error('Error:', error);
            // Remove loading message if it exists
            if (loadingMessage) {
            loadingMessage.remove();
            }
            showError('Sorry, there was an error processing your message. Please try again.');
        }
    }

    function addMessage(text, sender, imageUrl = null, isThumbnail = false) {
        console.log('Adding message:', { text, sender, imageUrl, isThumbnail });
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (imageUrl) {
            console.log('Adding image to message');
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.className = isThumbnail ? 'thumbnail' : 'full-image';
            thumbnail.addEventListener('click', () => showImagePreview(imageUrl));
            messageContent.appendChild(thumbnail);
        } else if (text) {
            console.log('Adding text to message');
            // Parse markdown and set as innerHTML
            messageContent.innerHTML = marked.parse(text);
            
            // Add markdown-specific styling
            messageContent.classList.add('markdown-content');
            
            // Add click handlers for links
            messageContent.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
        }

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-exclamation-circle"></i>
                ${message}
            </div>
        `;
        chatMessages.appendChild(errorDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load current chat
    async function loadCurrentChat() {
        try {
            const response = await fetch('/current-chat');
            const currentChat = await response.json();
            
            // Only clear and load messages if there are actual messages
            if (currentChat && currentChat.length > 0) {
                // Clear current chat messages
                chatMessages.innerHTML = '';
                
                // Load all messages from current chat
                currentChat.forEach(item => {
                    if (item.type === 'user') {
                    // Add user message
                    addMessage(item.user_message, 'user');
                    } else if (item.type === 'assistant') {
                        // Add assistant message
                    if (item.image_url) {
                        addMessage('', 'assistant', item.image_url, true);
                        // Update preview
                        updatePreview(item.image_url);
                        } else {
                            addMessage(item.user_message, 'assistant');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading current chat:', error);
            showError('Failed to load current chat');
        }
    }

    // Load initial chat history and current chat
    loadChatHistory();
    loadCurrentChat();

    // Handle new chat
    newChatButton.addEventListener('click', async () => {
        try {
            // Save current chat to history
            await fetch('/new-chat', {
                method: 'POST'
            });
            
            // Clear chat messages and input
            chatMessages.innerHTML = '';
            userInput.value = '';
            hidePreview();
            
            // Reset style buttons
            setActiveStyleButton('aspectRatio', '1:1');
            setActiveStyleButton('style', 'cartoon');
            
            // Reload chat history
            await loadChatHistory();
        } catch (error) {
            console.error('Error creating new chat:', error);
            showError('Failed to create new chat');
        }
    });

    // Share functionality
    document.getElementById('shareBtn').addEventListener('click', async () => {
        const img = document.getElementById('previewImage');
        if (img.src) {
            try {
                if (navigator.share) {
                    // For mobile devices with Web Share API
                    await navigator.share({
                        title: 'MemeMint',
                        text: 'Check out this meme I created!',
                        url: img.src
                    });
                } else {
                    // For desktop browsers
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    const file = new File([blob], 'meme.png', { type: 'image/png' });
                    
                    if (navigator.clipboard && navigator.clipboard.write) {
                        // Try to copy image to clipboard
                        try {
                            await navigator.clipboard.write([
                                new ClipboardItem({
                                    'image/png': file
                                })
                            ]);
                            showToast('Image copied to clipboard!');
                        } catch (err) {
                            // Fallback to copying URL
                            await navigator.clipboard.writeText(img.src);
                            showToast('Link copied to clipboard!');
                        }
                    } else {
                        // Fallback to downloading
                        const link = document.createElement('a');
                        link.href = img.src;
                        link.download = 'meme-mint-' + Date.now() + '.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showToast('Image downloaded!');
                    }
                }
            } catch (err) {
                console.error('Sharing failed:', err);
                showToast('Sharing failed. Please try again.');
            }
        } else {
            showToast('No meme to share yet!');
        }
    });

    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
        const img = document.getElementById('previewImage');
        if (img.src) {
            try {
                await navigator.clipboard.writeText(img.src);
                showToast('Link copied to clipboard!');
            } catch (err) {
                showToast('Failed to copy link');
            }
        }
    });

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}); 