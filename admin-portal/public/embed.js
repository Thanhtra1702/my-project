(function () {
    // 1. Lấy cấu hình
    const config = window.bluebotConfig || {};
    const tenantId = config.tenantId;
    const baseUrl = config.baseUrl || 'https://bluebot.vn';
    const primaryColor = config.primaryColor || '#4f46e5';

    if (!tenantId) {
        console.error('Bluebot: Missing tenantId in window.bluebotConfig');
        return;
    }

    // 2. Tạo Styles cho Bubble và Iframe
    const style = document.createElement('style');
    style.innerHTML = `
        #bluebot-chat-wrapper {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: sans-serif;
        }
        #bluebot-bubble-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: ${primaryColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #bluebot-bubble-button:hover {
            transform: scale(1.05);
        }
        #bluebot-bubble-button svg {
            width: 30px;
            height: 30px;
            color: white;
        }
        #bluebot-chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            overflow: hidden;
            display: none;
            flex-direction: column;
            border: 1px solid rgba(0,0,0,0.05);
        }
        #bluebot-chat-window.active {
            display: flex;
            animation: bluebotScaleUp 0.3s ease-out;
        }
        @keyframes bluebotScaleUp {
            from { transform: scale(0.8); opacity: 0; transform-origin: bottom right; }
            to { transform: scale(1); opacity: 1; transform-origin: bottom right; }
        }
        @media (max-width: 480px) {
            #bluebot-chat-window {
                width: calc(100vw - 40px);
                height: calc(100vh - 120px);
            }
        }
    `;
    document.head.appendChild(style);

    // 3. Tạo HTML Elements
    const wrapper = document.createElement('div');
    wrapper.id = 'bluebot-chat-wrapper';

    const chatWindow = document.createElement('div');
    chatWindow.id = 'bluebot-chat-window';
    chatWindow.innerHTML = `<iframe src="${baseUrl}/embed/${tenantId}" style="width:100%; height:100%; border:none;"></iframe>`;

    const bubbleButton = document.createElement('div');
    bubbleButton.id = 'bluebot-bubble-button';
    bubbleButton.innerHTML = `
        <svg id="bluebot-icon-chat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <svg id="bluebot-icon-close" style="display:none;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    `;

    wrapper.appendChild(chatWindow);
    wrapper.appendChild(bubbleButton);
    document.body.appendChild(wrapper);

    // 4. Logic Ẩn/Hiện
    let isOpen = false;
    bubbleButton.onclick = function () {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('active');
            document.getElementById('bluebot-icon-chat').style.display = 'none';
            document.getElementById('bluebot-icon-close').style.display = 'block';
        } else {
            chatWindow.classList.remove('active');
            document.getElementById('bluebot-icon-chat').style.display = 'block';
            document.getElementById('bluebot-icon-close').style.display = 'none';
        }
    };
})();
