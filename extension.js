// 替换或修改你原来的点击事件处理函数
document.getElementById('open-player').addEventListener('click', function() {
    // 获取或创建iframe容器
    let iframeContainer = document.getElementById('hy-player-iframe-container');
    
    if (!iframeContainer) {
        // 如果容器不存在，则在扩展面板内创建一个
        const extensionContent = this.closest('.inline-drawer-content');
        extensionContent.insertAdjacentHTML('beforeend', `
            <div id="hy-player-iframe-container" style="margin-top: 15px; border-top: 1px solid var(--border_color); padding-top: 15px;">
                <iframe 
                    id="hy-audio-player-iframe"
                    src="/scripts/extensions/third-party/HY-audio-player/index.html"
                    style="width: 100%; height: 600px; border: 1px solid var(--border_color); border-radius: 5px;"
                >
                </iframe>
            </div>
        `);
        // 按钮文字改为“关闭”
        this.innerHTML = '<i class="fa-solid fa-close"></i> 关闭播放器';
    } else {
        // 如果容器已存在，则切换显示/隐藏
        const isHidden = iframeContainer.style.display === 'none';
        iframeContainer.style.display = isHidden ? 'block' : 'none';
        // 切换按钮文字
        this.innerHTML = isHidden ? 
            '<i class="fa-solid fa-close"></i> 关闭播放器' : 
            '<i class="fa-solid fa-play"></i> 打开播放器';
    }
});
