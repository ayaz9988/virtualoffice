import axios from 'axios';
import jwt from 'jsonwebtoken';

export let access_token = null;


function isTokenExpired(token) {
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
        return true; 
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    return currentTime > decoded.exp;
}

export const getAccessToken = async () => {
    try {
        const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
        const ZOOM_CLIENT_ID= process.env.ZOOM_CLIENT_ID;
        const ZOOM_CLIENT_SECRET= process.env.ZOOM_CLIENT_SECRET;
        const b64 = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`, "utf8").toString("base64");

        const res = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {},
            {
                headers: {
                    Authorization: `Basic ${b64}`,
                }
            }
        );

        const accessToken = res.data;
        access_token = accessToken.access_token;

        // {access_token: ..., token_type: ..., expires_in: ..., scope: ..., api_url: ...}
        return accessToken;
    } catch (error) {
        console.error('Error getting Zoom access token:', error.response?.data || error.message);
        return { error: error.response?.data || error.message };
    }
}


export const createMeeting = async (teacherName, topic = 'office') => {
    try {
        const body = {
            topic,
            type: 1,
            settings: {
                waiting_room: true,
                host_video: false,
                participant_video: false,
                approval_type: 2,
                auto_recording: 'cloud',
                join_before_host: false
            }
        };
        if (!access_token || isTokenExpired(access_token)) {
            const token = await getAccessToken();
            if (token.error) {
                return { error: token.error };
            }
        }
        const res = await axios.post(
            `https://api.zoom.us/v2/users/me/meetings`,
            body,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                }
            }
        );
        const { id, password, join_url, start_url } = res.data;
        return { id, password, join_url, start_url };
    } catch (error) {
        console.error('Error creating Zoom meeting:', error.response?.data || error.message);
        return { error: error.response?.data || error.message };
    }
};

export const deleteMeeting = async (meetingId) => {
    try {
        if (!access_token || isTokenExpired(access_token)) {
            const token = await getAccessToken();
            if (token.error) {
                return { error: token.error };
            }
        }
        await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting Zoom meeting:', error.response?.data || error.message);
        return { error: error.response?.data || error.message };
    }
};


export const getZakToken = async (userId = 'me') => {
    try {
        if (!access_token || isTokenExpired(access_token)) {
            const token = await getAccessToken();
            if (token.error) {
                return { error: token.error };
            }
        }
        const res = await axios.get(`https://api.zoom.us/v2/users/${userId}/token?type=zak`, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        return res.data.token;
    } catch (error) {
        console.error('Error getting Zoom ZAK token:', error.response?.data || error.message);
        return { error: error.response?.data || error.message };
    }
};

export const generateSignature = (meetingNumber, role) => {
    try {
        const iat = Math.round(Date.now() / 1000);
        const exp = iat + 7200;

        const payload = {
            appKey: process.env.ZOOM_SDK_KEY,
            mn: String(meetingNumber),
            role,
            iat,
            exp,
            tokenExp: exp,
        };

        return jwt.sign(payload, process.env.ZOOM_SDK_SECRET);
    } catch (error) {
        console.error('Error generating Zoom signature:', error.message);
        return { error: error.message };
    }
};
