/*
 * 音乐播放器扩展入口
 * 版本: 1.0.1
 * 作者: hy.禾一
 */

(function() {
    'use strict';
    
    console.log('🎵 音乐播放器扩展加载中...');
    
    // 扩展状态
    const ExtensionState = {
        floatIconEnabled: true,
        floatIconColor: '#000000',
        autoAdaptTheme: true,
        playerVisible: false,
        lastPlayerMode: 'normal' // normal, rhythm, pure
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
        
        // 加载保存的设置
        loadExtensionSettings();
        
        // 创建扩展设置面板
        createExtensionPanel(container);
        
        // 创建悬浮图标
        createFloatIcon();
        
        // 加载播放器核心
        loadPlayerCore();
        
        // 绑定事件
        bindExtensionEvents();
        
        console.log('✅ 音乐播放器扩展初始化完成');
    }
    
    // 加载扩展设置
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
    
    // 保存扩展设置
    function saveExtensionSettings() {
        try {
            localStorage.setItem('music_player_extension_settings', JSON.stringify(ExtensionState));
        } catch (error) {
            console.error('保存扩展设置失败:', error);
        }
    }
    
    // 创建扩展设置面板
    function createExtensionPanel(container) {
        const html = `
        <div id="music-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🎵 音乐播放器</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <input type="checkbox" id="float-icon-toggle" ${ExtensionState.floatIconEnabled ? 'checked' : ''}>
                        <span>显示悬浮图标</span>
                    </label>
                    
                    <div id="icon-settings" style="${ExtensionState.floatIconEnabled ? '' : 'display: none;'}">
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span>图标颜色：</span>
                            <input type="color" id="icon-color-picker" value="${ExtensionState.floatIconColor}" style="width: 50px; height: 30px;">
                        </label>
                        
                        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <input type="checkbox" id="auto-adapt-theme" ${ExtensionState.autoAdaptTheme ? 'checked' : ''}>
                            <span>自动适配主题</span>
                        </label>
                    </div>
                </div>
                
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%;">
                    <i class="fa-solid fa-question-circle"></i> 使用说明
                </button>
            </div>
        </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    }
    
    // 创建悬浮图标
    function createFloatIcon() {
        const icon = document.createElement('div');
        icon.id = 'music-player-float-icon';
        icon.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 50px;
            height: 50px;
            cursor: pointer;
            z-index: 9999;
            transition: all 0.3s;
            display: ${ExtensionState.floatIconEnabled ? 'block' : 'none'};
        `;
        
        icon.innerHTML = `
            <img src="/scripts/extensions/third-party/HY-audio-player/icon.png" 
                 style="width: 100%; height: 100%; object-fit: contain;"
                 id="float-icon-img">
        `;
        
        document.body.appendChild(icon);
        
        // 应用图标颜色
        updateIconColor();
        
        // 点击事件
        icon.addEventListener('click', togglePlayer);
    }
    
    // 更新图标颜色
    function updateIconColor() {
        const img = document.getElementById('float-icon-img');
        if (!img) return;
        
        if (ExtensionState.autoAdaptTheme) {
            // 自动适配主题
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            img.style.filter = isDark ? 'invert(1)' : 'invert(0)';
        } else {
            // 使用自定义颜色
            const color = ExtensionState.floatIconColor;
            const rgb = hexToRgb(color);
            if (rgb) {
                const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
                const invert = brightness > 128 ? 0 : 1;
                img.style.filter = `invert(${invert}) sepia(1) saturate(5) hue-rotate(${getHueRotation(color)}deg)`;
            }
        }
    }
    
    // 颜色转换
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    function getHueRotation(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
            const d = max - min;
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
        }
        return h * 360;
    }
    
    // 切换播放器显示
    function togglePlayer() {
        ExtensionState.playerVisible = !ExtensionState.playerVisible;
        
        if (window.MusicPlayerApp) {
            if (ExtensionState.playerVisible) {
                window.MusicPlayerApp.show(ExtensionState.lastPlayerMode);
            } else {
                ExtensionState.lastPlayerMode = window.MusicPlayerApp.getCurrentMode();
                window.MusicPlayerApp.hide();
            }
        }
        
        saveExtensionSettings();
    }
    
    // 显示使用说明
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
            z-index: 10000;
        `;
        
        overlay.innerHTML = `
            <div class="help-dialog" style="
                background: var(--SmartThemeBodyColor, #222);
                color: var(--SmartThemeBodyText, #fff);
                border-radius: 15px;
                padding: 25px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
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
                    版本 1.0.1 | 作者：hy.禾一
                </p>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 关闭按钮
        overlay.querySelector('#help-close-btn').addEventListener('click', () => {
            overlay.remove();
        });
        
        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
    
    // 绑定扩展事件
    function bindExtensionEvents() {
        // 悬浮图标开关
        const floatToggle = document.getElementById('float-icon-toggle');
        if (floatToggle) {
            floatToggle.addEventListener('change', (e) => {
                ExtensionState.floatIconEnabled = e.target.checked;
                const icon = document.getElementById('music-player-float-icon');
                const settings = document.getElementById('icon-settings');
                if (icon) icon.style.display = e.target.checked ? 'block' : 'none';
                if (settings) settings.style.display = e.target.checked ? 'block' : 'none';
                saveExtensionSettings();
            });
        }
        
        // 图标颜色选择
        const colorPicker = document.getElementById('icon-color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                ExtensionState.floatIconColor = e.target.value;
                updateIconColor();
                saveExtensionSettings();
            });
        }
        
        // 自动适配主题
        const autoAdapt = document.getElementById('auto-adapt-theme');
        if (autoAdapt) {
            autoAdapt.addEventListener('change', (e) => {
                ExtensionState.autoAdaptTheme = e.target.checked;
                updateIconColor();
                saveExtensionSettings();
            });
        }
        
        // 使用说明按钮
        const helpBtn = document.getElementById('show-help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', showHelp);
        }
        
        // 扩展面板展开/收起
        const drawerToggle = document.querySelector('#music-player-extension .inline-drawer-toggle');
        if (drawerToggle) {
            drawerToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('.inline-drawer-icon');
                const content = this.nextElementSibling;
                
                if (content) {
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        if (icon) {
                            icon.classList.remove('down');
                            icon.classList.add('up');
                        }
                    } else {
                        content.style.display = 'none';
                        if (icon) {
                            icon.classList.remove('up');
                            icon.classList.add('down');
                        }
                    }
                }
            });
        }
        
        // 监听主题变化
        if (ExtensionState.autoAdaptTheme) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateIconColor);
        }
    }
    
    // 加载播放器核心
    function loadPlayerCore() {
        const script = document.createElement('script');
        script.src = '/scripts/extensions/third-party/HY-audio-player/player.js';
        script.onload = () => {
            console.log('✅ 播放器核心加载完成');
        };
        script.onerror = () => {
            console.error('❌ 播放器核心加载失败');
        };
        document.head.appendChild(script);
    }
    
    // 清理函数
    window.addEventListener('beforeunload', function() {
        const extensionElement = document.getElementById('music-player-extension');
        if (extensionElement) {
            extensionElement.remove();
        }
        
        const floatIcon = document.getElementById('music-player-float-icon');
        if (floatIcon) {
            floatIcon.remove();
        }
    });
    
})();
