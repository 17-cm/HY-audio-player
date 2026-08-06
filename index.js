/**
 * 音乐播放器扩展入口
 * 版本: 1.0.9
 * 作者: hy.禾一
 * 仓库: https://github.com/17-cm/HY-audio-player.git
 * 
 * 修改: 添加生命周期钩子，支持数据持久化到 extension_settings
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';
const EXTENSION_FOLDER = 'HY-audio-player';
const MODULE_NAME = 'music_player_data';  // 与 core.js 保持一致

console.log('🎵 音乐播放器扩展加载中...');

// ============================================================
// 默认设置
// ============================================================

const DEFAULT_SETTINGS = {
    miniIconVisible: true,
    neteaseChannel: 1,  // 1 = qijie, 2 = bugpk
    qishuiChannel: 1    // 1 = pearapi, 2 = 预留
};

// ============================================================
// 设置管理
// ============================================================

function getExtensionSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = { ...DEFAULT_SETTINGS };
    }
    // 确保新字段存在
    const settings = extension_settings[EXTENSION_NAME];
    for (const key in DEFAULT_SETTINGS) {
        if (settings[key] === undefined) {
            settings[key] = DEFAULT_SETTINGS[key];
        }
    }
    return settings;
}

function saveExtensionSettings() {
    saveSettingsDebounced();
}

// ============================================================
// 获取当前通道
// ============================================================

function getCurrentNeteaseChannel() {
    const settings = getExtensionSettings();
    return settings.neteaseChannel || 1;
}

function getCurrentQishuiChannel() {
    const settings = getExtensionSettings();
    return settings.qishuiChannel || 1;
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
    return '1.0.9';
}

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
    const basePath = `/scripts/extensions/third-party/${EXTENSION_FOLDER}/`;
    try {
        // 加载工具
        await loadScript(basePath + 'js/utils.js');
        // 加载API模块
        await loadScript(basePath + 'api/wyy1.js');
        await loadScript(basePath + 'api/wyy2.js');
        await loadScript(basePath + 'api/qs1.js');
        // 加载核心
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
// 通道切换弹窗
// ============================================================

function showChannelSwitchDialog() {
    const settings = getExtensionSettings();
    const currentNetease = settings.neteaseChannel || 1;
    const currentQishui = settings.qishuiChannel || 1;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(6px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        padding: 20px;
        box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="
            background: #2a2a2a;
            border-radius: 16px;
            padding: 28px 24px;
            max-width: 360px;
            width: 100%;
            color: #fff;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        ">
            <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px;">🎵 通道切换</div>
            
            <!-- 网易云通道 -->
            <div style="margin-bottom: 16px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #7eb8c9;">网易云通道</div>
                <div style="display: flex; gap: 8px;">
                    <button class="netease-chan-btn" data-channel="1" style="
                        flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentNetease === 1 ? '#7eb8c9' : '#444'};
                        background: ${currentNetease === 1 ? 'rgba(126,184,201,0.2)' : 'transparent'};
                        color: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s;
                    ">通道一</button>
                    <button class="netease-chan-btn" data-channel="2" style="
                        flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentNetease === 2 ? '#7eb8c9' : '#444'};
                        background: ${currentNetease === 2 ? 'rgba(126,184,201,0.2)' : 'transparent'};
                        color: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s;
                    ">通道二</button>
                </div>
                <div style="font-size: 11px; opacity: 0.4; margin-top: 4px; text-align: center;">
                    当前：${currentNetease === 1 ? '通道一' : '通道二'}
                </div>
            </div>

            <!-- 汽水通道 -->
            <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #f5a623;">汽水通道</div>
                <div style="display: flex; gap: 8px;">
                    <button class="qishui-chan-btn" data-channel="1" style="
                        flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentQishui === 1 ? '#f5a623' : '#444'};
                        background: ${currentQishui === 1 ? 'rgba(245,166,35,0.2)' : 'transparent'};
                        color: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s;
                    ">通道一</button>
                    <button class="qishui-chan-btn" data-channel="2" style="
                        flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentQishui === 2 ? '#f5a623' : '#444'};
                        background: ${currentQishui === 2 ? 'rgba(245,166,35,0.2)' : 'transparent'};
                        color: #fff; cursor: pointer; font-size: 13px; transition: all 0.2s;
                    ">通道二</button>
                </div>
                <div style="font-size: 11px; opacity: 0.4; margin-top: 4px; text-align: center;">
                    当前：${currentQishui === 1 ? '通道一' : '通道二'}
                </div>
            </div>

            <button id="channel-close-btn" style="
                width: 100%; padding: 10px; border: none; border-radius: 8px;
                background: rgba(255,255,255,0.1); color: #999; cursor: pointer; font-size: 13px;
            ">关闭</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // ===== 网易云通道切换 =====
    overlay.querySelectorAll('.netease-chan-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const channel = parseInt(this.dataset.channel);
            const settings = getExtensionSettings();
            settings.neteaseChannel = channel;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            
            // 更新UI高亮
            overlay.querySelectorAll('.netease-chan-btn').forEach(b => {
                b.style.borderColor = '#444';
                b.style.background = 'transparent';
            });
            this.style.borderColor = '#7eb8c9';
            this.style.background = 'rgba(126,184,201,0.2)';
            
            const label = overlay.querySelector('.netease-chan-btn:first-child').parentElement.parentElement.querySelector('div:last-child');
            if (label) label.textContent = `当前：${channel === 1 ? '通道一' : '通道二'}`;
            
            if (typeof window.showStatus === 'function') {
                window.showStatus(`已切换至网易云通道${channel === 1 ? '一' : '二'}`, 'success', 1500);
            }
        });
    });

    // ===== 汽水通道切换 =====
    overlay.querySelectorAll('.qishui-chan-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const channel = parseInt(this.dataset.channel);
            const settings = getExtensionSettings();
            settings.qishuiChannel = channel;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            
            overlay.querySelectorAll('.qishui-chan-btn').forEach(b => {
                b.style.borderColor = '#444';
                b.style.background = 'transparent';
            });
            this.style.borderColor = '#f5a623';
            this.style.background = 'rgba(245,166,35,0.2)';
            
            const label = overlay.querySelector('.qishui-chan-btn:first-child').parentElement.parentElement.querySelector('div:last-child');
            if (label) label.textContent = `当前：${channel === 1 ? '通道一' : '通道二'}`;
            
            if (typeof window.showStatus === 'function') {
                window.showStatus(`已切换至汽水通道${channel === 1 ? '一' : '二'}`, 'success', 1500);
            }
        });
    });

    overlay.querySelector('#channel-close-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// 使用说明弹窗
// ============================================================

function showHelp() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
        display: flex; justify-content: center; align-items: center;
        z-index: 2147483647; padding: 20px; box-sizing: border-box;
    `;

    overlay.innerHTML = `
        <div style="
            background: #2a2a2a; border-radius: 16px; padding: 28px 24px;
            max-width: 420px; width: 100%; max-height: 80vh; overflow-y: auto;
            color: #fff; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            line-height: 1.6;
        ">
            <div style="text-align: center; margin-bottom: 16px;">
                <span style="font-size: 36px;">🎵</span>
                <h2 style="margin: 4px 0; font-size: 18px;">音乐播放器</h2>
                <p style="margin: 0; opacity: 0.4; font-size: 12px;">hy.禾一</p>
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">🎯 通道切换</div>
                <div style="font-size: 12px; opacity: 0.8;">在扩展面板点击"通道切换"，可切换网易云/汽水的解析通道</div>
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">📋 导入歌曲</div>
                <div style="font-size: 12px; opacity: 0.8;">支持网易云单曲、歌单链接，汽水音乐单曲链接</div>
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">⚠️ 重要</div>
                <div style="font-size: 12px; opacity: 0.8;">导入后点击"⟳ 一键缓存"刷新链接，防止失效</div>
            </div>

            <button id="help-close-btn" style="
                width: 100%; padding: 10px; border: none; border-radius: 8px;
                background: rgba(255,255,255,0.1); color: #999; cursor: pointer; font-size: 13px; margin-top: 12px;
            ">关闭</button>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#help-close-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
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

                <!-- 通道切换 -->
                <button type="button" id="channel-switch-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    🔄 通道切换
                </button>

                <!-- 最小化控制 -->
                <button type="button" id="mini-icon-toggle-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    ${settings.miniIconVisible !== false ? '隐藏最小化图标' : '显示最小化图标'}
                </button>

                <!-- 使用说明 -->
                <button type="button" id="show-help-btn" class="menu_button" style="width: 100%; margin-bottom: 10px;">
                    使用说明
                </button>

                <!-- 注脚 -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                    <small style="opacity: 0.5; font-size: 11px; color: #000000;">𓂃 hy.禾一</small>
                    <small style="opacity: 0.5; font-size: 11px; color: #000000;">版本：${version}</small>
                </div>

            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // ===== 折叠事件 =====
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
                    icon.className = `inline-drawer-icon fa-solid fa-circle-chevron-${isHidden ? 'up' : 'down'}`;
                }
            }
        });
    }

    // ===== 通道切换按钮 =====
    const channelBtn = document.getElementById('channel-switch-btn');
    if (channelBtn) {
        channelBtn.addEventListener('click', showChannelSwitchDialog);
    }

    // ===== 最小化控制 =====
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

    // ===== 使用说明 =====
    const helpBtn = document.getElementById('show-help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
}

// ============================================================
// 初始化播放器
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

    console.log('✅ 音乐播放器扩展初始化完成');
}

// ============================================================
// 🎯 生命周期钩子（export）
// ============================================================

/**
 * 安装时调用
 * 用于：初始化默认数据
 */
export async function onInstall() {
    console.log('🎵 音乐播放器安装中...');
    
    // 尝试初始化数据（core.loadData 会自动处理）
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.loadData === 'function') {
        // 延迟执行，确保其他模块已加载
        setTimeout(() => {
            window.MusicPlayerCore.loadData();
        }, 100);
    }
    
    console.log('✅ 音乐播放器安装完成');
}

/**
 * 激活时调用（页面加载期间）
 * 用于：启动扩展
 */
export async function onActivate() {
    console.log('🎵 音乐播放器激活');
    // 正常初始化由 initPlayer 完成，这里不需要额外操作
}

/**
 * 更新时调用
 * 用于：数据迁移（版本更新时）
 */
export async function onUpdate() {
    console.log('🎵 音乐播放器更新中...');
    
    // 检查是否需要数据迁移
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.loadData === 'function') {
        // 重新加载数据（会自动处理迁移）
        window.MusicPlayerCore.loadData();
    }
    
    console.log('✅ 音乐播放器更新完成');
}

/**
 * 卸载时调用
 * 用于：清理数据、移除 UI
 * 🔥 解决卸载重装提示"已存在"的问题
 */
export async function onDelete() {
    console.log('🗑️ 音乐播放器卸载中...');
    
    // 1. 清理播放器数据
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.clearData === 'function') {
        window.MusicPlayerCore.clearData();
    }
    
    // 2. 清理 UI 元素
    const elementsToRemove = [
        'player-root',
        'player-status',
        'player-mini-icon',
        'player-rhythm-icon',
        'cache-progress-overlay'
    ];
    
    elementsToRemove.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    
    // 3. 清理任何残留的弹窗
    document.querySelectorAll('.player-dialog-overlay, .help-dialog, .player-status, .cache-progress-overlay').forEach(el => {
        el.remove();
    });
    
    // 4. 清理动态添加的样式（如果有）
    // 注意：style.css 是通过 link 加载的，卸载时不需要移除，因为酒馆会重新加载页面
    
    console.log('✅ 音乐播放器已清理完成');
    
    // 返回 Promise 让酒馆等待清理完成
    return Promise.resolve();
}

/**
 * 启用时调用
 */
export function onEnable() {
    console.log('🎵 音乐播放器已启用');
    // 显示播放器
    if (typeof window.showUI === 'function') {
        window.showUI();
    }
}

/**
 * 禁用时调用
 */
export function onDisable() {
    console.log('🎵 音乐播放器已禁用');
    // 隐藏播放器
    if (typeof window.hideUI === 'function') {
        window.hideUI();
    }
}

/**
 * 清理数据时调用（用户点击"清理扩展数据"）
 */
export async function onClean() {
    console.log('🧹 音乐播放器数据清理');
    
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.clearData === 'function') {
        window.MusicPlayerCore.clearData();
    }
    
    if (typeof toastr !== 'undefined') {
        toastr.success('音乐播放器数据已清理');
    }
    
    return Promise.resolve();
}

// ============================================================
// 暴露到全局（供其他模块使用）
// ============================================================

window.getCurrentNeteaseChannel = getCurrentNeteaseChannel;
window.getCurrentQishuiChannel = getCurrentQishuiChannel;
window.getExtensionSettings = getExtensionSettings;
window.saveExtensionSettings = saveExtensionSettings;

// ============================================================
// 启动
// ============================================================

$(document).ready(() => {
    // 先创建扩展面板（同步）
    createExtensionPanel();
    
    // 再加载所有模块（异步）
    loadAllModules();
});
