console.log('🎵 HY Audio Player 加载中...');

// 创建扩展UI
function createAudioPlayerExtension() {
    const html = `
    <div id="hy-audio-player-extension" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>🎵 HY Audio Player</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <p style="margin-bottom: 10px;">一个支持网易云音乐的Ins风格播放器</p>
            <button id="open-hy-player" class="menu_button" style="width:100%;">
                <i class="fa-solid fa-music"></i> 打开音频播放器
            </button>
        </div>
    </div>`;
    
    // 添加到扩展设置区域
    $('#extensions_settings').append(html);
    
    // 按钮点击事件
    $('#open-hy-player').on('click', function() {
        // 在新窗口打开你的播放器
        window.open('/plugins/HY-audio-player/index.html', 'audio-player', 
            'width=800,height=600,resizable=yes,scrollbars=yes');
    });
}

// 等待页面加载
$(document).ready(function() {
    // 等待扩展设置容器加载
    const checkContainer = setInterval(function() {
        if ($('#extensions_settings').length) {
            clearInterval(checkContainer);
            createAudioPlayerExtension();
            console.log('🎵 HY Audio Player 加载完成');
        }
    }, 500);
});
