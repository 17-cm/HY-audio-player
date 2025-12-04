/*
 * 音乐播放器核心逻辑
 * 版本: 1.0.2
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
        rgbColor: '#00d2ff',
        glassAlpha: 0.6,
        playerWidth: '400px',
        playerHeight: '160px',
        lyricsGradientStart: '#00d2ff',
        lyricsGradientEnd: '#ff00ff',
        pos: { x: 20, y: 100 }
    };

    // 播放器应用
    const MusicPlayerApp = {
        playlist: [],
        index: -1,
        audio: new Audio(),
        state: {
            playMode: 0, // 0:列表顺序 1:单曲循环 2:列表随机
            rgbMode: 0, // 0:关闭 1:单色 2:幻彩
            glass: true,
            glassOpacity: 0.6,
            speed: 1.0,
            panel: false,
            isRhythmMode: false, // 律动模式（原最小化）
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

        // 初始化
        init() {
            this.injectCSS();
            this.createUI();
            this.loadData();
            this.bindEvents();
            console.log('🎵 播放器核心初始化完成');
        },

        // 加载数据
        loadData() {
            const raw = localStorage.getItem('music_player_data');
            if (raw) {
                const data = JSON.parse(raw);
                this.playlist = data.playlist || [];
                if (data.state) {
                    this.state = { ...this.state, ...data.state };
                    this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                    
                    // 位置边界检查
                    const checkPos = (pos, def) => {
                        if (pos.x > window.innerWidth - 50) pos.x = def.x;
                        if (pos.y > window.innerHeight - 50) pos.y = def.y;
                    };
                    checkPos(this.state.playerPos, defaultConfig.pos);
                    checkPos(this.state.rhythmIconPos, { x: 20, y: 300 });
                }
            }
            this.state.panel = false;
            this.updateView();
            this.renderList();
        },

        // 保存数据
        saveData() {
            localStorage.setItem('music_player_data', JSON.stringify({
                playlist: this.playlist,
                state: this.state
            }));
        },

        // 显示状态提示
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

        // 添加导入历史
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

        // 文件上传处理
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

        // 更新视图
        updateView() {
            const root = document.getElementById('player-root');
            const rootRgb = document.getElementById('player-rgb-border');
            const inner = document.getElementById('player-inner');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            const cfg = this.state.cfg;

            if (!root || !inner || !rhythmIcon) return;

            // 位置设置
            root.style.left = this.state.playerPos.x + 'px';
            root.style.top = this.state.playerPos.y + 'px';
            rhythmIcon.style.left = this.state.rhythmIconPos.x + 'px';
            rhythmIcon.style.top = this.state.rhythmIconPos.y + 'px';

            // 样式变量
            root.style.setProperty('--border-w', cfg.borderWidth);
            root.style.setProperty('--rgb-single', cfg.rgbColor);
            root.style.setProperty('--player-h', cfg.playerHeight);
            root.style.setProperty('--lyrics-start', cfg.lyricsGradientStart);
            root.style.setProperty('--lyrics-end', cfg.lyricsGradientEnd);
            root.style.color = cfg.themeColor;
            root.style.width = cfg.playerWidth;
            rrhythmIcon.style.setProperty('--rgb-single', cfg.rgbColor);

            // 灵动岛颜色同步（包括RGB效果）
            const island = document.getElementById('player-island');
            if (island) {
                island.style.background = cfg.borderColor;
                
                // 同步RGB效果
                island.className = 'player-island';
                const mode = this.state.rgbMode;
                if (mode === 1) {
                    island.classList.add('rgb-single');
                    island.style.setProperty('--rgb-single', cfg.rgbColor);
                } else if (mode === 2) {
                    island.classList.add('rgb-rainbow');
                }
            }

            // 背景颜色处理
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

            // 磨砂玻璃效果
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

            // 封面设置
            const coverEl = document.getElementById('player-cover');
            if (coverEl) {
                coverEl.style.backgroundImage = `url("${cfg.cover}")`;
                coverEl.style.width = cfg.coverWidth + 'px';
                coverEl.style.height = cfg.coverHeight + 'px';
            }

            // RGB边框效果
            if (rootRgb) {
                rootRgb.className = 'player-rgb-border';
                rootRgb.style.background = cfg.borderColor;
                
                const mode = this.state.rgbMode;
                if (mode === 1) rootRgb.classList.add('mode-single');
                else if (mode === 2) rootRgb.classList.add('mode-rainbow');
            }

            // 律动图标RGB效果
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

        // 更新设置面板
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

            // RGB选项
            const rgbOpts = document.querySelectorAll('.rgb-opt');
            rgbOpts.forEach(opt => {
                opt.classList.toggle('active', parseInt(opt.dataset.val) === this.state.rgbMode);
            });
        },

        // 更新纯享模式歌词
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
                    activeLine.style.setProperty('--progress', progress + '%');
                }
            }
        },

        // 渲染纯享歌词
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
            this.index = i;
            this.audio.src = this.playlist[i].url;
            this.audio.playbackRate = this.state.speed;
            this.audio.play().catch(e => console.log(e));
            this.state.lyrics = this.playlist[i].lyrics ? this.parseLyrics(this.playlist[i].lyrics) : [];
            this.state.currentLyricIndex = -1;
            this.updateView();
            this.renderList();
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

        // 切换纯享模式
        togglePureMode() {
            this.state.isPureMode = !this.state.isPureMode;
            this.state.currentLyricIndex = -1;
            this.updateView();
            this.saveData();
        },

        // 歌词解析
        parseLyrics(lrc) {
            const lines = lrc.split('\n');
            const result = [];
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
            for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                    const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000;
                    const text = match[4].trim();
                    if (text) result.push({ time, text });
                }
            }
            return result.sort((a, b) => a.time - b.time);
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

        // 显示添加选项
        showAddOptions() {
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
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
                <div class="add-dialog" style="
                    background: #2a2a2a;
                    border-radius: 16px;
                    padding: 25px;
                    max-width: 90%;
                    width: 400px;
                    max-height: 85vh;
                    overflow-y: auto;
                    text-align: center;
                    color: #fff;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                    margin: auto;
                ">
                    <div class="dialog-title" style="
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 15px;
                    ">添加歌曲</div>
                    <div class="add-options" style="
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                        margin: 20px 0;
                    ">
                        <button type="button" id="add-single-btn" class="add-option-btn" style="
                            background: rgba(255,255,255,0.1);
                            border: 2px solid rgba(255,255,255,0.2);
                            border-radius: 12px;
                            padding: 20px;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            color: inherit;
                        ">
                            <div class="option-icon" style="font-size: 32px; line-height: 1;">🎵</div>
                            <div class="option-text" style="font-size: 16px; font-weight: bold;">添加单曲</div>
                        </button>
                        <button type="button" id="add-playlist-btn" class="add-option-btn" style="
                            background: rgba(255,255,255,0.1);
                            border: 2px solid rgba(255,255,255,0.2);
                            border-radius: 12px;
                            padding: 20px;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            color: inherit;
                        ">
                            <div class="option-icon" style="font-size: 32px; line-height: 1;">📋</div>
                            <div class="option-text" style="font-size: 16px; font-weight: bold;">添加歌单</div>
                        </button>
                    </div>
                    <button type="button" id="add-cancel-btn" class="dialog-cancel" style="
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.3);
                        color: #fff;
                        padding: 8px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">取消</button>
                </div>
            `;
            document.body.appendChild(overlay);

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
                
                let playUrl = '';
                if (urlData.data && Array.isArray(urlData.data) && urlData.data[0]) {
                    playUrl = urlData.data[0].url || '';
                }
                
                if (!playUrl) {
                    throw new Error('无法获取播放链接');
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

        // 添加单曲
        addUrlSong() {
            const input = prompt('请输入网易云歌曲链接：\n支持格式：\n• music.163.com/song?id=xxx\n• y.music.163.com/m/song/xxx\n• 163cn.tv/xxx（短链接）');
            if (!input) return;
            
            if (!this.isNeteaseLink(input)) {
                const title = prompt('歌名:', 'Untitled') || 'Untitled';
                const artist = prompt('歌手:', 'Unknown') || 'Unknown';
                
                this.playlist.push({
                    title: title,
                    artist: artist,
                    url: input,
                    lyrics: '',
                    cover: defaultConfig.cover
                });
                
                this.saveData();
                this.renderList();
                this.showStatus('歌曲添加成功！', 'success');
                
                if (this.index === -1) {
                    this.play(this.playlist.length - 1);
                }
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
                
                const playlist = data.data;
                return playlist;
                
            } catch (error) {
                console.error('歌单解析失败:', error);
                this.showStatus(`歌单解析失败: ${error.message}`, 'error');
                throw error;
            }
        },

        // 添加歌单
        async addPlaylist() {
            const input = prompt('请输入网易云歌单链接：\n支持格式：\n• music.163.com/playlist?id=xxx\n• y.music.163.com/m/playlist?id=xxx');
            if (!input) return;
            
            if (!this.isPlaylistLink(input)) {
                this.showStatus('这不是有效的歌单链接', 'error');
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
                            title: track.name,
                            artist: track.artists,
                            url: songInfo.url,
                            lyrics: songInfo.lyrics || '',
                            cover: track.picUrl || songInfo.cover
                        });
                        
                        addedCount++;
                        
                        if ((i + 1) % 5 === 0 || i === playlist.tracks.length - 1) {
                            this.showStatus(`已导入 ${i + 1}/${playlist.tracks.length} 首歌曲`, 'info');
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        console.error(`歌曲 ${track.name} 导入失败:`, error);
                        failedCount++;
                    }
                }
                
                this.addImportHistory('playlist', {
                    name: playlist.name,
                    creator: playlist.creator,
                    count: playlist.tracks.length,
                    link: input
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
                
            } catch (error) {
                console.error('歌单导入失败:', error);
            }
        },

        // 渲染导入历史
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

        // 更新歌词显示
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

        // 删除歌曲
        delSong(i) {
            if (!confirm('删除?')) return;
            this.playlist.splice(i, 1);
            this.saveData();
            this.renderList();
            if (i === this.index) {
                this.audio.pause();
                this.index = -1;
                this.updateView();
            }
        },

        // 歌词设置对话框
        showLyricsDialog(i) {
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
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
                <div class="lyrics-dialog" style="
                    background: #2a2a2a;
                    border-radius: 16px;
                    padding: 25px;
                    max-width: 90%;
                    width: 400px;
                    max-height: 85vh;
                    overflow-y: auto;
                    text-align: center;
                    color: #fff;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                    margin: auto;
                ">
                    <div class="dialog-title" style="
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 15px;
                    ">歌词设置</div>
                    <div class="lyrics-btns" style="
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-bottom: 15px;
                    ">
                        <button type="button" id="lyrics-paste-btn" class="dialog-btn" style="
                            padding: 12px 20px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                            background: #00d2ff;
                            color: #000;
                        ">粘贴歌词</button>
                        <button type="button" id="lyrics-import-btn" class="dialog-btn" style="
                            padding: 12px 20px;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                            background: #00d2ff;
                            color: #000;
                        ">导入文件</button>
                    </div>
                    <button type="button" id="lyrics-cancel-btn" class="dialog-cancel" style="
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.3);
                        color: #fff;
                        padding: 8px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">取消</button>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector('#lyrics-paste-btn').onclick = () => {
                overlay.remove();
                const currentLyrics = this.playlist[i].lyrics || '';
                const newLyrics = prompt('粘贴LRC格式歌词:', currentLyrics);
                if (newLyrics !== null) {
                    this.playlist[i].lyrics = newLyrics;
                    if (i === this.index) {
                        this.state.lyrics = this.parseLyrics(newLyrics);
                        this.state.currentLyricIndex = -1;
                    }
                    this.saveData();
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

            overlay.querySelector('#lyrics-cancel-btn').onclick = () => {
                overlay.remove();
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
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

            // 按钮事件
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

            // 颜色选择
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

            // RGB选项
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

            // 磨砂玻璃透明度
            const glassOpacityInput = document.getElementById('inp-glass-opacity');
            if (glassOpacityInput) {
                glassOpacityInput.oninput = (e) => {
                    this.state.glassOpacity = parseInt(e.target.value) / 100;
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
                    this.updateView();
                };
                speedInput.onchange = () => this.saveData();
            }

            // 边框宽度
            const borderWidthInput = document.getElementById('inp-width');
            if (borderWidthInput) {
                borderWidthInput.oninput = (e) => {
                    this.state.cfg.borderWidth = e.target.value + 'px';
                    this.updateView();
                };
                borderWidthInput.onchange = () => this.saveData();
            }

            // 播放器尺寸
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

            // 封面尺寸
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

            // 进度条
            const progInput = document.getElementById('inp-prog');
            if (progInput) {
                progInput.oninput = (e) => {
                    if(this.audio.duration) this.audio.currentTime = (e.target.value/100)*this.audio.duration;
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
                                
        // 显示播放器
        show(mode) {
            this.state.isRhythmMode = false;
            if (mode === 'rhythm') {
                this.state.isRhythmMode = true;
            } else if (mode === 'pure') {
                this.state.isPureMode = true;
            }
            this.updateView();
        },

        // 隐藏播放器
        hide() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (root) root.style.display = 'none';
            if (rhythmIcon) rhythmIcon.style.display = 'none';
        },

        // 获取当前模式
        getCurrentMode() {
            if (this.state.isRhythmMode) return 'rhythm';
            if (this.state.isPureMode) return 'pure';
            return 'normal';
        },

        // 创建UI
        createUI() {
            // 创建状态提示元素
            const statusEl = document.createElement('div');
            statusEl.id = 'player-status';
            statusEl.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #00d2ff;
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                z-index: 10001;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(statusEl);

            // 创建律动图标
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

            // 创建播放器主界面
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
                                <span>播放器高度 <b id="val-height-player">160px</b></span>
                                <input id="inp-height-player" type="range" min="140" max="300" step="5">
                            </div>
                            <div class="panel-row">
                                <span>边框宽度 <b id="val-width">6px</b></span>
                                <input id="inp-width" type="range" min="1" max="20" step="1">
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

        // 显示播放器
        show(mode) {
            this.state.isRhythmMode = false;
            if (mode === 'rhythm') {
                this.state.isRhythmMode = true;
            } else if (mode === 'pure') {
                this.state.isPureMode = true;
            }
            this.updateView();
        },

        // 隐藏播放器
        hide() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (root) root.style.display = 'none';
            if (rhythmIcon) rhythmIcon.style.display = 'none';
        },

        // 获取当前模式
        getCurrentMode() {
            if (this.state.isRhythmMode) return 'rhythm';
            if (this.state.isPureMode) return 'pure';
            return 'normal';
        },

        // 隐藏UI（音乐继续播放）
        hideUI() {
            const root = document.getElementById('player-root');
            const rhythmIcon = document.getElementById('player-rhythm-icon');
            if (root) root.style.display = 'none';
            if (rhythmIcon) rhythmIcon.style.display = 'none';
        },

        // 显示UI
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

        // 注入CSS
        injectCSS() {
            const css = `
                /* 动画定义 */
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
                @keyframes color-cycle {
                    0% { background-color: #ff0000; } 
                    14% { background-color: #ff7f00; } 
                    28% { background-color: #ffff00; } 
                    42% { background-color: #00ff00; } 
                    57% { background-color: #00ffff; } 
                    71% { background-color: #0000ff; } 
                    85% { background-color: #8b00ff; } 
                    100% { background-color: #ff0000; }
                }
                @keyframes wave { 0%, 100% { height: 2px; } 50% { height: var(--h); } }

                /* 状态提示 */
                #player-status.status-info { background: #00d2ff; }
                #player-status.status-success { background: #00cc66; }
                #player-status.status-error { background: #ff4444; }

                /* 律动图标 */
                .player-rhythm-icon {
                    position: fixed; 
                    z-index: 10000;
                    width: 300px; 
                    height: 50px;
                    display: none; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: flex-end;
                    pointer-events: auto;
                    --rgb-single: #00d2ff;
                    background: transparent;
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
                
                .rhythm-left-zone {
                    left: 0;
                    cursor: grab;
                }
                .rhythm-left-zone:active {
                    cursor: grabbing;
                }
                
                .rhythm-right-zone {
                    right: 0;
                    cursor: pointer;
                }

                .zone-hint {
                    font-size: 10px;
                    color: rgba(0,0,0,0.3);
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                
                .rhythm-left-zone:hover .zone-hint,
                .rhythm-right-zone:hover .zone-hint {
                    opacity: 1;
                }
                
                .rhythm-wave-box { 
                    display: flex; 
                    align-items: flex-end; 
                    gap: 2px; 
                    height: 35px; 
                    width: 100%; 
                    justify-content: center;
                    padding: 0 10px;
                    box-sizing: border-box;
                }
                
                .rhythm-bar { 
                    width: 3px; 
                    height: 2px; 
                    background: #000; 
                    border-radius: 1px; 
                    transition: background 0.3s; 
                }
                
                .rhythm-bar.edge-bar {
                    width: 2px;
                    opacity: 0.6;
                }
                
                .rhythm-base-line { 
                    width: 100%; 
                    height: 2px; 
                    background: #000; 
                    margin-top: 1px; 
                }

                .player-rhythm-icon.playing .rhythm-bar { 
                    animation: wave var(--s) infinite ease-in-out alternate; 
                    animation-delay: var(--d); 
                }
                
                .player-rhythm-icon.rgb-single .rhythm-bar, 
                .player-rhythm-icon.rgb-single .rhythm-base-line { 
                    background: var(--rgb-single); 
                    box-shadow: 0 0 5px var(--rgb-single); 
                }
                
                .player-rhythm-icon.rgb-rainbow .rhythm-bar, 
                .player-rhythm-icon.rgb-rainbow .rhythm-base-line { 
                    animation: color-cycle 4s infinite linear; 
                }
                
                .player-rhythm-icon.rgb-rainbow.playing .rhythm-bar { 
                    animation: wave var(--s) infinite ease-in-out alternate, color-cycle 4s infinite linear; 
                    animation-delay: var(--d), 0s; 
                }

                /* 播放器主体 */
                #player-root {
                    position: fixed; 
                    z-index: 10000;
                    width: 400px;
                    height: var(--player-h, 160px);
                    border-radius: 30px; 
                    display: none; 
                    flex-direction: column;
                    font-family: sans-serif; 
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    transition: height 0.3s, width 0.3s; 
                    pointer-events: auto;
                    --rgb-single: #00d2ff; 
                    --border-w: 6px;
                    --lyrics-start: #00d2ff; 
                    --lyrics-end: #ff00ff;
                }
                #player-root.expanded { height: 520px !important; }

                .player-rgb-border { 
                    position: absolute; 
                    inset: 0; 
                    border-radius: 30px; 
                    z-index: 0; 
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    padding: var(--border-w);
                }
                .player-rgb-border.mode-single { 
                    background: var(--rgb-single) !important; 
                    animation: blink 2s infinite; 
                }
                .player-rgb-border.mode-rainbow { 
                    animation: color-cycle 4s infinite linear, blink 2s infinite; 
                }

                .player-inner {
                    position: absolute; 
                    top: var(--border-w); 
                    left: var(--border-w); 
                    right: var(--border-w); 
                    bottom: var(--border-w);
                    border-radius: 24px; 
                    z-index: 1; 
                    overflow: hidden;
                    background: #1a1a1a;
                    transition: background 0.3s;
                }

                /* 磨砂玻璃效果 */
                .player-inner.glass-mode {
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                }

                /* 灵动岛 */
                .player-island { 
                    width: 70px; 
                    height: 18px; 
                    background: #000; 
                    margin: 0 auto; 
                    border-radius: 0 0 10px 10px; 
                    cursor: move; 
                    position: absolute; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    z-index: 20; 
                    top: 0;
                    transition: background 0.3s;
                }

                /* 灵动岛RGB效果 */
                .player-island.rgb-single {
                    background: var(--rgb-single) !important;
                    animation: blink 2s infinite;
                    box-shadow: 0 0 10px var(--rgb-single);
                }

                .player-island.rgb-rainbow {
                    animation: color-cycle 4s infinite linear, blink 2s infinite;
                }
                
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
                    background-repeat: no-repeat;
                    background-color: rgba(0,0,0,0.2);
                    transition: width 0.3s, height 0.3s;
                }
                
                .player-center { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: center; 
                    overflow: hidden; 
                }
                
                .player-meta { 
                    white-space: nowrap; 
                    overflow: hidden; 
                    margin-bottom: 5px; 
                }
                .player-title { font-weight: bold; font-size: 16px; }
                .player-artist { font-size: 12px; opacity: 0.7; }
                .player-lyrics { 
                    font-size: 12px; 
                    opacity: 0.8; 
                    height: 16px; 
                    overflow: hidden; 
                    text-align: center; 
                }
                
                .player-prog-wrap { 
                    width: 100%; 
                    height: 6px; 
                    background: rgba(255,255,255,0.1); 
                    border-radius: 3px; 
                    position: relative; 
                    margin: 5px 0; 
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
                    box-shadow: 0 0 5px rgba(0,0,0,0.5); 
                    margin-top: -3px;
                }
                
                .player-controls { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding-top: 10px; 
                }
                .player-controls button { 
                    background: none; 
                    border: none; 
                    color: inherit; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                }
                #btn-play { 
                    font-size: 22px; 
                    width: 26px; 
                    height: 26px; 
                    justify-content: center; 
                }
                #btn-prev, #btn-next { font-size: 18px; }
                #btn-play-mode { font-size: 18px; opacity: 0.8; }
                #btn-list { font-size: 18px; opacity: 0.8; }

                .player-right { 
                    display: flex; 
                    flex-direction: column; 
                    justify-content: space-between; 
                    height: 100px; 
                    margin-left: 12px; 
                }
                .player-right button { 
                    background: none; 
                    border: none; 
                    font-size: 22px; 
                    cursor: pointer; 
                    opacity: 0.7; 
                    color: inherit; 
                    padding: 5px;
                    transition: opacity 0.2s;
                }
                .player-right button:hover { opacity: 1; }
                
                /* 纯享模式 */
                .player-pure-mode { 
                    display: none; 
                    width: 100%; 
                    height: 100%; 
                    justify-content: center; 
                    align-items: center; 
                    padding: 40px 30px; 
                    box-sizing: border-box;
                    overflow: hidden; 
                    cursor: pointer;
                }
                #player-root.pure-mode #player-main-content { display: none; }
                #player-root.pure-mode .player-pure-mode { display: flex; }

                #pure-lyrics-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }

                .pure-lyric-line {
                    font-size: 14px;
                    opacity: 0.4;
                    transition: all 0.3s;
                    text-align: center;
                    line-height: 1.5;
                }

                .pure-lyric-line.active {
                    font-size: 22px;
                    font-weight: bold;
                    opacity: 1;
                    background: linear-gradient(90deg, 
                        var(--lyrics-start) var(--progress, 0%), 
                        var(--lyrics-end) var(--progress, 0%), 
                        rgba(255,255,255,0.6) var(--progress, 0%));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .pure-lyric-line.no-lyrics {
                    font-size: 16px;
                    opacity: 0.6;
                    background: none;
                    -webkit-text-fill-color: inherit;
                }

                .pure-lyric-line.passed { opacity: 0.25; }

                /* 面板 */
                .player-panel { 
                    flex: 1; 
                    display: none; 
                    flex-direction: column; 
                    padding: 15px; 
                    overflow-y: auto; 
                    position: relative; 
                    z-index: 3; 
                    max-height: 360px;
                    background: transparent;
                }
                
                .panel-section-title {
                    font-weight: bold;
                    font-size: 13px;
                    margin: 12px 0 8px 0;
                    padding-bottom: 5px;
                    border-bottom: 1px solid rgba(255,255,255,0.15);
                    position: relative;
                }
                .panel-section-title:first-child { margin-top: 0; }
                
                .panel-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 10px; 
                    font-size: 12px; 
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    position: relative;
                }
                
                .panel-row.panel-col-2 { gap: 10px; }
                .panel-row.panel-col-2 label { 
                    flex: 1; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    font-size: 12px; 
                    color: inherit;
                }
                
                .panel-bg-ctrl { display: flex; gap: 5px; align-items: center; }
                
                .panel-upload-btn, .panel-add-btn {
                    padding: 5px 10px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: inherit;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s;
                }
                .panel-upload-btn:hover, .panel-add-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .panel-opt-group { 
                    display: flex; 
                    gap: 4px; 
                    background: rgba(0,0,0,0.3); 
                    padding: 2px; 
                    border-radius: 5px; 
                }
                .rgb-opt { 
                    padding: 4px 8px; 
                    cursor: pointer; 
                    border-radius: 4px; 
                    font-size: 11px; 
                    transition: all 0.2s; 
                }
                .rgb-opt.active { 
                    background: #fff; 
                    color: #000; 
                    font-weight: bold; 
                }

                input[type=color] { 
                    width: 28px; 
                    height: 28px; 
                    border: none; 
                    background: none; 
                    cursor: pointer; 
                    border-radius: 4px; 
                }
                input[type=range] { width: 100px; }
                input[type=checkbox] { 
                    width: 16px; 
                    height: 16px; 
                    cursor: pointer; 
                }
                
                /* 播放列表 */
                .list-box { max-height: 280px; overflow-y: auto; }
                .list-box::-webkit-scrollbar { width: 4px; }
                .list-box::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.3); 
                    border-radius: 2px; 
                }

                .list-item { 
                    display: flex; 
                    justify-content: space-between; 
                    padding: 10px 0; 
                    border-bottom: 1px solid rgba(255,255,255,0.1); 
                    align-items: center;
                }
                
                .list-item.active { color: var(--rgb-single); font-weight: bold; }
                .list-item .item-info { flex: 1; cursor: pointer; font-size: 13px; }
                .item-btns { display: flex; gap: 8px; align-items: center; }
                .item-btns button { padding: 3px 8px; font-size: 11px; }
                .btn-lyrics { 
                    background: rgba(255,255,255,0.1); 
                    border: 1px solid rgba(255,255,255,0.2); 
                    color: inherit; 
                    border-radius: 4px; 
                    cursor: pointer; 
                }
                .btn-del { 
                    background: none; 
                    border: none; 
                    color: #f55; 
                    cursor: pointer; 
                    font-size: 18px; 
                }
                
                .panel-add-btn { 
                    width: 100%; 
                    padding: 12px; 
                    background: var(--rgb-single); 
                    border: none; 
                    cursor: pointer; 
                    font-weight: bold; 
                    border-radius: 8px; 
                    color: #000; 
                    margin-top: 10px; 
                    font-size: 13px;
                }

                /* 导入历史 */
                .history-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .history-list::-webkit-scrollbar {
                    width: 4px;
                }

                .history-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                }

                .history-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    gap: 12px;
                }

                .history-icon {
                    font-size: 20px;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }

                .history-content {
                    flex: 1;
                    overflow: hidden;
                }

                .history-title {
                    font-weight: bold;
                    font-size: 13px;
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .history-sub {
                    font-size: 11px;
                    opacity: 0.7;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .history-time {
                    font-size: 10px;
                    opacity: 0.5;
                    white-space: nowrap;
                }

                .no-history {
                    text-align: center;
                    padding: 40px 0;
                    opacity: 0.5;
                    font-size: 13px;
                }

                /* 对话框 */
                .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }

                .add-dialog, .lyrics-dialog {
                    background: #2a2a2a;
                    border-radius: 16px;
                    padding: 25px;
                    min-width: 250px;
                    text-align: center;
                    color: #fff;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.5);
                }

                .dialog-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 15px;
                }

                .add-options {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin: 20px 0;
                }

                .add-option-btn {
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: inherit;
                }

                .add-option-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.3);
                }

                .option-icon {
                    font-size: 32px;
                    line-height: 1;
                }

                .option-text {
                    font-size: 16px;
                    font-weight: bold;
                }

                .lyrics-btns {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .dialog-btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                    background: #00d2ff;
                    color: #000;
                }

                .dialog-btn:hover {
                    transform: scale(1.02);
                    opacity: 0.9;
                }

                .dialog-cancel {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.3);
                    color: #fff;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                }

                .dialog-cancel:hover {
                    background: rgba(255,255,255,0.1);
                }

                .player-panel::-webkit-scrollbar { width: 4px; }
                .player-panel::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.3); 
                    border-radius: 2px; 
                }
            `;
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
    };

    // 导出到全局
    window.MusicPlayerApp = MusicPlayerApp;

    // 初始化
    MusicPlayerApp.init();

})();
