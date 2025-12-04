// HY Audio Player Extension
(function() {
    console.log('🎵 HY Audio Player extension loading...');
    
    // 等待扩展设置容器
    const waitForContainer = setInterval(() => {
        const container = document.getElementById('extensions_settings');
        if (container) {
            clearInterval(waitForContainer);
            initExtension();
        }
    }, 500);
    
    function initExtension() {
        console.log('🎵 Initializing HY Audio Player...');
        
        // 创建扩展UI
        const html = `
        <div id="hy-audio-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 HY Audio Player</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <p style="margin: 10px 0;">支持网易云音乐的Ins风格播放器</p>
                <button id="open-hy-player" class="menu_button" style="width: 100%; margin: 10px 0;">
                    <i class="fa-solid fa-play"></i> 打开音频播放器
                </button>
            </div>
        </div>`;
        
        // 添加到扩展设置
        document.getElementById('extensions_settings').insertAdjacentHTML('beforeend', html);
        
        // 绑定按钮事件
        document.getElementById('open-hy-player').addEventListener('click', function() {
            // 打开你的播放器
            window.open('/scripts/extensions/third-party/HY-audio-player/index.html', 
                       'audio-player', 
                       'width=800,height=600,resizable=yes,scrollbars=yes');
        });
        
        console.log('🎵 HY Audio Player extension loaded successfully');
    }
})();
