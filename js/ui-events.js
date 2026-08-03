/**
 * ui-events.js - 音乐播放器事件绑定模块
 * 作者: hy.禾一
 */

// ============================================================
// 模式切换
// ============================================================

function togglePanel(type) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const root = document.getElementById('player-root');
    const p1 = document.getElementById('panel-settings');
    const p2 = document.getElementById('panel-list');
    const p3 = document.getElementById('panel-history');

    if (core.state.panel === type) {
        root.classList.remove('expanded');
        p1.style.display = p2.style.display = p3.style.display = 'none';
        core.state.panel = false;
    } else {
        root.classList.add('expanded');
        p1.style.display = type === 'settings' ? 'flex' : 'none';
        p2.style.display = type === 'list' ? 'flex' : 'none';
        p3.style.display = type === 'history' ? 'flex' : 'none';
        core.state.panel = type;

        if (type === 'history') {
            renderImportHistory();
        }
    }
    window.updateView();
}

function togglePureMode() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    core.state.isPureMode = !core.state.isPureMode;
    core.state.currentLyricIndex = -1;
    window.updateView();
    core.saveData();
}

function toggleRhythmMode() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    core.state.isRhythmMode = !core.state.isRhythmMode;
    window.updateView();
    core.saveData();
}

// ============================================================
// 显示/隐藏 UI
// ============================================================

function showUI() {
    if (window.extension_settings?.['music_player']?.playerHidden) return;

    const core = window.MusicPlayerCore;
    if (!core) return;

    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');

    if (core.state.isRhythmMode) {
        if (root) root.style.display = 'none';
        if (rhythmIcon) rhythmIcon.style.display = 'flex';
    } else {
        if (root) root.style.display = 'flex';
        if (rhythmIcon) rhythmIcon.style.display = 'none';
    }

    window.updateView();
}

function hideUI() {
    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    if (root) root.style.display = 'none';
    if (rhythmIcon) rhythmIcon.style.display = 'none';
}

// ============================================================
// 事件绑定
// ============================================================

function bindEvents() {
    const core = window.MusicPlayerCore;
    if (!core) {
        console.error('❌ MusicPlayerCore 未加载，无法绑定事件');
        return;
    }

    const root = document.getElementById('player-root');
    const rhythmIcon = document.getElementById('player-rhythm-icon');
    const island = document.getElementById('player-island');
    const leftZone = rhythmIcon?.querySelector('.rhythm-left-zone');
    const rightZone = rhythmIcon?.querySelector('.rhythm-right-zone');

    if (island) {
        const handlePlayerDrag = (e) => {
            e.preventDefault();
            const startX = e.clientX || e.touches[0].clientX;
            const startY = e.clientY || e.touches[0].clientY;
            core.drag.active = true;
            core.drag.offX = startX - root.offsetLeft;
            core.drag.offY = startY - root.offsetTop;

            const move = (ev) => {
                if (!core.drag.active) return;
                ev.preventDefault();
                const cx = ev.clientX || ev.touches[0].clientX;
                const cy = ev.clientY || ev.touches[0].clientY;
                const x = cx - core.drag.offX;
                const y = cy - core.drag.offY;
                root.style.left = x + 'px';
                root.style.top = y + 'px';
                core.state.playerPos = { x, y };
            };

            const up = () => {
                core.drag.active = false;
                core.saveData();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', up);
                document.removeEventListener('touchend', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', up);
            document.addEventListener('touchend', up);
        };

        island.addEventListener('mousedown', handlePlayerDrag);
        island.addEventListener('touchstart', handlePlayerDrag);
    }

    if (leftZone) {
        const handleRhythmDrag = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const startX = e.clientX || e.touches[0].clientX;
            const startY = e.clientY || e.touches[0].clientY;
            core.drag.active = true;
            core.drag.offX = startX - rhythmIcon.offsetLeft;
            core.drag.offY = startY - rhythmIcon.offsetTop;

            const move = (ev) => {
                if (!core.drag.active) return;
                ev.preventDefault();
                const cx = ev.clientX || ev.touches[0].clientX;
                const cy = ev.clientY || ev.touches[0].clientY;
                const x = cx - core.drag.offX;
                const y = cy - core.drag.offY;
                rhythmIcon.style.left = x + 'px';
                rhythmIcon.style.top = y + 'px';
                core.state.rhythmIconPos = { x, y };
            };

            const up = () => {
                core.drag.active = false;
                core.saveData();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('mouseup', up);
                document.removeEventListener('touchend', up);
            };

            document.addEventListener('mousemove', move);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('mouseup', up);
            document.addEventListener('touchend', up);
        };

        leftZone.addEventListener('mousedown', handleRhythmDrag);
        leftZone.addEventListener('touchstart', handleRhythmDrag);
    }

    if (rightZone) {
        let lastClickTime = 0;
        const handleRightClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const now = Date.now();
            if (now - lastClickTime < 300) {
                core.state.isRhythmMode = false;
                window.updateView();
                core.saveData();
                lastClickTime = 0;
            } else {
                lastClickTime = now;
            }
        };

        rightZone.addEventListener('click', handleRightClick);
        rightZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleRightClick(e);
        });
    }

    const click = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = (e) => { e.stopPropagation(); fn(e); };
    };

    click('btn-rhythm', () => {
        core.state.isRhythmMode = true;
        window.updateView();
        core.saveData();
    });

    click('btn-play', () => core.toggle());
    click('btn-next', () => core.next());
    click('btn-prev', () => core.prev());

    click('btn-play-mode', () => {
        core.state.playMode = (core.state.playMode + 1) % 3;
        window.updateView();
        core.saveData();
    });

    click('btn-settings', () => window.togglePanel('settings'));
    click('btn-list', () => window.togglePanel('list'));
    click('btn-history', () => window.togglePanel('history'));
    click('btn-add', () => window.showAddOptions());
    click('btn-pure', () => window.togglePureMode());
    click('player-pure-mode', () => window.togglePureMode());
    click('btn-cache-all', () => core.cacheAllSongs());

    click('btn-cover-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.cover = dataUrl;
                window.updateView();
                core.saveData();
            });
        });
    });

    click('btn-expanded-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.expandedBg = `url("${dataUrl}")`;
                window.updateView();
                core.saveData();
            });
        });
    });

    click('btn-collapsed-upload', () => {
        window.createFileInput('image/*', (file) => {
            window.handleFileUpload(file, (dataUrl) => {
                core.state.cfg.collapsedBg = `url("${dataUrl}")`;
                window.updateView();
                core.saveData();
            });
        });
    });

    const bgColorChange = (id, key) => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = (e) => {
                core.state.cfg[key] = e.target.value;
                window.updateView();
            };
            el.onchange = () => core.saveData();
        }
    };

    bgColorChange('inp-expanded-col', 'expandedBg');
    bgColorChange('inp-collapsed-col', 'collapsedBg');

    const change = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onchange = (e) => { fn(e.target.value); core.saveData(); };
    };

    change('inp-theme', v => { core.state.cfg.themeColor = v; window.updateView(); });
    change('inp-border', v => { core.state.cfg.borderColor = v; window.updateView(); });
    change('inp-rgb', v => { core.state.cfg.rgbColor = v; window.updateView(); });
    change('inp-lyrics-start', v => { core.state.cfg.lyricsGradientStart = v; window.updateView(); });
    change('inp-lyrics-end', v => { core.state.cfg.lyricsGradientEnd = v; window.updateView(); });

    document.querySelectorAll('.rgb-opt').forEach(opt => {
        opt.onclick = () => {
            core.state.rgbMode = parseInt(opt.dataset.val);
            window.updateView();
            core.saveData();
        };
    });

    const glassToggle = document.getElementById('sw-glass');
    if (glassToggle) {
        glassToggle.onchange = (e) => {
            core.state.glass = e.target.checked;
            window.updateView();
            core.saveData();
        };
    }

    const glassOpacityInput = document.getElementById('inp-glass-opacity');
    if (glassOpacityInput) {
        glassOpacityInput.oninput = (e) => {
            core.state.glassOpacity = parseInt(e.target.value) / 100;
            window.updateView();
        };
        glassOpacityInput.onchange = () => core.saveData();
    }

    const speedInput = document.getElementById('inp-speed');
    if (speedInput) {
        speedInput.oninput = (e) => {
            core.state.speed = parseFloat(e.target.value);
            core.audio.playbackRate = core.state.speed;
            window.updateView();
        };
        speedInput.onchange = () => core.saveData();
    }

    const borderWidthInput = document.getElementById('inp-width');
    if (borderWidthInput) {
        borderWidthInput.oninput = (e) => {
            core.state.cfg.borderWidth = e.target.value + 'px';
            window.updateView();
        };
        borderWidthInput.onchange = () => core.saveData();
    }

    const playerWidthInput = document.getElementById('inp-width-player');
    if (playerWidthInput) {
        playerWidthInput.oninput = (e) => {
            core.state.cfg.playerWidth = e.target.value + 'px';
            window.updateView();
        };
        playerWidthInput.onchange = () => core.saveData();
    }

    const playerHeightInput = document.getElementById('inp-height-player');
    if (playerHeightInput) {
        playerHeightInput.oninput = (e) => {
            core.state.cfg.playerHeight = e.target.value + 'px';
            window.updateView();
        };
        playerHeightInput.onchange = () => core.saveData();
    }

    const coverWInput = document.getElementById('inp-cover-w');
    if (coverWInput) {
        coverWInput.oninput = (e) => {
            core.state.cfg.coverWidth = parseInt(e.target.value);
            window.updateView();
        };
        coverWInput.onchange = () => core.saveData();
    }

    const coverHInput = document.getElementById('inp-cover-h');
    if (coverHInput) {
        coverHInput.oninput = (e) => {
            core.state.cfg.coverHeight = parseInt(e.target.value);
            window.updateView();
        };
        coverHInput.onchange = () => core.saveData();
    }

    const progInput = document.getElementById('inp-prog');
    if (progInput) {
        progInput.oninput = (e) => {
            if (core.audio.duration) {
                core.audio.currentTime = (e.target.value / 100) * core.audio.duration;
            }
        };
    }

    console.log('✅ 播放器事件绑定完成');
}

// ============================================================
// 暴露到全局
// ============================================================

window.togglePanel = togglePanel;
window.togglePureMode = togglePureMode;
window.toggleRhythmMode = toggleRhythmMode;
window.showUI = showUI;
window.hideUI = hideUI;
window.bindEvents = bindEvents;
