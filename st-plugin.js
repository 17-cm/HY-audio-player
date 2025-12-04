// st-plugin.js - 最简单的解决方案
(function() {
    console.log('HY Audio Player plugin loading...');
    
    // 创建浮动按钮
    const button = document.createElement('button');
    button.innerHTML = '🎵';
    button.title = '音频播放器';
    button.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #4CAF50;
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    // 创建iframe容器
    const iframe = document.createElement('iframe');
    iframe.src = '/plugins/hy-audio-player/index.html';
    iframe.style.cssText = `
        position: fixed;
        bottom: 130px;
        right: 20px;
        width: 400px;
        height: 600px;
        border: none;
        border-radius: 10px;
        display: none;
        z-index: 9998;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
    `;
    iframe.id = 'hy-audio-iframe';
    
    // 切换显示/隐藏
    button.addEventListener('click', () => {
        iframe.style.display = iframe.style.display === 'none' ? 'block' : 'none';
    });
    
    // 添加到页面
    document.body.appendChild(button);
    document.body.appendChild(iframe);
    
    console.log('HY Audio Player plugin loaded - iframe version');
})();
