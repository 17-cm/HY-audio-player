/**
 * ui-playlist.js - 音乐播放器歌单相关模块
 * 作者: hy.禾一
 */

// ============================================================
// 渲染列表
// ============================================================

function renderList() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const list = document.getElementById('list-box');
    if (!list) return;

    list.innerHTML = '';
    core.playlist.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = `list-item ${i === core.index ? 'active' : ''}`;
        const sourceLabel = t.source === 'qishui' ? '🍹' : '🎵';
        item.innerHTML = `
            <div class="item-info"><b>${t.title} - ${t.artist}</b> <span style="opacity:0.4;font-size:11px;">${sourceLabel}</span></div>
            <div class="item-btns">
                <button type="button" class="btn-lyrics">歌词</button>
                <button type="button" class="btn-del">×</button>
            </div>
        `;
        item.querySelector('.item-info').onclick = () => {
            if (core) core.play(i);
        };
        item.querySelector('.btn-del').onclick = () => {
            if (typeof window.delSong === 'function') {
                window.delSong(i);
            }
        };
        item.querySelector('.btn-lyrics').onclick = () => {
            if (typeof window.showLyricsDialog === 'function') {
                window.showLyricsDialog(i);
            }
        };
        list.appendChild(item);
    });
}

function renderImportHistory() {
    const core = window.MusicPlayerCore;
    if (!core) return;

    const container = document.getElementById('history-list');
    if (!container) return;

    if (core.state.importHistory.length === 0) {
        container.innerHTML = '<div class="no-history">暂无导入历史</div>';
        return;
    }

    let html = '';
    core.state.importHistory.forEach((history) => {
        const time = history.time;
        const sourceLabel = history.data.source === 'qishui' ? '🍹' : '🎵';

        if (history.type === 'single') {
            html += `
                <div class="history-item">
                    <div class="history-icon">${sourceLabel}</div>
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
}

// ============================================================
// 添加歌曲（新弹框样式）
// ============================================================

function showAddOptions() {
    const overlay = window.createOverlay();
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
        ">
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 18px; font-weight: 700; color: #1a1a1a;">选择音乐来源</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">导入时尽量不要开梯子</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="source-qishui" style="
                    padding: 14px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">🍹 汽水音乐</button>
                <button id="source-netease" style="
                    padding: 14px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 15px;
                    font-weight: 500;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">🎵 网易云音乐</button>
                <button id="source-cancel" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const hoverStyle = (btn) => {
        btn.addEventListener('mouseenter', () => { btn.style.background = '#e8e8e8'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#f5f5f5'; });
    };

    const qishuiBtn = overlay.querySelector('#source-qishui');
    const neteaseBtn = overlay.querySelector('#source-netease');
    hoverStyle(qishuiBtn);
    hoverStyle(neteaseBtn);

    qishuiBtn.onclick = () => {
        overlay.remove();
        window.showInputDialog(
            '添加汽水单曲',
            '请输入汽水音乐分享链接',
            async (input) => {
                if (!input.includes('qishui') && !input.includes('douyin') && !input.includes('music')) {
                    window.showStatus('请输入有效的汽水音乐链接', 'error');
                    return;
                }
                await doAddSong(input, 'qishui');
            }
        );
    };

    neteaseBtn.onclick = () => {
        overlay.remove();
        window.showInputDialog(
            '添加网易云单曲',
            '支持单曲导入、歌单导入，输入分享链接。歌单导入请自建歌单少量多次，防止崩溃。',
            async (input) => {
                if (!window.isNeteaseLink || !window.isNeteaseLink(input)) {
                    window.showStatus('请输入有效的网易云链接', 'error');
                    return;
                }
                // 判断是歌单还是单曲
                if (window.isPlaylistLink && window.isPlaylistLink(input)) {
                    await doAddPlaylist(input);
                } else {
                    await doAddSong(input, 'netease');
                }
            }
        );
    };

    overlay.querySelector('#source-cancel').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// 实际执行添加单曲
// ============================================================

async function doAddSong(input, source) {
    const core = window.MusicPlayerCore;
    if (!core) {
        window.showStatus('播放器未初始化', 'error');
        return;
    }

    window.showStatus(`正在解析${source === 'netease' ? '网易云' : '汽水音乐'}链接...`, 'info');

    try {
        let songInfo;
        if (source === 'netease') {
            if (typeof window.fetchNeteaseSongInfo !== 'function') {
                throw new Error('网易云解析模块未加载');
            }
            songInfo = await window.fetchNeteaseSongInfo(input);
        } else {
            if (typeof window.fetchQishuiSongInfo !== 'function') {
                throw new Error('汽水音乐解析模块未加载');
            }
            songInfo = await window.fetchQishuiSongInfo(input);
        }

        core.playlist.push({
            title: songInfo.title,
            artist: songInfo.artist,
            url: songInfo.url,
            lyrics: songInfo.lyrics || '',
            cover: songInfo.cover || '',
            neteaseId: songInfo.neteaseId || null,
            source: source
        });

        core.addImportHistory('single', {
            title: songInfo.title,
            artist: songInfo.artist,
            link: input,
            source: source
        });

        core.saveData();
        renderList();
        window.showStatus(`成功添加: ${songInfo.title}`, 'success');

        if (core.index === -1) {
            core.play(core.playlist.length - 1);
        }
    } catch (error) {
        window.showStatus(`添加失败: ${error.message}`, 'error');
    }
}

// ============================================================
// 实际执行添加歌单
// ============================================================

async function doAddPlaylist(input) {
    const core = window.MusicPlayerCore;
    if (!core) {
        window.showStatus('播放器未初始化', 'error');
        return;
    }

    window.showStatus('正在解析歌单...', 'info');

    try {
        const playlist = await window.fetchNeteasePlaylist(input);

        if (!playlist.tracks || playlist.tracks.length === 0) {
            window.showStatus('歌单为空或无法获取歌曲列表', 'error');
            return;
        }

        if (typeof window.showConfirmDialog === 'function') {
            window.showConfirmDialog(
                '确认导入',
                `<div style="text-align:left;line-height:1.8;">
                    <p><strong>歌单：</strong>${playlist.name}</p>
                    <p><strong>创建者：</strong>${playlist.creator}</p>
                    <p><strong>歌曲数：</strong>${playlist.tracks.length} 首</p>
                    <p style="margin-top:10px;opacity:0.8;">是否全部添加到播放列表？</p>
                </div>`,
                () => importPlaylistTracks(playlist, input)
            );
        }
    } catch (error) {
        window.showStatus(`歌单解析失败: ${error.message}`, 'error');
    }
}

// ============================================================
// 导入歌单曲目
// ============================================================

async function importPlaylistTracks(playlist, link) {
    const core = window.MusicPlayerCore;
    if (!core) return;

    window.showStatus(`正在导入 ${playlist.tracks.length} 首歌曲...`, 'info');
    if (typeof window.showCacheProgress === 'function') {
        window.showCacheProgress(0, playlist.tracks.length);
    }

    let addedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < playlist.tracks.length; i++) {
        const track = playlist.tracks[i];
        const songLink = `https://music.163.com/song?id=${track.id}`;

        if (typeof window.updateCacheProgress === 'function') {
            window.updateCacheProgress(i + 1, playlist.tracks.length, track.name);
        }

        try {
            const songInfo = await window.fetchNeteaseSongInfo(songLink);

            core.playlist.push({
                title: track.name,
                artist: track.artists,
                url: songInfo.url,
                lyrics: songInfo.lyrics || '',
                cover: track.picUrl || songInfo.cover,
                neteaseId: track.id.toString(),
                source: 'netease'
            });

            addedCount++;
        } catch (error) {
            console.error(`歌曲 ${track.name} 导入失败:`, error);
            failedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (typeof window.hideCacheProgress === 'function') {
        window.hideCacheProgress();
    }

    core.addImportHistory('playlist', {
        name: playlist.name,
        creator: playlist.creator,
        count: playlist.tracks.length,
        link: link
    });

    core.saveData();
    renderList();

    if (addedCount > 0) {
        window.showStatus(`歌单导入完成！成功 ${addedCount} 首，失败 ${failedCount} 首`, 'success');
    } else {
        window.showStatus('没有歌曲成功导入', 'error');
    }

    if (core.index === -1 && core.playlist.length > 0) {
        core.play(0);
    }
}

// ============================================================
// 歌词对话框
// ============================================================

function showLyricsDialog(i) {
    const overlay = window.createOverlay();
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
        ">
            <div style="text-align: center; font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px;">歌词设置</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="lyrics-paste-btn" style="
                    padding: 14px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">粘贴歌词</button>
                <button id="lyrics-import-btn" style="
                    padding: 14px;
                    background: #f5f5f5;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #1a1a1a;
                    transition: all 0.2s;
                ">导入文件</button>
                <button id="lyrics-cancel-btn" style="
                    margin-top: 6px;
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 13px;
                    padding: 8px;
                ">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#lyrics-paste-btn').onclick = () => {
        overlay.remove();
        window.showInputDialog('粘贴歌词', '请粘贴LRC格式歌词', (newLyrics) => {
            const core = window.MusicPlayerCore;
            if (core) {
                core.playlist[i].lyrics = newLyrics;
                if (i === core.index) {
                    core.state.lyrics = core.parseLyrics(newLyrics);
                    core.state.currentLyricIndex = -1;
                }
                core.saveData();
                window.showStatus('歌词已更新', 'success');
                window.updateView();
            }
        });
    };

    overlay.querySelector('#lyrics-import-btn').onclick = () => {
        overlay.remove();
        window.createFileInput('.lrc,.txt', (file) => {
            window.handleTextFileUpload(file, (content) => {
                const core = window.MusicPlayerCore;
                if (core) {
                    core.playlist[i].lyrics = content;
                    if (i === core.index) {
                        core.state.lyrics = core.parseLyrics(content);
                        core.state.currentLyricIndex = -1;
                    }
                    core.saveData();
                    window.showStatus('歌词导入成功！', 'success');
                    window.updateView();
                }
            });
        });
    };

    overlay.querySelector('#lyrics-cancel-btn').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ============================================================
// 删除歌曲
// ============================================================

function delSong(i) {
    window.showConfirmDialog('删除歌曲', '确定要删除这首歌曲吗？', () => {
        const core = window.MusicPlayerCore;
        if (core) {
            core.playlist.splice(i, 1);
            core.saveData();
            renderList();
            if (i === core.index) {
                core.audio.pause();
                core.index = -1;
                window.updateView();
            } else if (i < core.index) {
                core.index--;
            }
        }
    });
}

// ============================================================
// 暴露到全局
// ============================================================

window.renderList = renderList;
window.renderImportHistory = renderImportHistory;
window.showAddOptions = showAddOptions;
window.doAddSong = doAddSong;
window.doAddPlaylist = doAddPlaylist;
window.importPlaylistTracks = importPlaylistTracks;
window.showLyricsDialog = showLyricsDialog;
window.delSong = delSong;
