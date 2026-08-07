/**
 * 音乐播放器扩展入口
 * 版本: 1.0.9
 * 作者: hy.禾一
 */

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXTENSION_NAME = 'music_player';
const EXTENSION_FOLDER = 'HY-audio-player';

// ============================================================
// 默认设置
// ============================================================

const DEFAULT_SETTINGS = {
    neteaseChannel: 2,
    qishuiChannel: 1
};

// ============================================================
// 设置管理
// ============================================================

function getExtensionSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = { ...DEFAULT_SETTINGS };
    }
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
    return settings.neteaseChannel || 2;
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
        await loadScript(basePath + 'js/utils.js');
        await loadScript(basePath + 'api/wyy1.js');
        await loadScript(basePath + 'api/wyy2.js');
        await loadScript(basePath + 'api/qs1.js');
        await loadScript(basePath + 'js/core.js');
        await loadScript(basePath + 'js/ui-core.js');
        await loadScript(basePath + 'js/ui-helpers.js');
        await loadScript(basePath + 'js/ui-playlist.js');
        await loadScript(basePath + 'js/ui-events.js');
        initPlayer();
    } catch (error) {
        console.error('模块加载失败:', error);
    }
}

// ============================================================
// 导出歌单
// ============================================================

function exportPlaylistFile() {
    const core = window.MusicPlayerCore;
    if (!core) {
        if (typeof window.showStatus === 'function') {
            window.showStatus('播放器未初始化', 'error');
        }
        return;
    }
    if (core.playlist.length === 0) {
        if (typeof window.showStatus === 'function') {
            window.showStatus('歌单为空，无需导出', 'info');
        } else {
            alert('歌单为空');
        }
        return;
    }
    const data = {
        version: '1.0',
        exportTime: new Date().toISOString(),
        total: core.playlist.length,
        playlist: core.playlist
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `歌单_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof window.showStatus === 'function') {
        window.showStatus(`导出成功！共 ${core.playlist.length} 首歌曲`, 'success');
    }
}

// ============================================================
// 导入歌单
// ============================================================

function importPlaylistFile() {
    const core = window.MusicPlayerCore;
    if (!core) {
        if (typeof window.showStatus === 'function') {
            window.showStatus('播放器未初始化', 'error');
        }
        return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.playlist || !Array.isArray(data.playlist)) {
                    alert('无效的歌单文件：缺少 playlist 字段');
                    return;
                }
                if (data.playlist.length === 0) {
                    alert('歌单文件为空');
                    return;
                }
                const isAppend = confirm(
                    `歌单文件包含 ${data.playlist.length} 首歌曲\n\n` +
                    '点击「确定」追加到现有歌单\n' +
                    '点击「取消」覆盖现有歌单'
                );
                if (isAppend) {
                    core.playlist = core.playlist.concat(data.playlist);
                } else {
                    core.playlist = data.playlist;
                }
                core.saveData();
                if (typeof window.renderList === 'function') {
                    window.renderList();
                }
                if (typeof window.updateView === 'function') {
                    window.updateView();
                }
                if (typeof window.showStatus === 'function') {
                    window.showStatus(`导入成功！共 ${core.playlist.length} 首歌曲`, 'success');
                } else {
                    alert(`导入成功！共 ${core.playlist.length} 首歌曲`);
                }
            } catch (err) {
                alert('文件解析失败：' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
// 自定义接口配置
// ============================================================

function getCustomApiConfig() {
    const core = window.MusicPlayerCore;
    if (core && core._customApiConfig) {
        return core._customApiConfig;
    }
    try {
        const raw = localStorage.getItem('music_player_custom_api');
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
}

function saveCustomApiConfig(config) {
    const core = window.MusicPlayerCore;
    if (core) {
        core._customApiConfig = config;
        core.saveData();
    } else {
        localStorage.setItem('music_player_custom_api', JSON.stringify(config));
    }
}

// ============================================================
// 自定义接口设置弹窗
// ============================================================

function showCustomApiDialog() {
    const config = getCustomApiConfig() || { url: '', method: 'GET', params: 'type=url&id={id}&br=320' };
    
    const overlay = window.createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 420px;
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
            <div style="text-align: center; font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px;">自定义接口</div>
            
            <div style="margin-bottom: 12px;">
                <div style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 4px;">API 接口</div>
                <input id="custom-api-url" type="text" placeholder="https://api.example.com/meting/" value="${config.url}" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d0d0; border-radius: 8px; font-size: 13px; color: #1a1a1a; background: #fafafa; box-sizing: border-box;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <div style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 4px;">请求方式</div>
                <div style="display: flex; gap: 8px;">
                    <button class="api-method-btn" data-method="GET" style="flex: 1; padding: 8px; border-radius: 8px; border: 2px solid ${config.method === 'GET' ? '#7eb8c9' : '#d0d0d0'}; background: ${config.method === 'GET' ? 'rgba(126,184,201,0.12)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">GET</button>
                    <button class="api-method-btn" data-method="POST" style="flex: 1; padding: 8px; border-radius: 8px; border: 2px solid ${config.method === 'POST' ? '#7eb8c9' : '#d0d0d0'}; background: ${config.method === 'POST' ? 'rgba(126,184,201,0.12)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">POST</button>
                </div>
            </div>
            
            <div style="margin-bottom: 12px;">
                <div style="font-size: 13px; font-weight: 500; color: #1a1a1a; margin-bottom: 4px;">请求参数</div>
                <input id="custom-api-params" type="text" placeholder="type=url&id={id}&br=320" value="${config.params}" style="width: 100%; padding: 10px 12px; border: 1px solid #d0d0d0; border-radius: 8px; font-size: 13px; color: #1a1a1a; background: #fafafa; box-sizing: border-box;">
                <div style="font-size: 11px; opacity: 0.5; color: #1a1a1a; margin-top: 4px;">默认从分享链接中提取 id</div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 16px;">
                <button id="custom-api-save-btn" style="flex: 1; padding: 10px; border: none; border-radius: 8px; background: #1a1a1a; color: #fff; font-size: 14px; cursor: pointer; font-weight: 500;">保存设置</button>
                <button id="custom-api-close-btn" style="flex: 1; padding: 10px; border: 1px solid #d0d0d0; border-radius: 8px; background: #f5f5f5; color: #1a1a1a; font-size: 14px; cursor: pointer;">取消</button>
            </div>
            <div id="custom-api-status" style="font-size: 12px; margin-top: 8px; text-align: center; color: #999;"></div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.api-method-btn').forEach(btn => {
        btn.onclick = function() {
            overlay.querySelectorAll('.api-method-btn').forEach(b => {
                b.style.borderColor = '#d0d0d0';
                b.style.background = '#f5f5f5';
            });
            this.style.borderColor = '#7eb8c9';
            this.style.background = 'rgba(126,184,201,0.12)';
        };
    });

    overlay.querySelector('#custom-api-save-btn').onclick = function() {
        const url = document.getElementById('custom-api-url').value.trim();
        const method = overlay.querySelector('.api-method-btn[style*="7eb8c9"]')?.dataset.method || 'GET';
        const params = document.getElementById('custom-api-params').value.trim();
        const statusEl = document.getElementById('custom-api-status');
        
        if (!url) {
            statusEl.textContent = '请填写接口地址';
            statusEl.style.color = '#e74c3c';
            return;
        }
        
        const config = { url, method, params };
        saveCustomApiConfig(config);
        statusEl.textContent = '已保存';
        statusEl.style.color = '#27ae60';
        setTimeout(() => {
            overlay.remove();
            if (typeof window.showStatus === 'function') {
                window.showStatus('自定义接口已保存', 'success');
            }
        }, 600);
    };

    overlay.querySelector('#custom-api-close-btn').onclick = function() {
        overlay.remove();
    };
    overlay.onclick = function(e) {
        if (e.target === overlay) overlay.remove();
    };
}

// ============================================================
// 通道切换弹窗
// ============================================================

function showChannelSwitchDialog() {
    const settings = getExtensionSettings();
    const currentNetease = settings.neteaseChannel || 2;
    const currentQishui = settings.qishuiChannel || 1;

    const overlay = window.createOverlay();
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
        ">
            <div style="text-align: center; font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px;">通道切换</div>
            
            <div style="margin-bottom: 16px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #7eb8c9;">网易云通道</div>
                <div style="display: flex; gap: 8px;">
                    <button class="netease-chan-btn" data-channel="1" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentNetease === 1 ? '#7eb8c9' : '#ddd'}; background: ${currentNetease === 1 ? 'rgba(126,184,201,0.15)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; transition: all 0.2s;">通道一</button>
                    <button class="netease-chan-btn" data-channel="2" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentNetease === 2 ? '#7eb8c9' : '#ddd'}; background: ${currentNetease === 2 ? 'rgba(126,184,201,0.15)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; transition: all 0.2s;">通道二</button>
                </div>
                <div style="font-size: 11px; opacity: 0.4; margin-top: 4px; text-align: center; color: #1a1a1a;">当前：${currentNetease === 1 ? '通道一' : '通道二'}</div>
            </div>

            <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #f5a623;">汽水通道</div>
                <div style="display: flex; gap: 8px;">
                    <button class="qishui-chan-btn" data-channel="1" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentQishui === 1 ? '#f5a623' : '#ddd'}; background: ${currentQishui === 1 ? 'rgba(245,166,35,0.15)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; transition: all 0.2s;">通道一</button>
                    <button class="qishui-chan-btn" data-channel="2" style="flex: 1; padding: 10px; border-radius: 8px; border: 2px solid ${currentQishui === 2 ? '#f5a623' : '#ddd'}; background: ${currentQishui === 2 ? 'rgba(245,166,35,0.15)' : '#f5f5f5'}; color: #1a1a1a; cursor: pointer; font-size: 13px; transition: all 0.2s;">通道二</button>
                </div>
                <div style="font-size: 11px; opacity: 0.4; margin-top: 4px; text-align: center; color: #1a1a1a;">当前：${currentQishui === 1 ? '通道一' : '通道二'}</div>
            </div>

            <button id="channel-close-btn" style="width: 100%; padding: 10px; border: none; border-radius: 8px; background: #f5f5f5; color: #999; cursor: pointer; font-size: 13px;">关闭</button>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.netease-chan-btn').forEach(btn => {
        btn.onclick = function() {
            const channel = parseInt(this.dataset.channel);
            const settings = getExtensionSettings();
            settings.neteaseChannel = channel;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            overlay.querySelectorAll('.netease-chan-btn').forEach(b => {
                b.style.borderColor = '#ddd';
                b.style.background = '#f5f5f5';
            });
            this.style.borderColor = '#7eb8c9';
            this.style.background = 'rgba(126,184,201,0.15)';
            const label = overlay.querySelector('.netease-chan-btn:first-child').parentElement.parentElement.querySelector('div:last-child');
            if (label) label.textContent = `当前：${channel === 1 ? '通道一' : '通道二'}`;
            if (typeof window.showStatus === 'function') {
                window.showStatus(`已切换至网易云通道${channel === 1 ? '一' : '二'}`, 'success', 1500);
            }
        };
    });

    overlay.querySelectorAll('.qishui-chan-btn').forEach(btn => {
        btn.onclick = function() {
            const channel = parseInt(this.dataset.channel);
            const settings = getExtensionSettings();
            settings.qishuiChannel = channel;
            extension_settings[EXTENSION_NAME] = settings;
            saveExtensionSettings();
            overlay.querySelectorAll('.qishui-chan-btn').forEach(b => {
                b.style.borderColor = '#ddd';
                b.style.background = '#f5f5f5';
            });
            this.style.borderColor = '#f5a623';
            this.style.background = 'rgba(245,166,35,0.15)';
            const label = overlay.querySelector('.qishui-chan-btn:first-child').parentElement.parentElement.querySelector('div:last-child');
            if (label) label.textContent = `当前：${channel === 1 ? '通道一' : '通道二'}`;
            if (typeof window.showStatus === 'function') {
                window.showStatus(`已切换至汽水通道${channel === 1 ? '一' : '二'}`, 'success', 1500);
            }
        };
    });

    overlay.querySelector('#channel-close-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// 通道检测
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
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #1a1a1a;">通道检测</h2>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="platform-btn" data-platform="qishui" style="padding: 12px; background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 500; color: #1a1a1a; transition: all 0.2s;">汽水音乐</button>
                <button class="platform-btn" data-platform="netease" style="padding: 12px; background: #f5f5f5; border: 1px solid #e8e8e8; border-radius: 12px; cursor: pointer; font-size: 15px; font-weight: 500; color: #1a1a1a; transition: all 0.2s;">网易云音乐</button>
                <button id="test-dialog-cancel" style="margin-top: 6px; background: none; border: none; color: #999; cursor: pointer; font-size: 13px; padding: 8px;">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.platform-btn').forEach(btn => {
        btn.onmouseenter = () => { btn.style.background = '#e8e8e8'; };
        btn.onmouseleave = () => { btn.style.background = '#f5f5f5'; };
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
            <div style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">${title}</div>
            <div style="font-size: 14px; color: #666; margin-bottom: 16px; white-space: pre-wrap;">${result}</div>
            <button id="result-ok-btn" style="padding: 10px 40px; background: #1a1a1a; border: none; border-radius: 8px; color: #fff; font-size: 14px; cursor: pointer; font-weight: 500;">确定</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#result-ok-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

async function testQishuiChannel() {
    showResultDialog('检测中...', '正在检测汽水音乐通道...');
    try {
        const response = await fetch('https://api.pearapi.ai/api/qishui_music?url=https://music.163.com/song?id=1397345903');
        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data && data.data.song_name) {
                showResultDialog('检测成功', '汽水音乐通道可用');
                return;
            }
        }
        showResultDialog('检测失败', '汽水音乐通道不可用');
    } catch (e) {
        showResultDialog('检测失败', `汽水音乐通道不可用\n${e.message}`);
    }
}

async function testNeteaseChannel() {
    showResultDialog('检测中...', '正在检测网易云通道...');
    try {
        const response = await fetch('https://api.qijeya.cn/meting/?type=song&id=1397345903');
        if (response.ok) {
            const data = await response.json();
            if (data && data[0] && data[0].name) {
                showResultDialog('检测成功', '网易云通道一可用');
                return;
            }
        }
        try {
            const resp2 = await fetch('https://api.bugpk.com/api/163_music?type=json&url=https://music.163.com/song?id=1397345903');
            if (resp2.ok) {
                const data2 = await resp2.json();
                if (data2.status === 200 && data2.name) {
                    showResultDialog('检测成功', '网易云通道二可用');
                    return;
                }
            }
        } catch (e2) {}
        showResultDialog('检测失败', '网易云通道不可用');
    } catch (e) {
        showResultDialog('检测失败', `网易云通道不可用\n${e.message}`);
    }
}

// ============================================================
// 使用说明
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

            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 8px;">功能按钮</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 13px; color: #333;">
                    <div><span style="font-weight: 500;">𓆟</span> 切换纯享模式</div>
                    <div><span style="font-weight: 500;">𓆝</span> 切换律动模式</div>
                    <div><span style="font-weight: 500;">♡</span> 自定义设置面板</div>
                    <div><span style="font-weight: 500;">☰</span> 播放列表</div>
                </div>
            </div>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 6px;">模式操作</div>
                <div style="font-size: 13px; color: #333; line-height: 1.8;">
                    <div>• 纯享模式：点击屏幕任意位置返回播放器</div>
                    <div>• 律动模式：点击播放器上的 𓆝 按钮返回播放器</div>
                </div>
            </div>

            <div style="background: #f5f5f5; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8e8e8; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; margin-bottom: 6px;">核心亮点</div>
                <div style="font-size: 13px; color: #333; line-height: 1.8;">
                    <div>• 支持网易云音乐、汽水音乐分享链接解析</div>
                    <div>• 支持单曲导入和歌单导入（网易云）</div>
                    <div>• 支持歌单导出和导入（备份/迁移）</div>
                    <div>• 支持自定义接口，可使用自己的 API</div>
                </div>
            </div>

            <div style="background: #fff3e0; border-radius: 12px; padding: 14px 16px; border: 1px solid #ffcc80; margin-bottom: 10px;">
                <div style="font-weight: 600; font-size: 14px; color: #e65100; margin-bottom: 4px;">重要提示</div>
                <div style="font-size: 13px; color: #bf360c; line-height: 1.6;">
                    更换浏览器或重装酒馆后，使用「导入歌单」功能恢复歌曲列表。
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
    closeBtn.onmouseenter = function() {
        this.style.opacity = '0.8';
        this.style.background = 'rgba(0,0,0,0.05)';
    };
    closeBtn.onmouseleave = function() {
        this.style.opacity = '0.4';
        this.style.background = 'none';
    };
    closeBtn.onclick = () => overlay.remove();
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

                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button type="button" id="mini-icon-toggle-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        显示最小化图标
                    </button>
                    <button type="button" id="show-help-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        使用说明
                    </button>
                </div>

                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button type="button" id="import-playlist-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        导入歌单
                    </button>
                    <button type="button" id="export-playlist-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        导出歌单
                    </button>
                </div>

                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button type="button" id="channel-switch-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        通道切换
                    </button>
                    <button type="button" id="test-channels-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        通道检测
                    </button>
                </div>

                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                    <button type="button" id="custom-api-btn" class="menu_button" style="flex: 1; text-align: center; padding: 8px 0; font-size: 13px;">
                        自定义接口
                    </button>
                    <div style="flex: 1; text-align: center; padding: 8px 0; font-size: 11px; opacity: 0.35; color: #000000; display: flex; align-items: center; justify-content: center;">默认从分享链接提取 id</div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                    <small style="opacity: 0.5; font-size: 11px; color: #000000;">𓂃 hy.禾一</small>
                    <small style="opacity: 0.5; font-size: 11px; color: #000000;">版本：${version}</small>
                </div>

            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);

    // 折叠事件
    const drawerToggle = document.querySelector('#music-player-extension .inline-drawer-toggle');
    if (drawerToggle) {
        drawerToggle.onclick = function(e) {
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
        };
    }

    // 最小化控制：只控制 U3 显示/隐藏
    document.getElementById('mini-icon-toggle-btn').onclick = function() {
        const miniIcon = document.getElementById('player-mini-icon');
        if (miniIcon) {
            const isHidden = miniIcon.style.display === 'none';
            miniIcon.style.display = isHidden ? 'flex' : 'none';
            this.textContent = isHidden ? '隐藏最小化图标' : '显示最小化图标';
        }
    };

    // 使用说明
    document.getElementById('show-help-btn').onclick = showHelp;

    // 导入歌单
    document.getElementById('import-playlist-btn').onclick = importPlaylistFile;

    // 导出歌单
    document.getElementById('export-playlist-btn').onclick = exportPlaylistFile;

    // 通道切换
    document.getElementById('channel-switch-btn').onclick = showChannelSwitchDialog;

    // 通道检测
    document.getElementById('test-channels-btn').onclick = showChannelTestDialog;

    // 自定义接口
    document.getElementById('custom-api-btn').onclick = showCustomApiDialog;
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
        const root = document.getElementById('player-root');
        const miniIcon = document.getElementById('player-mini-icon');
        if (root) root.style.display = 'none';
        if (miniIcon) miniIcon.style.display = 'flex';
    }, 300);
}

// ============================================================
// 生命周期钩子
// ============================================================

export async function onInstall() {
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.loadData === 'function') {
        setTimeout(() => {
            window.MusicPlayerCore.loadData();
        }, 100);
    }
}

export async function onActivate() {}

export async function onUpdate() {
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.loadData === 'function') {
        window.MusicPlayerCore.loadData();
    }
}

export async function onDelete() {
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.clearData === 'function') {
        window.MusicPlayerCore.clearData();
    }
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
    document.querySelectorAll('.player-dialog-overlay, .help-dialog, .player-status, .cache-progress-overlay').forEach(el => {
        el.remove();
    });
    return Promise.resolve();
}

export function onEnable() {
    if (typeof window.showUI === 'function') {
        window.showUI();
    }
}

export function onDisable() {
    if (typeof window.hideUI === 'function') {
        window.hideUI();
    }
}

export async function onClean() {
    if (window.MusicPlayerCore && typeof window.MusicPlayerCore.clearData === 'function') {
        window.MusicPlayerCore.clearData();
    }
    if (typeof toastr !== 'undefined') {
        toastr.success('音乐播放器数据已清理');
    }
    return Promise.resolve();
}

// ============================================================
// 暴露到全局
// ============================================================

window.getCurrentNeteaseChannel = getCurrentNeteaseChannel;
window.getCurrentQishuiChannel = getCurrentQishuiChannel;
window.getExtensionSettings = getExtensionSettings;
window.saveExtensionSettings = saveExtensionSettings;
window.exportPlaylistFile = exportPlaylistFile;
window.importPlaylistFile = importPlaylistFile;
window.showCustomApiDialog = showCustomApiDialog;
window.getCustomApiConfig = getCustomApiConfig;

// ============================================================
// 启动
// ============================================================

$(document).ready(() => {
    createExtensionPanel();
    loadAllModules();
});
