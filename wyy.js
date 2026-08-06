/**
 * api/wyy.js - 网易云音乐解析模块
 * 作者: hy.禾一
 */

const BASE_URL = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh';

// ==========================================
// 工具函数
// ==========================================

function inspectLink(url) {
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

function isNeteaseLink(url) {
    const str = String(url).trim();
    return str.includes('music.163.com') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

function isPlaylistLink(url) {
    return inspectLink(url).type === 'playlist';
}

// ==========================================
// 1. 获取单曲信息
// ==========================================

async function fetchNeteaseSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const inspected = inspectLink(url);
        let requestUrl;

        if (inspected.type === 'shortlink' || inspected.type === 'song') {
            requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
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
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================

async function refreshSongUrl(shareLink) {
    if (!shareLink) return null;
    
    const url = String(shareLink).trim();
    const inspected = inspectLink(url);
    
    let requestUrl;

    if (inspected.type === 'shortlink' || inspected.type === 'song') {
        requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
    } else if (inspected.type === 'playlist') {
        if (inspected.id) {
            requestUrl = `${BASE_URL}?type=json&id=${inspected.id}&level=${DEFAULT_LEVEL}`;
        } else {
            return null;
        }
    } else {
        requestUrl = `${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`;
    }

    try {
        const response = await fetch(requestUrl);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status !== 200) return null;
        return data.url || null;
    } catch (e) {
        console.error('刷新链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================

async function fetchNeteasePlaylist(link) {
    try {
        const url = String(link).trim();
        if (!url) throw new Error('请输入歌单链接');

        const inspected = inspectLink(url);
        if (inspected.type !== 'playlist') {
            throw new Error('不是有效的歌单链接');
        }
        if (!inspected.id) {
            throw new Error('无法提取歌单ID');
        }

        const response = await fetch(`${BASE_URL}?type=playlist&id=${inspected.id}`);
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
        console.error('获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.refreshSongUrl = refreshSongUrl;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.inspectLink = inspectLink;
