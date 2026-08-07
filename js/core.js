/**
 * core.js - 音乐播放器核心逻辑
 * 说明：播放控制、状态管理、数据持久化
 */

// ============================================================
// 默认配置
// ============================================================

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

// ============================================================
// 播放器核心对象
// ============================================================

const MusicPlayerCore = {
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
    STORAGE_KEY: 'music_player_data',

    init() {
        this.loadData();
        this.bindAudioEvents();
        if (typeof window.bindEvents === 'function') {
            window.bindEvents();
        }
    },

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                this.playlist = data.playlist || [];
                if (data.state) {
                    this.state = { ...this.state, ...data.state };
                    this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                    
                    const checkPos = (pos, def) => {
                        if (pos && (pos.x > window.innerWidth - 50 || pos.y > window.innerHeight - 50)) {
                            pos.x = def.x;
                            pos.y = def.y;
                        }
                        return pos;
                    };
                    this.state.playerPos = checkPos(this.state.playerPos, defaultConfig.pos);
                    this.state.rhythmIconPos = checkPos(this.state.rhythmIconPos, { x: 20, y: 300 });
                }
            }
        } catch (e) {
            console.warn('数据加载失败:', e);
        }

        this.state.panel = false;
        this.state.isCaching = false;

        if (typeof window.updateView === 'function') window.updateView();
        if (typeof window.renderList === 'function') window.renderList();
    },

    saveData() {
        try {
            const data = {
                playlist: this.playlist,
                state: this.state
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('数据保存失败:', e);
        }
    },

    clearData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('数据清理失败:', e);
        }
        
        this.playlist = [];
        this.index = -1;
        this.state.lyrics = [];
        this.state.importHistory = [];
        this.audio.pause();
        this.audio.src = '';

        if (typeof window.updateView === 'function') window.updateView();
        if (typeof window.renderList === 'function') window.renderList();
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

    getRefreshFunction(track) {
        if (track.source === 'qishui') {
            return window.refreshQishuiSongUrl1 || null;
        } else {
            const channel = window.getCurrentNeteaseChannel ? window.getCurrentNeteaseChannel() : 1;
            if (channel === 1) {
                return window.refreshSongUrl1 || null;
            } else {
                return window.refreshSongUrl2 || null;
            }
        }
    },

    async play(i) {
        if (!this.playlist[i]) return;

        const settings = window.extension_settings?.['music_player'] || {};
        const isHidden = settings.playerHidden === true;

        this.index = i;
        const track = this.playlist[i];

        if (track.shareLink) {
            try {
                const testAudio = new Audio();
                testAudio.src = track.url;

                const canPlay = await new Promise((resolve) => {
                    testAudio.oncanplay = () => resolve(true);
                    testAudio.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 5000);
                });

                if (!canPlay) {
                    if (typeof window.showStatus === 'function') {
                        window.showStatus('链接已失效，正在重新获取...', 'info');
                    }
                    
                    const refreshFn = this.getRefreshFunction(track);
                    let newUrl = null;
                    if (refreshFn) {
                        newUrl = await refreshFn(track.shareLink);
                    }
                    
                    if (newUrl) {
                        track.url = newUrl;
                        this.saveData();
                        if (typeof window.showStatus === 'function') {
                            window.showStatus('链接已更新', 'success');
                        }
                    } else {
                        if (typeof window.showStatus === 'function') {
                            window.showStatus('获取播放链接失败', 'error');
                        }
                        return;
                    }
                }
            } catch (error) {
                console.error('链接检测失败:', error);
            }
        }

        this.audio.src = track.url;
        this.audio.playbackRate = this.state.speed;
        this.audio.play().catch(() => {});

        this.state.lyrics = track.lyrics ? this.parseLyrics(track.lyrics) : [];
        this.state.currentLyricIndex = -1;

        if (!isHidden) {
            if (typeof window.updateView === 'function') window.updateView();
            if (typeof window.renderList === 'function') window.renderList();
        }
    },

    toggle() {
        if (!this.playlist.length) {
            if (typeof window.showAddOptions === 'function') {
                window.showAddOptions();
            }
            return;
        }
        if (this.audio.paused) {
            if (this.index === -1) {
                this.play(0);
            } else {
                this.audio.play();
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

    async cacheAllSongs() {
        if (this.state.isCaching) {
            if (typeof window.showStatus === 'function') {
                window.showStatus('正在缓存中，请稍候...', 'info');
            }
            return;
        }

        const cacheableSongs = this.playlist.filter(t => t.shareLink);
        if (cacheableSongs.length === 0) {
            if (typeof window.showStatus === 'function') {
                window.showStatus('没有需要缓存的歌曲', 'info');
            }
            return;
        }

        this.state.isCaching = true;
        if (typeof window.showCacheProgress === 'function') {
            window.showCacheProgress(0, cacheableSongs.length);
        }

        let successCount = 0;
        let failCount = 0;
        let processedCount = 0;

        for (let i = 0; i < this.playlist.length; i++) {
            const track = this.playlist[i];
            if (!track.shareLink) continue;

            try {
                const refreshFn = this.getRefreshFunction(track);
                let newUrl = null;
                if (refreshFn) {
                    newUrl = await refreshFn(track.shareLink);
                }

                if (newUrl) {
                    track.url = newUrl;
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                failCount++;
                console.error('缓存失败:', error);
            }

            processedCount++;
            if (typeof window.updateCacheProgress === 'function') {
                window.updateCacheProgress(processedCount, cacheableSongs.length, track.title);
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        this.state.isCaching = false;
        this.saveData();

        if (typeof window.hideCacheProgress === 'function') {
            window.hideCacheProgress();
        }

        if (failCount === 0) {
            if (typeof window.showStatus === 'function') {
                window.showStatus(`缓存完成！共 ${successCount} 首歌曲`, 'success');
            }
        } else {
            if (typeof window.showStatus === 'function') {
                window.showStatus(`缓存完成！成功 ${successCount} 首，失败 ${failCount} 首`, 'info');
            }
        }
    },

    parseLyrics(lrc) {
        if (!lrc || typeof lrc !== 'string') return [];
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

    bindAudioEvents() {
        this.audio.onplay = () => {
            this.state.isPlaying = true;
            const playBtn = document.getElementById('btn-play');
            if (playBtn) playBtn.innerText = '❚❚';

            const miniIcon = document.getElementById('player-mini-icon');
            if (miniIcon) {
                miniIcon.style.animation = 'spin 3s linear infinite';
            }

            const settings = window.extension_settings?.['music_player'] || {};
            if (!settings.playerHidden && typeof window.updateView === 'function') {
                window.updateView();
            }
        };

        this.audio.onpause = () => {
            this.state.isPlaying = false;
            const playBtn = document.getElementById('btn-play');
            if (playBtn) playBtn.innerText = '▶';

            const miniIcon = document.getElementById('player-mini-icon');
            if (miniIcon) {
                miniIcon.style.animation = 'none';
                miniIcon.style.transform = 'rotate(0deg)';
            }

            if (typeof window.updateView === 'function') {
                window.updateView();
            }
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
            if (typeof window.updateLyrics === 'function') {
                window.updateLyrics();
            }
        };
    }
};

// ============================================================
// 暴露到全局
// ============================================================

window.MusicPlayerCore = MusicPlayerCore;
window.defaultConfig = defaultConfig;
