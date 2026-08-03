/**
 * api-qishui.js - 汽水音乐解析模块
 * 作者: hy.禾一
 * 说明：使用 https://api.pearapi.ai/api/qishui_music 作为数据源
 */

// ==========================================
// 接口配置
// ==========================================
const QISHUI_BASE = 'https://api.pearapi.ai/api/qishui_music';

// ==========================================
// 核心函数
// ==========================================

/**
 * 解析汽水音乐单曲
 * @param {string} link - 汽水音乐分享链接
 * @returns {Promise<{title, artist, url, lyrics, cover, neteaseId}>}
 */
async function fetchQishuiSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        // 请求汽水音乐接口
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();

        // 检查返回状态
        if (data.code !== 200) {
            throw new Error(data.msg || '解析失败');
        }

        const song = data.data;
        if (!song || !song.song_name) {
            throw new Error('未找到歌曲信息');
        }

        // 提取歌曲ID（从链接中提取）
        let songId = null;
        const idMatch = url.match(/[?&]id=(\d+)/) || url.match(/\/song\/(\d+)/);
        if (idMatch) songId = idMatch[1];

        return {
            title: song.song_name || '未知歌曲',
            artist: song.singers || '未知艺术家',
            url: song.url || '',
            lyrics: song.lyrics || '',
            cover: song.cover || '',
            duration: '0:00',
            neteaseId: songId,
            source: 'qishui'
        };
    } catch (error) {
        console.error('汽水音乐解析失败:', error);
        throw error;
    }
}

/**
 * 刷新播放链接
 * @param {string} link - 汽水音乐分享链接
 * @returns {Promise<string|null>}
 */
async function refreshQishuiSongUrl(link) {
    try {
        const response = await fetch(`${QISHUI_BASE}?url=${encodeURIComponent(link)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.code !== 200) return null;
        return data.data?.url || null;
    } catch (e) {
        console.error('刷新汽水链接失败:', e);
        return null;
    }
}

/**
 * 汽水音乐歌单解析（暂不支持）
 */
async function fetchQishuiPlaylist(link) {
    throw new Error('汽水音乐歌单解析暂不支持，请使用单曲链接');
}

// ==========================================
// 暴露到全局
// ==========================================
window.fetchQishuiSongInfo = fetchQishuiSongInfo;
window.refreshQishuiSongUrl = refreshQishuiSongUrl;
window.fetchQishuiPlaylist = fetchQishuiPlaylist;
