// script.js - SillyTavern扩展入口
import { extension_settings } from '../extensions.js';

console.log('🎵 HY Audio Player loading...');

const extensionName = 'hy-audio-player';

// 初始化设置
if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {
        enabled: true,
    };
}

// 创建UI
function createUI() {
    const html = `
    <div id="hy-audio-player-extension" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>HY Audio Player</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <button id="open-player" class="menu_button" style="width:100%;margin-bottom:10px;">
                <i class="fa-solid fa-play"></i> 打开音频播放器
            </button>
            <div class="player-container" style="display:none;">
                <iframe src="/plugins/HY-audio-player/index.html" 
                    style="width:100%; height:500px; border:none; border-radius:5px;"></iframe>
            </div>
        </div>
    </div>`;
    
    $('#extensions_settings').append(html);
    
    $('#open-player').on('click', function() {
        $('.player-container').toggle();
        $(this).find('i').toggleClass('fa-play fa-close');
        $(this).text($(this).text().includes('打开') ? '关闭播放器' : '打开音频播放器');
    });
}

// 等待页面加载
jQuery(async () => {
    const waitForContainer = setInterval(() => {
        if ($('#extensions_settings').length) {
            clearInterval(waitForContainer);
            createUI();
            console.log('🎵 HY Audio Player loaded successfully');
        }
    }, 100);
});
