/**
 * utils.js - 音乐播放器工具函数模块
 * 版本: 1.0.6
 * 作者: hy.禾一
 * 说明：纯工具函数，不依赖其他模块
 */

// ============================================================
// 1. 状态提示
// ============================================================

let statusTimer = null;

function showStatus(message, type = 'info', duration = 3000) {
    const statusEl = document.getElementById('player-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `player-status status-${type}`;
        statusEl.style.opacity = '1';

        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            statusEl.style.opacity = '0';
        }, duration);
    }
}

// ============================================================
// 2. 颜色工具
// ============================================================

function hexToHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hexToRgba(hex, alpha) {
    let r = 0,
        g = 0,
        b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// 3. 文件上传工具
// ============================================================

function createFileInput(accept, callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.onchange = (e) => {
        if (e.target.files[0]) callback(e.target.files[0]);
        input.remove();
    };
    document.body.appendChild(input);
    input.click();
}

function handleFileUpload(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
}

function handleTextFileUpload(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsText(file);
}

// ============================================================
// 4. 对话框工具
// ============================================================

function showConfirmDialog(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'player-dialog-overlay';

    overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">${title}</div>
                    <div class="dialog-message">${message}</div>
                    <div class="dialog-buttons">
                        <button type="button" class="dialog-btn-cancel">取消</button>
                        <button type="button" class="dialog-btn-confirm">确定</button>
                    </div>
                </div>
            `;
    document.body.appendChild(overlay);
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';

    overlay.querySelector('.dialog-btn-confirm').onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };

    overlay.querySelector('.dialog-btn-cancel').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    };
}

function showInputDialog(title, placeholder, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'player-dialog-overlay';

    overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">${title}</div>
                    <textarea class="dialog-input" placeholder="${placeholder}" rows="3"></textarea>
                    <div class="dialog-buttons">
                        <button type="button" class="dialog-btn-cancel">取消</button>
                        <button type="button" class="dialog-btn-confirm">确定</button>
                    </div>
                </div>
            `;
    document.body.appendChild(overlay);
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';

    const input = overlay.querySelector('.dialog-input');
    input.focus();

    overlay.querySelector('.dialog-btn-confirm').onclick = () => {
        const value = input.value.trim();
        overlay.remove();
        if (value && onConfirm) onConfirm(value);
    };

    overlay.querySelector('.dialog-btn-cancel').onclick = () => {
        overlay.remove();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
}

function showAddOptions() {
    const overlay = document.createElement('div');
    overlay.className = 'player-dialog-overlay';

    overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">添加歌曲</div>
                    <div class="add-options">
                        <button type="button" id="add-single-btn" class="add-option-btn">
                            <div class="option-icon">🎵</div>
                            <div class="option-text">添加单曲</div>
                        </button>
                        <button type="button" id="add-playlist-btn" class="add-option-btn">
                            <div class="option-icon">📋</div>
                            <div class="option-text">添加歌单</div>
                        </button>
                    </div>
                    <button type="button" id="add-cancel-btn" class="dialog-cancel">取消</button>
                </div>
            `;
    document.body.appendChild(overlay);
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';

    overlay.querySelector('#add-single-btn').onclick = () => {
        overlay.remove();
        if (typeof window.addUrlSong === 'function') {
            window.addUrlSong();
        }
    };

    overlay.querySelector('#add-playlist-btn').onclick = () => {
        overlay.remove();
        if (typeof window.addPlaylist === 'function') {
            window.addPlaylist();
        }
    };

    overlay.querySelector('#add-cancel-btn').onclick = () => {
        overlay.remove();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
}

function showLyricsDialog(i) {
    const overlay = document.createElement('div');
    overlay.className = 'player-dialog-overlay';

    overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">歌词设置</div>
                    <div class="lyrics-btns">
                        <button type="button" id="lyrics-paste-btn" class="dialog-btn">粘贴歌词</button>
                        <button type="button" id="lyrics-import-btn" class="dialog-btn">导入文件</button>
                    </div>
                    <button type="button" id="lyrics-cancel-btn" class="dialog-cancel">取消</button>
                </div>
            `;
    document.body.appendChild(overlay);
    overlay.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';

    overlay.querySelector('#lyrics-paste-btn').onclick = () => {
        overlay.remove();
        showInputDialog('粘贴歌词', '请粘贴LRC格式歌词', (newLyrics) => {
            if (window.MusicPlayerCore) {
                window.MusicPlayerCore.playlist[i].lyrics = newLyrics;
                if (i === window.MusicPlayerCore.index) {
                    window.MusicPlayerCore.state.lyrics = window.MusicPlayerCore.parseLyrics(newLyrics);
                    window.MusicPlayerCore.state.currentLyricIndex = -1;
                }
                window.MusicPlayerCore.saveData();
                showStatus('歌词已更新', 'success');
                if (typeof window.updateView === 'function') {
                    window.updateView();
                }
            }
        });
    };

    overlay.querySelector('#lyrics-import-btn').onclick = () => {
        overlay.remove();
        createFileInput('.lrc,.txt', (file) => {
            handleTextFileUpload(file, (content) => {
                if (window.MusicPlayerCore) {
                    window.MusicPlayerCore.playlist[i].lyrics = content;
                    if (i === window.MusicPlayerCore.index) {
                        window.MusicPlayerCore.state.lyrics = window.MusicPlayerCore.parseLyrics(content);
                        window.MusicPlayerCore.state.currentLyricIndex = -1;
                    }
                    window.MusicPlayerCore.saveData();
                    showStatus('歌词导入成功！', 'success');
                    if (typeof window.updateView === 'function') {
                        window.updateView();
                    }
                }
            });
        });
    };

    overlay.querySelector('#lyrics-cancel-btn').onclick = () => {
        overlay.remove();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
}

// ============================================================
// 5. 缓存进度弹窗
// ============================================================

function showCacheProgress(current, total) {
    let progressEl = document.getElementById('cache-progress-overlay');
    if (!progressEl) {
        progressEl = document.createElement('div');
        progressEl.id = 'cache-progress-overlay';
        progressEl.className = 'player-dialog-overlay';
        progressEl.innerHTML = `
                    <div class="cache-progress-dialog">
                        <div class="cache-progress-title">正在缓存歌曲</div>
                        <div class="cache-progress-song"></div>
                        <div class="cache-progress-bar-wrap">
                            <div class="cache-progress-bar"></div>
                        </div>
                        <div class="cache-progress-text">0 / 0</div>
                        <div class="cache-progress-tip">请勿关闭页面...</div>
                    </div>
                `;
        document.body.appendChild(progressEl);
        progressEl.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: flex !important; justify-content: center !important; align-items: center !important; background: rgba(0, 0, 0, 0.8) !important; margin: 0 !important; padding: 20px !important; box-sizing: border-box !important;';
    }
    updateCacheProgress(current, total);
}

function updateCacheProgress(current, total, songName) {
    const progressEl = document.getElementById('cache-progress-overlay');
    if (!progressEl) return;

    const percent = total > 0 ? (current / total * 100) : 0;
    const bar = progressEl.querySelector('.cache-progress-bar');
    const text = progressEl.querySelector('.cache-progress-text');
    const song = progressEl.querySelector('.cache-progress-song');

    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = `${current} / ${total}`;
    if (song) song.textContent = songName || '';
}

function hideCacheProgress() {
    const progressEl = document.getElementById('cache-progress-overlay');
    if (progressEl) {
        progressEl.remove();
    }
}

// ============================================================
// 6. 删除歌曲（需要 core 配合）
// ============================================================

function delSong(i) {
    showConfirmDialog('删除歌曲', '确定要删除这首歌曲吗？', () => {
        if (window.MusicPlayerCore) {
            window.MusicPlayerCore.playlist.splice(i, 1);
            window.MusicPlayerCore.saveData();
            if (typeof window.renderList === 'function') {
                window.renderList();
            }
            if (i === window.MusicPlayerCore.index) {
                window.MusicPlayerCore.audio.pause();
                window.MusicPlayerCore.index = -1;
                if (typeof window.updateView === 'function') {
                    window.updateView();
                }
            } else if (i < window.MusicPlayerCore.index) {
                window.MusicPlayerCore.index--;
            }
        }
    });
}

// ============================================================
// 暴露到全局
// ============================================================

window.showStatus = showStatus;
window.hexToHSL = hexToHSL;
window.hexToRgba = hexToRgba;
window.createFileInput = createFileInput;
window.handleFileUpload = handleFileUpload;
window.handleTextFileUpload = handleTextFileUpload;
window.showConfirmDialog = showConfirmDialog;
window.showInputDialog = showInputDialog;
window.showAddOptions = showAddOptions;
window.showLyricsDialog = showLyricsDialog;
window.showCacheProgress = showCacheProgress;
window.updateCacheProgress = updateCacheProgress;
window.hideCacheProgress = hideCacheProgress;
window.delSong = delSong;
