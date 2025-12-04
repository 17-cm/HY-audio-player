/*
 * 音乐播放器扩展核心逻辑
 * 版本: 1.0.0
 * 作者: 17-cm
 * 修复问题: 拖拽失效、磨砂玻璃边框、尺寸设置、移动端适配、历史导入位置
 */

const MusicPlayerApp = {
    // ==================== 配置和状态 ====================
    config: {
        apiEndpoints: [
            'https://wyapi-1.toubiec.cn',
            'https://wyapi-2.toubiec.cn'
        ],
        defaultApiIndex: 1,
        defaultCover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500',
        defaultSettings: {
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
            lyricsStart: '#00d2ff',
            lyricsEnd: '#ff00ff',
            position: { x: 20, y: 100 }
        }
    },

    state: {
        playlist: [],
        currentIndex: -1,
        audio: null,
        isPlaying: false,
        isMinimized: false,
        isPureMode: false,
        isMobile: false,
        currentApiIndex: 1,
        playMode: 0, // 0:顺序 1:列表循环 2:随机
        rgbMode: 0, // 0:关闭 1:单色 2:彩虹
        glassEnabled: true,
        glassOpacity: 0.6,
        playbackSpeed: 1.0,
        currentPanel: null, // 'settings', 'playlist', 'history'
        lyrics: [],
        currentLyricIndex: -1,
        importHistory: [],
        settings: {},
        playerPosition: { x: 20, y: 100 },
        iconPosition: { x: 20, y: 300 },
        isDragging: false,
        dragStartPos: { x: 0, y: 0 }
    },

    // ==================== 初始化 ====================
    init() {
        console.log('🎵 初始化音乐播放器扩展');
        
        // 检测环境
        this.detectEnvironment();
        
        // 创建UI
        this.createUI();
        
        // 加载数据
        this.loadData();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化音频
        this.initAudio();
        
        // 绑定快捷键
        this.bindKeyboardShortcuts();
        
        // 更新视图
        this.updateView();
        
        console.log('✅ 音乐播放器扩展初始化完成');
    },
    
    detectEnvironment() {
        // 检测移动端
        const ua = navigator.userAgent.toLowerCase();
        this.state.isMobile = /mobile|android|iphone|ipad|ipod|windows phone/.test(ua);
        
        // 调整移动端默认设置
        if (this.state.isMobile) {
            this.config.defaultSettings.playerWidth = '90vw';
            this.config.defaultSettings.playerHeight = '180px';
            this.config.defaultSettings.coverWidth = 70;
            this.config.defaultSettings.coverHeight = 70;
            this.config.defaultSettings.position = { x: '5vw', y: '10vh' };
        }
    },
    
    createUI() {
        const container = document.getElementById('music-player-container');
        if (!container) {
            console.error('找不到容器元素');
            return;
        }
        
        // 创建播放器主结构
        container.innerHTML = `
            <!-- 最小化图标模式 -->
            <div id="player-icon" class="player-icon" style="display: none;">
                <div class="icon-drag-area">
                    <div class="drag-hint">拖拽</div>
                </div>
                <div class="wave-visualizer">
                    ${Array(40).fill(0).map((_, i) => 
                        `<div class="wave-bar" style="--bar-index: ${i};"></div>`
                    ).join('')}
                </div>
                <div class="wave-base-line"></div>
                <div class="icon-expand-area">
                    <div class="expand-hint">${this.state.isMobile ? '点击' : '双击'}展开</div>
                </div>
            </div>
            
            <!-- 播放器主界面 -->
            <div id="player-main" class="player-main">
                <!-- RGB边框层 -->
                <div id="player-border" class="player-border"></div>
                
                <!-- 顶部拖拽岛 -->
                <div id="drag-island" class="drag-island"></div>
                
                <!-- 内容区域 -->
                <div id="player-content" class="player-content">
                    <!-- 主播放界面 -->
                    <div id="player-normal-mode" class="player-normal-mode">
                        <div class="player-header">
                            <div id="player-cover" class="player-cover"></div>
                            <div class="player-info">
                                <div id="player-title" class="player-title">点击添加歌曲</div>
                                <div id="player-artist" class="player-artist">等待播放</div>
                                <div id="player-lyrics" class="player-lyrics">⋆……𖦤……⋆</div>
                            </div>
                            <div class="player-controls-right">
                                <button id="btn-minimize" class="control-btn" title="最小化">𓆝</button>
                                <button id="btn-settings" class="control-btn" title="设置">⚙️</button>
                                <button id="btn-pure-mode" class="control-btn" title="纯享模式">𓆟</button>
                            </div>
                        </div>
                        
                        <div class="progress-container">
                            <input type="range" id="progress-bar" class="progress-bar" min="0" max="100" value="0">
                        </div>
                        
                        <div class="player-controls">
                            <button id="btn-play-mode" class="control-btn mode-btn"></button>
                            <button id="btn-prev" class="control-btn">⏮</button>
                            <button id="btn-play" class="control-btn play-btn">▶</button>
                            <button id="btn-next" class="control-btn">⏭</button>
                            <button id="btn-playlist" class="control-btn" title="播放列表">☰</button>
                        </div>
                    </div>
                    
                    <!-- 纯享模式 -->
                    <div id="player-pure-mode" class="player-pure-mode" style="display: none;">
                        <div id="pure-lyrics-container" class="pure-lyrics-container"></div>
                    </div>
                    
                    <!-- 设置面板 -->
                    <div id="panel-settings" class="player-panel" style="display: none;">
                        <div class="panel-header">
                            <h3>播放器设置</h3>
                            <button class="panel-close-btn" data-panel="settings">×</button>
                        </div>
                        <div class="panel-content">
                            <!-- 这里的内容会在JS中动态生成 -->
                        </div>
                    </div>
                    
                    <!-- 播放列表面板 -->
                    <div id="panel-playlist" class="player-panel" style="display: none;">
                        <div class="panel-header">
                            <div class="playlist-header-left">
                                <h3>播放列表</h3>
                                <button id="btn-show-history" class="history-btn" title="导入历史">📜</button>
                            </div>
                            <button class="panel-close-btn" data-panel="playlist">×</button>
                        </div>
                        
                        <!-- 历史记录下拉菜单（新位置） -->
                        <div id="history-dropdown" class="history-dropdown" style="display: none;">
                            <div class="history-header">
                                <h4>导入历史</h4>
                                <button id="btn-close-history" class="small-btn">×</button>
                            </div>
                            <div id="history-list" class="history-list">
                                <div class="no-history">暂无导入历史</div>
                            </div>
                        </div>
                        
                        <div class="panel-content">
                            <div id="playlist-items" class="playlist-items">
                                <div class="empty-playlist">
                                    <div class="empty-icon">🎵</div>
                                    <div class="empty-text">播放列表为空</div>
                                    <button id="btn-add-song" class="add-song-btn">+ 添加歌曲</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 全局状态提示 -->
            <div id="status-toast" class="status-toast"></div>
            
            <!-- 添加歌曲对话框 -->
            <div id="add-song-dialog" class="modal-overlay" style="display: none;">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>添加歌曲</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-content">
                        <div class="add-options">
                            <button class="add-option-btn" data-type="local">
                                <div class="option-icon">📁</div>
                                <div class="option-text">本地文件</div>
                            </button>
                            <button class="add-option-btn" data-type="link">
                                <div class="option-icon">🔗</div>
                                <div class="option-text">链接导入</div>
                            </button>
                            <button class="add-option-btn" data-type="netease">
                                <div class="option-icon">☁️</div>
                                <div class="option-text">网易云音乐</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 链接导入对话框 -->
            <div id="link-import-dialog" class="modal-overlay" style="display: none;">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>链接导入</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-content">
                        <div class="link-options">
                            <button class="link-option-btn" data-type="single">
                                <div class="option-icon">🎵</div>
                                <div class="option-text">单曲导入</div>
                            </button>
                            <button class="link-option-btn" data-type="playlist">
                                <div class="option-icon">📋</div>
                                <div class="option-text">歌单导入</div>
                            </button>
                        </div>
                        <div class="link-info">
                            <p><strong>支持格式：</strong></p>
                            <ul>
                                <li>URL直链（mp3/m4a等）</li>
                                <li>网易云分享链接</li>
                                <li>网易云歌单链接</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 初始化设置面板内容
        this.initSettingsPanel();
    },
    
    initSettingsPanel() {
        const panelContent = document.querySelector('#panel-settings .panel-content');
        if (!panelContent) return;
        
        panelContent.innerHTML = `
            <div class="settings-section">
                <h4>播放设置</h4>
                <div class="setting-item">
                    <label>播放速度</label>
                    <div class="setting-control">
                        <span id="speed-value">1.0x</span>
                        <input type="range" id="speed-slider" min="0.5" max="2.0" step="0.1" value="1.0">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label>播放模式</label>
                    <div class="mode-options">
                        <button class="mode-option ${this.state.playMode === 0 ? 'active' : ''}" data-mode="0">顺序</button>
                        <button class="mode-option ${this.state.playMode === 1 ? 'active' : ''}" data-mode="1">循环</button>
                        <button class="mode-option ${this.state.playMode === 2 ? 'active' : ''}" data-mode="2">随机</button>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>外观设置</h4>
                <div class="setting-item">
                    <label>播放器尺寸</label>
                    <div class="setting-control">
                        <span id="size-value">${this.state.settings.playerWidth || '400px'}</span>
                        <input type="range" id="size-slider" min="300" max="600" step="10" value="${parseInt(this.state.settings.playerWidth || '400px')}">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label>边框宽度</label>
                    <div class="setting-control">
                        <span id="border-value">${this.state.settings.borderWidth || '6px'}</span>
                        <input type="range" id="border-slider" min="1" max="20" step="1" value="${parseInt(this.state.settings.borderWidth || '6px')}">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label>封面尺寸</label>
                    <div class="setting-control dual-slider">
                        <div>
                            <span>宽: </span>
                            <span id="cover-width-value">${this.state.settings.coverWidth || 80}px</span>
                            <input type="range" id="cover-width-slider" min="40" max="150" step="5" value="${this.state.settings.coverWidth || 80}">
                        </div>
                        <div>
                            <span>高: </span>
                            <span id="cover-height-value">${this.state.settings.coverHeight || 80}px</span>
                            <input type="range" id="cover-height-slider" min="40" max="150" step="5" value="${this.state.settings.coverHeight || 80}">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>颜色设置</h4>
                <div class="setting-item">
                    <label>主色调</label>
                    <input type="color" id="theme-color" value="${this.state.settings.themeColor || '#ffffff'}">
                </div>
                
                <div class="setting-item">
                    <label>边框颜色</label>
                    <input type="color" id="border-color" value="${this.state.settings.borderColor || '#333333'}">
                </div>
                
                <div class="setting-item">
                    <label>RGB灯效</label>
                    <div class="rgb-options">
                        <button class="rgb-option ${this.state.rgbMode === 0 ? 'active' : ''}" data-mode="0">关闭</button>
                        <button class="rgb-option ${this.state.rgbMode === 1 ? 'active' : ''}" data-mode="1">单色</button>
                        <button class="rgb-option ${this.state.rgbMode === 2 ? 'active' : ''}" data-mode="2">彩虹</button>
                    </div>
                </div>
                
                <div class="setting-item" id="rgb-color-control" style="${this.state.rgbMode === 1 ? '' : 'display: none;'}">
                    <label>RGB颜色</label>
                    <input type="color" id="rgb-color" value="${this.state.settings.rgbColor || '#00d2ff'}">
                </div>
            </div>
            
            <div class="settings-section">
                <h4>背景设置</h4>
                <div class="setting-item">
                    <label>磨砂玻璃效果</label>
                    <label class="switch">
                        <input type="checkbox" id="glass-toggle" ${this.state.glassEnabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item" id="glass-opacity-control" style="${this.state.glassEnabled ? '' : 'display: none;'}">
                    <label>透明度</label>
                    <div class="setting-control">
                        <span id="opacity-value">${Math.round((this.state.glassOpacity || 0.6) * 100)}%</span>
                        <input type="range" id="opacity-slider" min="10" max="90" step="5" value="${Math.round((this.state.glassOpacity || 0.6) * 100)}">
                    </div>
                </div>
                
                <div class="setting-item">
                    <label>背景颜色</label>
                    <div class="bg-color-controls">
                        <div>
                            <span>展开时: </span>
                            <input type="color" id="bg-expanded" value="${this.state.settings.expandedBg || '#1a1a1a'}">
                        </div>
                        <div>
                            <span>折叠时: </span>
                            <input type="color" id="bg-collapsed" value="${this.state.settings.collapsedBg || '#1a1a1a'}">
                        </div>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label>背景图片</label>
                    <div class="bg-image-controls">
                        <button id="btn-upload-bg" class="upload-btn">上传背景</button>
                        <button id="btn-reset-bg" class="reset-btn">重置</button>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>歌词设置</h4>
                <div class="setting-item">
                    <label>渐变颜色</label>
                    <div class="gradient-controls">
                        <div>
                            <span>起始色: </span>
                            <input type="color" id="lyrics-start" value="${this.state.settings.lyricsStart || '#00d2ff'}">
                        </div>
                        <div>
                            <span>结束色: </span>
                            <input type="color" id="lyrics-end" value="${this.state.settings.lyricsEnd || '#ff00ff'}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==================== 数据管理 ====================
    loadData() {
        try {
            const saved = localStorage.getItem('music_player_data');
            if (saved) {
                const data = JSON.parse(saved);
                
                // 加载播放列表
                if (data.playlist) {
                    this.state.playlist = data.playlist;
                }
                
                // 加载状态
                if (data.state) {
                    Object.assign(this.state, data.state);
                    
                    // 确保设置存在
                    if (!this.state.settings) {
                        this.state.settings = { ...this.config.defaultSettings };
                    } else {
                        // 合并默认设置
                        this.state.settings = { 
                            ...this.config.defaultSettings, 
                            ...this.state.settings 
                        };
                    }
                } else {
                    this.state.settings = { ...this.config.defaultSettings };
                }
                
                // 加载导入历史
                if (data.importHistory) {
                    this.state.importHistory = data.importHistory;
                }
                
                // 加载位置
                if (data.playerPosition) {
                    this.state.playerPosition = data.playerPosition;
                }
                if (data.iconPosition) {
                    this.state.iconPosition = data.iconPosition;
                }
            } else {
                // 首次使用，使用默认设置
                this.state.settings = { ...this.config.defaultSettings };
                this.state.playerPosition = { ...this.config.defaultSettings.position };
            }
            
            // 应用移动端调整
            if (this.state.isMobile) {
                this.state.settings.playerWidth = '90vw';
                this.state.settings.playerHeight = '180px';
                this.state.settings.coverWidth = 70;
                this.state.settings.coverHeight = 70;
                
                if (typeof this.state.playerPosition.x === 'number') {
                    this.state.playerPosition.x = '5vw';
                }
                if (typeof this.state.playerPosition.y === 'number') {
                    this.state.playerPosition.y = '10vh';
                }
            }
            
        } catch (error) {
            console.error('加载数据失败:', error);
            this.state.settings = { ...this.config.defaultSettings };
        }
    },
    
    saveData() {
        try {
            const data = {
                playlist: this.state.playlist,
                state: {
                    isPlaying: this.state.isPlaying,
                    currentIndex: this.state.currentIndex,
                    playMode: this.state.playMode,
                    rgbMode: this.state.rgbMode,
                    glassEnabled: this.state.glassEnabled,
                    glassOpacity: this.state.glassOpacity,
                    playbackSpeed: this.state.playbackSpeed,
                    isPureMode: this.state.isPureMode,
                    lyrics: this.state.lyrics,
                    currentLyricIndex: this.state.currentLyricIndex,
                    settings: this.state.settings
                },
                importHistory: this.state.importHistory,
                playerPosition: this.state.playerPosition,
                iconPosition: this.state.iconPosition
            };
            
            localStorage.setItem('music_player_data', JSON.stringify(data));
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    },
    
    // ==================== 音频控制 ====================
    initAudio() {
        this.state.audio = new Audio();
        this.state.audio.playbackRate = this.state.playbackSpeed;
        
        // 音频事件监听
        this.state.audio.addEventListener('play', () => {
            this.state.isPlaying = true;
            this.updatePlayButton();
            this.updateVisualizer();
        });
        
        this.state.audio.addEventListener('pause', () => {
            this.state.isPlaying = false;
            this.updatePlayButton();
            this.updateVisualizer();
        });
        
        this.state.audio.addEventListener('ended', () => {
            this.next();
        });
        
        this.state.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            this.updateLyrics();
        });
        
        this.state.audio.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
            this.showToast('播放失败，请检查音频链接', 'error');
        });
    },
    
    play(index = null) {
        if (index !== null) {
            this.state.currentIndex = index;
        }
        
        if (this.state.currentIndex < 0 || this.state.currentIndex >= this.state.playlist.length) {
            return;
        }
        
        const song = this.state.playlist[this.state.currentIndex];
        
        try {
            this.state.audio.src = song.url;
            this.state.audio.play().catch(e => {
                console.error('播放失败:', e);
                this.showToast('播放失败', 'error');
            });
            
            // 更新UI
            this.updateSongInfo();
            this.updatePlaylistHighlight();
            
            // 解析歌词
            if (song.lyrics) {
                this.state.lyrics = this.parseLyrics(song.lyrics);
            } else {
                this.state.lyrics = [];
            }
            this.state.currentLyricIndex = -1;
            
            // 保存播放历史
            this.addImportHistory('play', {
                title: song.title,
                artist: song.artist
            });
            
        } catch (error) {
            console.error('播放错误:', error);
            this.showToast('播放失败', 'error');
        }
    },
    
    pause() {
        if (this.state.audio) {
            this.state.audio.pause();
        }
    },
    
    togglePlay() {
        if (!this.state.playlist.length) {
            this.showAddSongDialog();
            return;
        }
        
        if (this.state.currentIndex === -1) {
            this.play(0);
        } else if (this.state.audio.paused) {
            this.state.audio.play().catch(e => {
                console.error('播放失败:', e);
                this.showToast('播放失败', 'error');
            });
        } else {
            this.state.audio.pause();
        }
    },
    
    next() {
        if (!this.state.playlist.length) return;
        
        let nextIndex;
        if (this.state.playMode === 2) { // 随机
            do {
                nextIndex = Math.floor(Math.random() * this.state.playlist.length);
            } while (nextIndex === this.state.currentIndex && this.state.playlist.length > 1);
        } else {
            nextIndex = this.state.currentIndex + 1;
            if (nextIndex >= this.state.playlist.length) {
                nextIndex = this.state.playMode === 1 ? 0 : -1; // 列表循环或停止
            }
        }
        
        if (nextIndex >= 0) {
            this.play(nextIndex);
        }
    },
    
    prev() {
        if (!this.state.playlist.length || this.state.currentIndex < 0) return;
        
        let prevIndex = this.state.currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = this.state.playlist.length - 1;
        }
        
        this.play(prevIndex);
    },
    
    // ==================== UI更新 ====================
    updateView() {
        // 更新播放器位置
        this.updatePlayerPosition();
        
        // 更新播放器样式
        this.updatePlayerStyle();
        
        // 更新按钮状态
        this.updatePlayButton();
        this.updatePlayModeButton();
        
        // 更新播放列表
        this.updatePlaylist();
        
        // 更新历史记录
        this.updateHistoryList();
        
        // 更新可视化效果
        this.updateVisualizer();
        
        // 更新纯享模式
        if (this.state.isPureMode) {
            this.updatePureLyrics();
        }
    },
    
    updatePlayerPosition() {
        const playerMain = document.getElementById('player-main');
        const playerIcon = document.getElementById('player-icon');
        
        if (!playerMain || !playerIcon) return;
        
        if (this.state.isMinimized) {
            // 显示图标，隐藏主界面
            playerMain.style.display = 'none';
            playerIcon.style.display = 'flex';
            
            // 设置图标位置
            const pos = this.state.iconPosition;
            if (typeof pos.x === 'string') {
                playerIcon.style.left = pos.x;
            } else {
                playerIcon.style.left = pos.x + 'px';
            }
            
            if (typeof pos.y === 'string') {
                playerIcon.style.top = pos.y;
            } else {
                playerIcon.style.top = pos.y + 'px';
            }
        } else {
            // 显示主界面，隐藏图标
            playerMain.style.display = 'flex';
            playerIcon.style.display = 'none';
            
            // 设置主界面位置
            const pos = this.state.playerPosition;
            if (typeof pos.x === 'string') {
                playerMain.style.left = pos.x;
            } else {
                playerMain.style.left = pos.x + 'px';
            }
            
            if (typeof pos.y === 'string') {
                playerMain.style.top = pos.y;
            } else {
                playerMain.style.top = pos.y + 'px';
            }
        }
    },
    
    updatePlayerStyle() {
        const playerMain = document.getElementById('player-main');
        const playerBorder = document.getElementById('player-border');
        const playerContent = document.getElementById('player-content');
        
        if (!playerMain || !playerBorder || !playerContent) return;
        
        const settings = this.state.settings;
        
        // 尺寸
        playerMain.style.width = settings.playerWidth;
        playerMain.style.height = settings.playerHeight;
        
        // 边框
        playerBorder.style.borderWidth = settings.borderWidth;
        playerBorder.style.borderColor = settings.borderColor;
        
        // RGB效果
        playerBorder.className = 'player-border';
        if (this.state.rgbMode === 1) {
            playerBorder.classList.add('rgb-single');
            playerBorder.style.setProperty('--rgb-color', settings.rgbColor);
        } else if (this.state.rgbMode === 2) {
            playerBorder.classList.add('rgb-rainbow');
        }
        
        // 磨砂玻璃效果
        if (this.state.glassEnabled) {
            playerContent.classList.add('glass-effect');
            playerContent.style.setProperty('--glass-opacity', this.state.glassOpacity);
        } else {
            playerContent.classList.remove('glass-effect');
        }
        
        // 背景颜色
        const currentBg = this.state.currentPanel ? settings.expandedBg : settings.collapsedBg;
        playerContent.style.backgroundColor = currentBg;
        
        // 文字颜色
        playerMain.style.color = settings.themeColor;
        
        // 封面
        const cover = document.getElementById('player-cover');
        if (cover) {
            const song = this.state.playlist[this.state.currentIndex];
            cover.style.backgroundImage = `url("${song?.cover || this.config.defaultCover}")`;
            cover.style.width = settings.coverWidth + 'px';
            cover.style.height = settings.coverHeight + 'px';
        }
    },
    
    updatePlayButton() {
        const btn = document.getElementById('btn-play');
        if (btn) {
            btn.textContent = this.state.isPlaying ? '❚❚' : '▶';
        }
    },
    
    updatePlayModeButton() {
        const btn = document.getElementById('btn-play-mode');
        if (!btn) return;
        
        const icons = ['→', '🔁', '🔀'];
        btn.textContent = icons[this.state.playMode] || icons[0];
        btn.title = ['顺序播放', '列表循环', '随机播放'][this.state.playMode];
    },
    
    updateProgress() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar || !this.state.audio.duration) return;
        
        const progress = (this.state.audio.currentTime / this.state.audio.duration) * 100;
        progressBar.value = progress;
    },
    
    updateSongInfo() {
        const titleEl = document.getElementById('player-title');
        const artistEl = document.getElementById('player-artist');
        
        if (!titleEl || !artistEl) return;
        
        if (this.state.currentIndex >= 0 && this.state.playlist[this.state.currentIndex]) {
            const song = this.state.playlist[this.state.currentIndex];
            titleEl.textContent = song.title;
            artistEl.textContent = song.artist;
        } else {
            titleEl.textContent = '点击添加歌曲';
            artistEl.textContent = '等待播放';
        }
    },
    
    updateLyrics() {
        const lyricsEl = document.getElementById('player-lyrics');
        if (!lyricsEl) return;
        
        if (!this.state.lyrics.length) {
            lyricsEl.textContent = '⋆……𖦤……⋆';
            return;
        }
        
        const currentTime = this.state.audio.currentTime;
        let currentLine = '';
        
        for (let i = 0; i < this.state.lyrics.length; i++) {
            if (currentTime >= this.state.lyrics[i].time) {
                currentLine = this.state.lyrics[i].text;
                this.state.currentLyricIndex = i;
            } else {
                break;
            }
        }
        
        lyricsEl.textContent = currentLine || '⋆……𖦤……⋆';
        
        // 更新纯享模式歌词
        if (this.state.isPureMode) {
            this.updatePureLyrics();
        }
    },
    
    updatePureLyrics() {
        const container = document.getElementById('pure-lyrics-container');
        if (!container) return;
        
        if (!this.state.lyrics.length) {
            container.innerHTML = '<div class="pure-lyric-line no-lyrics">晚睡的小孩不会有美梦光临哦</div>';
            return;
        }
        
        const currentIndex = this.state.currentLyricIndex;
        if (currentIndex < 0) return;
        
        // 显示当前行和前两行、后两行
        const start = Math.max(0, currentIndex - 2);
        const end = Math.min(this.state.lyrics.length, currentIndex + 3);
        
        let html = '';
        for (let i = start; i < end; i++) {
            const lineClass = i === currentIndex ? 'pure-lyric-line active' : 'pure-lyric-line';
            html += `<div class="${lineClass}">${this.state.lyrics[i].text}</div>`;
        }
        
        container.innerHTML = html;
        
        // 计算当前歌词进度
        if (currentIndex < this.state.lyrics.length - 1) {
            const currentTime = this.state.lyrics[currentIndex].time;
            const nextTime = this.state.lyrics[currentIndex + 1].time;
            const duration = nextTime - currentTime;
            const elapsed = this.state.audio.currentTime - currentTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            
            const activeLine = container.querySelector('.pure-lyric-line.active');
            if (activeLine) {
                activeLine.style.setProperty('--lyrics-progress', progress + '%');
            }
        }
    },
    
    updatePlaylist() {
        const container = document.getElementById('playlist-items');
        if (!container) return;
        
        if (!this.state.playlist.length) {
            container.innerHTML = `
                <div class="empty-playlist">
                    <div class="empty-icon">🎵</div>
                    <div class="empty-text">播放列表为空</div>
                    <button id="btn-add-song" class="add-song-btn">+ 添加歌曲</button>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.state.playlist.forEach((song, index) => {
            const isActive = index === this.state.currentIndex;
            const typeIcon = song.isLocal ? '📁' : song.isNetease ? '☁️' : '🔗';
            
            html += `
                <div class="playlist-item ${isActive ? 'active' : ''}" data-index="${index}">
                    <div class="item-type">${typeIcon}</div>
                    <div class="item-info">
                        <div class="item-title">${song.title}</div>
                        <div class="item-artist">${song.artist}</div>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn lyrics-btn" title="歌词">🎵</button>
                        <button class="item-btn delete-btn" title="删除">×</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    updatePlaylistHighlight() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === this.state.currentIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },
    
    updateHistoryList() {
        const container = document.getElementById('history-list');
        if (!container) return;
        
        if (!this.state.importHistory.length) {
            container.innerHTML = '<div class="no-history">暂无导入历史</div>';
            return;
        }
        
        let html = '';
        this.state.importHistory.slice(0, 10).forEach((history, index) => {
            const time = history.time || new Date().toLocaleTimeString();
            let content = '';
            
            if (history.type === 'play') {
                content = `
                    <div class="history-icon">🎵</div>
                    <div class="history-content">
                        <div class="history-title">${history.data.title}</div>
                        <div class="history-sub">播放历史</div>
                    </div>
                `;
            } else if (history.type === 'import') {
                content = `
                    <div class="history-icon">📥</div>
                    <div class="history-content">
                        <div class="history-title">${history.data.title}</div>
                        <div class="history-sub">${history.data.artist || '导入歌曲'}</div>
                    </div>
                `;
            } else if (history.type === 'playlist') {
                content = `
                    <div class="history-icon">📋</div>
                    <div class="history-content">
                        <div class="history-title">${history.data.name}</div>
                        <div class="history-sub">${history.data.count} 首歌曲</div>
                    </div>
                `;
            }
            
            if (content) {
                html += `
                    <div class="history-item" data-index="${index}">
                        ${content}
                        <div class="history-time">${time}</div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
    },
    
    updateVisualizer() {
        const bars = document.querySelectorAll('.wave-bar');
        if (!bars.length) return;
        
        bars.forEach((bar, index) => {
            if (this.state.isPlaying) {
                const amplitude = Math.sin(Date.now() / 200 + index * 0.3) * 0.5 + 0.5;
                bar.style.height = `${10 + amplitude * 20}px`;
                bar.style.opacity = 0.3 + amplitude * 0.7;
            } else {
                bar.style.height = '10px';
                bar.style.opacity = '0.3';
            }
        });
    },
    
    // ==================== 事件处理 ====================
    bindEvents() {
        // 播放控制按钮
        this.bindButton('#btn-play', () => this.togglePlay());
        this.bindButton('#btn-prev', () => this.prev());
        this.bindButton('#btn-next', () => this.next());
        this.bindButton('#btn-play-mode', () => this.togglePlayMode());
        this.bindButton('#btn-playlist', () => this.togglePanel('playlist'));
        this.bindButton('#btn-settings', () => this.togglePanel('settings'));
        this.bindButton('#btn-pure-mode', () => this.togglePureMode());
        this.bindButton('#btn-minimize', () => this.toggleMinimize());
        
        // 添加歌曲
        this.bindButton('#btn-add-song', () => this.showAddSongDialog());
        
        // 进度条
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                if (this.state.audio.duration) {
                    this.state.audio.currentTime = (e.target.value / 100) * this.state.audio.duration;
                }
            });
        }
        
        // 拖拽系统（已修复）
        this.initDragSystem();
        
        // 设置面板控制
        this.initSettingsControls();
        
        // 对话框
        this.initDialogs();
        
        // 播放列表点击
        this.delegateEvent('#playlist-items', '.playlist-item', 'click', (e, item) => {
            const index = parseInt(item.dataset.index);
            if (!isNaN(index)) {
                this.play(index);
            }
        });
        
        this.delegateEvent('#playlist-items', '.lyrics-btn', 'click', (e, btn) => {
            e.stopPropagation();
            const item = btn.closest('.playlist-item');
            const index = parseInt(item.dataset.index);
            this.editLyrics(index);
        });
        
        this.delegateEvent('#playlist-items', '.delete-btn', 'click', (e, btn) => {
            e.stopPropagation();
            const item = btn.closest('.playlist-item');
            const index = parseInt(item.dataset.index);
            this.deleteSong(index);
        });
        
        // 历史记录
        this.bindButton('#btn-show-history', () => this.toggleHistoryDropdown());
        this.bindButton('#btn-close-history', () => this.toggleHistoryDropdown());
        
        // 面板关闭按钮
        this.delegateEvent('.player-panel', '.panel-close-btn', 'click', (e, btn) => {
            const panel = btn.dataset.panel;
            this.closePanel(panel);
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.updatePlayerPosition();
        });
    },
    
    bindButton(selector, handler) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    },
    
    delegateEvent(containerSelector, targetSelector, eventType, handler) {
        const container = document.querySelector(containerSelector);
        if (container) {
            container.addEventListener(eventType, (e) => {
                const target = e.target.closest(targetSelector);
                if (target) {
                    handler(e, target);
                }
            });
        }
    },
    
    // ==================== 拖拽系统（已修复） ====================
    initDragSystem() {
        // 主播放器拖拽
        const dragIsland = document.getElementById('drag-island');
        const playerMain = document.getElementById('player-main');
        
        if (dragIsland && playerMain) {
            this.setupDraggable(dragIsland, playerMain, 'playerPosition', this.state.isMobile);
        }
        
        // 图标拖拽
        const iconDragArea = document.querySelector('.icon-drag-area');
        const playerIcon = document.getElementById('player-icon');
        
        if (iconDragArea && playerIcon) {
            this.setupDraggable(iconDragArea, playerIcon, 'iconPosition', this.state.isMobile);
        }
        
        // 图标展开区域
        const expandArea = document.querySelector('.icon-expand-area');
        if (expandArea) {
            if (this.state.isMobile) {
                // 移动端：点击展开
                expandArea.addEventListener('click', () => {
                    this.state.isMinimized = false;
                    this.updateView();
                    this.saveData();
                });
            } else {
                // 桌面端：双击展开
                let lastClick = 0;
                expandArea.addEventListener('click', () => {
                    const now = Date.now();
                    if (now - lastClick < 300) {
                        this.state.isMinimized = false;
                        this.updateView();
                        this.saveData();
                        lastClick = 0;
                    } else {
                        lastClick = now;
                    }
                });
            }
        }
    },
    
    setupDraggable(dragElement, targetElement, positionKey, isMobile) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            
            const rect = targetElement.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            document.body.style.userSelect = 'none';
            targetElement.style.transition = 'none';
        };
        
        const doDrag = (clientX, clientY) => {
            if (!isDragging) return;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;
            
            // 边界检查
            const maxX = window.innerWidth - targetElement.offsetWidth;
            const maxY = window.innerHeight - targetElement.offsetHeight;
            
            newLeft = Math.max(0, Math.min(newLeft, maxX));
            newTop = Math.max(0, Math.min(newTop, maxY));
            
            targetElement.style.left = newLeft + 'px';
            targetElement.style.top = newTop + 'px';
            
            // 更新状态
            this.state[positionKey] = { x: newLeft, y: newTop };
        };
        
        const stopDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.userSelect = '';
            targetElement.style.transition = '';
            this.saveData();
        };
        
        // 桌面端事件
        dragElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            doDrag(e.clientX, e.clientY);
        });
        
        document.addEventListener('mouseup', stopDrag);
        
        // 移动端触摸事件
        if (isMobile) {
            dragElement.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                startDrag(touch.clientX, touch.clientY);
            }, { passive: false });
            
            document.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const touch = e.touches[0];
                doDrag(touch.clientX, touch.clientY);
            }, { passive: false });
            
            document.addEventListener('touchend', stopDrag);
            document.addEventListener('touchcancel', stopDrag);
        }
    },
    
    // ==================== 设置控制 ====================
    initSettingsControls() {
        // 播放速度
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                this.state.playbackSpeed = speed;
                if (this.state.audio) {
                    this.state.audio.playbackRate = speed;
                }
                document.getElementById('speed-value').textContent = speed.toFixed(1) + 'x';
            });
            
            speedSlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        // 播放模式
        this.delegateEvent('#panel-settings', '.mode-option', 'click', (e, btn) => {
            const mode = parseInt(btn.dataset.mode);
            this.state.playMode = mode;
            
            // 更新按钮状态
            document.querySelectorAll('.mode-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            this.updatePlayModeButton();
            this.saveData();
        });
        
        // 尺寸控制
        const sizeSlider = document.getElementById('size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                const unit = this.state.isMobile ? 'vw' : 'px';
                this.state.settings.playerWidth = size + unit;
                document.getElementById('size-value').textContent = size + unit;
                this.updatePlayerStyle();
            });
            
            sizeSlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        // 边框宽度
        const borderSlider = document.getElementById('border-slider');
        if (borderSlider) {
            borderSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                this.state.settings.borderWidth = width + 'px';
                document.getElementById('border-value').textContent = width + 'px';
                this.updatePlayerStyle();
            });
            
            borderSlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        // 封面尺寸
        const coverWidthSlider = document.getElementById('cover-width-slider');
        const coverHeightSlider = document.getElementById('cover-height-slider');
        
        if (coverWidthSlider) {
            coverWidthSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                this.state.settings.coverWidth = width;
                document.getElementById('cover-width-value').textContent = width + 'px';
                this.updatePlayerStyle();
            });
            
            coverWidthSlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        if (coverHeightSlider) {
            coverHeightSlider.addEventListener('input', (e) => {
                const height = parseInt(e.target.value);
                this.state.settings.coverHeight = height;
                document.getElementById('cover-height-value').textContent = height + 'px';
                this.updatePlayerStyle();
            });
            
            coverHeightSlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        // 颜色设置
        const themeColor = document.getElementById('theme-color');
        if (themeColor) {
            themeColor.addEventListener('change', (e) => {
                this.state.settings.themeColor = e.target.value;
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        const borderColor = document.getElementById('border-color');
        if (borderColor) {
            borderColor.addEventListener('change', (e) => {
                this.state.settings.borderColor = e.target.value;
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        // RGB模式
        this.delegateEvent('#panel-settings', '.rgb-option', 'click', (e, btn) => {
            const mode = parseInt(btn.dataset.mode);
            this.state.rgbMode = mode;
            
            // 更新按钮状态
            document.querySelectorAll('.rgb-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 显示/隐藏RGB颜色选择器
            const colorControl = document.getElementById('rgb-color-control');
            if (colorControl) {
                colorControl.style.display = mode === 1 ? '' : 'none';
            }
            
            this.updatePlayerStyle();
            this.saveData();
        });
        
        const rgbColor = document.getElementById('rgb-color');
        if (rgbColor) {
            rgbColor.addEventListener('change', (e) => {
                this.state.settings.rgbColor = e.target.value;
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        // 磨砂玻璃
        const glassToggle = document.getElementById('glass-toggle');
        if (glassToggle) {
            glassToggle.addEventListener('change', (e) => {
                this.state.glassEnabled = e.target.checked;
                const opacityControl = document.getElementById('glass-opacity-control');
                if (opacityControl) {
                    opacityControl.style.display = e.target.checked ? '' : 'none';
                }
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        const opacitySlider = document.getElementById('opacity-slider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const opacity = parseInt(e.target.value) / 100;
                this.state.glassOpacity = opacity;
                document.getElementById('opacity-value').textContent = e.target.value + '%';
                this.updatePlayerStyle();
            });
            
            opacitySlider.addEventListener('change', () => {
                this.saveData();
            });
        }
        
        // 背景颜色
        const bgExpanded = document.getElementById('bg-expanded');
        const bgCollapsed = document.getElementById('bg-collapsed');
        
        if (bgExpanded) {
            bgExpanded.addEventListener('change', (e) => {
                this.state.settings.expandedBg = e.target.value;
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        if (bgCollapsed) {
            bgCollapsed.addEventListener('change', (e) => {
                this.state.settings.collapsedBg = e.target.value;
                this.updatePlayerStyle();
                this.saveData();
            });
        }
        
        // 歌词颜色
        const lyricsStart = document.getElementById('lyrics-start');
        const lyricsEnd = document.getElementById('lyrics-end');
        
        if (lyricsStart) {
            lyricsStart.addEventListener('change', (e) => {
                this.state.settings.lyricsStart = e.target.value;
                this.saveData();
            });
        }
        
        if (lyricsEnd) {
            lyricsEnd.addEventListener('change', (e) => {
                this.state.settings.lyricsEnd = e.target.value;
                this.saveData();
            });
        }
    },
    
    // ==================== 对话框系统 ====================
    initDialogs() {
        // 添加歌曲对话框
        this.delegateEvent('#add-song-dialog', '.add-option-btn', 'click', (e, btn) => {
            const type = btn.dataset.type;
            this.hideDialog('add-song-dialog');
            
            switch (type) {
                case 'local':
                    this.importLocalFiles();
                    break;
                case 'link':
                    this.showDialog('link-import-dialog');
                    break;
                case 'netease':
                    this.importNeteaseSong();
                    break;
            }
        });
        
        // 链接导入对话框
        this.delegateEvent('#link-import-dialog', '.link-option-btn', 'click', (e, btn) => {
            const type = btn.dataset.type;
            this.hideDialog('link-import-dialog');
            
            if (type === 'single') {
                this.importSongLink();
            } else if (type === 'playlist') {
                this.importPlaylistLink();
            }
        });
        
        // 关闭按钮
        this.delegateEvent('.modal-overlay', '.modal-close', 'click', (e, btn) => {
            const dialog = btn.closest('.modal-overlay');
            if (dialog) {
                dialog.style.display = 'none';
            }
        });
        
        // 点击背景关闭
        document.querySelectorAll('.modal-overlay').forEach(dialog => {
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.style.display = 'none';
                }
            });
        });
    },
    
    showDialog(id) {
        const dialog = document.getElementById(id);
        if (dialog) {
            dialog.style.display = 'flex';
        }
    },
    
    hideDialog(id) {
        const dialog = document.getElementById(id);
        if (dialog) {
            dialog.style.display = 'none';
        }
    },
    
    showAddSongDialog() {
        this.showDialog('add-song-dialog');
    },
    
    // ==================== 歌曲导入 ====================
    importLocalFiles() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.multiple = true;
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            let importedCount = 0;
            
            files.forEach(file => {
                const url = URL.createObjectURL(file);
                const title = file.name.replace(/\\.[^/.]+$/, "");
                
                this.state.playlist.push({
                    title: title,
                    artist: '本地文件',
                    url: url,
                    cover: this.config.defaultCover,
                    isLocal: true
                });
                
                importedCount++;
            });
            
            if (importedCount > 0) {
                this.updatePlaylist();
                this.saveData();
                this.showToast(`成功导入 ${importedCount} 首本地歌曲`, 'success');
                
                if (this.state.currentIndex === -1) {
                    this.play(0);
                }
            }
            
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    },
    
    importSongLink() {
        const url = prompt('请输入歌曲链接（支持直链或网易云链接）:', '');
        if (!url) return;
        
        if (url.includes('music.163.com') || url.includes('163cn.tv')) {
            // 网易云链接
            this.importNeteaseSong(url);
        } else {
            // 直链
            const title = prompt('请输入歌曲名称:', '未知歌曲');
            const artist = prompt('请输入歌手名称:', '未知艺术家');
            
            if (title) {
                this.state.playlist.push({
                    title: title || '未知歌曲',
                    artist: artist || '未知艺术家',
                    url: url,
                    cover: this.config.defaultCover,
                    isDirectLink: true
                });
                
                this.updatePlaylist();
                this.saveData();
                this.showToast('歌曲添加成功', 'success');
                
                if (this.state.currentIndex === -1) {
                    this.play(this.state.playlist.length - 1);
                }
            }
        }
    },
    
    async importNeteaseSong(link = null) {
        if (!link) {
            link = prompt('请输入网易云歌曲链接:', '');
            if (!link) return;
        }
        
        this.showToast('正在解析网易云链接...', 'info');
        
        try {
            const apiUrl = this.config.apiEndpoints[this.state.currentApiIndex];
            const response = await fetch(`${apiUrl}/api/music/detail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: link })
            });
            
            if (!response.ok) throw new Error('API请求失败');
            
            const data = await response.json();
            if (data.code !== 200) throw new Error(data.msg || 'API返回错误');
            
            const song = data.data;
            
            // 获取播放链接
            const urlResponse = await fetch(`${apiUrl}/api/music/url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: link, level: 'exhigh' })
            });
            
            if (!urlResponse.ok) throw new Error('获取播放链接失败');
            
            const urlData = await urlResponse.json();
            if (urlData.code !== 200) throw new Error(urlData.msg || '获取播放链接失败');
            
            const playUrl = urlData.data?.[0]?.url;
            if (!playUrl) throw new Error('无法获取播放链接');
            
            // 添加到播放列表
            this.state.playlist.push({
                title: song.name || '未知歌曲',
                artist: song.singer || '未知艺术家',
                url: playUrl,
                cover: song.picimg || this.config.defaultCover,
                isNetease: true
            });
            
            this.updatePlaylist();
            this.saveData();
            
            this.addImportHistory('import', {
                title: song.name,
                artist: song.singer
            });
            
            this.showToast(`成功添加: ${song.name}`, 'success');
            
            if (this.state.currentIndex === -1) {
                this.play(this.state.playlist.length - 1);
            }
            
        } catch (error) {
            console.error('导入失败:', error);
            this.showToast(`导入失败: ${error.message}`, 'error');
        }
    },
    
    async importPlaylistLink() {
        const link = prompt('请输入网易云歌单链接:', '');
        if (!link) return;
        
        if (!link.includes('playlist')) {
            this.showToast('这不是有效的歌单链接', 'error');
            return;
        }
        
        const confirmImport = confirm('是否导入整个歌单？这可能需要一些时间。');
        if (!confirmImport) return;
        
        this.showToast('正在解析歌单...', 'info');
        
        try {
            const apiUrl = this.config.apiEndpoints[this.state.currentApiIndex];
            const response = await fetch(`${apiUrl}/api/music/playlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: link })
            });
            
            if (!response.ok) throw new Error('API请求失败');
            
            const data = await response.json();
            if (data.code !== 200) throw new Error(data.msg || 'API返回错误');
            
            const playlist = data.data;
            
            if (!playlist.tracks || playlist.tracks.length === 0) {
                throw new Error('歌单为空');
            }
            
            const importCount = Math.min(playlist.tracks.length, 50); // 限制最多导入50首
            let imported = 0;
            
            for (let i = 0; i < importCount; i++) {
                const track = playlist.tracks[i];
                const songLink = `music.163.com/song?id=${track.id}`;
                
                try {
                    const songResponse = await fetch(`${apiUrl}/api/music/detail`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: songLink })
                    });
                    
                    if (songResponse.ok) {
                        const songData = await songResponse.json();
                        if (songData.code === 200) {
                            this.state.playlist.push({
                                title: track.name,
                                artist: track.artists,
                                url: '', // 实际播放链接需要单独获取，这里简化处理
                                cover: track.picUrl || this.config.defaultCover,
                                isNetease: true
                            });
                            imported++;
                        }
                    }
                } catch (e) {
                    console.warn(`跳过歌曲 ${track.name}:`, e);
                }
                
                // 更新进度
                if (i % 5 === 0 || i === importCount - 1) {
                    this.showToast(`已导入 ${i + 1}/${importCount} 首歌曲`, 'info');
                }
            }
            
            this.updatePlaylist();
            this.saveData();
            
            this.addImportHistory('playlist', {
                name: playlist.name,
                count: imported
            });
            
            this.showToast(`歌单导入完成，成功 ${imported} 首`, 'success');
            
            if (this.state.currentIndex === -1 && imported > 0) {
                this.play(0);
            }
            
        } catch (error) {
            console.error('歌单导入失败:', error);
            this.showToast(`歌单导入失败: ${error.message}`, 'error');
        }
    },
    
    // ==================== 其他功能 ====================
    togglePlayMode() {
        this.state.playMode = (this.state.playMode + 1) % 3;
        this.updatePlayModeButton();
        this.saveData();
    },
    
    togglePureMode() {
        this.state.isPureMode = !this.state.isPureMode;
        
        const normalMode = document.getElementById('player-normal-mode');
        const pureMode = document.getElementById('player-pure-mode');
        
        if (normalMode && pureMode) {
            if (this.state.isPureMode) {
                normalMode.style.display = 'none';
                pureMode.style.display = 'flex';
                this.updatePureLyrics();
            } else {
                normalMode.style.display = 'flex';
                pureMode.style.display = 'none';
            }
        }
        
        this.saveData();
    },
    
    toggleMinimize() {
        this.state.isMinimized = !this.state.isMinimized;
        this.updateView();
        this.saveData();
    },
    
    togglePanel(panelName) {
        if (this.state.currentPanel === panelName) {
            this.closePanel(panelName);
        } else {
            this.openPanel(panelName);
        }
    },
    
    openPanel(panelName) {
        // 关闭其他面板
        document.querySelectorAll('.player-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        
        // 显示目标面板
        const panel = document.getElementById(`panel-${panelName}`);
        if (panel) {
            panel.style.display = 'flex';
            this.state.currentPanel = panelName;
            
            // 调整播放器高度
            const playerMain = document.getElementById('player-main');
            if (playerMain) {
                playerMain.style.height = '520px';
            }
        }
    },
    
    closePanel(panelName) {
        const panel = document.getElementById(`panel-${panelName}`);
        if (panel) {
            panel.style.display = 'none';
            this.state.currentPanel = null;
            
            // 恢复播放器高度
            const playerMain = document.getElementById('player-main');
            if (playerMain) {
                playerMain.style.height = this.state.settings.playerHeight;
            }
        }
    },
    
    toggleHistoryDropdown() {
        const dropdown = document.getElementById('history-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    deleteSong(index) {
        if (confirm('确定要删除这首歌曲吗？')) {
            this.state.playlist.splice(index, 1);
            
            if (index === this.state.currentIndex) {
                this.state.currentIndex = -1;
                if (this.state.audio) {
                    this.state.audio.pause();
                    this.state.audio.src = '';
                }
            } else if (index < this.state.currentIndex) {
                this.state.currentIndex--;
            }
            
            this.updatePlaylist();
            this.updateSongInfo();
            this.saveData();
            this.showToast('歌曲已删除', 'success');
        }
    },
    
    editLyrics(index) {
        const song = this.state.playlist[index];
        const currentLyrics = song.lyrics || '';
        const newLyrics = prompt('请输入歌词（LRC格式）:', currentLyrics);
        
        if (newLyrics !== null) {
            song.lyrics = newLyrics;
            
            if (index === this.state.currentIndex) {
                this.state.lyrics = this.parseLyrics(newLyrics);
                this.state.currentLyricIndex = -1;
                this.updateLyrics();
            }
            
            this.saveData();
            this.showToast('歌词已更新', 'success');
        }
    },
    
    parseLyrics(lrcText) {
        if (!lrcText) return [];
        
        const lines = lrcText.split('\n');
        const lyrics = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
        
        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const text = match[4].trim();
                
                if (text) {
                    const time = minutes * 60 + seconds + milliseconds / 1000;
                    lyrics.push({ time, text });
                }
            }
        }
        
        return lyrics.sort((a, b) => a.time - b.time);
    },
    
    addImportHistory(type, data) {
        const history = {
            type,
            data,
            time: new Date().toLocaleTimeString()
        };
        
        this.state.importHistory.unshift(history);
        if (this.state.importHistory.length > 50) {
            this.state.importHistory.pop();
        }
        
        this.updateHistoryList();
        this.saveData();
    },
    
    // ==================== 工具函数 ====================
    showToast(message, type = 'info') {
        const toast = document.getElementById('status-toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `status-toast ${type}`;
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    },
    
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 忽略输入框中的按键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Alt + 快捷键
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'p':
                        e.preventDefault();
                        this.togglePlay();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.next();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.prev();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.toggleMinimize();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.togglePureMode();
                        break;
                    case ',':
                        e.preventDefault();
                        if (this.state.audio) {
                            this.state.audio.volume = Math.max(0, this.state.audio.volume - 0.1);
                            this.showToast(`音量: ${Math.round(this.state.audio.volume * 100)}%`);
                        }
                        break;
                    case '.':
                        e.preventDefault();
                        if (this.state.audio) {
                            this.state.audio.volume = Math.min(1, this.state.audio.volume + 0.1);
                            this.showToast(`音量: ${Math.round(this.state.audio.volume * 100)}%`);
                        }
                        break;
                    case '?':
                        e.preventDefault();
                        alert(`快捷键帮助：
Alt + P: 播放/暂停
Alt + N: 下一首
Alt + B: 上一首
Alt + M: 最小化/最大化
Alt + L: 切换纯享模式
Alt + ,: 减小音量
Alt + .: 增加音量`);
                        break;
                }
            }
            
            // 空格键播放/暂停
            if (e.code === 'Space' && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && activeElement.tagName !== 'BUTTON') {
                    e.preventDefault();
                    this.togglePlay();
                }
            }
        });
    },
    
    // ==================== 清理函数 ====================
    cleanup() {
        // 暂停音频
        if (this.state.audio) {
            this.state.audio.pause();
            this.state.audio.src = '';
        }
        
        // 移除事件监听器
        document.removeEventListener('keydown', this.keyboardHandler);
        
        // 清理DOM
        const container = document.getElementById('music-player-container');
        if (container) {
            container.innerHTML = '';
        }
        
        console.log('🎵 音乐播放器扩展已清理');
    }
};

// 导出到全局
window.MusicPlayerApp = MusicPlayerApp;

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => MusicPlayerApp.init(), 100);
    });
} else {
    setTimeout(() => MusicPlayerApp.init(), 100);
}
