/**
 * api/wyy2.js - 网易云音乐解析模块（通道二）
 * 接口: https://api.bugpk.com/api/163_music
 * 作者: hy.禾一
 * 说明: 备用通道，函数名带 2 后缀
 * 修改: BASE_URL 改为 BASE_URL_WYY2，避免与 wyy1.js 冲突
 */

const BASE_URL_WYY2 = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh';

// ==========================================
// 工具函数
// ==========================================

function inspectLink2(url) {
    const str = String(url).trim();
    if (str.includes('163cn.tv')) return { type: 'shortlink', id: null };
    if (str.includes('playlist')) {
        const match = str.match(/id=(\d+)/);
        return { type: 'playlist', id: match ? match[1] : null };
    }
    if (str.includes('song') || str.includes('music.163.com')) {
        const match = str.match(/id=(\d+)/);
        return { type: 'song', id: match ? match[1] : null };
    }
    if (/^\d+$/.test(str)) return { type: 'song', id: str };
    return { type: 'unknown', id: null };
}

function isNeteaseLink2(url) {
    const str = String(url).trim();
    return str.includes('music.163.com') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

function isPlaylistLink2(url) {
    return inspectLink2(url).type === 'playlist';
}

// ==========================================
// 1. 获取单曲信息
// ==========================================

async function fetchNeteaseSongInfo2(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const inspected = inspectLink2(url);
        let requestUrl;

        if (inspected.type === 'shortlink' || inspected.type === 'song') {
            requestUrl = `${BASE_URL_WYY2}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
        } else {
            throw new Error('不支持的链接类型');
        }

        const response = await fetch(requestUrl);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        return {
            title: data.name || '未知歌曲',
            artist: data.ar_name || '未知艺术家',
            url: data.url || '',
            lyrics: data.lyric || '',
            cover: data.pic || '',
            duration: '0:00',
            shareLink: url,
            source: 'netease'
        };
    } catch (error) {
        console.error('通道二解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================

async function refreshSongUrl2(shareLink) {
    if (!shareLink) return null;
    
    const url = String(shareLink).trim();
    const inspected = inspectLink2(url);
    
    let requestUrl;

    if (inspected.type === 'shortlink' || inspected.type === 'song') {
        requestUrl = `${BASE_URL_WYY2}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
    } else if (inspected.type === 'playlist') {
        if (inspected.id) {
            requestUrl = `${BASE_URL_WYY2}?type=json&id=${inspected.id}&level=${DEFAULT_LEVEL}`;
        } else {
            return null;
        }
    } else {
        requestUrl = `${BASE_URL_WYY2}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
    }

    try {
        const response = await fetch(requestUrl);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status !== 200) return null;
        return data.url || null;
    } catch (e) {
        console.error('通道二刷新链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================

async function fetchNeteasePlaylist2(link) {
    try {
        const url = String(link).trim();
        if (!url) throw new Error('请输入歌单链接');

        const inspected = inspectLink2(url);
        if (inspected.type !== 'playlist') {
            throw new Error('不是有效的歌单链接');
        }
        if (!inspected.id) {
            throw new Error('无法提取歌单ID');
        }

        const response = await fetch(`${BASE_URL_WYY2}?type=playlist&id=${inspected.id}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const result = await response.json();
        if (result.code !== 200) throw new Error(result.msg || '获取歌单失败');

        const playlist = result.data;
        if (!playlist.tracks || playlist.tracks.length === 0) {
            throw new Error('该歌单为空');
        }

        return {
            name: playlist.name || '网易云歌单',
            creator: playlist.creator || '未知',
            description: playlist.description || '',
            coverImgUrl: playlist.coverImgUrl || '',
            trackCount: playlist.trackCount || playlist.tracks.length,
            shareLink: url,
            tracks: playlist.tracks.map(track => ({
                id: track.id,
                name: track.name || '未知歌曲',
                artists: track.artists || '未知艺术家',
                album: track.album || '未知专辑',
                picUrl: track.picUrl || '',
                shareLink: `https://music.163.com/song?id=${track.id}`,
                source: 'netease'
            }))
        };
    } catch (error) {
        console.error('通道二获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchNeteaseSongInfo2 = fetchNeteaseSongInfo2;
window.fetchNeteasePlaylist2 = fetchNeteasePlaylist2;
window.refreshSongUrl2 = refreshSongUrl2;
window.isNeteaseLink2 = isNeteaseLink2;
window.isPlaylistLink2 = isPlaylistLink2;
window.inspectLink2 = inspectLink2;
