/**
 * api/qs.js - 汽水音乐解析模块
 * 作者: hy.禾一
 */

const QISHUI_BASE = 'https://api.pearapi.ai/api/qishui_music';

// ==========================================
// 1. 获取单曲信息
// ==========================================

async function fetchQishuiSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.code !== 200) throw new Error(data.msg || '解析失败');

        const song = data.data;
        if (!song || !song.song_name) {
            throw new Error('未找到歌曲信息');
        }

        return {
            title: song.song_name || '未知歌曲',
            artist: song.singers || '未知艺术家',
            url: song.url || '',
            lyrics: song.lyrics || '',
            cover: song.cover || '',
            duration: '0:00',
            shareLink: url,        // 存分享链接
            source: 'qishui'
        };
    } catch (error) {
        console.error('汽水音乐解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================

async function refreshQishuiSongUrl(shareLink) {
    if (!shareLink) return null;
    
    try {
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(shareLink)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.code !== 200) return null;
        return data.data?.url || null;
    } catch (e) {
        console.error('刷新汽水链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 歌单（暂不支持）
// ==========================================

async function fetchQishuiPlaylist(link) {
    throw new Error('汽水音乐歌单解析暂不支持');
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchQishuiSongInfo = fetchQishuiSongInfo;
window.refreshQishuiSongUrl = refreshQishuiSongUrl;
window.fetchQishuiPlaylist = fetchQishuiPlaylist;
