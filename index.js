/*
 * 音乐播放器扩展入口
 * 版本: 1.0.3
 * 作者: hy.禾一
 */

(function() {
    'use strict';
    
    console.log('🎵 音乐播放器扩展加载中...');
    
    // 扩展状态
    const ExtensionState = {
        playerHidden: false
    };
    
    // 等待扩展设置容器加载
    const waitForContainer = setInterval(() => {
        const container = document.getElementById('extensions_settings');
        if (container && container.offsetParent !== null) {
            clearInterval(waitForContainer);
            initializeExtension(container);
        }
    }, 500);
    
    function initializeExtension(container) {
        console.log('🎵 初始化音乐播放器扩展...');
        
        loadExtensionSettings();
        createExtensionPanel(container);
        loadPlayerCore();
        bindExtensionEvents();
        
        console.log('✅ 音乐播放器扩展初始化完成');
    }
    
    function loadExtensionSettings() {
        try {
            const saved = localStorage.getItem('music_player_extension_settings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(ExtensionState, settings);
            }
        } catch (error) {
            console.error('加载扩展设置失败:', error);
        }
    }
    
    function saveExtensionSettings() {
        try {
            localStorage.setItem('music_player_extension_settings', JSON.stringify(ExtensionState));
        } catch (error) {
            console.error('保存扩展设置失败:', error);
        }
    }
    
    function createExtensionPanel(container) {
        const html = `
        <div id="music-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 音乐播放器</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content" style="display: none;">
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <input type="checkbox" id="player-hidden-toggle" ${ExtensionState.playerHidden ? 'checked' : ''}>
                        <span>隐藏播放器（音乐继续播放）</span>
                    </label>
                    <small style="opacity: 0.7; display: block; margin-left: 30px;">
                        勾选后播放器界面隐藏，但音乐不会停止
                    </small>
                </div>
                
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%;">
                    <i class="fa-solid fa-question-circle"></i> 使用说明
                </button>
            </div>
        </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    }
    
    function showHelp() {
        // 注入帮助弹窗样式（确保z-index最高）
        if (!document.getElementById('help-dialog-style')) {
            const style = document.createElement('style');
            style.id = 'help-dialog-style';
            style.textContent = `
                .help-dialog-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 2147483647 !important;
                    padding: 20px !important;
                    box-sizing: border-box !important;
                    overflow: auto !important;
                }
                
                .help-dialog {
                    background: var(--SmartThemeBodyColor, #222) !important;
                    color: var(--SmartThemeBodyText, #fff) !important;
                    border-radius: 15px !important;
                    padding: 25px !important;
                    max-width: 90% !important;
                    width: 500px !important;
                    max-height: 85vh !important;
                    overflow-y: auto !important;
                    position: relative !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
                    margin: auto !important;
                    z-index: 2147483647 !important;
                }
                
                .help-dialog h2 {
                    margin-top: 0;
                    font-size: 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 10px;
                }
                
                .help-dialog h3 {
                    font-size: 16px;
                    margin: 20px 0 10px 0;
                    color: #7eb8c9;
                }
                
                .help-dialog ul {
                    padding-left: 20px;
                    margin: 10px 0;
                }
                
                .help-dialog li {
                    margin: 8px 0;
                    line-height: 1.5;
                }
                
                .help-dialog li ul {
                    margin-top: 5px;
                }
                
                .help-close-btn {
                    position: absolute !important;
                    top: 10px !important;
                    right: 10px !important;
                    background: none !important;
                    border: none !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    color: inherit !important;
                    opacity: 0.7 !important;
                    width: 30px !important;
                    height: 30px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 50% !important;
                    transition: all 0.2s !important;
                }
                
                .help-close-btn:hover {
                    opacity: 1 !important;
                    background: rgba(255,255,255,0.1) !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'help-dialog-overlay';
        
        overlay.innerHTML = `
            <div class="help-dialog">
                <button type="button" class="help-close-btn">×</button>
                
                <h2>🎵 音乐播放器使用说明</h2>
                
                <h3>💻 电脑端操作</h3>
                <ul>
                    <li><strong>拖动播放器</strong>：点击顶部灵动岛拖动</li>
                    <li><strong>切换模式</strong>：点击右侧按钮切换窄屏/全屏/律动/纯享模式</li>
                    <li><strong>添加歌曲</strong>：支持本地文件、直链、网易云链接</li>
                    <li><strong>快捷键</strong>：
                        <ul>
                            <li>空格：播放/暂停</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>📱 手机端操作</h3>
                <ul>
                    <li><strong>拖动播放器</strong>：长按顶部灵动岛拖动</li>
                    <li><strong>切换模式</strong>：点击右侧按钮</li>
                    <li><strong>律动模式</strong>：左侧拖动，右侧双击展开</li>
                    <li><strong>添加歌曲</strong>：点击"+"按钮</li>
                </ul>
                
                <h3>🎨 播放器模式</h3>
                <ul>
                    <li><strong>窄屏模式</strong>：默认紧凑显示</li>
                    <li><strong>全屏模式</strong>：展开设置和播放列表</li>
                    <li><strong>律动模式</strong>：最小化为律动图标</li>
                    <li><strong>纯享模式</strong>：全屏歌词显示</li>
                </ul>
                
                <h3>✨ RGB 模式</h3>
                <ul>
                    <li><strong>关闭</strong>：纯色边框</li>
                    <li><strong>单色</strong>：渐变流动 + 呼吸闪烁效果</li>
                    <li><strong>幻彩</strong>：多色随机流动 + 呼吸效果</li>
                </ul>
                
                <h3>☁️ 网易云音乐</h3>
                <ul>
                    <li>支持歌曲直链导入</li>
                    <li>支持歌单批量导入</li>
                    <li>自动获取歌词和封面</li>
                    <li>⚠️ 注意：网易云链接是临时的，可能过期</li>
                </ul>
                
                <p style="text-align: center; margin-top: 20px; opacity: 0.7;">
                    版本 1.0.3 | 作者：hy.禾一
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 关闭按钮事件
        const closeBtn = overlay.querySelector('.help-close-btn');
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
        
        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
    
    function bindExtensionEvents() {
        // 隐藏播放器开关
        const hiddenToggle = document.getElementById('player-hidden-toggle');
        if (hiddenToggle) {
            hiddenToggle.addEventListener('change', (e) => {
                ExtensionState.playerHidden = e.target.checked;
                
                if (window.MusicPlayerApp) {
                    if (ExtensionState.playerHidden) {
                        window.MusicPlayerApp.hideUI();
                    } else {
                        window.MusicPlayerApp.showUI();
                    }
                }
                
                saveExtensionSettings();
            });
        }
        
        // 帮助按钮
        const helpBtn = document.getElementById('show-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', showHelp);
        }
        
        // 抽屉展开/收起
        const drawerToggle = document.querySelector('#music-player-extension .inline-drawer-toggle');
        if (drawerToggle) {
            drawerToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const icon = this.querySelector('.inline-drawer-icon');
                const content = this.nextElementSibling;
                
                if (content) {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    
                    if (icon) {
                        if (isHidden) {
                            icon.classList.remove('down');
                            icon.classList.add('up');
                        } else {
                            icon.classList.remove('up');
                            icon.classList.add('down');
                        }
                    }
                }
            });
        }
    }
    
    function loadPlayerCore() {
        const script = document.createElement('script');
        script.src = '/scripts/extensions/third-party/HY-audio-player/player.js';
        script.onload = () => {
            console.log('✅ 播放器核心加载完成');
            
            // 应用隐藏状态
            setTimeout(() => {
                if (window.MusicPlayerApp) {
                    if (ExtensionState.playerHidden) {
                        window.MusicPlayerApp.hideUI();
                    } else {
                        window.MusicPlayerApp.showUI();
                    }
                }
            }, 500);
        };
        script.onerror = () => {
            console.error('❌ 播放器核心加载失败');
        };
        document.head.appendChild(script);
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        const extensionElement = document.getElementById('music-player-extension');
        if (extensionElement) {
            extensionElement.remove();
        }
    });
    
})();
