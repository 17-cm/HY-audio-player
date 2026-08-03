/**
 * ui-core.js - 音乐播放器界面核心模块
 * 作者: hy.禾一
 */

// ============================================================
// 加载样式
// ============================================================

function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/scripts/extensions/third-party/hy-yybfq/style.css';
    link.onload = () => console.log('✅ 播放器样式加载完成');
    link.onerror = () => console.error('❌ 播放器样式加载失败');
    document.head.appendChild(link);
}

// ============================================================
// 创建 UI
// ============================================================

function createUI() {
    // 状态提示
    const statusEl = document.createElement('div');
    statusEl.id = 'player-status';
    statusEl.className = 'player-status';
    document.body.appendChild(statusEl);

    // 律动图标
    const rhythmIcon = document.createElement('div');
    rhythmIcon.id = 'player-rhythm-icon';
    rhythmIcon.className = 'player-rhythm-icon';

    let bars = '';
    const totalBars = 60;
    for (let i = 0; i < totalBars; i++) {
        const pos = i / totalBars;
        const isEdge = pos < 0.15 || pos > 0.85;
        let h, s;
        if (isEdge) {
            h = Math.random() * 8 + 2;
            s = Math.random() * 2 + 1.5;
        } else {
            h = Math.random() * 30 + 5;
            s = Math.random() * 0.5 + 0.3;
        }
        const d = Math.random() * 0.8;
        bars += `<div class="rhythm-bar ${isEdge ? 'edge-bar' : ''}" style="--h:${h}px; --d:${d}s; --s:${s}s"></div>`;
    }

    rhythmIcon.innerHTML = `
        <div class="rhythm-star star-left">✦</div>
        <div class="rhythm-star star-right">✦</div>
        <div class="rhythm-left-zone">
            <div class="zone-hint">拖拽</div>
        </div>
        <div class="rhythm-wave-box">${bars}</div>
        <div class="rhythm-base-line"></div>
        <div class="rhythm-right-zone">
            <div class="zone-hint">双击</div>
        </div>
    `;
    document.body.appendChild(rhythmIcon);

    // 播放器主体
    const root = document.createElement('div');
    root.id = 'player-root';
    root.innerHTML = `
        <div id="player-rgb-border" class="player-rgb-border"></div>
        <div id="player-island" class="player-island"></div>
        <div id="player-inner" class="player-inner">
            <div id="player-main-content">
                <div class="player-main">
                    <div id="player-cover" class="player-cover"></div>
                    <div class="player-center">
                        <div class="player-meta">
                            <div id="player-title" class="player-title">支持网易云直链</div>
                            <div id="player-artist" class="player-artist">功能按钮查看使用说明</div>
                        </div>
                        <div id="player-lyrics" class="player-lyrics">⋆……𖦤……⋆</div>
                        <div class="player-prog-wrap">
                            <input type="range" id="inp-prog" value="0" min="0" max="100">
                        </div>
                        <div class="player-controls">
                            <button type="button" id="btn-play-mode"></button>
                            <button type="button" id="btn-prev">⏮</button>
                            <button type="button" id="btn-play">▶</button>
                            <button type="button" id="btn-next">⏭</button>
                            <button type="button" id="btn-list">☰</button>
                        </div>
                    </div>
                    <div class="player-right">
                        <button type="button" id="btn-rhythm" title="律动模式">𓆝</button>
                        <button type="button" id="btn-settings" title="设置">♡</button>
                        <button type="button" id="btn-pure" title="纯享模式">𓆟</button>
                    </div>
                </div>

                <div id="panel-settings" class="player-panel">
                    <div class="panel-section-title">播放设置</div>
                    <div class="panel-row">
                        <span>倍速 <b id="val-speed">1.0x</b></span>
                        <input id="inp-speed" type="range" min="0.5" max="2.0" step="0.1">
                    </div>

                    <div class="panel-section-title">背景设置</div>
                    <div class="panel-row">
                        <span>全屏背景</span>
                        <div class="panel-bg-ctrl">
                            <input id="inp-expanded-col" type="color">
                            <button type="button" id="btn-expanded-upload" class="panel-upload-btn">上传</button>
                        </div>
                    </div>
                    <div class="panel-row">
                        <span>窄屏背景</span>
                        <div class="panel-bg-ctrl">
                            <input id="inp-collapsed-col" type="color">
                            <button type="button" id="btn-collapsed-upload" class="panel-upload-btn">上传</button>
                        </div>
                    </div>

                    <div class="panel-section-title">封面设置</div>
                    <div class="panel-row">
                        <span>封面图片</span>
                        <button type="button" id="btn-cover-upload" class="panel-upload-btn">上传</button>
                    </div>
                    <div class="panel-row">
                        <span>封面宽度 <b id="val-cover-w">80px</b></span>
                        <input id="inp-cover-w" type="range" min="60" max="150" step="5">
                    </div>
                    <div class="panel-row">
                        <span>封面高度 <b id="val-cover-h">80px</b></span>
                        <input id="inp-cover-h" type="range" min="60" max="150" step="5">
                    </div>

                    <div class="panel-section-title">RGB 模式</div>
                    <div class="panel-row">
                        <span>灯光模式</span>
                        <div class="panel-opt-group">
                            <div class="rgb-opt" data-val="0">关闭</div>
                            <div class="rgb-opt" data-val="1">单色</div>
                            <div class="rgb-opt" data-val="2">幻彩</div>
                        </div>
                    </div>
                    <div class="panel-row">
                        <span>单色颜色</span>
                        <input id="inp-rgb" type="color">
                    </div>

                    <div class="panel-section-title">歌词渐变色</div>
                    <div class="panel-row panel-col-2">
                        <label>起始色 <input id="inp-lyrics-start" type="color"></label>
                        <label>结束色 <input id="inp-lyrics-end" type="color"></label>
                    </div>

                    <div class="panel-section-title">颜色设置</div>
                    <div class="panel-row panel-col-2">
                        <label>字体颜色 <input id="inp-theme" type="color"></label>
                        <label>边框色 <input id="inp-border" type="color"></label>
                    </div>

                    <div class="panel-section-title">磨砂玻璃设置</div>
                    <div class="panel-row">
                        <span>启用磨砂效果</span>
                        <input id="sw-glass" type="checkbox" checked>
                    </div>
                    <div class="panel-row">
                        <span>透明度 <b id="val-glass-opacity">60%</b></span>
                        <input id="inp-glass-opacity" type="range" min="10" max="90" value="60">
                    </div>

                    <div class="panel-section-title">尺寸调整</div>
                    <div class="panel-row">
                        <span>播放器宽度 <b id="val-width-player">400px</b></span>
                        <input id="inp-width-player" type="range" min="300" max="600" step="10">
                    </div>
                    <div class="panel-row">
                        <span>播放器高度 <b id="val-height-player">180px</b></span>
                        <input id="inp-height-player" type="range" min="140" max="300" step="5">
                    </div>
                    <div class="panel-row">
                        <span>边框宽度 <b id="val-width">6px</b></span>
                        <input id="inp-width" type="range" min="1" max="20" step="1">
                    </div>
                </div>

                <div id="panel-list" class="player-panel">
                    <div id="list-box" class="list-box"></div>
                    <div class="panel-list-btns">
                        <button type="button" id="btn-add" class="panel-action-btn">+ 添加歌曲</button>
                        <button type="button" id="btn-cache-all" class="panel-action-btn">⟳ 一键缓存</button>
                    </div>
                </div>

                <div id="panel-history" class="player-panel">
                    <div class="panel-section-title">导入历史</div>
                    <div id="history-list" class="history-list"></div>
                </div>
            </div>

            <div id="player-pure-mode" class="player-pure-mode">
                <div id="pure-lyrics-container"></div>
            </div>
        </div>
    `;
    document.body.appendChild(root);
}

// ============================================================
// 更新视图
// ============================================================

function updateView() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    if (window.extension_settings?.['music_player']?.playerHidden) {
        const root = document.getElementById('player-root');
        const rhythmIcon = document.getElementById('player-rhythm-icon');
        if (root) root.style.display = 'none';
        if (rhythmIcon) rhythmIcon.style.display = 'none';
        return;
    }

    const root = document.getElementById('player-root');
    const rootRgb = document.getElementById('player-rgb-border');
    const inner = document.getElementById('player-inner');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    const cfg = core.state.cfg;

    if (!root || !inner || !rhythmIcon) return;

    root.style.left = core.state.playerPos.x + 'px';
    root.style.top = core.state.playerPos.y + 'px';
    rhythmIcon.style.left = core.state.rhythmIconPos.x + 'px';
    rhythmIcon.style.top = core.state.rhythmIconPos.y + 'px';

    root.style.setProperty('--border-w', cfg.borderWidth);
    root.style.setProperty('--rgb-single', cfg.rgbColor);
    root.style.setProperty('--player-h', cfg.playerHeight);
    root.style.setProperty('--lyrics-start', cfg.lyricsGradientStart);
    root.style.setProperty('--lyrics-end', cfg.lyricsGradientEnd);
    root.style.color = cfg.themeColor;
    root.style.width = cfg.playerWidth;
    rhythmIcon.style.setProperty('--rgb-single', cfg.rgbColor);

    const island = document.getElementById('player-island');
    if (island) {
        island.className = 'player-island';
        const mode = core.state.rgbMode;
        if (mode === 0) {
            island.style.background = cfg.borderColor;
        } else if (mode === 1) {
            island.classList.add('rgb-single-breathe');
            island.style.setProperty('--rgb-single', cfg.rgbColor);
        } else if (mode === 2) {
            island.classList.add('rgb-rainbow-breathe');
        }
    }

    let currentBg = core.state.panel ? cfg.expandedBg : cfg.collapsedBg;

    if (core.state.glass) {
        inner.classList.add('glass-mode');
        if (currentBg.startsWith('#')) {
            inner.style.background = window.hexToRgba(currentBg, core.state.glassOpacity);
        } else if (currentBg.startsWith('url')) {
            inner.style.background = `${currentBg}, rgba(0,0,0,${1 - core.state.glassOpacity})`;
            inner.style.backgroundSize = 'cover';
            inner.style.backgroundBlendMode = 'overlay';
        } else {
            inner.style.background = currentBg;
        }
        inner.style.setProperty('--glass-opacity', core.state.glassOpacity);
    } else {
        inner.classList.remove('glass-mode');
        inner.style.background = currentBg;
        inner.style.backdropFilter = 'none';
    }

    const coverEl = document.getElementById('player-cover');
    if (coverEl) {
        coverEl.style.backgroundImage = `url("${cfg.cover}")`;
        coverEl.style.width = cfg.coverWidth + 'px';
        coverEl.style.height = cfg.coverHeight + 'px';
    }

    if (rootRgb) {
        rootRgb.className = 'player-rgb-border';
        const mode = core.state.rgbMode;
        if (mode === 0) {
            rootRgb.style.background = cfg.borderColor;
        } else if (mode === 1) {
            rootRgb.classList.add('mode-single');
        } else if (mode === 2) {
            rootRgb.classList.add('mode-rainbow');
        }
    }

    rhythmIcon.className = 'player-rhythm-icon';
    if (core.state.isPlaying) rhythmIcon.classList.add('playing');
    if (core.state.rgbMode === 1) rhythmIcon.classList.add('rgb-single');
    if (core.state.rgbMode === 2) rhythmIcon.classList.add('rgb-rainbow');

    if (core.state.isRhythmMode) {
        root.style.display = 'none';
        rhythmIcon.style.display = 'flex';
    } else {
        root.style.display = 'flex';
        rhythmIcon.style.display = 'none';
    }

    root.classList.toggle('pure-mode', core.state.isPureMode);
    updatePureLyrics();

    const modeBtn = document.getElementById('btn-play-mode');
    if (modeBtn) {
        const svgs = [
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="17" font-size="8" stroke="none" fill="currentColor">1</text></svg>',
            '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>'
        ];
        modeBtn.innerHTML = svgs[core.state.playMode];
    }

    const t = core.playlist[core.index];
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');

    if (titleEl) titleEl.innerText = t ? t.title : '支持网易云直链';
    if (artistEl) artistEl.innerText = t ? t.artist : '功能按钮查看使用说明';

    updateSettingsPanel();
}

function updateSettingsPanel() {
    const core = window.MusicPlayerCore;
    if (!core) return;
    const cfg = core.state.cfg;

    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setValue('inp-theme', cfg.themeColor);
    setValue('inp-border', cfg.borderColor);
    setValue('inp-rgb', cfg.rgbColor);
    setValue('inp-lyrics-start', cfg.lyricsGradientStart);
    setValue('inp-lyrics-end', cfg.lyricsGradientEnd);
    setValue('inp-expanded-col', cfg.expandedBg.startsWith('#') ? cfg.expandedBg : '#1a1a1a');
    setValue('inp-collapsed-col', cfg.collapsedBg.startsWith('#') ? cfg.collapsedBg : '#1a1a1a');

    const glassToggle = document.getElementById('sw-glass');
    if (glassToggle) glassToggle.checked = core.state.glass;

    setValue('inp-glass-opacity', Math.round(core.state.glassOpacity * 100));
    setText('val-glass-opacity', Math.round(core.state.glassOpacity * 100) + '%');

    setValue('inp-speed', core.state.speed);
    setText('val-speed', core.state.speed + 'x');

    setValue('inp-width', parseInt(cfg.borderWidth));
    setText('val-width', cfg.borderWidth);

    setValue('inp-width-player', parseInt(cfg.playerWidth));
    setText('val-width-player', cfg.playerWidth);

    setValue('inp-height-player', parseInt(cfg.playerHeight));
    setText('val-height-player', cfg.playerHeight);

    setValue('inp-cover-w', cfg.coverWidth);
    setText('val-cover-w', cfg.coverWidth + 'px');

    setValue('inp-cover-h', cfg.coverHeight);
    setText('val-cover-h', cfg.coverHeight + 'px');

    const rgbOpts = document.querySelectorAll('.rgb-opt');
    rgbOpts.forEach(opt => {
        opt.classList.toggle('active', parseInt(opt.dataset.val) === core.state.rgbMode);
    });
}

// ============================================================
// 歌词相关
// ============================================================

function updateLyrics() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    if (!core.state.lyrics.length) {
        const lyricsEl = document.getElementById('player-lyrics');
        if (lyricsEl) lyricsEl.innerText = '⋆……𖦤……⋆';
        return;
    }

    const time = core.audio.currentTime;
    let currentLine = '';
    for (let i = 0; i < core.state.lyrics.length; i++) {
        if (time >= core.state.lyrics[i].time) {
            currentLine = core.state.lyrics[i].text;
        } else {
            break;
        }
    }
    const lyricsEl = document.getElementById('player-lyrics');
    if (lyricsEl) lyricsEl.innerText = currentLine || '⋆……𖦤……⋆';

    if (core.state.isPureMode) {
        updatePureLyrics();
    }
}

function updatePureLyrics() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('pure-lyrics-container');
    if (!container) return;

    if (!core.state.lyrics.length) {
        container.innerHTML = '<div class="pure-lyric-line active no-lyrics">晚睡的小孩不会有美梦光临哦</div>';
        return;
    }

    const time = core.audio.currentTime;
    let currentIndex = -1;

    for (let i = 0; i < core.state.lyrics.length; i++) {
        if (time >= core.state.lyrics[i].time) {
            currentIndex = i;
        } else {
            break;
        }
    }

    if (currentIndex !== core.state.currentLyricIndex) {
        core.state.currentLyricIndex = currentIndex;
        renderPureLyrics(currentIndex);
    }

    if (currentIndex >= 0 && currentIndex < core.state.lyrics.length - 1) {
        const currentLyric = core.state.lyrics[currentIndex];
        const nextLyric = core.state.lyrics[currentIndex + 1];
        const duration = nextLyric.time - currentLyric.time;
        const elapsed = time - currentLyric.time;
        const progress = Math.min(elapsed / duration * 100, 100);

        const activeLine = container.querySelector('.pure-lyric-line.active');
        if (activeLine) {
            activeLine.style.setProperty('--lyric-progress', progress + '%');
        }
    }
}

function renderPureLyrics(currentIndex) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('pure-lyrics-container');
    if (!container) return;

    container.innerHTML = '';

    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(core.state.lyrics.length, currentIndex + 3);

    for (let i = start; i < end; i++) {
        const line = document.createElement('div');
        line.className = 'pure-lyric-line';
        line.innerText = core.state.lyrics[i].text;

        if (i === currentIndex) {
            line.classList.add('active');
        } else if (i < currentIndex) {
            line.classList.add('passed');
        }

        container.appendChild(line);
    }
}

// ============================================================
// 暴露到全局
// ============================================================

window.loadCSS = loadCSS;
window.createUI = createUI;
window.updateView = updateView;
window.updateSettingsPanel = updateSettingsPanel;
window.updateLyrics = updateLyrics;
window.updatePureLyrics = updatePureLyrics;
window.renderPureLyrics = renderPureLyrics;
