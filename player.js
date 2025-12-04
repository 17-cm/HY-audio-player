/*
 * 音乐播放器核心逻辑
 * 版本: 1.0.3
 * 作者: hy.禾一
 */

(function() {
    'use strict';

    // 默认配置
    const defaultConfig = {
        cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500',
        coverWidth: 80,
        coverHeight: 80,
        expandedBg: '#1a1a1a',
        collapsedBg: '#1a1a1a',
        borderColor: '#333333',
        borderWidth: '6px',
        themeColor: '#ffffff',
        rgbColor: '#7eb8c9',
        glassAlpha: 0.6,
        playerWidth: '400px',
        playerHeight: '180px',
        lyricsGradientStart: '#7eb8c9',
        lyricsGradientEnd: '#c9a7eb',
        pos: { x: 20, y: 100 }
    };

    // 播放器应用
    const MusicPlayerApp = {
        playlist: [],
        index: -1,
        audio: new Audio(),
        state: {
            playMode: 0,
            rgbMode: 0,
            glass: true,
            glassOpacity: 0.6,
            speed: 1.0,
            panel: false,
            isRhythmMode: false,
            isPlaying: false,
            isPureMode: false,
            lyrics: [],
            currentLyricIndex: -1,
            cfg: { ...defaultConfig },
            playerPos: { x: 20, y: 100 },
            rhythmIconPos: { x: 20, y: 300 },
            importHistory: []
        },
        drag: { active: false, offX: 0, offY: 0 },

        init() {
            this.injectCSS();
            this.createUI();
            this.loadData();
            this.bindEvents();
            this.startRainbowTimer();
            console.log('🎵 播放器核心初始化完成');
        },

        // 幻彩模式定时器 - 随机变换颜色
        startRainbowTimer() {
            setInterval(() => {
                if (this.state.rgbMode === 2) {
                    this.updateRainbowColors();
                }
            }, 2000);
        },

        // 更新幻彩颜色
        updateRainbowColors() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (!root && !rhythmIcon) return;

            // 生成随机色相偏移
            const hueOffset = Math.floor(Math.random() * 360);
            const cssVar = `--rainbow-offset`;
            
            if (root) root.style.setProperty(cssVar, hueOffset + 'deg');
            if (rhythmIcon) rhythmIcon.style.setProperty(cssVar, hueOffset + 'deg');
        },

        loadData() {
            try {
                const raw = localStorage.getItem('music_player_data');
                if (raw) {
                    const data = JSON.parse(raw);
                    // 恢复播放列表
                    if (data.playlist && Array.isArray(data.playlist)) {
                        this.playlist = data.playlist.map(song => ({
                            title: song.title || 'Unknown',
                            artist: song.artist || 'Unknown',
                            url: song.url || '',
                            lyrics: song.lyrics || '',
                            cover: song.cover || defaultConfig.cover
                        }));
                    }
                    // 恢复状态
                    if (data.state) {
                        this.state = { ...this.state, ...data.state };
                        this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                        
                        const checkPos = (pos, def) => {
                            if (!pos || pos.x > window.innerWidth - 50) pos.x = def.x;
                            if (!pos || pos.y > window.innerHeight - 50) pos.y = def.y;
                            return pos || def;
                        };
                        this.state.playerPos = checkPos(this.state.playerPos, defaultConfig.pos);
                        this.state.rhythmIconPos = checkPos(this.state.rhythmIconPos, { x: 20, y: 300 });
                    }
                }
            } catch (error) {
                console.error('加载数据失败:', error);
            }
            this.state.panel = false;
            this.state.isPlaying = false;
            this.updateView();
            this.renderList();
        },

        saveData() {
            try {
                const dataToSave = {
                    playlist: this.playlist.map(song => ({
                        title: song.title,
                        artist: song.artist,
                        url: song.url,
                        lyrics: song.lyrics,
                        cover: song.cover
                    })),
                    state: {
                        playMode: this.state.playMode,
                        rgbMode: this.state.rgbMode,
                        glass: this.state.glass,
                        glassOpacity: this.state.glassOpacity,
                        speed: this.state.speed,
                        isRhythmMode: this.state.isRhythmMode,
                        isPureMode: this.state.isPureMode,
                        cfg: this.state.cfg,
                        playerPos: this.state.playerPos,
                        rhythmIconPos: this.state.rhythmIconPos,
                        importHistory: this.state.importHistory
                    }
                };
                localStorage.setItem('music_player_data', JSON.stringify(dataToSave));
            } catch (error) {
                console.error('保存数据失败:', error);
            }
        },

        showStatus(message, type = 'info', duration = 3000) {
            const statusEl = document.getElementById('player-status');
            if (statusEl) {
                statusEl.textContent = message;
                statusEl.className = `player-status status-${type}`;
                statusEl.style.opacity = '1';
                
                clearTimeout(this.statusTimer);
                this.statusTimer = setTimeout(() => {
                    statusEl.style.opacity = '0';
                }, duration);
            }
        },

        addImportHistory(type, data) {
            const history = {
                type: type,
                data: data,
                time: new Date().toLocaleTimeString()
            };
            this.state.importHistory.unshift(history);
            if (this.state.importHistory.length > 10) {
                this.state.importHistory.pop();
            }
            this.saveData();
        },

        handleFileUpload(file, callback) {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsDataURL(file);
        },

        handleTextFileUpload(file, callback) {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsText(file);
        },

        createFileInput(accept, callback) {
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
        },

        hexToHSL(hex) {
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
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
        },

        // 检查是否被扩展隐藏
        isHiddenByExtension() {
            try {
                const saved = localStorage.getItem('music_player_extension_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    return settings.playerHidden === true;
                }
            } catch (e) {}
            return false;
        },
        
        updateView() {
            const root = document.getElementById('player-root');
            const rootRgb = document.getElementById('player-rgb-border');
            const inner = document.getElementById('player-inner');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            const cfg = this.state.cfg;

            if (!root || !inner || !rhythmIcon) return;

            // 检查是否被扩展隐藏，如果是则不显示
            if (this.isHiddenByExtension()) {
                root.style.display = 'none';
                rhythmIcon.style.display = 'none';
                return;
            }

            root.style.left = this.state.playerPos.x + 'px';
            root.style.top = this.state.playerPos.y + 'px';
            rhythmIcon.style.left = this.state.rhythmIconPos.x + 'px';
            rhythmIcon.style.top = this.state.rhythmIconPos.y + 'px';

            root.style.setProperty('--border-w', cfg.borderWidth);
            root.style.setProperty('--rgb-single', cfg.rgbColor);
            root.style.setProperty('--player-h', cfg.playerHeight);
            root.style.setProperty('--lyrics-start', cfg.lyricsGradientStart);
            root.style.setProperty('--lyrics-end', cfg.lyricsGradientEnd);
            root.style.color = cfg.themeColor;
            root.style.width = cfg.playerWidth;
            rhythmIcon.style.setProperty('--rgb-single', cfg.rgbColor);

            // 灵动岛
            const island = document.getElementById('player-island');
            if (island) {
                island.className = 'player-island';
                const mode = this.state.rgbMode;
                if (mode === 0) {
                    island.style.background = cfg.borderColor;
                } else if (mode === 1) {
                    island.classList.add('rgb-single-flow');
                    island.style.setProperty('--rgb-single', cfg.rgbColor);
                } else if (mode === 2) {
                    island.classList.add('rgb-rainbow-flow');
                }
            }

            const hexToRgba = (hex, alpha) => {
                let r=0, g=0, b=0;
                if(hex.length === 4){
                    r=parseInt(hex[1]+hex[1],16);
                    g=parseInt(hex[2]+hex[2],16);
                    b=parseInt(hex[3]+hex[3],16);
                }else if(hex.length === 7){
                    r=parseInt(hex.slice(1,3),16);
                    g=parseInt(hex.slice(3,5),16);
                    b=parseInt(hex.slice(5,7),16);
                }
                return `rgba(${r},${g},${b},${alpha})`;
            };

            let currentBg = this.state.panel ? cfg.expandedBg : cfg.collapsedBg;

            if (this.state.glass) {
                inner.classList.add('glass-mode');
                if (currentBg.startsWith('#')) {
                    inner.style.background = hexToRgba(currentBg, this.state.glassOpacity);
                } else if (currentBg.startsWith('url')) {
                    inner.style.background = `${currentBg}, rgba(0,0,0,${1 - this.state.glassOpacity})`;
                    inner.style.backgroundSize = 'cover';
                    inner.style.backgroundBlendMode = 'overlay';
                } else {
                    inner.style.background = currentBg;
                }
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

            // RGB边框
            if (rootRgb) {
                rootRgb.className = 'player-rgb-border';
                const mode = this.state.rgbMode;
                if (mode === 0) {
                    rootRgb.style.background = cfg.borderColor;
                } else if (mode === 1) {
                    rootRgb.classList.add('mode-single');
                } else if (mode === 2) {
                    rootRgb.classList.add('mode-rainbow');
                }
            }

            // 律动图标
            rhythmIcon.className = 'player-rhythm-icon';
            if (this.state.isPlaying) rhythmIcon.classList.add('playing');
            if (this.state.rgbMode === 1) rhythmIcon.classList.add('rgb-single');
            if (this.state.rgbMode === 2) rhythmIcon.classList.add('rgb-rainbow');

            // 显示/隐藏模式
            if (this.state.isRhythmMode) {
                root.style.display = 'none';
                rhythmIcon.style.display = 'flex';
            } else {
                root.style.display = 'flex';
                rhythmIcon.style.display = 'none';
            }

            // 纯享模式
            root.classList.toggle('pure-mode', this.state.isPureMode);
            this.updatePureLyrics();

            // 播放模式按钮
            const modeBtn = document.getElementById('btn-play-mode');
            if (modeBtn) {
                const svgs = [
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="17" font-size="8" stroke="none" fill="currentColor">1</text></svg>',
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>'
                ];
                modeBtn.innerHTML = svgs[this.state.playMode];
            }

            // 歌曲信息
            const t = this.playlist[this.index];
            const titleEl = document.getElementById('player-title');
            const artistEl = document.getElementById('player-artist');
            
            if (titleEl) titleEl.innerText = t ? t.title : '支持网易云直链';
            if (artistEl) artistEl.innerText = t ? t.artist : '功能按钮查看使用说明';

            this.updateSettingsPanel();
        },

        updateSettingsPanel() {
            const cfg = this.state.cfg;
            
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
            if (glassToggle) glassToggle.checked = this.state.glass;
            
            setValue('inp-glass-opacity', Math.round(this.state.glassOpacity * 100));
            setText('val-glass-opacity', Math.round(this.state.glassOpacity * 100) + '%');
            
            setValue('inp-speed', this.state.speed);
            setText('val-speed', this.state.speed + 'x');
            
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
                opt.classList.toggle('active', parseInt(opt.dataset.val) === this.state.rgbMode);
            });
        },
        
        updatePureLyrics() {
            const container = document.getElementById('pure-lyrics-container');
            if (!container) return;
            
            if (!this.state.lyrics || !this.state.lyrics.length) {
                container.innerHTML = '<div class="pure-lyric-line active no-lyrics">晚睡的小孩不会有美梦光临哦</div>';
                return;
            }

            const time = this.audio.currentTime;
            let currentIndex = -1;
            
            for (let i = 0; i < this.state.lyrics.length; i++) {
                if (time >= this.state.lyrics[i].time) {
                    currentIndex = i;
                } else {
                    break;
                }
            }

            if (currentIndex !== this.state.currentLyricIndex) {
                this.state.currentLyricIndex = currentIndex;
                this.renderPureLyrics(currentIndex);
            }

            if (currentIndex >= 0 && currentIndex < this.state.lyrics.length - 1) {
                const currentLyric = this.state.lyrics[currentIndex];
                const nextLyric = this.state.lyrics[currentIndex + 1];
                const duration = nextLyric.time - currentLyric.time;
                const elapsed = time - currentLyric.time;
                const progress = Math.min(elapsed / duration * 100, 100);
                
                const activeLine = container.querySelector('.pure-lyric-line.active');
                if (activeLine) {
                    activeLine.style.setProperty('--progress', progress + '%');
                }
            }
        },

        renderPureLyrics(currentIndex) {
            const container = document.getElementById('pure-lyrics-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            const start = Math.max(0, currentIndex - 2);
            const end = Math.min(this.state.lyrics.length, currentIndex + 3);
            
            for (let i = start; i < end; i++) {
                const line = document.createElement('div');
                line.className = 'pure-lyric-line';
                line.innerText = this.state.lyrics[i].text;
                
                if (i === currentIndex) {
                    line.classList.add('active');
                } else if (i < currentIndex) {
                    line.classList.add('passed');
                }
                
                container.appendChild(line);
            }
        },
        
        // 播放控制
        play(i) {
            if (!this.playlist[i]) return;
            
            // 验证URL是否有效
            const song = this.playlist[i];
            if (!song.url) {
                this.showStatus('播放链接无效', 'error');
                return;
            }
            
            this.index = i;
            this.audio.src = song.url;
            this.audio.playbackRate = this.state.speed;
            
            // 解析歌词
            if (song.lyrics && song.lyrics.trim()) {
                this.state.lyrics = this.parseLyrics(song.lyrics);
            } else {
                this.state.lyrics = [];
            }
            this.state.currentLyricIndex = -1;
            
            // 更新封面
            if (song.cover) {
                this.state.cfg.cover = song.cover;
            }
            
            this.audio.play().catch(e => {
                console.error('播放失败:', e);
                this.showStatus('播放失败，链接可能已过期', 'error');
            });
            
            this.updateView();
            this.renderList();
        },

        toggle() {
            if (!this.playlist.length) return this.showAddOptions();
            if (this.audio.paused) {
                if (this.index === -1) {
                    this.play(0);
                } else {
                    this.audio.play().catch(e => console.log(e));
                }
            } else {
                this.audio.pause();
            }
        },

        next() {
            if (!this.playlist.length) return;
            let n;
            if (this.state.playMode === 2) {
                do { 
                    n = Math.floor(Math.random() * this.playlist.length); 
                } while (n === this.index && this.playlist.length > 1);
            } else {
                n = this.index + 1 >= this.playlist.length ? 0 : this.index + 1;
            }
            this.play(n);
        },

        prev() {
            if (!this.playlist.length) return;
            let n = this.index - 1 < 0 ? this.playlist.length - 1 : this.index - 1;
            this.play(n);
        },

        // 面板切换
        togglePanel(type) {
            const root = document.getElementById('player-root');
            const p1 = document.getElementById('panel-settings');
            const p2 = document.getElementById('panel-list');
            const p3 = document.getElementById('panel-history');
            
            if (this.state.panel === type) {
                root.classList.remove('expanded');
                p1.style.display = p2.style.display = p3.style.display = 'none';
                this.state.panel = false;
            } else {
                root.classList.add('expanded');
                p1.style.display = type === 'settings' ? 'flex' : 'none';
                p2.style.display = type === 'list' ? 'flex' : 'none';
                p3.style.display = type === 'history' ? 'flex' : 'none';
                this.state.panel = type;
                
                if (type === 'history') {
                    this.renderImportHistory();
                }
            }
            this.updateView();
        },

        togglePureMode() {
            this.state.isPureMode = !this.state.isPureMode;
            this.state.currentLyricIndex = -1;
            this.updateView();
            this.saveData();
        },

        // 歌词解析
        parseLyrics(lrc) {
            if (!lrc || typeof lrc !== 'string') return [];
            
            const lines = lrc.split('\n');
            const result = [];
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
            
            for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const ms = parseInt(match[3]);
                    const time = minutes * 60 + seconds + (ms < 100 ? ms / 100 : ms / 1000);
                    const text = match[4].trim();
                    if (text) result.push({ time, text });
                }
            }
            return result.sort((a, b) => a.time - b.time);
        },

        // 更新歌词显示
        updateLyrics() {
            const lyricsEl = document.getElementById('player-lyrics');
            
            if (!this.state.lyrics || !this.state.lyrics.length) {
                if (lyricsEl) lyricsEl.innerText = '⋆……𖦤……⋆';
                return;
            }
            
            const time = this.audio.currentTime;
            let currentLine = '';
            
            for (let i = 0; i < this.state.lyrics.length; i++) {
                if (time >= this.state.lyrics[i].time) {
                    currentLine = this.state.lyrics[i].text;
                } else {
                    break;
                }
            }
            
            if (lyricsEl) lyricsEl.innerText = currentLine || '⋆……𖦤……⋆';
            
            if (this.state.isPureMode) {
                this.updatePureLyrics();
            }
        },

        // 链接识别
        isNeteaseLink(url) {
            return url.includes('music.163.com') || 
                   url.includes('163cn.tv') || 
                   url.includes('y.music.163.com');
        },

        isPlaylistLink(url) {
            return url.includes('playlist') || url.includes('playlist?id=');
        },

        // 删除歌曲
        delSong(i) {
            if (!confirm('确定删除这首歌吗？')) return;
            this.playlist.splice(i, 1);
            this.saveData();
            this.renderList();
            if (i === this.index) {
                this.audio.pause();
                this.audio.src = '';
                this.index = -1;
                this.state.lyrics = [];
                this.updateView();
            } else if (i < this.index) {
                this.index--;
            }
        },

        // 渲染播放列表
        renderList() {
            const list = document.getElementById('list-box');
            if (!list) return;
            
            list.innerHTML = '';
            this.playlist.forEach((t, i) => {
                const item = document.createElement('div');
                item.className = `list-item ${i === this.index ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="item-info"><b>${t.title}</b> - ${t.artist}</div>
                    <div class="item-btns">
                        <button type="button" class="btn-lyrics">词</button>
                        <button type="button" class="btn-del">×</button>
                    </div>
                `;
                item.querySelector('.item-info').onclick = () => this.play(i);
                item.querySelector('.btn-del').onclick = (e) => { e.stopPropagation(); this.delSong(i); };
                item.querySelector('.btn-lyrics').onclick = (e) => { e.stopPropagation(); this.showLyricsDialog(i); };
                list.appendChild(item);
            });
        },

        // 渲染导入历史
        renderImportHistory() {
            const container = document.getElementById('history-list');
            if (!container) return;
            
            if (!this.state.importHistory || this.state.importHistory.length === 0) {
                container.innerHTML = '<div class="no-history">暂无导入历史</div>';
                return;
            }
            
            let html = '';
            this.state.importHistory.forEach((history) => {
                const time = history.time;
                
                if (history.type === 'single') {
                    html += `
                        <div class="history-item">
                            <div class="history-icon">🎵</div>
                            <div class="history-content">
                                <div class="history-title">${history.data.title}</div>
                                <div class="history-sub">${history.data.artist}</div>
                            </div>
                            <div class="history-time">${time}</div>
                        </div>
                    `;
                } else if (history.type === 'playlist') {
                    html += `
                        <div class="history-item">
                            <div class="history-icon">📋</div>
                            <div class="history-content">
                                <div class="history-title">${history.data.name}</div>
                                <div class="history-sub">${history.data.creator} • ${history.data.count} 首</div>
                            </div>
                            <div class="history-time">${time}</div>
                        </div>
                    `;
                }
            });
            
            container.innerHTML = html;
        },

        // 显示添加选项弹窗
        showAddOptions() {
            const overlay = document.createElement('div');
            overlay.className = 'player-dialog-overlay';
            
            overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">添加歌曲</div>
                    <div class="add-options">
                        <button type="button" id="add-local-btn" class="add-option-btn">
                            <div class="option-icon">📁</div>
                            <div class="option-text">本地文件</div>
                        </button>
                        <button type="button" id="add-single-btn" class="add-option-btn">
                            <div class="option-icon">🎵</div>
                            <div class="option-text">网易云单曲</div>
                        </button>
                        <button type="button" id="add-playlist-btn" class="add-option-btn">
                            <div class="option-icon">📋</div>
                            <div class="option-text">网易云歌单</div>
                        </button>
                        <button type="button" id="add-url-btn" class="add-option-btn">
                            <div class="option-icon">🔗</div>
                            <div class="option-text">直链URL</div>
                        </button>
                    </div>
                    <button type="button" class="dialog-cancel">取消</button>
                </div>
            `;
            document.body.appendChild(overlay);

            // 本地文件
            overlay.querySelector('#add-local-btn').onclick = () => {
                overlay.remove();
                this.addLocalFile();
            };

            // 网易云单曲
            overlay.querySelector('#add-single-btn').onclick = () => {
                overlay.remove();
                this.addNeteaseSong();
            };

            // 网易云歌单
            overlay.querySelector('#add-playlist-btn').onclick = () => {
                overlay.remove();
                this.addNeteasePlaylist();
            };

            // 直链URL
            overlay.querySelector('#add-url-btn').onclick = () => {
                overlay.remove();
                this.addDirectUrl();
            };

            overlay.querySelector('.dialog-cancel').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        },

        // 添加本地文件
        addLocalFile() {
            this.createFileInput('audio/*', (file) => {
                this.handleFileUpload(file, (dataUrl) => {
                    const title = file.name.replace(/\.[^/.]+$/, '') || 'Unknown';
                    
                    this.playlist.push({
                        title: title,
                        artist: '本地文件',
                        url: dataUrl,
                        lyrics: '',
                        cover: defaultConfig.cover
                    });
                    
                    this.saveData();
                    this.renderList();
                    this.showStatus('本地文件添加成功！', 'success');
                    
                    if (this.index === -1) {
                        this.play(this.playlist.length - 1);
                    }
                });
            });
        },

        // 添加直链URL
        addDirectUrl() {
            const url = prompt('请输入音频直链URL：');
            if (!url) return;
            
            const title = prompt('歌曲名称：', 'Unknown') || 'Unknown';
            const artist = prompt('歌手名称：', 'Unknown') || 'Unknown';
            
            this.playlist.push({
                title: title,
                artist: artist,
                url: url,
                lyrics: '',
                cover: defaultConfig.cover
            });
            
            this.saveData();
            this.renderList();
            this.showStatus('歌曲添加成功！', 'success');
            
            if (this.index === -1) {
                this.play(this.playlist.length - 1);
            }
        },

        // 网易云歌曲信息获取
        async fetchNeteaseSongInfo(link) {
            try {
                this.showStatus('正在解析链接...', 'info');
                
                const detailResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: link })
                });
                
                if (!detailResponse.ok) {
                    throw new Error('获取歌曲信息失败');
                }
                
                const detailData = await detailResponse.json();
                
                if (detailData.code !== 200) {
                    throw new Error(detailData.msg || 'API返回错误');
                }
                
                const songInfo = detailData.data;
                
                const urlResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: link, 
                        level: 'exhigh'
                    })
                });
                
                if (!urlResponse.ok) {
                    throw new Error('获取播放链接失败');
                }
                
                const urlData = await urlResponse.json();
                
                if (urlData.code !== 200) {
                    throw new Error(urlData.msg || '获取播放链接失败');
                }
                
                let lyrics = '';
                try {
                    const lyricResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/lyric', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: link })
                    });
                    
                    if (lyricResponse.ok) {
                        const lyricData = await lyricResponse.json();
                        if (lyricData.code === 200 && lyricData.data) {
                            lyrics = lyricData.data.lrc || '';
                        }
                    }
                } catch (e) {
                    console.log('歌词获取失败，跳过');
                }
                
                let playUrl = '';
                if (urlData.data && Array.isArray(urlData.data) && urlData.data[0]) {
                    playUrl = urlData.data[0].url || '';
                }
                
                if (!playUrl) {
                    throw new Error('无法获取播放链接，可能需要VIP');
                }
                
                return {
                    title: songInfo.name || '未知歌曲',
                    artist: songInfo.singer || '未知艺术家',
                    url: playUrl,
                    lyrics: lyrics,
                    cover: songInfo.picimg || defaultConfig.cover,
                    duration: songInfo.duration || '0:00'
                };
                
            } catch (error) {
                console.error('网易云解析失败:', error);
                this.showStatus(`解析失败: ${error.message}`, 'error');
                throw error;
            }
        },

        // 添加网易云单曲
        addNeteaseSong() {
            const input = prompt('请输入网易云歌曲链接：\n\n支持格式：\n• music.163.com/song?id=xxx\n• y.music.163.com/m/song/xxx\n• 163cn.tv/xxx（短链接）');
            if (!input) return;
            
            if (!this.isNeteaseLink(input)) {
                this.showStatus('请输入有效的网易云链接', 'error');
                return;
            }
            
            this.fetchNeteaseSongInfo(input)
                .then(songInfo => {
                    this.playlist.push({
                        title: songInfo.title,
                        artist: songInfo.artist,
                        url: songInfo.url,
                        lyrics: songInfo.lyrics || '',
                        cover: songInfo.cover
                    });
                    
                    this.addImportHistory('single', {
                        title: songInfo.title,
                        artist: songInfo.artist,
                        link: input
                    });
                    
                    this.saveData();
                    this.renderList();
                    this.showStatus(`成功添加: ${songInfo.title}`, 'success');
                    
                    if (this.index === -1) {
                        this.play(this.playlist.length - 1);
                    }
                })
                .catch(error => {
                    console.error('添加失败:', error);
                });
        },

        // 网易云歌单获取
        async fetchNeteasePlaylist(link) {
            try {
                this.showStatus('正在解析歌单...', 'info');
                
                const response = await fetch('https://wyapi-1.toubiec.cn/api/music/playlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: link })
                });
                
                if (!response.ok) {
                    throw new Error('获取歌单失败');
                }
                
                const data = await response.json();
                
                if (data.code !== 200) {
                    throw new Error(data.msg || 'API返回错误');
                }
                
                return data.data;
                
            } catch (error) {
                console.error('歌单解析失败:', error);
                this.showStatus(`歌单解析失败: ${error.message}`, 'error');
                throw error;
            }
        },

        // 添加网易云歌单
        async addNeteasePlaylist() {
            const input = prompt('请输入网易云歌单链接：\n\n支持格式：\n• music.163.com/playlist?id=xxx\n• y.music.163.com/m/playlist?id=xxx');
            if (!input) return;
            
            if (!this.isPlaylistLink(input)) {
                this.showStatus('请输入有效的歌单链接', 'error');
                return;
            }
            
            try {
                const playlist = await this.fetchNeteasePlaylist(input);
                
                if (!playlist.tracks || playlist.tracks.length === 0) {
                    this.showStatus('歌单为空或无法获取歌曲列表', 'error');
                    return;
                }
                
                const confirmed = confirm(`发现歌单: ${playlist.name}\n创建者: ${playlist.creator}\n共 ${playlist.tracks.length} 首歌曲\n\n是否全部添加到播放列表？`);
                
                if (!confirmed) return;
                
                this.showStatus(`正在导入 ${playlist.tracks.length} 首歌曲...`, 'info');
                
                let addedCount = 0;
                let failedCount = 0;
                
                for (let i = 0; i < playlist.tracks.length; i++) {
                    const track = playlist.tracks[i];
                    const link = `music.163.com/song?id=${track.id}`;
                    
                    try {
                        const songInfo = await this.fetchNeteaseSongInfo(link);
                        
                        this.playlist.push({
                            title: track.name || songInfo.title,
                            artist: track.artists || songInfo.artist,
                            url: songInfo.url,
                            lyrics: songInfo.lyrics || '',
                            cover: track.picUrl || songInfo.cover
                        });
                        
                        addedCount++;
                        
                        if ((i + 1) % 5 === 0 || i === playlist.tracks.length - 1) {
                            this.showStatus(`已导入 ${i + 1}/${playlist.tracks.length} 首歌曲`, 'info');
                            this.saveData();
                        }
                        
                        // 延迟避免请求过快
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                    } catch (error) {
                        console.error(`歌曲 ${track.name} 导入失败:`, error);
                        failedCount++;
                    }
                }
                
                this.addImportHistory('playlist', {
                    name: playlist.name,
                    creator: playlist.creator,
                    count: addedCount,
                    link: input
                });
                
                this.saveData();
                this.renderList();
                
                if (addedCount > 0) {
                    this.showStatus(`导入完成！成功 ${addedCount} 首，失败 ${failedCount} 首`, 'success');
                    
                    if (this.index === -1 && this.playlist.length > 0) {
                        this.play(0);
                    }
                } else {
                    this.showStatus('没有歌曲成功导入', 'error');
                }
                
            } catch (error) {
                console.error('歌单导入失败:', error);
            }
        },

        // 歌词设置弹窗
        showLyricsDialog(i) {
            const overlay = document.createElement('div');
            overlay.className = 'player-dialog-overlay';
            
            const currentLyrics = this.playlist[i].lyrics || '';
            
            overlay.innerHTML = `
                <div class="player-dialog">
                    <div class="dialog-title">歌词设置 - ${this.playlist[i].title}</div>
                    <div class="lyrics-btns">
                        <button type="button" id="lyrics-paste-btn" class="add-option-btn">
                            <div class="option-icon">📝</div>
                            <div class="option-text">粘贴歌词</div>
                        </button>
                        <button type="button" id="lyrics-import-btn" class="add-option-btn">
                            <div class="option-icon">📄</div>
                            <div class="option-text">导入LRC文件</div>
                        </button>
                        ${currentLyrics ? `
                        <button type="button" id="lyrics-clear-btn" class="add-option-btn" style="border-color: #f55;">
                            <div class="option-icon">🗑️</div>
                            <div class="option-text">清除歌词</div>
                        </button>
                        ` : ''}
                    </div>
                    <button type="button" class="dialog-cancel">取消</button>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#lyrics-paste-btn').onclick = () => {
                overlay.remove();
                const newLyrics = prompt('请粘贴LRC格式歌词：\n\n格式示例：\n[00:00.00]歌词内容\n[00:05.50]第二句歌词', currentLyrics);
                if (newLyrics !== null) {
                    this.playlist[i].lyrics = newLyrics;
                    if (i === this.index) {
                        this.state.lyrics = this.parseLyrics(newLyrics);
                        this.state.currentLyricIndex = -1;
                    }
                    this.saveData();
                    this.showStatus('歌词已更新', 'success');
                }
            };

            overlay.querySelector('#lyrics-import-btn').onclick = () => {
                overlay.remove();
                this.createFileInput('.lrc,.txt', (file) => {
                    this.handleTextFileUpload(file, (content) => {
                        this.playlist[i].lyrics = content;
                        if (i === this.index) {
                            this.state.lyrics = this.parseLyrics(content);
                            this.state.currentLyricIndex = -1;
                        }
                        this.saveData();
                        this.showStatus('歌词导入成功！', 'success');
                    });
                });
            };

            const clearBtn = overlay.querySelector('#lyrics-clear-btn');
            if (clearBtn) {
                clearBtn.onclick = () => {
                    overlay.remove();
                    this.playlist[i].lyrics = '';
                    if (i === this.index) {
                        this.state.lyrics = [];
                        this.state.currentLyricIndex = -1;
                    }
                    this.saveData();
                    this.showStatus('歌词已清除', 'success');
                };
            }

            overlay.querySelector('.dialog-cancel').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        },

        // 绑定事件
        bindEvents() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            const island = document.getElementById('player-island');
            const leftZone = rhythmIcon.querySelector('.rhythm-left-zone');
            const rightZone = rhythmIcon.querySelector('.rhythm-right-zone');

            // 播放器拖拽
            const handlePlayerDrag = (e) => {
                e.preventDefault();
                this.drag.active = true;
                const startX = e.clientX || e.touches[0].clientX;
                const startY = e.clientY || e.touches[0].clientY;
                this.drag.offX = startX - root.offsetLeft;
                this.drag.offY = startY - root.offsetTop;

                const move = (ev) => {
                    if (!this.drag.active) return;
                    ev.preventDefault();
                    const cx = ev.clientX || (ev.touches && ev.touches[0].clientX);
                    const cy = ev.clientY || (ev.touches && ev.touches[0].clientY);
                    if (cx === undefined || cy === undefined) return;
                    
                    let x = cx - this.drag.offX;
                    let y = cy - this.drag.offY;
                    
                    // 边界限制
                    x = Math.max(0, Math.min(x, window.innerWidth - 100));
                    y = Math.max(0, Math.min(y, window.innerHeight - 100));
                    
                    root.style.left = x + 'px';
                    root.style.top = y + 'px';
                    this.state.playerPos = { x, y };
                };

                const up = () => {
                    this.drag.active = false;
                    this.saveData();
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

            if (island) {
                island.addEventListener('mousedown', handlePlayerDrag);
                island.addEventListener('touchstart', handlePlayerDrag, { passive: false });
            }

            // 律动图标拖拽
            const handleRhythmDrag = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.drag.active = true;
                const startX = e.clientX || e.touches[0].clientX;
                const startY = e.clientY || e.touches[0].clientY;
                this.drag.offX = startX - rhythmIcon.offsetLeft;
                this.drag.offY = startY - rhythmIcon.offsetTop;

                const move = (ev) => {
                    if (!this.drag.active) return;
                    ev.preventDefault();
                    const cx = ev.clientX || (ev.touches && ev.touches[0].clientX);
                    const cy = ev.clientY || (ev.touches && ev.touches[0].clientY);
                    if (cx === undefined || cy === undefined) return;
                    
                    let x = cx - this.drag.offX;
                    let y = cy - this.drag.offY;
                    
                    x = Math.max(0, Math.min(x, window.innerWidth - 100));
                    y = Math.max(0, Math.min(y, window.innerHeight - 50));
                    
                    rhythmIcon.style.left = x + 'px';
                    rhythmIcon.style.top = y + 'px';
                    this.state.rhythmIconPos = { x, y };
                };

                const up = () => {
                    this.drag.active = false;
                    this.saveData();
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

            if (leftZone) {
                leftZone.addEventListener('mousedown', handleRhythmDrag);
                leftZone.addEventListener('touchstart', handleRhythmDrag, { passive: false });
            }

            // 律动图标右侧双击展开
            if (rightZone) {
                let lastClickTime = 0;
                const handleRightClick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const now = Date.now();
                    if (now - lastClickTime < 300) {
                        this.state.isRhythmMode = false;
                        this.updateView();
                        this.saveData();
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

            // 按钮事件绑定
            const click = (id, fn) => {
                const el = document.getElementById(id);
                if (el) el.onclick = (e) => { e.stopPropagation(); fn(e); };
            };

            click('btn-rhythm', () => { 
                this.state.isRhythmMode = true; 
                this.updateView(); 
                this.saveData(); 
            });
            click('btn-play', () => this.toggle());
            click('btn-next', () => this.next());
            click('btn-prev', () => this.prev());
            click('btn-play-mode', () => { 
                this.state.playMode = (this.state.playMode + 1) % 3; 
                this.updateView(); 
                this.saveData(); 
            });
            click('btn-settings', () => this.togglePanel('settings'));
            click('btn-list', () => this.togglePanel('list'));
            click('btn-history', () => this.togglePanel('history'));
            click('btn-add', () => this.showAddOptions());
            click('btn-pure', () => this.togglePureMode());
            click('player-pure-mode', () => this.togglePureMode());

            // 封面上传
            click('btn-cover-upload', () => {
                this.createFileInput('image/*', (file) => {
                    this.handleFileUpload(file, (dataUrl) => {
                        this.state.cfg.cover = dataUrl;
                        this.updateView();
                        this.saveData();
                    });
                });
            });

            // 背景上传
            click('btn-expanded-upload', () => {
                this.createFileInput('image/*', (file) => {
                    this.handleFileUpload(file, (dataUrl) => {
                        this.state.cfg.expandedBg = `url("${dataUrl}")`;
                        this.updateView();
                        this.saveData();
                    });
                });
            });

            click('btn-collapsed-upload', () => {
                this.createFileInput('image/*', (file) => {
                    this.handleFileUpload(file, (dataUrl) => {
                        this.state.cfg.collapsedBg = `url("${dataUrl}")`;
                        this.updateView();
                        this.saveData();
                    });
                });
            });

            // 颜色选择事件
            const bgColorChange = (id, key) => {
                const el = document.getElementById(id);
                if (el) {
                    el.oninput = (e) => {
                        this.state.cfg[key] = e.target.value;
                        this.updateView();
                    };
                    el.onchange = () => this.saveData();
                }
            };

            bgColorChange('inp-expanded-col', 'expandedBg');
            bgColorChange('inp-collapsed-col', 'collapsedBg');

            const change = (id, fn) => {
                const el = document.getElementById(id);
                if (el) el.onchange = (e) => { fn(e.target.value); this.saveData(); };
            };

            change('inp-theme', v => { this.state.cfg.themeColor = v; this.updateView(); });
            change('inp-border', v => { this.state.cfg.borderColor = v; this.updateView(); });
            change('inp-rgb', v => { this.state.cfg.rgbColor = v; this.updateView(); });
            change('inp-lyrics-start', v => { this.state.cfg.lyricsGradientStart = v; this.updateView(); });
            change('inp-lyrics-end', v => { this.state.cfg.lyricsGradientEnd = v; this.updateView(); });

            // RGB模式选项
            document.querySelectorAll('.rgb-opt').forEach(opt => {
                opt.onclick = () => {
                    this.state.rgbMode = parseInt(opt.dataset.val);
                    this.updateView();
                    this.saveData();
                };
            });

            // 磨砂玻璃开关
            const glassToggle = document.getElementById('sw-glass');
            if (glassToggle) {
                glassToggle.onchange = (e) => { 
                    this.state.glass = e.target.checked;
                    this.updateView();
                    this.saveData(); 
                };
            }

            // 磨砂透明度
            const glassOpacityInput = document.getElementById('inp-glass-opacity');
            if (glassOpacityInput) {
                glassOpacityInput.oninput = (e) => {
                    this.state.glassOpacity = parseInt(e.target.value) / 100;
                    document.getElementById('val-glass-opacity').innerText = e.target.value + '%';
                    this.updateView();
                };
                glassOpacityInput.onchange = () => this.saveData();
            }

            // 播放速度
            const speedInput = document.getElementById('inp-speed');
            if (speedInput) {
                speedInput.oninput = (e) => {
                    this.state.speed = parseFloat(e.target.value); 
                    this.audio.playbackRate = this.state.speed;
                    document.getElementById('val-speed').innerText = this.state.speed + 'x';
                    this.updateView();
                };
                speedInput.onchange = () => this.saveData();
            }

            // 边框宽度
            const borderWidthInput = document.getElementById('inp-width');
            if (borderWidthInput) {
                borderWidthInput.oninput = (e) => {
                    this.state.cfg.borderWidth = e.target.value + 'px';
                    document.getElementById('val-width').innerText = e.target.value + 'px';
                    this.updateView();
                };
                borderWidthInput.onchange = () => this.saveData();
            }

            // 播放器宽度
            const playerWidthInput = document.getElementById('inp-width-player');
            if (playerWidthInput) {
                playerWidthInput.oninput = (e) => {
                    this.state.cfg.playerWidth = e.target.value + 'px';
                    document.getElementById('val-width-player').innerText = e.target.value + 'px';
                    this.updateView();
                };
                playerWidthInput.onchange = () => this.saveData();
            }

            // 播放器高度
            const playerHeightInput = document.getElementById('inp-height-player');
            if (playerHeightInput) {
                playerHeightInput.oninput = (e) => {
                    this.state.cfg.playerHeight = e.target.value + 'px';
                    document.getElementById('val-height-player').innerText = e.target.value + 'px';
                    this.updateView();
                };
                playerHeightInput.onchange = () => this.saveData();
            }

            // 封面宽度
            const coverWInput = document.getElementById('inp-cover-w');
            if (coverWInput) {
                coverWInput.oninput = (e) => {
                    this.state.cfg.coverWidth = parseInt(e.target.value);
                    document.getElementById('val-cover-w').innerText = e.target.value + 'px';
                    this.updateView();
                };
                coverWInput.onchange = () => this.saveData();
            }

            // 封面高度
            const coverHInput = document.getElementById('inp-cover-h');
            if (coverHInput) {
                coverHInput.oninput = (e) => {
                    this.state.cfg.coverHeight = parseInt(e.target.value);
                    document.getElementById('val-cover-h').innerText = e.target.value + 'px';
                    this.updateView();
                };
                coverHInput.onchange = () => this.saveData();
            }

            // 进度条
            const progInput = document.getElementById('inp-prog');
            if (progInput) {
                progInput.oninput = (e) => {
                    if (this.audio.duration) {
                        this.audio.currentTime = (e.target.value / 100) * this.audio.duration;
                    }
                };
            }

            // 音频事件
            this.audio.onplay = () => {
                this.state.isPlaying = true;
                const playBtn = document.getElementById('btn-play');
                if (playBtn) playBtn.innerText = '❚❚';
                this.updateView();
            };
            
            this.audio.onpause = () => {
                this.state.isPlaying = false;
                const playBtn = document.getElementById('btn-play');
                if (playBtn) playBtn.innerText = '▶';
                this.updateView();
            };
            
            this.audio.onended = () => {
                if (this.state.playMode === 1) {
                    // 单曲循环
                    this.audio.currentTime = 0;
                    this.audio.play();
                } else {
                    // 下一首
                    this.next();
                }
            };
            
            this.audio.ontimeupdate = () => {
                const progInput = document.getElementById('inp-prog');
                if (this.audio.duration && progInput) {
                    progInput.value = (this.audio.currentTime / this.audio.duration) * 100;
                }
                this.updateLyrics();
            };

            this.audio.onerror = () => {
                console.error('音频加载失败');
                this.showStatus('音频加载失败，链接可能已过期', 'error');
            };
        },

        // 创建UI
        createUI() {
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
                bars += `<div class="rhythm-bar ${isEdge ? 'edge-bar' : ''}" style="--h:${h}px; --d:${d}s; --s:${s}s; --i:${i}"></div>`;
            }
            
            rhythmIcon.innerHTML = `
                <div class="rhythm-star star-left">✦</div>
                <div class="rhythm-star star-right">✦</div>
                <div class="rhythm-left-zone">
                    <div class="zone-hint">拖动</div>
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
                                <input id="inp-speed" type="range" min="0.5" max="2.0" step="0.1" value="1.0">
                            </div>
                            
                            <div class="panel-section-title">背景设置</div>
                            <div class="panel-row">
                                <span>展开背景</span>
                                <div class="panel-bg-ctrl">
                                    <input id="inp-expanded-col" type="color" value="#1a1a1a">
                                    <button type="button" id="btn-expanded-upload" class="panel-upload-btn">图片</button>
                                </div>
                            </div>
                            <div class="panel-row">
                                <span>收起背景</span>
                                <div class="panel-bg-ctrl">
                                    <input id="inp-collapsed-col" type="color" value="#1a1a1a">
                                    <button type="button" id="btn-collapsed-upload" class="panel-upload-btn">图片</button>
                                </div>
                            </div>
                            
                            <div class="panel-section-title">封面设置</div>
                            <div class="panel-row">
                                <span>自定义封面</span>
                                <button type="button" id="btn-cover-upload" class="panel-upload-btn">上传</button>
                            </div>
                            <div class="panel-row">
                                <span>宽度 <b id="val-cover-w">80px</b></span>
                                <input id="inp-cover-w" type="range" min="50" max="150" step="5" value="80">
                            </div>
                            <div class="panel-row">
                                <span>高度 <b id="val-cover-h">80px</b></span>
                                <input id="inp-cover-h" type="range" min="50" max="150" step="5" value="80">
                            </div>
                            
                            <div class="panel-section-title">RGB 灯效</div>
                            <div class="panel-row">
                                <span>模式</span>
                                <div class="panel-opt-group">
                                    <div class="rgb-opt active" data-val="0">关</div>
                                    <div class="rgb-opt" data-val="1">单色</div>
                                    <div class="rgb-opt" data-val="2">幻彩</div>
                                </div>
                            </div>
                            <div class="panel-row">
                                <span>单色颜色</span>
                                <input id="inp-rgb" type="color" value="#7eb8c9">
                            </div>
                            
                            <div class="panel-section-title">歌词颜色</div>
                            <div class="panel-row panel-col-2">
                                <label>起始 <input id="inp-lyrics-start" type="color" value="#7eb8c9"></label>
                                <label>结束 <input id="inp-lyrics-end" type="color" value="#c9a7eb"></label>
                            </div>
                            
                            <div class="panel-section-title">主题颜色</div>
                            <div class="panel-row panel-col-2">
                                <label>文字 <input id="inp-theme" type="color" value="#ffffff"></label>
                                <label>边框 <input id="inp-border" type="color" value="#333333"></label>
                            </div>
                            
                            <div class="panel-section-title">磨砂玻璃</div>
                            <div class="panel-row">
                                <span>启用</span>
                                <input id="sw-glass" type="checkbox" checked>
                            </div>
                            <div class="panel-row">
                                <span>透明度 <b id="val-glass-opacity">60%</b></span>
                                <input id="inp-glass-opacity" type="range" min="10" max="90" value="60">
                            </div>
                            
                            <div class="panel-section-title">尺寸设置</div>
                            <div class="panel-row">
                                <span>宽度 <b id="val-width-player">400px</b></span>
                                <input id="inp-width-player" type="range" min="300" max="600" step="10" value="400">
                            </div>
                            <div class="panel-row">
                                <span>高度 <b id="val-height-player">180px</b></span>
                                <input id="inp-height-player" type="range" min="140" max="300" step="5" value="180">
                            </div>
                            <div class="panel-row">
                                <span>边框 <b id="val-width">6px</b></span>
                                <input id="inp-width" type="range" min="0" max="20" step="1" value="6">
                            </div>
                        </div>

                        <div id="panel-list" class="player-panel">
                            <div id="list-box" class="list-box"></div>
                            <button type="button" id="btn-add" class="panel-add-btn">+ 添加歌曲</button>
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
        },

        // 显示/隐藏UI
        show(mode) {
            this.state.isRhythmMode = false;
            if (mode === 'rhythm') {
                this.state.isRhythmMode = true;
            } else if (mode === 'pure') {
                this.state.isPureMode = true;
            }
            this.updateView();
        },

        hide() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (root) root.style.display = 'none';
            if (rhythmIcon) rhythmIcon.style.display = 'none';
        },

        getCurrentMode() {
            if (this.state.isRhythmMode) return 'rhythm';
            if (this.state.isPureMode) return 'pure';
            return 'normal';
        },

        hideUI() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (root) root.style.display = 'none';
            if (rhythmIcon) rhythmIcon.style.display = 'none';
        },

        showUI() {
            if (this.isHiddenByExtension()) return;
            
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            
            if (this.state.isRhythmMode) {
                if (root) root.style.display = 'none';
                if (rhythmIcon) rhythmIcon.style.display = 'flex';
            } else {
                if (root) root.style.display = 'flex';
                if (rhythmIcon) rhythmIcon.style.display = 'none';
            }
        },

        // 注入CSS样式
        injectCSS() {
            const css = `
                /* ========== 动画定义 ========== */
                
                /* 单色旋转流动 - 围绕边框转圈 */
                @keyframes rgb-rotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* 幻彩色相旋转 */
                @keyframes hue-rotate {
                    0% { filter: hue-rotate(0deg); }
                    100% { filter: hue-rotate(360deg); }
                }
                
                /* 强烈呼吸感 - 明暗交替 */
                @keyframes breathe-strong {
                    0%, 100% { 
                        opacity: 0.4; 
                        filter: brightness(0.6);
                    }
                    50% { 
                        opacity: 1; 
                        filter: brightness(1.3);
                    }
                }
                
                /* 律动条波浪 */
                @keyframes wave {
                    0%, 100% { height: 3px; }
                    50% { height: var(--h); }
                }
                
                /* 星星闪烁 - 左 */
                @keyframes star-twinkle-left {
                    0%, 100% { opacity: 0.2; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                /* 星星闪烁 - 右（不同频率） */
                @keyframes star-twinkle-right {
                    0%, 100% { opacity: 0.3; transform: scale(0.6); }
                    30% { opacity: 1; transform: scale(1.3); }
                    60% { opacity: 0.5; transform: scale(0.8); }
                }
                
                /* 幻彩随机颜色变化 */
                @keyframes rainbow-shift {
                    0% { filter: hue-rotate(0deg) brightness(1); }
                    25% { filter: hue-rotate(90deg) brightness(1.2); }
                    50% { filter: hue-rotate(180deg) brightness(0.8); }
                    75% { filter: hue-rotate(270deg) brightness(1.1); }
                    100% { filter: hue-rotate(360deg) brightness(1); }
                }

                /* ========== 弹窗样式 ========== */
                .player-dialog-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.85) !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 2147483647 !important;
                    padding: 20px !important;
                    box-sizing: border-box !important;
                }
                
                .player-dialog {
                    background: #1e1e1e !important;
                    border-radius: 20px !important;
                    padding: 25px !important;
                    max-width: 95% !important;
                    width: 380px !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                    text-align: center !important;
                    color: #fff !important;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                
                .player-dialog .dialog-title {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #fff;
                }
                
                .player-dialog .add-options,
                .player-dialog .lyrics-btns {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .player-dialog .add-option-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    color: #fff;
                    text-align: left;
                }
                
                .player-dialog .add-option-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.3);
                    transform: translateX(5px);
                }
                
                .player-dialog .option-icon {
                    font-size: 28px;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                }
                
                .player-dialog .option-text {
                    font-size: 15px;
                    font-weight: 500;
                }
                
                .player-dialog .dialog-cancel {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.7);
                    padding: 10px 30px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .player-dialog .dialog-cancel:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                }

                /* ========== 状态提示 ========== */
                .player-status {
                    position: fixed !important;
                    top: 20px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    padding: 12px 25px !important;
                    border-radius: 25px !important;
                    z-index: 2147483647 !important;
                    font-size: 14px !important;
                    opacity: 0 !important;
                    transition: opacity 0.3s !important;
                    pointer-events: none !important;
                    font-weight: 500 !important;
                }
                .player-status.status-info { background: #3498db !important; color: #fff !important; }
                .player-status.status-success { background: #27ae60 !important; color: #fff !important; }
                .player-status.status-error { background: #e74c3c !important; color: #fff !important; }

                /* ========== 律动图标 ========== */
                .player-rhythm-icon {
                    position: fixed;
                    z-index: 10000;
                    width: 280px;
                    height: 55px;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    pointer-events: auto;
                    --rgb-single: #7eb8c9;
                }

                /* 星星 */
                .rhythm-star {
                    position: absolute;
                    top: 0;
                    font-size: 18px;
                    color: #666;
                    z-index: 15;
                    pointer-events: none;
                }
                
                .rhythm-star.star-left {
                    left: 30px;
                    animation: star-twinkle-left 1.2s ease-in-out infinite;
                }
                
                .rhythm-star.star-right {
                    right: 30px;
                    animation: star-twinkle-right 1.8s ease-in-out infinite;
                }
                
                /* 星星RGB单色 */
                .player-rhythm-icon.rgb-single .rhythm-star {
                    color: var(--rgb-single);
                    text-shadow: 0 0 15px var(--rgb-single), 0 0 30px var(--rgb-single);
                    animation: star-twinkle-left 1.2s ease-in-out infinite, breathe-strong 1.5s ease-in-out infinite;
                }
                
                .player-rhythm-icon.rgb-single .rhythm-star.star-right {
                    animation: star-twinkle-right 1.8s ease-in-out infinite, breathe-strong 2s ease-in-out infinite;
                }
                
                /* 星星RGB幻彩 */
                .player-rhythm-icon.rgb-rainbow .rhythm-star {
                    color: #ff6b6b;
                    text-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
                    animation: star-twinkle-left 1.2s ease-in-out infinite, rainbow-shift 3s linear infinite;
                }
                
                .player-rhythm-icon.rgb-rainbow .rhythm-star.star-right {
                    animation: star-twinkle-right 1.8s ease-in-out infinite, rainbow-shift 3s linear infinite 0.5s;
                }

                .rhythm-left-zone,
                .rhythm-right-zone {
                    position: absolute;
                    top: 0;
                    width: 50%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                
                .rhythm-left-zone { left: 0; cursor: grab; }
                .rhythm-left-zone:active { cursor: grabbing; }
                .rhythm-right-zone { right: 0; cursor: pointer; }

                .zone-hint {
                    font-size: 10px;
                    color: rgba(255,255,255,0.3);
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                
                .rhythm-left-zone:hover .zone-hint,
                .rhythm-right-zone:hover .zone-hint { opacity: 1; }
                
                .rhythm-wave-box {
                    display: flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 35px;
                    width: 100%;
                    justify-content: center;
                    padding: 0 40px;
                    box-sizing: border-box;
                }
                
                /* 律动条 */
                .rhythm-bar {
                    width: 3px;
                    height: 3px;
                    background: #555;
                    border-radius: 2px;
                    transition: background 0.3s;
                }
                
                .rhythm-bar.edge-bar {
                    width: 2px;
                    opacity: 0.7;
                }
                
                .rhythm-base-line {
                    width: calc(100% - 80px);
                    height: 2px;
                    background: #555;
                    margin-top: 2px;
                    border-radius: 1px;
                }

                /* 播放时律动 */
                .player-rhythm-icon.playing .rhythm-bar {
                    animation: wave var(--s) infinite ease-in-out;
                    animation-delay: var(--d);
                }
                
                /* 律动条单色RGB */
                .player-rhythm-icon.rgb-single .rhythm-bar {
                    background: linear-gradient(to top, 
                        var(--rgb-single),
                        color-mix(in srgb, var(--rgb-single) 60%, white)
                    );
                    box-shadow: 0 0 8px var(--rgb-single);
                    animation: wave var(--s) infinite ease-in-out, breathe-strong 2s ease-in-out infinite;
                    animation-delay: var(--d), calc(var(--i) * 0.05s);
                }
                
                .player-rhythm-icon.rgb-single .rhythm-base-line {
                    background: var(--rgb-single);
                    box-shadow: 0 0 10px var(--rgb-single);
                    animation: breathe-strong 2s ease-in-out infinite;
                }
                
                /* 律动条幻彩RGB */
                .player-rhythm-icon.rgb-rainbow .rhythm-bar {
                    background: linear-gradient(to top, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
                    box-shadow: 0 0 8px currentColor;
                    animation: wave var(--s) infinite ease-in-out, rainbow-shift 2s linear infinite;
                    animation-delay: var(--d), calc(var(--i) * 0.08s);
                }
                
                .player-rhythm-icon.rgb-rainbow .rhythm-base-line {
                    background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b);
                    background-size: 200% 100%;
                    animation: rainbow-shift 3s linear infinite;
                }

                /* ========== 播放器主体 ========== */
                #player-root {
                    position: fixed;
                    z-index: 10000;
                    width: 400px;
                    height: var(--player-h, 180px);
                    border-radius: 28px;
                    display: none;
                    flex-direction: column;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    box-shadow: 0 15px 50px rgba(0,0,0,0.5);
                    transition: height 0.3s, width 0.3s;
                    pointer-events: auto;
                    --rgb-single: #7eb8c9;
                    --border-w: 6px;
                    --lyrics-start: #7eb8c9;
                    --lyrics-end: #c9a7eb;
                    overflow: visible;
                }
                
                #player-root.expanded { height: 520px !important; }

                /* ========== RGB边框 - 真正旋转流动 ========== */
                .player-rgb-border {
                    position: absolute;
                    inset: 0;
                    border-radius: 28px;
                    z-index: 0;
                    overflow: hidden;
                }
                
                /* 单色模式 - 旋转流动 */
                .player-rgb-border.mode-single::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(
                        from 0deg,
                        transparent 0deg,
                        color-mix(in srgb, var(--rgb-single) 20%, transparent) 30deg,
                        color-mix(in srgb, var(--rgb-single) 50%, white) 90deg,
                        var(--rgb-single) 180deg,
                        color-mix(in srgb, var(--rgb-single) 70%, black) 270deg,
                        color-mix(in srgb, var(--rgb-single) 30%, transparent) 330deg,
                        transparent 360deg
                    );
                    animation: rgb-rotate 3s linear infinite, breathe-strong 2s ease-in-out infinite;
                }
                
                .player-rgb-border.mode-single::after {
                    content: '';
                    position: absolute;
                    inset: var(--border-w);
                    background: inherit;
                    border-radius: 22px;
                    z-index: 1;
                }
                
                /* 幻彩模式 - 旋转流动+随机变色 */
                .player-rgb-border.mode-rainbow::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: conic-gradient(
                        from 0deg,
                        #ff6b6b,
                        #feca57,
                        #48dbfb,
                        #1dd1a1,
                        #ff9ff3,
                        #54a0ff,
                        #ff6b6b
                    );
                    animation: rgb-rotate 4s linear infinite, breathe-strong 2.5s ease-in-out infinite;
                    filter: hue-rotate(var(--rainbow-offset, 0deg));
                }
                
                .player-rgb-border.mode-rainbow::after {
                    content: '';
                    position: absolute;
                    inset: var(--border-w);
                    background: inherit;
                    border-radius: 22px;
                    z-index: 1;
                }

                /* 播放器内部 - 无缝贴合 */
                .player-inner {
                    position: absolute;
                    top: var(--border-w);
                    left: var(--border-w);
                    right: var(--border-w);
                    bottom: var(--border-w);
                    border-radius: 22px;
                    z-index: 2;
                    overflow: hidden;
                    background: #1a1a1a;
                    transition: background 0.3s;
                }

                .player-inner.glass-mode {
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                }

                /* 灵动岛 */
                .player-island {
                    width: 70px;
                    height: 20px;
                    background: #000;
                    margin: 0 auto;
                    border-radius: 0 0 12px 12px;
                    cursor: move;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 25;
                    top: 0;
                    transition: all 0.3s;
                    overflow: hidden;
                }

                /* 灵动岛单色流动 */
                .player-island.rgb-single-flow {
                    background: linear-gradient(90deg,
                        color-mix(in srgb, var(--rgb-single) 30%, black),
                        var(--rgb-single),
                        color-mix(in srgb, var(--rgb-single) 50%, white),
                        var(--rgb-single),
                        color-mix(in srgb, var(--rgb-single) 30%, black)
                    );
                    background-size: 300% 100%;
                    animation: island-flow 2s linear infinite, breathe-strong 1.5s ease-in-out infinite;
                    box-shadow: 0 0 20px var(--rgb-single);
                }
                
                @keyframes island-flow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 300% 50%; }
                }

                /* 灵动岛幻彩流动 */
                .player-island.rgb-rainbow-flow {
                    background: linear-gradient(90deg, 
                        #ff6b6b, #feca57, #48dbfb, #1dd1a1, #ff9ff3, #54a0ff, #ff6b6b
                    );
                    background-size: 300% 100%;
                    animation: island-flow 3s linear infinite, breathe-strong 2s ease-in-out infinite;
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
                    filter: hue-rotate(var(--rainbow-offset, 0deg));
                }

                /* ========== 播放器布局 ========== */
                .player-main {
                    display: flex;
                    height: 100%;
                    padding: 30px 15px 15px;
                    box-sizing: border-box;
                    align-items: center;
                    position: relative;
                    z-index: 3;
                }
                
                .player-cover {
                    width: 80px;
                    height: 80px;
                    border-radius: 12px;
                    margin-right: 15px;
                    background-size: cover;
                    background-position: center;
                    background-color: rgba(255,255,255,0.1);
                    flex-shrink: 0;
                }
                
                .player-center {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    overflow: hidden;
                    min-width: 0;
                }
                
                .player-meta {
                    white-space: nowrap;
                    overflow: hidden;
                    margin-bottom: 5px;
                }
                
                .player-title {
                    font-weight: 600;
                    font-size: 15px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .player-artist {
                    font-size: 12px;
                    opacity: 0.6;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .player-lyrics {
                    font-size: 12px;
                    opacity: 0.8;
                    height: 18px;
                    overflow: hidden;
                    text-align: center;
                    margin: 5px 0;
                }
                
                .player-prog-wrap {
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                    margin: 8px 0;
                }
                
                #inp-prog {
                    width: 100%;
                    height: 100%;
                    -webkit-appearance: none;
                    background: transparent;
                    margin: 0;
                    cursor: pointer;
                }
                
                #inp-prog::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--rgb-single);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--rgb-single);
                    margin-top: -4px;
                }
                
                .player-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 8px;
                }
                
                .player-controls button {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 5px;
                    opacity: 0.8;
                    transition: opacity 0.2s, transform 0.2s;
                }
                
                .player-controls button:hover {
                    opacity: 1;
                    transform: scale(1.1);
                }
                
                #btn-play {
                    font-size: 24px;
                    opacity: 1;
                }
                
                #btn-prev, #btn-next { font-size: 18px; }
                #btn-play-mode, #btn-list { font-size: 16px; }

                .player-right {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 90px;
                    margin-left: 10px;
                }
                
                .player-right button {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.6;
                    color: inherit;
                    padding: 5px;
                    transition: opacity 0.2s;
                }
                
                .player-right button:hover { opacity: 1; }

                /* ========== 纯享模式 ========== */
                .player-pure-mode {
                    display: none;
                    width: 100%;
                    height: 100%;
                    justify-content: center;
                    align-items: center;
                    padding: 40px 25px;
                    box-sizing: border-box;
                    cursor: pointer;
                }
                
                #player-root.pure-mode #player-main-content { display: none; }
                #player-root.pure-mode .player-pure-mode { display: flex; }

                #pure-lyrics-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }

                .pure-lyric-line {
                    font-size: 14px;
                    opacity: 0.35;
                    transition: all 0.4s;
                    text-align: center;
                    line-height: 1.6;
                }

                .pure-lyric-line.active {
                    font-size: 20px;
                    font-weight: 600;
                    opacity: 1;
                    background: linear-gradient(90deg, 
                        var(--lyrics-start) var(--progress, 0%), 
                        var(--lyrics-end) var(--progress, 0%), 
                        rgba(255,255,255,0.5) var(--progress, 0%));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .pure-lyric-line.no-lyrics {
                    font-size: 16px;
                    opacity: 0.5;
                    background: none;
                    -webkit-text-fill-color: inherit;
                }

                .pure-lyric-line.passed { opacity: 0.2; }

                /* ========== 面板样式 ========== */
                .player-panel {
                    flex: 1;
                    display: none;
                    flex-direction: column;
                    padding: 15px;
                    overflow-y: auto;
                    position: relative;
                    z-index: 3;
                    max-height: 340px;
                }
                
                .player-panel::-webkit-scrollbar { width: 4px; }
                .player-panel::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                }
                
                .panel-section-title {
                    font-weight: 600;
                    font-size: 12px;
                    margin: 15px 0 8px 0;
                    padding-bottom: 5px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    color: var(--rgb-single);
                }
                
                .panel-section-title:first-child { margin-top: 0; }
                
                .panel-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 12px;
                    padding: 5px 0;
                }
                
                .panel-row.panel-col-2 { gap: 10px; }
                .panel-row.panel-col-2 label {
                    flex: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .panel-bg-ctrl { display: flex; gap: 8px; align-items: center; }
                
                .panel-upload-btn {
                    padding: 5px 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: inherit;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s;
                }
                
                .panel-upload-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .panel-opt-group {
                    display: flex;
                    gap: 5px;
                    background: rgba(0,0,0,0.3);
                    padding: 3px;
                    border-radius: 8px;
                }
                
                .rgb-opt {
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 6px;
                    font-size: 11px;
                    transition: all 0.2s;
                    color: rgba(255,255,255,0.7);
                }
                
                .rgb-opt:hover {
                    background: rgba(255,255,255,0.1);
                }
                
                .rgb-opt.active {
                    background: var(--rgb-single);
                    color: #000;
                    font-weight: 600;
                }

                input[type=color] {
                    width: 30px;
                    height: 30px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-radius: 6px;
                    padding: 0;
                }
                
                input[type=range] {
                    width: 100px;
                    height: 4px;
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    cursor: pointer;
                }
                
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    background: var(--rgb-single);
                    border-radius: 50%;
                    cursor: pointer;
                }
                
                input[type=checkbox] {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    accent-color: var(--rgb-single);
                }

                /* ========== 播放列表 ========== */
                .list-box {
                    max-height: 260px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                }
                
                .list-box::-webkit-scrollbar { width: 4px; }
                .list-box::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                }

                .list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 5px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    transition: background 0.2s;
                }
                
                .list-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                
                .list-item.active {
                    color: var(--rgb-single);
                }
                
                .list-item.active .item-info b {
                    text-shadow: 0 0 10px var(--rgb-single);
                }
                
                .list-item .item-info {
                    flex: 1;
                    cursor: pointer;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding-right: 10px;
                }
                
                .item-btns {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .item-btns button {
                    padding: 4px 8px;
                    font-size: 11px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-lyrics {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: inherit;
                }
                
                .btn-lyrics:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .btn-del {
                    background: none;
                    border: none;
                    color: #e74c3c;
                    font-size: 18px;
                    padding: 0 5px;
                }
                
                .btn-del:hover {
                    color: #ff6b6b;
                }
                
                .panel-add-btn {
                    width: 100%;
                    padding: 12px;
                    background: var(--rgb-single);
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    border-radius: 10px;
                    color: #000;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .panel-add-btn:hover {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                }

                /* ========== 导入历史 ========== */
                .history-list {
                    max-height: 280px;
                    overflow-y: auto;
                }
                
                .history-list::-webkit-scrollbar { width: 4px; }
                .history-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                }

                .history-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    gap: 12px;
                }

                .history-icon {
                    font-size: 18px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    flex-shrink: 0;
                }

                .history-content {
                    flex: 1;
                    overflow: hidden;
                    min-width: 0;
                }

                .history-title {
                    font-weight: 600;
                    font-size: 13px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .history-sub {
                    font-size: 11px;
                    opacity: 0.6;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .history-time {
                    font-size: 10px;
                    opacity: 0.4;
                    white-space: nowrap;
                    flex-shrink: 0;
                }

                .no-history {
                    text-align: center;
                    padding: 40px 0;
                    opacity: 0.4;
                    font-size: 13px;
                }
            `;
            
            const style = document.createElement('style');
            style.id = 'music-player-styles';
            style.textContent = css;
            document.head.appendChild(style);
        }
    };

    // 导出到全局
    window.MusicPlayerApp = MusicPlayerApp;

    // 初始化
    MusicPlayerApp.init();

})();
