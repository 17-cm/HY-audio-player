// ==================== 第三方API服务声明 ====================
//    网易云音乐解析调用API。
//    项目地址: https://github.com/Suxiaoqinx/Netease_url
//    许可证: MIT License
//    用途: 解析网易云歌曲链接、获取播放地址、歌词等
// =========================================================
(function() {
    'use strict';
    
    // ============================================
    // 模块1：环境检测与父窗口获取
    // ============================================
    let targetDoc = document;
    let targetWindow = window;
    
    // 检测是否在iframe中运行
    try {
        if (window.parent && window.parent.document && window.parent !== window) {
            targetDoc = window.parent.document;
            targetWindow = window.parent;
        }
    } catch (e) {
        console.log('无法访问父窗口，在当前窗口运行');
    }
    
    // 清理旧版本
    const cleanOldVersions = () => {
        const oldRoot = targetDoc.getElementById('audio-player-root');
        const oldIcon = targetDoc.getElementById('audio-player-icon');
        const oldStatus = targetDoc.getElementById('audio-player-status');
        if (oldRoot) oldRoot.remove();
        if (oldIcon) oldIcon.remove();
        if (oldStatus) oldStatus.remove();
    };
    cleanOldVersions();
    
    // ============================================
    // 模块2：设备感知与响应式配置
    // ============================================
    const DeviceDetector = {
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        screenWidth: 0,
        screenHeight: 0,
        hasTouch: false,
        
        init() {
            this.screenWidth = targetWindow.innerWidth;
            this.screenHeight = targetWindow.innerHeight;
            this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // 设备类型判断
            if (this.screenWidth < 768) {
                this.isMobile = true;
                this.scaleFactor = 0.7;
            } else if (this.screenWidth < 1024) {
                this.isTablet = true;
                this.scaleFactor = 0.85;
            } else {
                this.isDesktop = true;
                this.scaleFactor = 1.0;
            }
            
            // 默认位置（根据设备类型）
            if (this.isMobile) {
                this.defaultPlayerPos = { x: 20, y: this.screenHeight - 200 };
                this.defaultIconPos = { x: 20, y: this.screenHeight - 120 };
            } else {
                this.defaultPlayerPos = { x: this.screenWidth - 420, y: 100 };
                this.defaultIconPos = { x: this.screenWidth - 320, y: 100 };
            }
            
            console.log(`设备检测: ${this.isMobile ? '手机' : this.isTablet ? '平板' : '电脑'}, 缩放: ${this.scaleFactor}`);
        },
        
        // 获取响应式尺寸
        getResponsiveSize(baseSize) {
            return Math.round(baseSize * this.scaleFactor);
        },
        
        // 检查位置是否在屏幕内
        validatePosition(pos) {
            const maxX = this.screenWidth - 100;
            const maxY = this.screenHeight - 100;
            return {
                x: Math.max(20, Math.min(pos.x, maxX)),
                y: Math.max(20, Math.min(pos.y, maxY))
            };
        }
    };
    DeviceDetector.init();
    
    // ============================================
    // 模块3：CSS可自定义变量
    // ============================================
    const CSSVariables = {
        // 用户可修改的变量（通过CSS注入）
        variables: `
            :root {
                /* 播放器基础 */
                --audio-player-bg: #1a1a1a;
                --audio-player-text: #ffffff;
                --audio-player-width: ${DeviceDetector.getResponsiveSize(400)}px;
                --audio-player-height: ${DeviceDetector.getResponsiveSize(160)}px;
                --audio-player-radius: 30px;
                --audio-player-shadow: 0 20px 50px rgba(0,0,0,0.5);
                
                /* 频谱设置 */
                --spectrum-bar-count: 34;
                --spectrum-bar-width: 6px;
                --spectrum-bar-mid-height: ${DeviceDetector.getResponsiveSize(125)}px;
                --spectrum-bar-side-height: ${DeviceDetector.getResponsiveSize(90)}px;
                --spectrum-bar-spacing: 3px;
                --spectrum-bar-radius: 3px;
                
                /* 星星设置 */
                --star-count: 34;
                --star-size: ${DeviceDetector.getResponsiveSize(16)}px;
                --star-blur: 8px;
                --star-scale-min: 0.9;
                --star-scale-max: 1.1;
                
                /* 歌词设置 */
                --lyric-color: #ffffff;
                --lyric-active-color: #00d2ff;
                --lyric-font-size: 14px;
                --lyric-active-font-size: 22px;
                
                /* 磨砂玻璃 */
                --glass-opacity: 0.6;
                --glass-blur: 20px;
                
                /* RGB模式 */
                --rgb-single-color: #00d2ff;
                --rgb-animation-speed: 2s;
                
                /* 纯享模式 */
                --pure-mode-size: 400px;
                --pure-mode-bg: #1a1a1a;
                
                /* 响应式覆盖 */
                --mobile-scale: 0.7;
                --tablet-scale: 0.85;
            }
            
            /* 移动端覆盖 */
            @media (max-width: 767px) {
                :root {
                    --audio-player-width: ${DeviceDetector.getResponsiveSize(350)}px;
                    --audio-player-height: ${DeviceDetector.getResponsiveSize(140)}px;
                    --spectrum-bar-mid-height: ${DeviceDetector.getResponsiveSize(100)}px;
                    --spectrum-bar-side-height: ${DeviceDetector.getResponsiveSize(70)}px;
                    --star-size: ${DeviceDetector.getResponsiveSize(14)}px;
                    --lyric-font-size: 12px;
                    --lyric-active-font-size: 18px;
                }
            }
        `,
        
        // 注入CSS变量
        inject() {
            const style = targetDoc.createElement('style');
            style.id = 'audio-player-css-variables';
            style.textContent = this.variables;
            targetDoc.head.appendChild(style);
        }
    };
    
    // ============================================
    // 模块4：色谱加载器
    // ============================================
    class ColorLoader {
        constructor() {
            this.colorWheelURL = 'https://gist.githubusercontent.com/17-cm/d749da38d885dddc66777a0266d029e5/raw/71d6e336a93e31a28a9982c0a840018af53d52f3/color-wheel.html';
            this.rainbowColors = [];
            this.colorIndex = 0;
            this.isLoading = false;
        }
        
        async loadRainbowColors(count = 34) {
            return new Promise((resolve) => {
                if (this.rainbowColors.length > 0) {
                    resolve(this.rainbowColors);
                    return;
                }
                
                const callbackName = 'colorCallback_' + Date.now();
                window[callbackName] = (data) => {
                    if (data && data.success && data.colors) {
                        this.rainbowColors = data.colors.slice(0, count);
                    } else {
                        this.rainbowColors = this.generateLocalColors(count);
                    }
                    delete window[callbackName];
                    resolve(this.rainbowColors);
                };
                
                const script = targetDoc.createElement('script');
                script.src = `${this.colorWheelURL}?mode=flow&count=${count}&callback=${callbackName}`;
                script.onerror = () => {
                    this.rainbowColors = this.generateLocalColors(count);
                    resolve(this.rainbowColors);
                };
                targetDoc.head.appendChild(script);
            });
        }
        
        generateLocalColors(count) {
            const colors = [];
            for (let i = 0; i < count; i++) {
                const hue = (i / count) * 360;
                colors.push(`hsl(${hue}, 100%, 50%)`);
            }
            return colors;
        }
        
        getNextColor() {
            if (this.rainbowColors.length === 0) return '#00d2ff';
            const color = this.rainbowColors[this.colorIndex];
            this.colorIndex = (this.colorIndex + 1) % this.rainbowColors.length;
            return color;
        }
        
        getColorByIndex(index) {
            if (this.rainbowColors.length === 0) {
                const hue = (index / 34) * 360;
                return `hsl(${hue}, 100%, 50%)`;
            }
            return this.rainbowColors[index % this.rainbowColors.length];
        }
    }
    
    // ============================================
    // 模块5：频谱可视化（三行新设计）
    // ============================================
    class SpectrumVisualizer {
        constructor() {
            this.bars = []; // 68根音频条
            this.stars = []; // 34个星星
            this.audioContext = null;
            this.analyser = null;
            this.dataArray = null;
            this.source = null;
            this.animationId = null;
            this.colorLoader = new ColorLoader();
            
            this.config = {
                barCount: 34,
                starCount: 34,
                barWidth: 6,
                midHeight: DeviceDetector.getResponsiveSize(125),
                sideHeight: DeviceDetector.getResponsiveSize(90),
                spacing: 3
            };
        }
        
        async init(audioElement, container) {
            await this.colorLoader.loadRainbowColors(this.config.barCount);
            this.createSpectrumUI(container);
            this.initAudioAnalyser(audioElement);
        }
        
        createSpectrumUI(container) {
            container.innerHTML = '';
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                gap: 2px;
            `;
            
            // 创建三行容器
            const topBars = document.createElement('div');
            const middleStars = document.createElement('div');
            const bottomBars = document.createElement('div');
            
            [topBars, middleStars, bottomBars].forEach(row => {
                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: ${this.config.spacing}px;
                    height: ${this.config.midHeight}px;
                `;
            });
            
            // 创建音频条（上下两行，每行34根）
            this.bars = [];
            for (let i = 0; i < this.config.barCount * 2; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-player-spectrum-bar';
                bar.style.cssText = `
                    width: ${this.config.barWidth}px;
                    height: 2px;
                    background: currentColor;
                    border-radius: ${this.config.barWidth / 2}px;
                    transition: height 0.15s ease-out;
                    opacity: 0.7;
                `;
                
                // 添加到对应行
                if (i < this.config.barCount) {
                    topBars.appendChild(bar);
                } else {
                    bottomBars.appendChild(bar);
                }
                this.bars.push(bar);
            }
            
            // 创建星星（中间行，34个）
            this.stars = [];
            for (let i = 0; i < this.config.starCount; i++) {
                const star = document.createElement('div');
                star.className = 'audio-player-star';
                star.innerHTML = '✦';
                star.style.cssText = `
                    font-size: ${DeviceDetector.getResponsiveSize(16)}px;
                    color: #000;
                    opacity: 0;
                    transition: all 0.3s;
                    text-shadow: 0 0 5px currentColor;
                    display: inline-block;
                `;
                middleStars.appendChild(star);
                this.stars.push(star);
            }
            
            container.appendChild(topBars);
            container.appendChild(middleStars);
            container.appendChild(bottomBars);
        }
        
        initAudioAnalyser(audioElement) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                this.analyser.smoothingTimeConstant = 0.8;
                
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
                
                this.source = this.audioContext.createMediaElementSource(audioElement);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                console.log('音频分析器初始化成功');
            } catch (error) {
                console.warn('音频分析器初始化失败，使用模拟模式');
                this.useSimulationMode();
            }
        }
        
        useSimulationMode() {
            this.dataArray = new Uint8Array(this.config.barCount);
            let simulationIndex = 0;
            setInterval(() => {
                for (let i = 0; i < this.config.barCount; i++) {
                    const wave = Math.sin((i + simulationIndex) * 0.3) * 0.5 + 0.5;
                    const random = Math.random() * 0.3;
                    this.dataArray[i] = Math.floor((wave + random) * 128);
                }
                simulationIndex++;
            }, 100);
        }
        
        start() {
            if (this.animationId) return;
            const animate = () => {
                this.updateSpectrum();
                this.animationId = requestAnimationFrame(animate);
            };
            animate();
            
            // 显示星星
            this.stars.forEach(star => {
                star.style.opacity = '0.8';
            });
        }
        
        stop() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            this.stars.forEach(star => {
                star.style.opacity = '0';
            });
            
            this.bars.forEach(bar => {
                bar.style.height = '2px';
            });
        }
        
        updateSpectrum() {
            if (!this.bars.length) return;
            
            // 获取频率数据
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
            }
            
            this.applyColors();
            this.updateBarHeights();
            this.updateStars();
        }
        
        applyColors() {
            const isRainbowMode = App.state.rgbMode === 2;
            
            // 更新音频条颜色
            this.bars.forEach((bar, index) => {
                if (isRainbowMode) {
                    const colorIndex = index % this.config.barCount;
                    const color = this.colorLoader.getColorByIndex(colorIndex);
                    bar.style.color = color;
                    bar.style.background = color;
                } else if (App.state.rgbMode === 1) {
                    bar.style.color = App.state.cfg.rgbColor;
                    bar.style.background = App.state.cfg.rgbColor;
                } else {
                    bar.style.color = '#000000';
                    bar.style.background = '#000000';
                }
            });
            
            // 更新星星颜色
            const starColor = isRainbowMode ? 
                this.colorLoader.getNextColor() : 
                (App.state.rgbMode === 1 ? App.state.cfg.rgbColor : '#000000');
            
            this.stars.forEach(star => {
                star.style.color = starColor;
            });
        }
        
        updateBarHeights() {
            if (!this.dataArray || this.dataArray.length === 0) return;
            
            const dataStep = Math.floor(this.dataArray.length / this.config.barCount);
            
            this.bars.forEach((bar, index) => {
                const barIndex = index % this.config.barCount;
                let value;
                
                if (this.dataArray.length >= this.config.barCount) {
                    const dataIndex = Math.min(barIndex * dataStep, this.dataArray.length - 1);
                    value = this.dataArray[dataIndex];
                } else {
                    value = this.dataArray[barIndex % this.dataArray.length] || 0;
                }
                
                // 计算高度（区分中间和两侧）
                let maxHeight = this.config.midHeight;
                if (barIndex < 5 || barIndex >= this.config.barCount - 5) {
                    maxHeight = this.config.sideHeight;
                }
                
                const normalizedValue = value / 256;
                const targetHeight = 2 + normalizedValue * (maxHeight - 2);
                
                // 平滑过渡
                const currentHeight = parseFloat(bar.style.height) || 2;
                const newHeight = currentHeight + (targetHeight - currentHeight) * 0.15;
                
                bar.style.height = `${newHeight}px`;
                bar.style.opacity = 0.6 + normalizedValue * 0.4;
            });
        }
        
        updateStars() {
            if (!this.dataArray || this.stars.length === 0) return;
            
            // 计算平均音量用于星星动画
            let sum = 0;
            for (let i = 0; i < Math.min(this.dataArray.length, 10); i++) {
                sum += this.dataArray[i];
            }
            const avgVolume = sum / Math.min(this.dataArray.length, 10) / 256;
            
            this.stars.forEach((star, index) => {
                // 独立闪烁动画
                const time = Date.now() / 1000;
                const individualOffset = index * 0.3;
                const blink = Math.sin(time * 2 + individualOffset) * 0.3 + 0.7;
                
                // 音量影响
                const volumeScale = 0.9 + avgVolume * 0.2;
                
                // 组合效果
                const scale = volumeScale * (0.9 + blink * 0.2);
                const opacity = 0.5 + avgVolume * 0.3 + blink * 0.2;
                
                star.style.transform = `scale(${scale})`;
                star.style.opacity = `${opacity}`;
            });
        }
        
        destroy() {
            this.stop();
            if (this.source) this.source.disconnect();
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        }
    }
    
    // ============================================
    // 模块6：主播放器应用
    // ============================================
    const defaultConfig = {
        cover: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=500',
        coverWidth: 80,
        coverHeight: 80,
        
        expandedBg: '#1a1a1a',
        collapsedBg: '#1a1a1a',
        pureModeBg: '#1a1a1a',
        
        vinylBg: '',
        borderColor: '#333333',
        borderWidth: '6px',
        themeColor: '#ffffff',
        rgbColor: '#00d2ff',
        glassAlpha: 0.6,
        playerWidth: DeviceDetector.getResponsiveSize(400) + 'px',
        playerHeight: DeviceDetector.getResponsiveSize(160) + 'px',
        
        lyricColor: '#ffffff',
        lyricActiveColor: '#00d2ff',
        
        pos: DeviceDetector.defaultPlayerPos
    };
    
    const App = {
        playlist: [],
        index: -1,
        audio: new Audio(),
        spectrum: null,
        colorLoader: new ColorLoader(),
        
        state: {
            playMode: 0,
            rgbMode: 0,
            glass: true,
            glassOpacity: 0.6,
            speed: 1.0,
            panel: false,
            isMinimized: false,
            isPlaying: false,
            isPureMode: false,
            pureModeSize: 400,
            lyrics: [],
            currentLyricIndex: -1,
            cfg: { ...defaultConfig },
            playerPos: DeviceDetector.defaultPlayerPos,
            iconPos: DeviceDetector.defaultIconPos,
            importHistory: []
        },
        
        drag: { active: false, offX: 0, offY: 0 },
        
        init() {
            this.injectCSS();
            this.createUI();
            this.loadData();
            this.bindEvents();
            this.initSpectrum();
            console.log('音乐播放器 3.0 启动 - 作者: hy禾一');
        },
        
        async initSpectrum() {
            this.spectrum = new SpectrumVisualizer();
            const icon = targetDoc.getElementById('audio-player-icon');
            if (!icon) {
                setTimeout(() => this.initSpectrum(), 500);
                return;
            }
            
            const waveBox = icon.querySelector('.wave-box');
            if (waveBox) {
                await this.spectrum.init(this.audio, waveBox);
                
                this.audio.onplay = () => {
                    this.state.isPlaying = true;
                    targetDoc.getElementById('btn-play').innerText = '❚❚';
                    this.updateView();
                    if (this.spectrum) this.spectrum.start();
                };
                
                this.audio.onpause = () => {
                    this.state.isPlaying = false;
                    targetDoc.getElementById('btn-play').innerText = '▶';
                    this.updateView();
                    if (this.spectrum) this.spectrum.stop();
                };
                
                this.audio.onended = () => this.next();
            }
        },
        
        loadData() {
            const raw = localStorage.getItem('audio_player_data');
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    this.playlist = data.playlist || [];
                    if (data.state) {
                        Object.assign(this.state, data.state);
                        this.state.cfg = { ...defaultConfig, ...data.state.cfg };
                        
                        // 验证并修正位置
                        this.state.playerPos = DeviceDetector.validatePosition(this.state.playerPos);
                        this.state.iconPos = DeviceDetector.validatePosition(this.state.iconPos);
                    }
                } catch (e) {
                    console.error('加载数据失败:', e);
                }
            }
            
            this.state.panel = false;
            this.updateView();
            this.renderList();
        },
        
        saveData() {
            localStorage.setItem('audio_player_data', JSON.stringify({
                playlist: this.playlist,
                state: this.state
            }));
        },
        
        showStatus(message, type = 'info', duration = 3000) {
            let statusEl = targetDoc.getElementById('audio-player-status');
            if (!statusEl) {
                statusEl = targetDoc.createElement('div');
                statusEl.id = 'audio-player-status';
                statusEl.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #00d2ff;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 20px;
                    z-index: 2147483647;
                    font-size: 14px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                `;
                targetDoc.body.appendChild(statusEl);
            }
            
            statusEl.textContent = message;
            statusEl.className = `status-${type}`;
            statusEl.style.opacity = '1';
            
            clearTimeout(this.statusTimer);
            this.statusTimer = setTimeout(() => {
                statusEl.style.opacity = '0';
            }, duration);
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
        
        createFileInput(accept, callback) {
            const input = targetDoc.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            input.onchange = (e) => {
                if (e.target.files[0]) callback(e.target.files[0]);
                input.remove();
            };
            targetDoc.body.appendChild(input);
            input.click();
        },
        
        updateView() {
            const root = targetDoc.getElementById('audio-player-root');
            const icon = targetDoc.getElementById('audio-player-icon');
            const cfg = this.state.cfg;
            
            // 更新位置
            root.style.left = this.state.playerPos.x + 'px';
            root.style.top = this.state.playerPos.y + 'px';
            icon.style.left = this.state.iconPos.x + 'px';
            icon.style.top = this.state.iconPos.y + 'px';
            
            // 更新CSS变量
            root.style.setProperty('--rgb-single', cfg.rgbColor);
            root.style.width = cfg.playerWidth;
            root.style.height = cfg.playerHeight;
            
            // 磨砂玻璃效果修复
            const inner = targetDoc.getElementById('root-inner');
            let currentBg = this.state.panel ? cfg.expandedBg : cfg.collapsedBg;
            
            if (this.state.glass) {
                inner.classList.add('glass-mode');
                if (currentBg.startsWith('#')) {
                    const hex = currentBg;
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    inner.style.background = `rgba(${r}, ${g}, ${b}, ${this.state.glassOpacity})`;
                } else if (currentBg.startsWith('url')) {
                    inner.style.background = `${currentBg}, rgba(0, 0, 0, ${1 - this.state.glassOpacity})`;
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
            
            // 纯享模式
            root.classList.toggle('pure-mode', this.state.isPureMode);
            if (this.state.isPureMode) {
                const pureContainer = targetDoc.getElementById('pure-lyrics-container');
                if (pureContainer) {
                    pureContainer.style.width = this.state.pureModeSize + 'px';
                    pureContainer.style.height = this.state.pureModeSize + 'px';
                    pureContainer.style.background = cfg.pureModeBg;
                }
            }
            
            // 更新歌词颜色
            const lyricsElement = targetDoc.getElementById('audio-player-lyrics');
            if (lyricsElement) {
                lyricsElement.style.color = cfg.lyricColor;
            }
            
            this.updateSettingsPanel();
        },
        
        updateSettingsPanel() {
            const cfg = this.state.cfg;
            
            // 基础设置
            targetDoc.getElementById('inp-theme').value = cfg.themeColor;
            targetDoc.getElementById('inp-border').value = cfg.borderColor;
            targetDoc.getElementById('inp-rgb').value = cfg.rgbColor;
            targetDoc.getElementById('inp-lyric-color').value = cfg.lyricColor;
            targetDoc.getElementById('inp-lyric-active-color').value = cfg.lyricActiveColor;
            
            // 背景设置
            targetDoc.getElementById('inp-expanded-col').value = cfg.expandedBg.startsWith('#') ? cfg.expandedBg : '#1a1a1a';
            targetDoc.getElementById('inp-collapsed-col').value = cfg.collapsedBg.startsWith('#') ? cfg.collapsedBg : '#1a1a1a';
            targetDoc.getElementById('inp-pure-bg').value = cfg.pureModeBg.startsWith('#') ? cfg.pureModeBg : '#1a1a1a';
            
            // 磨砂玻璃
            targetDoc.getElementById('sw-glass').checked = this.state.glass;
            targetDoc.getElementById('inp-glass-opacity').value = Math.round(this.state.glassOpacity * 100);
            targetDoc.getElementById('val-glass-opacity').innerText = Math.round(this.state.glassOpacity * 100) + '%';
            
            // 纯享模式
            targetDoc.getElementById('inp-pure-size').value = this.state.pureModeSize;
            targetDoc.getElementById('val-pure-size').innerText = this.state.pureModeSize + 'px';
            
            // 播放设置
            targetDoc.getElementById('inp-speed').value = this.state.speed;
            targetDoc.getElementById('val-speed').innerText = this.state.speed + 'x';
            
            // RGB模式
            const rgbOpts = targetDoc.querySelectorAll('.rgb-opt');
            rgbOpts.forEach(opt => {
                opt.classList.toggle('active', parseInt(opt.dataset.val) === this.state.rgbMode);
            });
        },
        
        // 歌词相关方法
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
        
        updateLyrics() {
            if (!this.state.lyrics.length) {
                targetDoc.getElementById('audio-player-lyrics').innerText = '⋆……𖦤……⋆';
                return;
            }
            
            const time = this.audio.currentTime;
            let currentLine = '';
            let currentIndex = -1;
            
            for (let i = 0; i < this.state.lyrics.length; i++) {
                if (time >= this.state.lyrics[i].time) {
                    currentLine = this.state.lyrics[i].text;
                    currentIndex = i;
                } else {
                    break;
                }
            }
            
            const lyricsElement = targetDoc.getElementById('audio-player-lyrics');
            lyricsElement.innerText = currentLine || '⋆……𖦤……⋆';
            
            // 纯享模式歌词更新
            if (this.state.isPureMode && currentIndex !== this.state.currentLyricIndex) {
                this.state.currentLyricIndex = currentIndex;
                this.renderPureLyrics(currentIndex);
            }
        },
        
        renderPureLyrics(currentIndex) {
            const container = targetDoc.getElementById('pure-lyrics-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            const start = Math.max(0, currentIndex - 2);
            const end = Math.min(this.state.lyrics.length, currentIndex + 3);
            
            for (let i = start; i < end; i++) {
                const line = targetDoc.createElement('div');
                line.className = 'pure-lyric-line';
                line.innerText = this.state.lyrics[i].text;
                
                if (i === currentIndex) {
                    line.classList.add('active');
                    line.style.color = this.state.cfg.lyricActiveColor;
                    line.style.fontWeight = 'bold';
                    line.style.fontSize = '22px';
                } else if (i < currentIndex) {
                    line.classList.add('passed');
                    line.style.opacity = '0.4';
                } else {
                    line.style.opacity = '0.7';
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
            
            // 修复音频播放问题
            this.audio.play().catch(e => {
                console.error('播放失败:', e);
                this.showStatus('播放失败: ' + e.message, 'error');
            });
            
            this.state.lyrics = this.playlist[i].lyrics ? this.parseLyrics(this.playlist[i].lyrics) : [];
            this.state.currentLyricIndex = -1;
            this.updateView();
            this.renderList();
        },
        
        toggle() {
            if (!this.playlist.length) return this.showAddOptions();
            
            if (this.audio.paused) {
                if (this.index === -1) {
                    this.play(0);
                } else {
                    this.audio.play().catch(e => {
                        console.error('播放失败:', e);
                    });
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
        
        // 网易云相关方法
        isNeteaseLink(url) {
            return url.includes('music.163.com') || url.includes('163cn.tv') || url.includes('y.music.163.com');
        },
        
        async fetchNeteaseSongInfo(link) {
            try {
                this.showStatus('正在解析链接...', 'info');
                
                const detailResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/detail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: link })
                });
                
                if (!detailResponse.ok) throw new Error('获取歌曲信息失败');
                const detailData = await detailResponse.json();
                if (detailData.code !== 200) throw new Error(detailData.msg || 'API返回错误');
                
                const songInfo = detailData.data;
                const urlResponse = await fetch('https://wyapi-1.toubiec.cn/api/music/url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: link, level: 'exhigh' })
                });
                
                if (!urlResponse.ok) throw new Error('获取播放链接失败');
                const urlData = await urlResponse.json();
                if (urlData.code !== 200) throw new Error(urlData.msg || '获取播放链接失败');
                
                // 获取歌词
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
                    console.warn('歌词获取失败:', e);
                }
                
                // 解析播放链接
                let playUrl = '';
                if (urlData.data && Array.isArray(urlData.data) && urlData.data[0]) {
                    playUrl = urlData.data[0].url || '';
                }
                if (!playUrl) throw new Error('无法获取播放链接');
                
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
        
        showAddOptions() {
            const overlay = targetDoc.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.innerHTML = `
                <div class="dialog">
                    <div class="dialog-title">添加歌曲</div>
                    <div class="dialog-buttons">
                        <button id="add-single-btn">
                            <div class="button-icon">🎵</div>
                            <div class="button-text">添加单曲</div>
                        </button>
                        <button id="add-playlist-btn">
                            <div class="button-icon">📋</div>
                            <div class="button-text">添加歌单</div>
                        </button>
                    </div>
                    <button id="add-cancel-btn" class="cancel-btn">取消</button>
                </div>
            `;
            targetDoc.body.appendChild(overlay);
            
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
        
        // 其他方法（renderList, bindEvents等）保持原有逻辑
        renderList() {
            const list = targetDoc.getElementById('list-box');
            if (!list) return;
            
            list.innerHTML = '';
            this.playlist.forEach((t, i) => {
                const item = targetDoc.createElement('div');
                item.className = `list-item ${i === this.index ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="item-info"><b>${t.title} - ${t.artist}</b></div>
                    <div class="item-buttons">
                        <button class="btn-lyrics">歌词</button>
                        <button class="btn-delete">×</button>
                    </div>
                `;
                item.querySelector('.item-info').onclick = () => this.play(i);
                item.querySelector('.btn-delete').onclick = () => this.delSong(i);
                item.querySelector('.btn-lyrics').onclick = () => this.showLyricsDialog(i);
                list.appendChild(item);
            });
        },
        
        delSong(i) {
            if (!confirm('确定删除这首歌曲吗？')) return;
            this.playlist.splice(i, 1);
            this.saveData();
            this.renderList();
            if (i === this.index) {
                this.audio.pause();
                this.index = -1;
                this.updateView();
            }
        },
        
        showLyricsDialog(i) {
            const overlay = targetDoc.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.innerHTML = `
                <div class="dialog">
                    <div class="dialog-title">歌词设置</div>
                    <div class="dialog-buttons">
                        <button id="lyrics-paste-btn">粘贴歌词</button>
                        <button id="lyrics-import-btn">导入文件</button>
                    </div>
                    <button id="lyrics-cancel-btn" class="cancel-btn">取消</button>
                </div>
            `;
            targetDoc.body.appendChild(overlay);
            
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
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.playlist[i].lyrics = e.target.result;
                        if (i === this.index) {
                            this.state.lyrics = this.parseLyrics(e.target.result);
                            this.state.currentLyricIndex = -1;
                        }
                        this.saveData();
                        this.showStatus('歌词导入成功！', 'success');
                    };
                    reader.readAsText(file);
                });
            };
            
            overlay.querySelector('#lyrics-cancel-btn').onclick = () => {
                overlay.remove();
            };
            
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        },
        
        // UI创建
        createUI() {
            // 创建图标界面
            const icon = targetDoc.createElement('div');
            icon.id = 'audio-player-icon';
            icon.innerHTML = `
                <div class="icon-left-zone">
                    <div class="zone-hint">拖拽</div>
                </div>
                <div class="wave-box"></div>
                <div class="base-line"></div>
                <div class="icon-right-zone">
                    <div class="zone-hint">双击</div>
                </div>
            `;
            targetDoc.body.appendChild(icon);
            
            // 创建主播放器
            const root = targetDoc.createElement('div');
            root.id = 'audio-player-root';
            root.innerHTML = `
                <div id="root-rgb" class="rgb-layer"></div>
                <div id="audio-player-island"></div>
                <div id="root-inner" class="inner-content">
                    <div id="audio-player-main-content">
                        <div class="main">
                            <div id="audio-player-cover"></div>
                            <div class="center">
                                <div class="meta">
                                    <div id="audio-player-title">可网易云直链</div>
                                    <div id="audio-player-artist">按钮使用教程看备注-hy</div>
                                </div>
                                <div id="audio-player-lyrics">⋆……𖦤……⋆</div>
                                <div class="progress-wrap">
                                    <input type="range" id="audio-player-progress" value="0" min="0" max="100">
                                </div>
                                <div class="controls">
                                    <button id="btn-mode"></button>
                                    <button id="btn-prev">⏮</button>
                                    <button id="btn-play">▶</button>
                                    <button id="btn-next">⏭</button>
                                    <button id="btn-list">☰</button>
                                </div>
                            </div>
                            <div class="right">
                                <button id="btn-min" title="最小化">𓆝</button>
                                <button id="btn-set" title="设置">♡</button>
                                <button id="btn-pure" title="纯享模式">𓆟</button>
                            </div>
                        </div>
                        
                        <div id="panel-settings" class="panel">
                            <div class="section-title">播放设置</div>
                            <div class="setting-row">
                                <span>倍速 <b id="val-speed">1.0x</b></span>
                                <input id="inp-speed" type="range" min="0.5" max="2.0" step="0.1">
                            </div>
                            
                            <div class="section-title">背景设置</div>
                            <div class="setting-row">
                                <span>全屏背景</span>
                                <div class="bg-control">
                                    <input id="inp-expanded-col" type="color">
                                    <button id="btn-expanded-import" class="import-btn">导入</button>
                                </div>
                            </div>
                            <div class="setting-row">
                                <span>窄屏背景</span>
                                <div class="bg-control">
                                    <input id="inp-collapsed-col" type="color">
                                    <button id="btn-collapsed-import" class="import-btn">导入</button>
                                </div>
                            </div>
                            
                            <div class="section-title">纯享模式设置</div>
                            <div class="setting-row">
                                <span>尺寸 <b id="val-pure-size">400px</b></span>
                                <input id="inp-pure-size" type="range" min="200" max="600" step="10">
                            </div>
                            <div class="setting-row">
                                <span>背景颜色</span>
                                <div class="bg-control">
                                    <input id="inp-pure-bg" type="color">
                                    <button id="btn-pure-import" class="import-btn">导入</button>
                                </div>
                            </div>
                            
                            <div class="section-title">封面设置</div>
                            <div class="setting-row">
                                <span>封面图片</span>
                                <button id="btn-cover-import" class="import-btn">导入</button>
                            </div>
                            
                            <div class="section-title">RGB模式</div>
                            <div class="setting-row">
                                <span>灯光模式</span>
                                <div class="option-group">
                                    <div class="rgb-opt" data-val="0">关</div>
                                    <div class="rgb-opt" data-val="1">单色</div>
                                    <div class="rgb-opt" data-val="2">幻彩</div>
                                </div>
                            </div>
                            <div class="setting-row">
                                <span>单色颜色</span>
                                <input id="inp-rgb" type="color">
                            </div>
                            
                            <div class="section-title">歌词颜色</div>
                            <div class="setting-row">
                                <span>普通颜色</span>
                                <input id="inp-lyric-color" type="color">
                            </div>
                            <div class="setting-row">
                                <span>激活颜色</span>
                                <input id="inp-lyric-active-color" type="color">
                            </div>
                            
                            <div class="section-title">磨砂玻璃设置</div>
                            <div class="setting-row">
                                <span>启用磨砂效果</span>
                                <input id="sw-glass" type="checkbox" checked>
                            </div>
                            <div class="setting-row">
                                <span>透明度 <b id="val-glass-opacity">60%</b></span>
                                <input id="inp-glass-opacity" type="range" min="10" max="90" value="60">
                            </div>
                            
                            <div class="section-title">颜色设置</div>
                            <div class="setting-row">
                                <span>字体颜色</span>
                                <input id="inp-theme" type="color">
                            </div>
                            <div class="setting-row">
                                <span>边框色</span>
                                <input id="inp-border" type="color">
                            </div>
                        </div>
                        
                        <div id="panel-list" class="panel">
                            <div id="list-box"></div>
                            <button id="btn-add" class="add-btn">+ 添加歌曲</button>
                        </div>
                        
                        <div id="panel-history" class="panel">
                            <div class="section-title">导入历史</div>
                            <div id="history-list" class="history-list"></div>
                        </div>
                    </div>
                    
                    <div id="audio-player-pure-mode">
                        <div id="pure-lyrics-container"></div>
                    </div>
                </div>
            `;
            targetDoc.body.appendChild(root);
            
            // 初始化显示
            this.updateView();
        },
        
        bindEvents() {
            const root = targetDoc.getElementById('audio-player-root');
            const icon = targetDoc.getElementById('audio-player-icon');
            const island = targetDoc.getElementById('audio-player-island');
            
            // 拖拽功能
            const makeDraggable = (element, posKey) => {
                element.addEventListener('mousedown', startDrag);
                element.addEventListener('touchstart', startDrag, { passive: false });
                
                function startDrag(e) {
                    e.preventDefault();
                    App.drag.active = true;
                    const startX = e.clientX || e.touches[0].clientX;
                    const startY = e.clientY || e.touches[0].clientY;
                    App.drag.offX = startX - element.offsetLeft;
                    App.drag.offY = startY - element.offsetTop;
                    
                    function move(e) {
                        if (!App.drag.active) return;
                        e.preventDefault();
                        const x = (e.clientX || e.touches[0].clientX) - App.drag.offX;
                        const y = (e.clientY || e.touches[0].clientY) - App.drag.offY;
                        element.style.left = x + 'px';
                        element.style.top = y + 'px';
                        App.state[posKey] = { x, y };
                    }
                    
                    function end() {
                        App.drag.active = false;
                        App.saveData();
                        document.removeEventListener('mousemove', move);
                        document.removeEventListener('touchmove', move);
                        document.removeEventListener('mouseup', end);
                        document.removeEventListener('touchend', end);
                    }
                    
                    document.addEventListener('mousemove', move);
                    document.addEventListener('touchmove', move, { passive: false });
                    document.addEventListener('mouseup', end);
                    document.addEventListener('touchend', end);
                }
            };
            
            makeDraggable(root, 'playerPos');
            makeDraggable(icon, 'iconPos');
            
            // 双击展开
            let lastClickTime = 0;
            const handleDoubleClick = () => {
                const now = Date.now();
                if (now - lastClickTime < 300) {
                    App.state.isMinimized = false;
                    App.updateView();
                    App.saveData();
                    lastClickTime = 0;
                } else {
                    lastClickTime = now;
                }
            };
            
            icon.querySelector('.icon-right-zone').addEventListener('click', handleDoubleClick);
            
            // 按钮事件
            const bindClick = (id, fn) => {
                const el = targetDoc.getElementById(id);
                if (el) el.onclick = fn;
            };
            
            bindClick('btn-min', () => {
                App.state.isMinimized = true;
                App.updateView();
                App.saveData();
            });
            
            bindClick('btn-play', () => App.toggle());
            bindClick('btn-next', () => App.next());
            bindClick('btn-prev', () => App.prev());
            
            bindClick('btn-mode', () => {
                App.state.playMode = (App.state.playMode + 1) % 3;
                App.updateView();
                App.saveData();
            });
            
            bindClick('btn-set', () => App.togglePanel('settings'));
            bindClick('btn-list', () => App.togglePanel('list'));
            bindClick('btn-history', () => App.togglePanel('history'));
            bindClick('btn-add', () => App.showAddOptions());
            bindClick('btn-pure', () => App.togglePureMode());
            
            // 纯享模式点击
            targetDoc.getElementById('audio-player-pure-mode').onclick = () => App.togglePureMode();
            
            // 设置面板事件
            const bindInput = (id, key, isCfg = true) => {
                const el = targetDoc.getElementById(id);
                if (!el) return;
                
                el.oninput = (e) => {
                    if (isCfg) {
                        App.state.cfg[key] = e.target.value;
                    } else {
                        App.state[key] = e.target.value;
                    }
                    App.updateView();
                };
                
                el.onchange = () => App.saveData();
            };
            
            // 颜色设置
            bindInput('inp-theme', 'themeColor');
            bindInput('inp-border', 'borderColor');
            bindInput('inp-rgb', 'rgbColor');
            bindInput('inp-lyric-color', 'lyricColor');
            bindInput('inp-lyric-active-color', 'lyricActiveColor');
            
            // 背景颜色
            bindInput('inp-expanded-col', 'expandedBg');
            bindInput('inp-collapsed-col', 'collapsedBg');
            bindInput('inp-pure-bg', 'pureModeBg');
            
            // 纯享模式尺寸
            bindInput('inp-pure-size', 'pureModeSize', false);
            
            // 磨砂玻璃
            targetDoc.getElementById('sw-glass').onchange = (e) => {
                App.state.glass = e.target.checked;
                App.updateView();
                App.saveData();
            };
            
            bindInput('inp-glass-opacity', 'glassOpacity', false);
            
            // 播放速度
            bindInput('inp-speed', 'speed', false);
            
            // RGB模式选择
            targetDoc.querySelectorAll('.rgb-opt').forEach(opt => {
                opt.onclick = () => {
                    App.state.rgbMode = parseInt(opt.dataset.val);
                    App.updateView();
                    App.saveData();
                };
            });
            
            // 导入按钮
            const bindImport = (btnId, callback) => {
                bindClick(btnId, () => {
                    App.createFileInput('image/*', (file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => callback(e.target.result);
                        reader.readAsDataURL(file);
                    });
                });
            };
            
            bindImport('btn-cover-import', (url) => {
                App.state.cfg.cover = url;
                App.updateView();
                App.saveData();
            });
            
            bindImport('btn-expanded-import', (url) => {
                App.state.cfg.expandedBg = `url("${url}")`;
                App.updateView();
                App.saveData();
            });
            
            bindImport('btn-collapsed-import', (url) => {
                App.state.cfg.collapsedBg = `url("${url}")`;
                App.updateView();
                App.saveData();
            });
            
            bindImport('btn-pure-import', (url) => {
                App.state.cfg.pureModeBg = `url("${url}")`;
                App.updateView();
                App.saveData();
            });
            
            // 进度条
            const progress = targetDoc.getElementById('audio-player-progress');
            progress.oninput = (e) => {
                if (App.audio.duration) {
                    App.audio.currentTime = (e.target.value / 100) * App.audio.duration;
                }
            };
            
            // 音频事件
            App.audio.ontimeupdate = () => {
                if (App.audio.duration) {
                    progress.value = (App.audio.currentTime / App.audio.duration) * 100;
                }
                App.updateLyrics();
            };
        },
        
        togglePanel(type) {
            const root = targetDoc.getElementById('audio-player-root');
            const panels = ['settings', 'list', 'history'];
            
            if (this.state.panel === type) {
                root.classList.remove('expanded');
                panels.forEach(panel => {
                    const el = targetDoc.getElementById(`panel-${panel}`);
                    if (el) el.style.display = 'none';
                });
                this.state.panel = false;
            } else {
                root.classList.add('expanded');
                panels.forEach(panel => {
                    const el = targetDoc.getElementById(`panel-${panel}`);
                    if (el) el.style.display = panel === type ? 'flex' : 'none';
                });
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
        
        renderImportHistory() {
            const container = targetDoc.getElementById('history-list');
            if (!container) return;
            
            if (this.state.importHistory.length === 0) {
                container.innerHTML = '<div class="no-history">暂无导入历史</div>';
                return;
            }
            
            let html = '';
            this.state.importHistory.forEach(history => {
                if (history.type === 'single') {
                    html += `
                        <div class="history-item">
                            <div class="history-icon">🎵</div>
                            <div class="history-content">
                                <div class="history-title">${history.data.title}</div>
                                <div class="history-sub">${history.data.artist}</div>
                            </div>
                            <div class="history-time">${history.time}</div>
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
                            <div class="history-time">${history.time}</div>
                        </div>
                    `;
                }
            });
            
            container.innerHTML = html;
        },
        
        // CSS注入
        injectCSS() {
            CSSVariables.inject();
            
            const css = `
                /* 基础动画 */
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
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
                
                /* 播放器主体 */
                #audio-player-root {
                    position: fixed;
                    z-index: 2147483647;
                    width: var(--audio-player-width, 400px);
                    height: var(--audio-player-height, 160px);
                    border-radius: var(--audio-player-radius, 30px);
                    display: none;
                    flex-direction: column;
                    font-family: sans-serif;
                    box-shadow: var(--audio-player-shadow, 0 20px 50px rgba(0,0,0,0.5));
                    transition: all 0.3s;
                    pointer-events: auto;
                    --rgb-single: var(--rgb-single-color, #00d2ff);
                }
                
                #audio-player-root.expanded {
                    height: 520px !important;
                }
                
                #audio-player-root.pure-mode #audio-player-main-content {
                    display: none;
                }
                
                #audio-player-root.pure-mode #audio-player-pure-mode {
                    display: flex;
                }
                
                /* 纯享模式 */
                #audio-player-pure-mode {
                    display: none;
                    width: 100%;
                    height: 100%;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    box-sizing: border-box;
                    overflow: hidden;
                    cursor: pointer;
                    background: var(--pure-mode-bg, #1a1a1a);
                }
                
                #pure-lyrics-container {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.3s;
                }
                
                .pure-lyric-line {
                    font-size: var(--lyric-font-size, 14px);
                    color: var(--lyric-color, #ffffff);
                    transition: all 0.3s;
                    text-align: center;
                    line-height: 1.5;
                    opacity: 0.7;
                }
                
                .pure-lyric-line.active {
                    font-size: var(--lyric-active-font-size, 22px);
                    font-weight: bold;
                    color: var(--lyric-active-color, #00d2ff);
                    opacity: 1;
                    text-shadow: 0 0 10px currentColor;
                }
                
                .pure-lyric-line.passed {
                    opacity: 0.4;
                }
                
                /* 图标界面 */
                #audio-player-icon {
                    position: fixed;
                    z-index: 2147483647;
                    width: 300px;
                    height: 50px;
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    pointer-events: auto;
                    background: transparent;
                }
                
                .wave-box {
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    padding: 0 10px;
                    box-sizing: border-box;
                }
                
                .base-line {
                    width: 100%;
                    height: 2px;
                    background: #000;
                    margin-top: 1px;
                }
                
                /* RGB层 */
                .rgb-layer {
                    position: absolute;
                    inset: 0;
                    border-radius: var(--audio-player-radius, 30px);
                    z-index: 0;
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    padding: var(--border-width, 6px);
                }
                
                .rgb-layer.mode-single {
                    background: var(--rgb-single) !important;
                    animation: blink var(--rgb-animation-speed, 2s) infinite;
                }
                
                .rgb-layer.mode-rainbow {
                    animation: color-cycle 4s infinite linear, blink var(--rgb-animation-speed, 2s) infinite;
                }
                
                /* 内部内容 */
                #root-inner {
                    position: absolute;
                    top: var(--border-width, 6px);
                    left: var(--border-width, 6px);
                    right: var(--border-width, 6px);
                    bottom: var(--border-width, 6px);
                    border-radius: 24px;
                    z-index: 1;
                    overflow: hidden;
                    background: var(--audio-player-bg, #1a1a1a);
                    color: var(--audio-player-text, #ffffff);
                    transition: background 0.3s;
                }
                
                #root-inner.glass-mode {
                    backdrop-filter: blur(var(--glass-blur, 20px)) saturate(180%);
                    -webkit-backdrop-filter: blur(var(--glass-blur, 20px)) saturate(180%);
                }
                
                /* 岛屿拖拽 */
                #audio-player-island {
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
                }
                
                /* 主内容布局 */
                .main {
                    display: flex;
                    height: 100%;
                    padding: 30px 15px 15px;
                    box-sizing: border-box;
                    align-items: center;
                    position: relative;
                    z-index: 3;
                }
                
                #audio-player-cover {
                    width: var(--cover-width, 80px);
                    height: var(--cover-height, 80px);
                    border-radius: 12px;
                    margin-right: 15px;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: rgba(0,0,0,0.2);
                    transition: width 0.3s, height 0.3s;
                }
                
                .center {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    overflow: hidden;
                }
                
                .meta {
                    white-space: nowrap;
                    overflow: hidden;
                    margin-bottom: 5px;
                }
                
                #audio-player-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                #audio-player-artist {
                    font-size: 12px;
                    opacity: 0.7;
                }
                
                #audio-player-lyrics {
                    font-size: 12px;
                    opacity: 0.8;
                    height: 16px;
                    overflow: hidden;
                    text-align: center;
                    color: var(--lyric-color, #ffffff);
                    transition: color 0.3s;
                }
                
                /* 进度条 */
                .progress-wrap {
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                    position: relative;
                    margin: 5px 0;
                }
                
                #audio-player-progress {
                    width: 100%;
                    height: 100%;
                    -webkit-appearance: none;
                    background: transparent;
                    margin: 0;
                    cursor: pointer;
                }
                
                #audio-player-progress::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--rgb-single);
                    border-radius: 50%;
                    box-shadow: 0 0 5px rgba(0,0,0,0.5);
                    margin-top: -3px;
                }
                
                /* 控制按钮 */
                .controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 10px;
                }
                
                .controls button {
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-size: 18px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                
                .controls button:hover {
                    opacity: 1;
                }
                
                #btn-play {
                    font-size: 22px;
                    width: 26px;
                    height: 26px;
                    justify-content: center;
                }
                
                /* 右侧按钮 */
                .right {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100px;
                    margin-left: 12px;
                }
                
                .right button {
                    background: none;
                    border: none;
                    font-size: 22px;
                    cursor: pointer;
                    opacity: 0.7;
                    color: inherit;
                    padding: 5px;
                    transition: opacity 0.2s;
                }
                
                .right button:hover {
                    opacity: 1;
                }
                
                /* 面板 */
                .panel {
                    flex: 1;
                    display: none;
                    flex-direction: column;
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 360px;
                    background: transparent;
                }
                
                .section-title {
                    font-weight: bold;
                    font-size: 13px;
                    margin: 12px 0 8px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid rgba(255,255,255,0.15);
                }
                
                .section-title:first-child {
                    margin-top: 0;
                }
                
                .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    font-size: 12px;
                    padding: 6px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }
                
                .bg-control {
                    display: flex;
                    gap: 5px;
                    align-items: center;
                }
                
                .import-btn, .add-btn {
                    padding: 5px 10px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s;
                }
                
                .import-btn:hover, .add-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                /* RGB选项 */
                .option-group {
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
                
                /* 颜色输入 */
                input[type="color"] {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-radius: 4px;
                }
                
                input[type="range"] {
                    width: 100px;
                }
                
                /* 歌曲列表 */
                .list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                
                .list-item.active {
                    color: var(--rgb-single);
                    font-weight: bold;
                }
                
                .item-info {
                    flex: 1;
                    cursor: pointer;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .item-buttons {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .btn-lyrics, .btn-delete {
                    padding: 3px 8px;
                    font-size: 11px;
                    border-radius: 4px;
                    cursor: pointer;
                    border: none;
                }
                
                .btn-lyrics {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: #fff;
                }
                
                .btn-delete {
                    background: none;
                    color: #ff5555;
                    font-size: 18px;
                }
                
                .add-btn {
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
                
                /* 滚动条 */
                .panel::-webkit-scrollbar,
                #list-box::-webkit-scrollbar,
                .history-list::-webkit-scrollbar {
                    width: 4px;
                }
                
                .panel::-webkit-scrollbar-thumb,
                #list-box::-webkit-scrollbar-thumb,
                .history-list::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
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
                    z-index: 2147483648;
                }
                
                .dialog {
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
                
                .dialog-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .dialog-buttons button {
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
                }
                
                .dialog-buttons button:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,0.3);
                }
                
                .button-icon {
                    font-size: 32px;
                    line-height: 1;
                }
                
                .button-text {
                    font-size: 16px;
                    font-weight: bold;
                }
                
                .cancel-btn {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.3) !important;
                    color: #fff;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                /* 历史记录 */
                .history-list {
                    max-height: 300px;
                    overflow-y: auto;
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
                
                /* 响应式调整 */
                @media (max-width: 767px) {
                    #audio-player-root {
                        width: calc(var(--audio-player-width, 400px) * var(--mobile-scale, 0.7));
                        height: calc(var(--audio-player-height, 160px) * var(--mobile-scale, 0.7));
                    }
                    
                    .controls button {
                        font-size: 16px;
                    }
                    
                    #btn-play {
                        font-size: 20px;
                    }
                    
                    .right button {
                        font-size: 18px;
                    }
                }
                
                /* 低性能模式 */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `;
            
            const style = targetDoc.createElement('style');
            style.id = 'audio-player-styles';
            style.textContent = css;
            targetDoc.head.appendChild(style);
        }
    };
    
    // ============================================
    // 初始化
    // ============================================
    App.init();
    
    // 全局访问
    window.AudioPlayer = App;
    
})();
