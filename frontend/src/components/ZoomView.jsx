import { useEffect, useRef } from 'react';
import ZoomMtgEmbedded from '@zoom/meetingsdk/embedded';

export default function ZoomView({ meetingNumber, password, signature, zak, userName, onLeave }) {
  const containerRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    const client = ZoomMtgEmbedded.createClient();
    clientRef.current = client;

    client.init({ zoomAppRoot: containerRef.current, language: 'en-US' });

    client.on('connection-change', (event) => {
      if (event.state === 'Closed') {
        onLeave?.();
      }
    });

    client.join({
      meetingNumber: String(meetingNumber),
      password,
      signature,
      ...(zak ? { zak } : {}),
      userName,
      userEmail: `${userName.replace(/\s+/g, '')}@virtualoffice.com`,
    });

    return () => {
      client.leaveMeeting().catch(() => {});
    };
  }, [meetingNumber, password, signature, zak, userName, onLeave]);

  return <div ref={containerRef} className="w-full h-screen" />;
}
