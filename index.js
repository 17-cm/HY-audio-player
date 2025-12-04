/*
 * 音乐播放器扩展入口
 * 版本: 1.0.2
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
        const overlay = document.createElement('div');
        overlay.className = 'help-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2147483647;
            padding: 20px;
            box-sizing: border-box;
            overflow: auto;
        `;
        
        overlay.innerHTML = `
            <div class="help-dialog" style="
                background: var(--SmartThemeBodyColor, #222);
                color: var(--SmartThemeBodyText, #fff);
                border-radius: 15px;
                padding: 25px;
                max-width: 90%;
                width: 500px;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                margin: auto;
            ">
                <button type="button" id="help-close-btn" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: inherit;
                    opacity: 0.7;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                ">×</button>
                
                <h2 style="margin-top: 0;">🎵 音乐播放器使用说明</h2>
                
                <h3>💻 电脑端操作</h3>
                <ul>
                    <li><strong>拖动播放器</strong>：点击顶部灵动岛拖动</li>
                    <li><strong>切换模式</strong>：点击右侧按钮切换窄屏/全屏/律动/纯享模式</li>
                    <li><strong>添加歌曲</strong>：支持本地文件、直链、网易云链接</li>
                    <li><strong>快捷键</strong>：
                        <ul>
                            <li>Alt + P：播放/暂停</li>
                            <li>Alt + N：下一首</li>
                            <li>Alt + B：上一首</li>
                            <li>空格：播放/暂停</li>
                        </ul>
                    </li>
                </ul>
                
                <h3>📱 手机端操作</h3>
                <ul>
                    <li><strong>拖动播放器</strong>：长按顶部灵动岛拖动</li>
                    <li><strong>切换模式</strong>：点击右侧按钮</li>
                    <li><strong>律动模式</strong>：左侧拖动，右侧点击展开</li>
                    <li><strong>添加歌曲</strong>：点击"+"按钮</li>
                </ul>
                
                <h3>🎨 播放器模式</h3>
                <ul>
                    <li><strong>窄屏模式</strong>：默认紧凑显示</li>
                    <li><strong>全屏模式</strong>：展开设置和播放列表</li>
                    <li><strong>律动模式</strong>：最小化为律动图标</li>
                    <li><strong>纯享模式</strong>：全屏歌词显示</li>
                </ul>
                
                <h3>☁️ 网易云音乐</h3>
                <ul>
                    <li>支持歌曲直链导入</li>
                    <li>支持歌单批量导入</li>
                    <li>自动获取歌词和封面</li>
                </ul>
                
                <p style="text-align: center; margin-top: 20px; opacity: 0.7;">
                    版本 1.0.2 | 作者：hy.禾一
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeBtn = overlay.querySelector('#help-close-btn');
        closeBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
            this.style.background = 'rgba(255,255,255,0.1)';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.7';
            this.style.background = 'none';
        });
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
    function bindExtensionEvents() {
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
        
        const helpBtn = document.getElementById('show-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', showHelp);
        }
        
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
    
    window.addEventListener('beforeunload', function() {
        const extensionElement = document.getElementById('music-player-extension');
        if (extensionElement) {
            extensionElement.remove();
        }
    });
    
})();
