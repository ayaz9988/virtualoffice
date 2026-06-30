import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToEvents } from '../api';
import { useColorMode } from '../hooks/useColorMode';
import { Box, Button, Heading, IconButton, Spinner, Text, VStack } from '@chakra-ui/react';

function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle theme"
      variant="ghost"
      size="sm"
      onClick={toggleColorMode}
      position="fixed"
      top={4}
      right={4}
      zIndex={10}
    >
      {mode === 'dark' ? '☀️' : '🌙'}
    </IconButton>
  );
}

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const source = subscribeToEvents();

    source.addEventListener('status-changed', (e) => {
      const data = JSON.parse(e.data);
      if (data.meeting_number || data.status === 'admitted') {
        setStatus('admitted');
        if (data.meeting_number) {
          const joinUrl = data.zoom_join_url || `https://zoom.us/j/${data.meeting_number}?pwd=${data.zoom_password}`;
          window.open(joinUrl, '_blank');
        }
      } else {
        setStatus('declined');
      }
    });

    return () => source.close();
  }, [roomId]);

  return (
    <Box minH="100vh" bg="bg.muted" display="flex" alignItems="center" justifyContent="center">
      <ThemeToggle />
      <VStack gap={4} textAlign="center">
        {status === 'waiting' && (
          <>
            <Spinner size="xl" color="magenta.500" />
            <Heading size="lg">Waiting for teacher to admit you...</Heading>
            <Text color="fg.muted">You&apos;ll be able to join once admitted</Text>
          </>
        )}
        {status === 'admitted' && (
          <>
            <Heading size="lg" color="green.400">You&apos;ve been admitted!</Heading>
            <Text color="fg.muted">Check the opened Zoom tab to join the meeting.</Text>
            <Button mt={4} colorPalette="magenta" onClick={() => navigate('/browse')}>
              Back to rooms
            </Button>
          </>
        )}
        {status === 'declined' && (
          <>
            <Heading size="lg" color="red.400">The teacher declined your request</Heading>
            <Button mt={4} colorPalette="magenta" onClick={() => navigate('/browse')}>
              Back to rooms
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}
