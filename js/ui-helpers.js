/**
 * ui-helpers.js - 音乐播放器辅助UI模块
 * 作者: hy.禾一
 */

// ============================================================
// 状态提示
// ============================================================

let helperStatusTimer = null;

function showStatus(message, type = 'info', duration = 3000) {
    const statusEl = document.getElementById('player-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `player-status status-${type}`;
        statusEl.style.opacity = '1';

        clearTimeout(helperStatusTimer);
        helperStatusTimer = setTimeout(() => {
            statusEl.style.opacity = '0';
        }, duration);
    }
}

// ============================================================
// 弹窗创建
// ============================================================

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        padding: 20px;
        box-sizing: border-box;
        overflow: auto;
        min-height: 100vh;
    `;
    return overlay;
}

// ============================================================
// 确认对话框
// ============================================================

function showConfirmDialog(title, message, onConfirm, onCancel) {
    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 380px;
            width: 100%;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
            text-align: center;
        ">
            <div style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">${title}</div>
            <div style="font-size: 14px; color: #666; margin-bottom: 20px;">${message}</div>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="dialog-cancel-btn" style="
                    padding: 10px 30px;
                    background: #f5f5f5;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    color: #1a1a1a;
                    font-size: 14px;
                    cursor: pointer;
                ">取消</button>
                <button id="dialog-confirm-btn" style="
                    padding: 10px 30px;
                    background: #1a1a1a;
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 500;
                ">确定</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#dialog-confirm-btn').onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };

    overlay.querySelector('#dialog-cancel-btn').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    };
}

// ============================================================
// 输入对话框
// ============================================================

function showInputDialog(title, placeholder, onConfirm) {
    const overlay = createOverlay();
    overlay.innerHTML = `
        <div class="help-dialog" style="
            background: #ffffff;
            color: #1a1a1a;
            border-radius: 24px;
            padding: 32px 28px 24px;
            max-width: 420px;
            width: 100%;
            position: relative;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            margin: auto;
            z-index: 1000000;
            border: 2px solid #1a1a1a;
            line-height: 1.6;
        ">
            <div style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">${title}</div>
            <textarea id="dialog-input" style="
                width: 100%;
                padding: 12px;
                border: 1px solid #d0d0d0;
                border-radius: 8px;
                font-size: 14px;
                color: #1a1a1a;
                background: #fafafa;
                resize: vertical;
                min-height: 60px;
                box-sizing: border-box;
                font-family: inherit;
            " placeholder="${placeholder}"></textarea>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 12px;">
                <button id="dialog-cancel-btn" style="
                    padding: 10px 30px;
                    background: #f5f5f5;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    color: #1a1a1a;
                    font-size: 14px;
                    cursor: pointer;
                ">取消</button>
                <button id="dialog-confirm-btn" style="
                    padding: 10px 30px;
                    background: #1a1a1a;
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 14px;
                    cursor: pointer;
                    font-weight: 500;
                ">确定</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#dialog-input');
    input.focus();

    overlay.querySelector('#dialog-confirm-btn').onclick = () => {
        const value = input.value.trim();
        overlay.remove();
        if (value && onConfirm) onConfirm(value);
    };

    overlay.querySelector('#dialog-cancel-btn').onclick = () => {
        overlay.remove();
    };

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
}

// ============================================================
// 颜色工具
// ============================================================

function hexToRgba(hex, alpha) {
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
    return `rgba(${r},${g},${b},${alpha})`;
}

// ============================================================
// 文件上传工具
// ============================================================

function createFileInput(accept, callback) {
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
}

function handleFileUpload(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
}

function handleTextFileUpload(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsText(file);
}

// ============================================================
// 暴露到全局
// ============================================================

window.showStatus = showStatus;
window.createOverlay = createOverlay;
window.showConfirmDialog = showConfirmDialog;
window.showInputDialog = showInputDialog;
window.hexToRgba = hexToRgba;
window.createFileInput = createFileInput;
window.handleFileUpload = handleFileUpload;
window.handleTextFileUpload = handleTextFileUpload;
