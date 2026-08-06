/**
 * 音乐播放器扩展入口
 * 版本: 1.0.7
 * 作者: hy.禾一
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';
const EXTENSION_FOLDER = 'hy-yybfq';

console.log('🎵 音乐播放器扩展加载中...');

// ============================================================
// 模块加载
// ============================================================

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadAllModules() {
    // basePath 改为根目录
    const basePath = `/scripts/extensions/third-party/${EXTENSION_FOLDER}/`;
    try {
        await loadScript(basePath + 'js/utils.js');
        await loadScript(basePath + 'api/wyy.js');
        await loadScript(basePath + 'api/qs.js');
        await loadScript(basePath + 'js/core.js');
        await loadScript(basePath + 'js/ui-core.js');
        await loadScript(basePath + 'js/ui-helpers.js');
        await loadScript(basePath + 'js/ui-playlist.js');
        await loadScript(basePath + 'js/ui-events.js');
        initPlayer();
    } catch (error) {
        console.error('❌ 模块加载失败:', error);
    }
}

// ============================================================
// 设置管理
// ============================================================

function getExtensionSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = { miniIconVisible: true };
    }
    return extension_settings[EXTENSION_NAME];
}

function saveExtensionSettings() {
    saveSettingsDebounced();
}

// ============================================================
// 读取版本号
// ============================================================

function getVersion() {
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) {
        try {
            const href = manifest.href;
            const versionMatch = href.match(/v=([\d.]+)/);
            if (versionMatch) return versionMatch[1];
        } catch (e) {}
    }
    return '1.0.7';
}

// ============================================================
// 绑定扩展面板事件
// ============================================================

function bindExtensionEvents() {
    // 已由 createExtensionPanel 内部绑定
    // 保留空函数以防 initPlayer 调用
}

// ============================================================
// 初始化
// ============================================================

function initPlayer() {
    if (typeof window.loadCSS === 'function') window.loadCSS();
    if (typeof window.createUI === 'function') window.createUI();
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.init === 'function') {
        window.MusicPlayerCore.init();
    }

    setTimeout(() => {
        const settings = getExtensionSettings();
        const icon = document.getElementById('player-mini-icon');
        if (icon) {
            icon.style.display = settings.miniIconVisible !== false ? 'flex' : 'none';
        }
    }, 300);

    bindExtensionEvents();
    console.log('✅ 音乐播放器扩展初始化完成');
}

// ============================================================
// 创建扩展面板
// ============================================================

function createExtensionPanel() {
    const container = document.getElementById('extensions_settings');
    if (!container) return;

    const settings = getExtensionSettings();
    const version = getVersion();

    const html = `
        <div id="music-player-extension" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b style="color: #000000;">🎵 音乐播放器</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down" style="color: #000000;"></div>
            </div>
            <div class="inline-drawer-content" style="display: none;">

                <!-- 最小化控制 -->
                <button type="button" id="mini-icon-toggle-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    ${settings.miniIconVisible !== false ? '隐藏最小化图标' : '显示最小化图标'}
                </button>

                <!-- 通道检测 -->
                <button type="button" id="test-channels-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    通道检测
                </button>

                <!-- 使用说明 -->
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    使用说明
                </button>

                <!-- 注脚 + 版本号 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                    <small style="opacity: 0.5; font-size: 11px; letter-spacing: 0.5px; color: #000000;">
                        𓂃𓂃𓂃𓊝𓄹𓄺𓂃𓂃𓂃 hy.禾一
                    </small>
                    <small style="opacity: 0.5; font-size: 11px; color: #000000;">
                        版本：${version}
                    </small>
                </div>

            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // ===== 事件绑定 =====
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

    // 最小化控制按钮
    const miniToggleBtn = document.getElementById('mini-icon-toggle-btn');
    if (miniToggleBtn) {
        miniToggleBtn.addEventListener('click', () => {
            const settings = getExtensionSettings();
            settings.miniIconVisible = !settings.miniIconVisible;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();

            const icon = document.getElementById('player-mini-icon');
            if (icon) {
                icon.style.display = settings.miniIconVisible ? 'flex' : 'none';
            }

            miniToggleBtn.textContent = settings.miniIconVisible ? '隐藏最小化图标' : '显示最小化图标';
        });
    }

    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }

    const testBtn = document.getElementById('test-channels-btn');
    if (testBtn) {
        testBtn.addEventListener('click', showChannelTestDialog);
    }
}

// ============================================================
// 通道检测系统
// ============================================================

function showChannelTestDialog() {
    const overlay = window.createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">选择检测通道</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="platform-btn" data-platform="qishui" style="
                    padding: 12px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">汽水音乐通道检测</button>
                <button class="platform-btn" data-platform="netease" style="
                    padding: 12px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">网易云通道检测</button>
                <button id="test-dialog-cancel" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e8e8e8'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#f5f5f5'; });
        btn.onclick = () => {
            const platform = btn.dataset.platform;
            overlay.remove();
            if (platform === 'qishui') {
                testQishuiChannel();
            } else if (platform === 'netease') {
                testNeteaseChannel();
            }
        };
    });

    overlay.querySelector('#test-dialog-cancel').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function showResultDialog(title, result) {
    const overlay = window.createOverlay();
    const isSuccess = result.includes('✅');
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
            text-align: center;
        ">
            <div style="font-size: 48px; margin-bottom: 12px;">${isSuccess ? '✅' : '❌'}</div>
            <div style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
                ${title}
            </div>
            <div style="font-size: 14px; color: #666; margin-bottom: 16px;">
                ${result}
            </div>
            <button id="result-ok-btn" style="
                padding: 10px 40px;
                background: #1a1a1a;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                cursor: pointer;
                font-weight: 500;
            ">确定</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#result-ok-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

async function testQishuiChannel() {
    showResultDialog('检测中...', '⏳ 正在检测汽水音乐通道...');
    try {
        const response = await fetch('https://api.qijieya.cn/meting/?server=netease&type=song&id=1397345903');
        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].name) {
                showResultDialog('检测成功', '✅ 汽水音乐通道可用');
                return;
            }
        }
        showResultDialog('检测失败', '❌ 汽水音乐通道不可用');
    } catch (e) {
        showResultDialog('检测失败', `❌ 汽水音乐通道不可用\n${e.message}`);
    }
}

async function testNeteaseChannel() {
    showResultDialog('检测中...', '⏳ 正在检测网易云通道...');
    try {
        const response = await fetch('https://api.bugpk.com/api/163_music?type=json&url=https://music.163.com/song?id=1397345903');
        if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.name) {
                showResultDialog('检测成功', '✅ 网易云通道可用');
                return;
            }
        }
        showResultDialog('检测失败', '❌ 网易云通道不可用');
    } catch (e) {
        showResultDialog('检测失败', `❌ 网易云通道不可用\n${e.message}`);
    }
}

// ============================================================
// 使用说明弹窗
// ============================================================

function showHelp() {
    const overlay = window.createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 36px 32px 28px;
            max-width: 520px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        ">
            <button type="button" id="help-close-btn" style="
                position: sticky;
                float: right;
                top: 0;
                background: none;
                border: none;
                font-size: 22px;
                cursor: pointer;
                color: #1a1a1a;
                opacity: 0.4;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                margin-top: -8px;
                margin-right: -8px;
            ">✕</button>

            <div style="clear: both;"></div>

            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 38px; display: block; margin-bottom: 4px;">🎵</span>
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; color: #1a1a1a;">音乐播放器</h2>
                <p style="margin: 4px 0 0; opacity: 0.35; font-size: 12px; color: #1a1a1a;">hy.禾一</p>
            </div>

            <!-- 功能按钮说明 -->
            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 8px;">功能按钮</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 13px; color: #333;">
                    <div><span style="font-weight: 500;">𓆟</span> 切换纯享模式</div>
                    <div><span style="font-weight: 500;">𓆝</span> 切换律动模式</div>
                    <div><span style="font-weight: 500;">♡</span> 自定义设置面板</div>
                    <div><span style="font-weight: 500;">☰</span> 播放列表</div>
                </div>
            </div>

            <!-- 模式操作 -->
            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 6px;">模式操作</div>
                <div style="font-size: 13px; color: #333; line-height: 1.8;">
                    <div>• 纯享模式：点击屏幕任意位置返回播放器</div>
                    <div>• 律动模式：点击播放器上的 𓆝 按钮返回播放器</div>
                </div>
            </div>

            <!-- 核心亮点 -->
            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 6px;">核心亮点</div>
                <div style="font-size: 13px; color: #333; line-height: 1.8;">
                    <div>• 支持网易云音乐、汽水音乐分享链接解析</div>
                    <div>• 支持单曲导入和歌单导入（网易云）</div>
                    <div>• 粘贴链接时可直接粘贴完整分享文案，自动提取链接</div>
                </div>
            </div>

            <!-- 重要提示 -->
            <div style="background: #fff3e0; border-radius: 12px; padding: 14px 16px; border: 1px solid #ffcc80; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #e65100; margin-bottom: 4px;">⚠️ 重要提示</div>
                <div style="font-size: 13px; color: #bf360c; line-height: 1.6;">
                    导入歌曲或歌单后，请务必点击播放列表底部的 <strong>⟳ 一键缓存</strong>，否则刷新页面后歌曲链接可能失效。
                </div>
            </div>

            <div style="text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8e8e8;">
                <span style="opacity: 0.3; font-size: 12px; color: #1a1a1a;">开源 · 免费 · 仅供个人使用</span>
                <div style="margin-top: 4px; opacity: 0.25; font-size: 11px; color: #1a1a1a;">📧 QQ: 2027932654</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#help-close-btn');
    closeBtn.addEventListener('mouseenter', function() {
        this.style.opacity = '0.8';
        this.style.background = 'rgba(0,0,0,0.05)';
    });
    closeBtn.addEventListener('mouseleave', function() {
        this.style.opacity = '0.4';
        this.style.background = 'none';
    });
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ============================================================
// 启动
// ============================================================

$(document).ready(() => {
    createExtensionPanel();
    loadAllModules();
});
