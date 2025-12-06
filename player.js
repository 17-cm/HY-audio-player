/*
 * 音乐播放器核心逻辑
 * 版本: 1.0.5
 * 作者: hy.禾一
 */

// 声明全局变量（从酒馆获取）
/* global extension_settings, saveSettingsDebounced */

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
            importHistory: [],
            isCaching: false
        },
        drag: { active: false, offX: 0, offY: 0 },

        init() {
            this.loadCSS();
            this.createUI();
            this.loadData();
            this.bindEvents();
            console.log('🎵 播放器核心初始化完成');
        },

        loadCSS() {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/scripts/extensions/third-party/HY-audio-player/style.css';
            link.onload = () => console.log('✅ 播放器样式加载完成');
            link.onerror = () => console.error('❌ 播放器样式加载失败');
            document.head.appendChild(link);
        },

        loadData() {
            const EXTENSION_NAME = 'music_player_data';
            
            // 优先从酒馆扩展设置读取
            if (typeof extension_settings !== 'undefined' && extension_settings[EXTENSION_NAME]) {
                const data = extension_settings[EXTENSION_NAME];
                this.playlist = data.playlist || [];
                if (data.state) {
                    this.state = { ...this.state, ...data.state };
                    this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                    
                    const checkPos = (pos, def) => {
                        if (pos.x > window.innerWidth - 50) pos.x = def.x;
                        if (pos.y > window.innerHeight - 50) pos.y = def.y;
                    };
                    checkPos(this.state.playerPos, defaultConfig.pos);
                    checkPos(this.state.rhythmIconPos, { x: 20, y: 300 });
                }
            } 
            // 降级到 localStorage（兼容旧数据或独立使用）
            else {
                const raw = localStorage.getItem('music_player_data');
                if (raw) {
                    const data = JSON.parse(raw);
                    this.playlist = data.playlist || [];
                    if (data.state) {
                        this.state = { ...this.state, ...data.state };
                        this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                        
                        const checkPos = (pos, def) => {
                            if (pos.x > window.innerWidth - 50) pos.x = def.x;
                            if (pos.y > window.innerHeight - 50) pos.y = def.y;
                        };
                        checkPos(this.state.playerPos, defaultConfig.pos);
                        checkPos(this.state.rhythmIconPos, { x: 20, y: 300 });
                    }
                }
            }
            
            this.state.panel = false;
            this.state.isCaching = false;
            this.updateView();
            this.renderList();
        },

        saveData() {
            const EXTENSION_NAME = 'music_player_data';
            const data = {
                playlist: this.playlist,
                state: this.state
            };
            
            // 优先保存到酒馆扩展设置
            if (typeof extension_settings !== 'undefined' && typeof saveSettingsDebounced !== 'undefined') {
                extension_settings[EXTENSION_NAME] = data;
                saveSettingsDebounced();
            } 
            // 降级到 localStorage
            else {
                localStorage.setItem('music_player_data', JSON.stringify(data));
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

        updateView() {
            const root = document.getElementById('player-root');
            const rootRgb = document.getElementById('player-rgb-border');
            const inner = document.getElementById('player-inner');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            const cfg = this.state.cfg;

            if (!root || !inner || !rhythmIcon) return;

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

            const island = document.getElementById('player-island');
            if (island) {
                island.className = 'player-island';
                const mode = this.state.rgbMode;
                if (mode === 0) {
                    island.style.background = cfg.borderColor;
                } else if (mode === 1) {
                    island.classList.add('rgb-single-breathe');
                    island.style.setProperty('--rgb-single', cfg.rgbColor);
                } else if (mode === 2) {
                    island.classList.add('rgb-rainbow-breathe');
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
                inner.style.setProperty('--glass-opacity', this.state.glassOpacity);
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
                const mode = this.state.rgbMode;
                if (mode === 0) {
                    rootRgb.style.background = cfg.borderColor;
                } else if (mode === 1) {
                    rootRgb.classList.add('mode-single');
                } else if (mode === 2) {
                    rootRgb.classList.add('mode-rainbow');
                }
            }

            rhythmIcon.className = 'player-rhythm-icon';
            if (this.state.isPlaying) rhythmIcon.classList.add('playing');
            if (this.state.rgbMode === 1) rhythmIcon.classList.add('rgb-single');
            if (this.state.rgbMode === 2) rhythmIcon.classList.add('rgb-rainbow');

            if (this.state.isRhythmMode) {
                root.style.display = 'none';
                rhythmIcon.style.display = 'flex';
            } else {
                root.style.display = 'flex';
                rhythmIcon.style.display = 'none';
            }

            root.classList.toggle('pure-mode', this.state.isPureMode);
            this.updatePureLyrics();

            const modeBtn = document.getElementById('btn-play-mode');
            if (modeBtn) {
                const svgs = [
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="17" font-size="8" stroke="none" fill="currentColor">1</text></svg>',
                    '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>'
                ];
                modeBtn.innerHTML = svgs[this.state.playMode];
            }

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
            
            if (!this.state.lyrics.length) {
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
                    activeLine.style.setProperty('--lyric-progress', progress + '%');
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

        async play(i) {
            if (!this.playlist[i]) return;
            this.index = i;
            
            const track = this.playlist[i];
            
            // 检测链接是否有效，如果是网易云歌曲则重新获取链接
            if (track.neteaseId) {
                try {
                    const testAudio = new Audio();
                    testAudio.src = track.url;
                    
                    const canPlay = await new Promise((resolve) => {
                        testAudio.oncanplay = () => resolve(true);
                        testAudio.onerror = () => resolve(false);
                        setTimeout(() => resolve(false), 5000);
                    });
                    
                    if (!canPlay) {
                        this.showStatus('链接已失效，正在重新获取...', 'info');
                        const newUrl = await this.refreshSongUrl(track.neteaseId);
                        if (newUrl) {
                            track.url = newUrl;
                            this.saveData();
                            this.showStatus('链接已更新', 'success');
                        } else {
                            this.showStatus('获取播放链接失败', 'error');
                            return;
                        }
                    }
                } catch (error) {
                    console.error('链接检测失败:', error);
                }
            }
            
            this.audio.src = track.url;
            this.audio.playbackRate = this.state.speed;
            this.audio.play().catch(e => console.log(e));
            this.state.lyrics = track.lyrics ? this.parseLyrics(track.lyrics) : [];
            this.state.currentLyricIndex = -1;
            this.updateView();
            this.renderList();
        },

        async refreshSongUrl(neteaseId) {
            try {
                const urlResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        id: `music.163.com/song?id=${neteaseId}`, 
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
                
                let playUrl = '';
                if (urlData.data && Array.isArray(urlData.data) && urlData.data[0]) {
                    playUrl = urlData.data[0].url || '';
                }
                
                return playUrl;
            } catch (error) {
                console.error('刷新链接失败:', error);
                return null;
            }
        },

        async cacheAllSongs() {
            if (this.state.isCaching) {
                this.showStatus('正在缓存中，请稍候...', 'info');
                return;
            }
            
            const neteaseSongs = this.playlist.filter(t => t.neteaseId);
            if (neteaseSongs.length === 0) {
                this.showStatus('没有需要缓存的网易云歌曲', 'info');
                return;
            }
            
            this.state.isCaching = true;
            this.showCacheProgress(0, neteaseSongs.length);
            
            let successCount = 0;
            let failCount = 0;
            let processedCount = 0;
            
            for (let i = 0; i < this.playlist.length; i++) {
                const track = this.playlist[i];
                if (!track.neteaseId) continue;
                
                try {
                    const newUrl = await this.refreshSongUrl(track.neteaseId);
                    if (newUrl) {
                        track.url = newUrl;
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                    console.error(`缓存歌曲失败: ${track.title}`, error);
                }
                
                processedCount++;
                this.updateCacheProgress(processedCount, neteaseSongs.length, track.title);
                
                // 延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            this.state.isCaching = false;
            this.saveData();
            this.hideCacheProgress();
            
            if (failCount === 0) {
                this.showStatus(`缓存完成！共 ${successCount} 首歌曲`, 'success');
            } else {
                this.showStatus(`缓存完成！成功 ${successCount} 首，失败 ${failCount} 首`, 'info');
            }
        },

        showCacheProgress(current, total) {
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
        },

        updateCacheProgress(current, total, songName) {
            const progressEl = document.getElementById('cache-progress-overlay');
            if (!progressEl) return;
            
            const percent = total > 0 ? (current / total * 100) : 0;
            const bar = progressEl.querySelector('.cache-progress-bar');
            const text = progressEl.querySelector('.cache-progress-text');
            const song = progressEl.querySelector('.cache-progress-song');
            
            if (bar) bar.style.width = percent + '%';
            if (text) text.textContent = `${current} / ${total}`;
            if (song) song.textContent = songName || '';
        },

        hideCacheProgress() {
            const progressEl = document.getElementById('cache-progress-overlay');
            if (progressEl) {
                progressEl.remove();
            }
        },

        toggle() {
            if (!this.playlist.length) return this.showAddOptions();
            this.audio.paused ? (this.index === -1 ? this.play(0) : this.audio.play()) : this.audio.pause();
        },

        next() {
            if (!this.playlist.length) return;
            let n;
            if (this.state.playMode === 2) {
                do { n = Math.floor(Math.random() * this.playlist.length); } while (n === this.index && this.playlist.length > 1);
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

        parseLyrics(lrc) {
            const lines = lrc.split('\n');
            const result = [];
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
            for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                    const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / (match[3].length === 2 ? 100 : 1000);
                    const text = match[4].trim();
                    if (text) result.push({ time, text });
                }
            }
            return result.sort((a, b) => a.time - b.time);
        },

        isNeteaseLink(url) {
            return url.includes('music.163.com') || 
                   url.includes('163cn.tv') || 
                   url.includes('y.music.163.com');
        },

        isPlaylistLink(url) {
            return url.includes('playlist') || url.includes('playlist?id=');
        },

        extractNeteaseId(link) {
            const idMatch = link.match(/id=(\d+)/);
            if (idMatch) return idMatch[1];
            
            const pathMatch = link.match(/song\/(\d+)/);
            if (pathMatch) return pathMatch[1];
            
            return null;
        },

        showConfirmDialog(title, message, onConfirm, onCancel) {
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
        },

        showAddOptions() {
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
                this.addUrlSong();
            };

            overlay.querySelector('#add-playlist-btn').onclick = () => {
                overlay.remove();
                this.addPlaylist();
            };

            overlay.querySelector('#add-cancel-btn').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        },

        showInputDialog(title, placeholder, onConfirm) {
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
        },

        async fetchNeteaseSongInfo(link) {
            try {
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
                        if (lyricData.code === 200) {
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
                    throw new Error('无法获取播放链接');
                }
                
                const neteaseId = this.extractNeteaseId(link);
                
                return {
                    title: songInfo.name || '未知歌曲',
                    artist: songInfo.singer || '未知艺术家',
                    url: playUrl,
                    lyrics: lyrics,
                    cover: songInfo.picimg || defaultConfig.cover,
                    duration: songInfo.duration || '0:00',
                    neteaseId: neteaseId
                };
                
            } catch (error) {
                console.error('网易云解析失败:', error);
                throw error;
            }
        },

        addUrlSong() {
            this.showInputDialog(
                '添加单曲',
                '请输入网易云歌曲链接\n支持格式：\n• music.163.com/song?id=xxx\n• 163cn.tv/xxx（短链接）',
                async (input) => {
                    if (!this.isNeteaseLink(input)) {
                        this.showStatus('请输入有效的网易云链接', 'error');
                        return;
                    }
                    
                    this.showStatus('正在解析链接...', 'info');
                    
                    try {
                        const songInfo = await this.fetchNeteaseSongInfo(input);
                        
                        this.playlist.push({
                            title: songInfo.title,
                            artist: songInfo.artist,
                            url: songInfo.url,
                            lyrics: songInfo.lyrics || '',
                            cover: songInfo.cover,
                            neteaseId: songInfo.neteaseId
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
                    } catch (error) {
                        this.showStatus(`添加失败: ${error.message}`, 'error');
                    }
                }
            );
        },

        async fetchNeteasePlaylist(link) {
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
        },

        addPlaylist() {
            this.showInputDialog(
                '添加歌单',
                '请输入网易云歌单链接\n支持格式：\n• music.163.com/playlist?id=xxx\n• 163cn.tv/xxx（短链接）',
                async (input) => {
                    if (!this.isPlaylistLink(input) && !this.isNeteaseLink(input)) {
                        this.showStatus('请输入有效的歌单链接', 'error');
                        return;
                    }
                    
                    this.showStatus('正在解析歌单...', 'info');
                    
                    try {
                        const playlist = await this.fetchNeteasePlaylist(input);
                        
                        if (!playlist.tracks || playlist.tracks.length === 0) {
                            this.showStatus('歌单为空或无法获取歌曲列表', 'error');
                            return;
                        }
                        
                        this.showConfirmDialog(
                            '确认导入',
                            `<div style="text-align:left;line-height:1.8;">
                                <p><strong>歌单：</strong>${playlist.name}</p>
                                <p><strong>创建者：</strong>${playlist.creator}</p>
                                <p><strong>歌曲数：</strong>${playlist.tracks.length} 首</p>
                                <p style="margin-top:10px;opacity:0.8;">是否全部添加到播放列表？</p>
                            </div>`,
                            () => this.importPlaylistTracks(playlist, input)
                        );
                        
                    } catch (error) {
                        this.showStatus(`歌单解析失败: ${error.message}`, 'error');
                    }
                }
            );
        },

        async importPlaylistTracks(playlist, link) {
            this.showStatus(`正在导入 ${playlist.tracks.length} 首歌曲...`, 'info');
            this.showCacheProgress(0, playlist.tracks.length);
            
            let addedCount = 0;
            let failedCount = 0;
            
            for (let i = 0; i < playlist.tracks.length; i++) {
                const track = playlist.tracks[i];
                const songLink = `music.163.com/song?id=${track.id}`;
                
                this.updateCacheProgress(i + 1, playlist.tracks.length, track.name);
                
                try {
                    const songInfo = await this.fetchNeteaseSongInfo(songLink);
                    
                    this.playlist.push({
                        title: track.name,
                        artist: track.artists,
                        url: songInfo.url,
                        lyrics: songInfo.lyrics || '',
                        cover: track.picUrl || songInfo.cover,
                        neteaseId: track.id.toString()
                    });
                    
                    addedCount++;
                    
                } catch (error) {
                    console.error(`歌曲 ${track.name} 导入失败:`, error);
                    failedCount++;
                }
                
                // 延迟避免请求过快
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            this.hideCacheProgress();
            
            this.addImportHistory('playlist', {
                name: playlist.name,
                creator: playlist.creator,
                count: playlist.tracks.length,
                link: link
            });
            
            this.saveData();
            this.renderList();
            
            if (addedCount > 0) {
                this.showStatus(`歌单导入完成！成功 ${addedCount} 首，失败 ${failedCount} 首`, 'success');
            } else {
                this.showStatus('没有歌曲成功导入', 'error');
            }
            
            if (this.index === -1 && this.playlist.length > 0) {
                this.play(0);
            }
        },

        renderImportHistory() {
            const container = document.getElementById('history-list');
            if (!container) return;
            
            if (this.state.importHistory.length === 0) {
                container.innerHTML = '<div class="no-history">暂无导入历史</div>';
                return;
            }
            
            let html = '';
            this.state.importHistory.forEach((history, index) => {
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

        updateLyrics() {
            if (!this.state.lyrics.length) {
                const lyricsEl = document.getElementById('player-lyrics');
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
            const lyricsEl = document.getElementById('player-lyrics');
            if (lyricsEl) lyricsEl.innerText = currentLine || '⋆……𖦤……⋆';
            
            if (this.state.isPureMode) {
                this.updatePureLyrics();
            }
        },

        delSong(i) {
            this.showConfirmDialog('删除歌曲', '确定要删除这首歌曲吗？', () => {
                this.playlist.splice(i, 1);
                this.saveData();
                this.renderList();
                if (i === this.index) {
                    this.audio.pause();
                    this.index = -1;
                    this.updateView();
                } else if (i < this.index) {
                    this.index--;
                }
            });
        },

        showLyricsDialog(i) {
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
                this.showInputDialog('粘贴歌词', '请粘贴LRC格式歌词', (newLyrics) => {
                    this.playlist[i].lyrics = newLyrics;
                    if (i === this.index) {
                        this.state.lyrics = this.parseLyrics(newLyrics);
                        this.state.currentLyricIndex = -1;
                    }
                    this.saveData();
                    this.showStatus('歌词已更新', 'success');
                });
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

            overlay.querySelector('#lyrics-cancel-btn').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        },

        renderList() {
            const list = document.getElementById('list-box');
            if (!list) return;
            
            list.innerHTML = '';
            this.playlist.forEach((t, i) => {
                const item = document.createElement('div');
                item.className = `list-item ${i === this.index ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="item-info"><b>${t.title} - ${t.artist}</b></div>
                    <div class="item-btns">
                        <button type="button" class="btn-lyrics">歌词</button>
                        <button type="button" class="btn-del">×</button>
                    </div>
                `;
                item.querySelector('.item-info').onclick = () => this.play(i);
                item.querySelector('.btn-del').onclick = () => this.delSong(i);
                item.querySelector('.btn-lyrics').onclick = () => this.showLyricsDialog(i);
                list.appendChild(item);
            });
        },

        bindEvents() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            const island = document.getElementById('player-island');
            const leftZone = rhythmIcon.querySelector('.rhythm-left-zone');
            const rightZone = rhythmIcon.querySelector('.rhythm-right-zone');

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
                    const cx = ev.clientX || ev.touches[0].clientX;
                    const cy = ev.clientY || ev.touches[0].clientY;
                    const x = cx - this.drag.offX;
                    const y = cy - this.drag.offY;
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
                island.addEventListener('touchstart', handlePlayerDrag);
            }

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
                    const cx = ev.clientX || ev.touches[0].clientX;
                    const cy = ev.clientY || ev.touches[0].clientY;
                    const x = cx - this.drag.offX;
                    const y = cy - this.drag.offY;
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
                leftZone.addEventListener('touchstart', handleRhythmDrag);
            }

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

            const click = (id, fn) => {
                const el = document.getElementById(id);
                if (el) el.onclick = (e) => { e.stopPropagation(); fn(e); };
            };

            click('btn-rhythm', () => { this.state.isRhythmMode = true; this.updateView(); this.saveData(); });
            click('btn-play', () => this.toggle());
            click('btn-next', () => this.next());
            click('btn-prev', () => this.prev());
            click('btn-play-mode', () => { this.state.playMode = (this.state.playMode + 1) % 3; this.updateView(); this.saveData(); });
            click('btn-settings', () => this.togglePanel('settings'));
            click('btn-list', () => this.togglePanel('list'));
            click('btn-history', () => this.togglePanel('history'));
            click('btn-add', () => this.showAddOptions());
            click('btn-pure', () => this.togglePureMode());
            click('player-pure-mode', () => this.togglePureMode());
            click('btn-cache-all', () => this.cacheAllSongs());

            click('btn-cover-upload', () => {
                this.createFileInput('image/*', (file) => {
                    this.handleFileUpload(file, (dataUrl) => {
                        this.state.cfg.cover = dataUrl;
                        this.updateView();
                        this.saveData();
                    });
                });
            });

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

            document.querySelectorAll('.rgb-opt').forEach(opt => {
                opt.onclick = () => {
                    this.state.rgbMode = parseInt(opt.dataset.val);
                    this.updateView();
                    this.saveData();
                };
            });

            const glassToggle = document.getElementById('sw-glass');
            if (glassToggle) {
                glassToggle.onchange = (e) => { 
                    this.state.glass = e.target.checked;
                    this.updateView();
                    this.saveData(); 
                };
            }

            const glassOpacityInput = document.getElementById('inp-glass-opacity');
            if (glassOpacityInput) {
                glassOpacityInput.oninput = (e) => {
                    this.state.glassOpacity = parseInt(e.target.value) / 100;
                    this.updateView();
                };
                glassOpacityInput.onchange = () => this.saveData();
            }

            const speedInput = document.getElementById('inp-speed');
            if (speedInput) {
                speedInput.oninput = (e) => {
                    this.state.speed = parseFloat(e.target.value); 
                    this.audio.playbackRate = this.state.speed;
                    this.updateView();
                };
                speedInput.onchange = () => this.saveData();
            }

            const borderWidthInput = document.getElementById('inp-width');
            if (borderWidthInput) {
                borderWidthInput.oninput = (e) => {
                    this.state.cfg.borderWidth = e.target.value + 'px';
                    this.updateView();
                };
                borderWidthInput.onchange = () => this.saveData();
            }

            const playerWidthInput = document.getElementById('inp-width-player');
            if (playerWidthInput) {
                playerWidthInput.oninput = (e) => {
                    this.state.cfg.playerWidth = e.target.value + 'px';
                    this.updateView();
                };
                playerWidthInput.onchange = () => this.saveData();
            }

            const playerHeightInput = document.getElementById('inp-height-player');
            if (playerHeightInput) {
                playerHeightInput.oninput = (e) => {
                    this.state.cfg.playerHeight = e.target.value + 'px';
                    this.updateView();
                };
                playerHeightInput.onchange = () => this.saveData();
            }

            const coverWInput = document.getElementById('inp-cover-w');
            if (coverWInput) {
                coverWInput.oninput = (e) => {
                    this.state.cfg.coverWidth = parseInt(e.target.value);
                    this.updateView();
                };
                coverWInput.onchange = () => this.saveData();
            }

            const coverHInput = document.getElementById('inp-cover-h');
            if (coverHInput) {
                coverHInput.oninput = (e) => {
                    this.state.cfg.coverHeight = parseInt(e.target.value);
                    this.updateView();
                };
                coverHInput.onchange = () => this.saveData();
            }

            const progInput = document.getElementById('inp-prog');
            if (progInput) {
                progInput.oninput = (e) => {
                    if(this.audio.duration) this.audio.currentTime = (e.target.value/100)*this.audio.duration;
                };
            }

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
                    this.audio.currentTime = 0;
                    this.audio.play();
                } else {
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
        },

        createUI() {
            const statusEl = document.createElement('div');
            statusEl.id = 'player-status';
            statusEl.className = 'player-status';
            document.body.appendChild(statusEl);

            // 律动图标 - 添加星星
            const rhythmIcon = document.createElement('div');
            rhythmIcon.id = 'player-rhythm-icon';
            rhythmIcon.className = 'player-rhythm-icon';
            
            let bars = '';
            const totalBars = 60;
            for(let i = 0; i < totalBars; i++) {
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
        },

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
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            
            if (this.state.isRhythmMode) {
                if (root) root.style.display = 'none';
                if (rhythmIcon) rhythmIcon.style.display = 'flex';
            } else {
                if (root) root.style.display = 'flex';
                if (rhythmIcon) rhythmIcon.style.display = 'none';
            }
            
            this.updateView();
        }
    };

    // 导出到全局
    window.MusicPlayerApp = MusicPlayerApp;

    // 初始化
    MusicPlayerApp.init();

})();
