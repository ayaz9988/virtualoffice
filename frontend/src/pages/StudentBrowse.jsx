import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpenRooms, joinWaitingRoom, subscribeToEvents } from '../api';
import { useAuth } from '../store/auth';
import { useColorMode } from '../hooks/useColorMode';
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';

function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle theme"
      variant="ghost"
      size="sm"
      onClick={toggleColorMode}
    >
      {mode === 'dark' ? '☀️' : '🌙'}
    </IconButton>
  );
}

export default function StudentBrowse() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [joiningIds, setJoiningIds] = useState(new Set());

  const fetchRooms = useCallback(() => {
    getOpenRooms().then((data) => setRooms(data.rooms)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const source = subscribeToEvents();

    source.addEventListener('rooms-changed', () => {
      fetchRooms();
    });

    return () => source.close();
  }, [fetchRooms]);

  const handleJoin = async (roomId) => {
    setJoiningIds((prev) => new Set(prev).add(roomId));
    try {
      await joinWaitingRoom(roomId);
      navigate(`/waiting/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoiningIds((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    }
  };

  return (
    <Box minH="100vh" bg="bg.muted" p={6}>
      <VStack maxW="3xl" mx="auto" align="stretch" gap={6}>
        <Flex justify="space-between" align="center">
          <Heading size="lg">Open Rooms</Heading>
          <HStack gap={4}>
            <Text color="fg.muted">Welcome, {user?.name}</Text>
            <ThemeToggle />
          </HStack>
        </Flex>

        {error && (
          <Text color="red.400" fontSize="sm">{error}</Text>
        )}

        {rooms.length === 0 ? (
          <VStack py={20} gap={3}>
            <Text color="fg.muted" fontSize="lg">No open rooms right now</Text>
            <Text color="fg.muted" fontSize="sm">Check back later or ask a teacher to open a room.</Text>
          </VStack>
        ) : (
          <Stack gap={4}>
            {rooms.map((room) => (
              <Card.Root key={room.id}>
                <Card.Body>
                  <Flex justify="space-between" align="center">
                    <VStack align="start" gap={1}>
                      <Heading size="md">{room.name}</Heading>
                      {room.topic && <Text color="fg.muted" fontSize="sm">{room.topic}</Text>}
                      {room.description && (
                        <Text color="fg.muted" fontSize="sm">{room.description}</Text>
                      )}
                    </VStack>
                    <Button
                      colorPalette="magenta"
                      onClick={() => handleJoin(room.id)}
                      loading={joiningIds.has(room.id)}
                    >
                      Join
                    </Button>
                  </Flex>
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        )}
      </VStack>
    </Box>
  );
}
