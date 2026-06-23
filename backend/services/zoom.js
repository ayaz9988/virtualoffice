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
}


export const createMeeting = async (teacherName, topic = 'office') => {
    const body = { 
        topic,
        type: 1,
        settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            waiting_room: true
        }
    };
    if (!access_token || isTokenExpired(access_token)) {
        await getAccessToken();
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
};

export const deleteMeeting = async (meetingId) => {
  if (!access_token || isTokenExpired(access_token)) {
    const token = await getAccessToken();
    access_token = token.access_token;
  }
  await axios.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
};


export const generateSignature = (meetingNumber, role) => {
  const iat = Math.round(Date.now() / 1000);
  const exp = iat + 20; // expires in 20 seconds

  const payload = {
    appKey: process.env.ZOOM_CLIENT_ID,
    role: role,       // 0 = attendee, 1 = host
    version: 1,
    iat,
    exp,
    meetingNumber: Number(meetingNumber),
  };

  return jwt.sign(payload, process.env.ZOOM_CLIENT_SECRET);
};