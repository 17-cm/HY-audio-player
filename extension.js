// HY Audio Player Extension for SillyTavern - 内嵌模式
(function() {
    console.log('🎵 HY Audio Player extension loading...');
    
    // 等待扩展设置容器加载
    const waitForContainer = setInterval(() => {
        const container = document.getElementById('extensions_settings');
        if (container && container.offsetParent !== null) {
            clearInterval(waitForContainer);
            initializeExtension(container);
        }
    }, 500);
    
    function initializeExtension(container) {
        console.log('🎵 Initializing HY Audio Player extension (Embedded Mode)...');
        
        // 创建扩展UI
        const html = `
        <div id="hy-audio-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 HY Audio Player</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <p style="margin: 10px 0; font-size: 0.9em; color: var(--text_color_secondary);">
                    一个支持网易云音乐的Ins风格播放器
                </p>
                <div class="flex-container flexGap5" style="margin-bottom: 15px;">
                    <button id="toggle-hy-player" class="menu_button" style="flex: 1;">
                        <i class="fa-solid fa-expand"></i> 展开播放器
                    </button>
                    <button id="open-external" class="menu_button" style="flex: 1;">
                        <i class="fa-solid fa-external-link-alt"></i> 独立窗口
                    </button>
                </div>
                <!-- iframe容器，初始隐藏 -->
                <div id="hy-player-iframe-wrapper" style="display: none; transition: all 0.3s ease;">
                    <div style="border: 1px solid var(--border_color); border-radius: 8px; overflow: hidden; margin-bottom: 10px;">
                        <iframe 
                            id="hy-audio-player-iframe"
                            src="/scripts/extensions/third-party/HY-audio-player/index.html"
                            style="width: 100%; height: 650px; border: none; display: block;"
                            title="HY Audio Player"
                            allow="autoplay"
                        ></iframe>
                    </div>
                    <div style="text-align: center; margin-bottom: 5px;">
                        <button id="close-hy-player" class="menu_button" style="width: auto; padding: 5px 15px;">
                            <i class="fa-solid fa-compress"></i> 收起播放器
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
        
        // 绑定按钮事件
        bindEvents();
        
        console.log('🎵 HY Audio Player extension initialized successfully');
    }
    
    function bindEvents() {
        // 展开播放器 (内嵌模式)
        document.getElementById('toggle-hy-player').addEventListener('click', function() {
            const wrapper = document.getElementById('hy-player-iframe-wrapper');
            const iframe = document.getElementById('hy-audio-player-iframe');
            
            wrapper.style.display = 'block';
            this.style.display = 'none';
            
            // 确保iframe正确加载
            setTimeout(() => {
                iframe.src = iframe.src; // 重新加载以确保内容正确显示
            }, 100);
        });
        
        // 收起播放器
        document.getElementById('close-hy-player').addEventListener('click', function() {
            const wrapper = document.getElementById('hy-player-iframe-wrapper');
            wrapper.style.display = 'none';
            document.getElementById('toggle-hy-player').style.display = 'block';
        });
        
        // 独立窗口模式
        document.getElementById('open-external').addEventListener('click', function() {
            window.open(
                '/scripts/extensions/third-party/HY-audio-player/index.html',
                'HY_Audio_Player',
                'width=800,height=700,resizable=yes,scrollbars=yes,location=no'
            );
        });
        
        // 处理inline-drawer的展开/收起
        const drawerHeader = document.querySelector('#hy-audio-player-extension .inline-drawer-toggle');
        if (drawerHeader) {
            drawerHeader.addEventListener('click', function() {
                const icon = this.querySelector('.inline-drawer-icon');
                const content = this.nextElementSibling;
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.classList.remove('down');
                    icon.classList.add('up');
                } else {
                    content.style.display = 'none';
                    icon.classList.remove('up');
                    icon.classList.add('down');
                }
            });
        }
    }
    
    // 清理函数 (如果扩展被卸载)
    window.addEventListener('beforeunload', function() {
        const extensionElement = document.getElementById('hy-audio-player-extension');
        if (extensionElement) {
            extensionElement.remove();
        }
    });
    
})();
