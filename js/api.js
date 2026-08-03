/**
 * api.js - 音乐播放器网络请求模块
 * 版本: BugPK 网易云接口版
 * 作者: hy.禾一
 * 说明：使用 https://api.bugpk.com/api/163_music 作为数据源
 */

// ==========================================
// 接口配置
// ==========================================
const BASE_URL = 'https://api.bugpk.com/api/163_music';
const DEFAULT_LEVEL = 'exhigh'; // 默认极高音质

// ==========================================
// 工具函数：提取纯数字ID（仅用于歌单解析）
// ==========================================
function extractNeteaseId(link) {
    if (!link) return null;
    const strLink = String(link).trim();
    if (/^\d+$/.test(strLink)) return strLink;
    const match = strLink.match(/id=(\d+)/) || strLink.match(/song\/(\d+)/);
    return match ? match[1] : null;
}

function isNeteaseLink(url) {
    const str = String(url).trim();
    return str.includes('music.163.com') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

function isPlaylistLink(url) {
    const str = String(url).trim();
    return str.includes('playlist') || str.includes('163cn.tv') || /^\d+$/.test(str);
}

// ==========================================
// 1. 获取单曲信息
// ==========================================
async function fetchNeteaseSongInfo(link) {
    try {
        const url = link.trim();
        if (!url) throw new Error('请输入链接或歌曲ID');

        const response = await fetch(`${BASE_URL}?type=json&url=${encodeURIComponent(url)}&level=${DEFAULT_LEVEL}`);
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);

        const data = await response.json();
        if (data.status !== 200) throw new Error(data.message || '解析失败');

        let songId = null;
        const idMatch = data.url?.match(/id=(\d+)/) || url.match(/id=(\d+)/);
        if (idMatch) songId = idMatch[1];

        return {
            title: data.name || '未知歌曲',
            artist: data.ar_name || '未知艺术家',
            url: data.url || '',
            lyrics: data.lyric || '',
            cover: data.pic || '',
            duration: '0:00',
            neteaseId: songId
        };
    } catch (error) {
        console.error('单曲解析失败:', error);
        throw error;
    }
}

// ==========================================
// 2. 刷新播放链接（方案一：支持纯数字ID和完整链接）
// ==========================================
async function refreshSongUrl(link) {
    // 如果是纯数字，补全为完整链接
    if (/^\d+$/.test(link)) {
        link = `https://music.163.com/song?id=${link}`;
    }
    try {
        const response = await fetch(`${BASE_URL}?type=json&url=${encodeURIComponent(link)}&level=${DEFAULT_LEVEL}`);
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
        let playlistId = extractNeteaseId(link);
        if (!playlistId) {
            if (/^\d+$/.test(link.trim())) {
                playlistId = link.trim();
            } else {
                throw new Error('无法提取歌单ID');
            }
        }

        const response = await fetch(`${BASE_URL}?type=playlist&id=${playlistId}`);
        if (!response.ok) throw new Error(`网络请求失败: ${response.status}`);

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
            tracks: playlist.tracks.map(track => ({
                id: track.id,
                name: track.name || '未知歌曲',
                artists: track.artists || '未知艺术家',
                album: track.album || '未知专辑',
                picUrl: track.picUrl || ''
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
window.refreshSongUrl = refreshSongUrl;
window.fetchNeteaseSongInfo = fetchNeteaseSongInfo;
window.fetchNeteasePlaylist = fetchNeteasePlaylist;
window.isNeteaseLink = isNeteaseLink;
window.isPlaylistLink = isPlaylistLink;
window.extractNeteaseId = extractNeteaseId;
