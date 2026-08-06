/**
 * api/wyy1.js - 网易云音乐解析模块（通道一）
 * 接口: https://api.qijeya.cn/meting/
 * 作者: hy.禾一
 * 说明: 默认通道，支持VIP歌曲、歌单，函数名带 1 后缀
 */

const BASE_URL = 'https://api.qijeya.cn/meting/';

// ==========================================
// 工具函数（仅单曲和歌单）
// ==========================================

function extractNeteaseId1(url) {
    const str = String(url).trim();
    
    // 歌单
    if (str.includes('playlist')) {
        const match = str.match(/id=(\d+)/);
        return { type: 'playlist', id: match ? match[1] : null };
    }
    // 单曲（包括 song/ 或 music.163.com 链接）
    if (str.includes('song') || str.includes('music.163.com')) {
        const match = str.match(/id=(\d+)/);
        return { type: 'song', id: match ? match[1] : null };
    }
    // 纯数字 ID
    if (/^\d+$/.test(str)) {
        return { type: 'song', id: str };
    }
    return { type: 'unknown', id: null };
}

function isNeteaseLink1(url) {
    const str = String(url).trim();
    return str.includes('music.163.com') && !str.includes('163cn.tv') || /^\d+$/.test(str);
}

function isPlaylistLink1(url) {
    return extractNeteaseId1(url).type === 'playlist';
}

// ==========================================
// 1. 获取单曲信息（含播放链接）
// ==========================================

async function fetchNeteaseSongInfo1(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接');

        const inspected = extractNeteaseId1(url);
        if (inspected.type !== 'song' || !inspected.id) {
            throw new Error('请输入有效的单曲链接或ID');
        }

        const songId = inspected.id;

        // 1.1 获取播放链接（type=url，支持VIP，音质320k）
        const urlResp = await fetch(`${BASE_URL}?type=url&id=${songId}&br=320`);
        if (!urlResp.ok) throw new Error(`请求链接失败: ${urlResp.status}`);
        const urlData = await urlResp.json();

        // 1.2 获取歌曲信息（type=song）
        const infoResp = await fetch(`${BASE_URL}?type=song&id=${songId}`);
        if (!infoResp.ok) throw new Error(`请求信息失败: ${infoResp.status}`);
        const infoData = await infoResp.json();

        // 处理返回格式（可能是数组或对象）
        const songInfo = Array.isArray(infoData) ? infoData[0] : infoData;
        const songUrl = Array.isArray(urlData) ? urlData[0] : urlData;

        if (!songInfo || !songInfo.name) {
            throw new Error('未找到歌曲信息');
        }

        return {
            title: songInfo.name || '未知歌曲',
            artist: songInfo.artist || '未知艺术家',
            url: songUrl?.url || songUrl || '',
            lyrics: songInfo.lrc || '',
            cover: songInfo.pic || '',
            duration: songInfo.duration || '0:00',
            shareLink: link,
            source: 'netease'
        };
    } catch (error) {
        console.error('通道一解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接
// ==========================================

async function refreshSongUrl1(shareLink) {
    if (!shareLink) return null;

    const inspected = extractNeteaseId1(shareLink);
    if (inspected.type !== 'song' || !inspected.id) return null;

    try {
        const resp = await fetch(`${BASE_URL}?type=url&id=${inspected.id}&br=320`);
        if (!resp.ok) return null;
        const data = await resp.json();
        const songUrl = Array.isArray(data) ? data[0] : data;
        return songUrl?.url || null;
    } catch (e) {
        console.error('通道一刷新链接失败:', e);
        return null;
    }
}

// ==========================================
// 3. 获取歌单
// ==========================================

async function fetchNeteasePlaylist1(link) {
    try {
        const url = String(link).trim();
        if (!url) throw new Error('请输入歌单链接');

        const inspected = extractNeteaseId1(url);
        if (inspected.type !== 'playlist' || !inspected.id) {
            throw new Error('请输入有效的歌单链接');
        }

        const resp = await fetch(`${BASE_URL}?type=playlist&id=${inspected.id}`);
        if (!resp.ok) throw new Error(`请求失败: ${resp.status}`);

        const data = await resp.json();
        const playlist = Array.isArray(data) ? data : [data];

        if (!playlist.length || !playlist[0].name) {
            throw new Error('未找到歌单信息');
        }

        const first = playlist[0];
        const tracks = playlist.map(track => ({
            id: track.id,
            name: track.name || '未知歌曲',
            artists: track.artist || '未知艺术家',
            album: track.album || '未知专辑',
            picUrl: track.pic || '',
            shareLink: `https://music.163.com/song?id=${track.id}`,
            source: 'netease'
        }));

        return {
            name: first.playlist_name || first.name || '网易云歌单',
            creator: first.playlist_creator || '未知',
            description: first.desc || '',
            coverImgUrl: first.pic || '',
            trackCount: tracks.length,
            shareLink: link,
            tracks: tracks
        };
    } catch (error) {
        console.error('通道一获取歌单失败:', error);
        throw error;
    }
}

// ==========================================
// 暴露到全局
// ==========================================

window.fetchNeteaseSongInfo1 = fetchNeteaseSongInfo1;
window.fetchNeteasePlaylist1 = fetchNeteasePlaylist1;
window.refreshSongUrl1 = refreshSongUrl1;
window.isNeteaseLink1 = isNeteaseLink1;
window.isPlaylistLink1 = isPlaylistLink1;
window.extractNeteaseId1 = extractNeteaseId1;
