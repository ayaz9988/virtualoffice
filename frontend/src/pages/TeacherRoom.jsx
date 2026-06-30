import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRoom, createRoom, updateRoom, deleteRoom, getWaitingQueue, admitStudent, declineStudent, subscribeToEvents } from '../api';
import { useAuth } from '../store/auth';
import { useColorMode } from '../hooks/useColorMode';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
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

export default function TeacherRoom() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [room, setRoom] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [togglingRoom, setTogglingRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [admittingIds, setAdmittingIds] = useState(new Set());
  const [decliningIds, setDecliningIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    getMyRoom()
      .then((data) => { if (!cancelled) setRoom(data.rooms); })
      .catch(() => { if (!cancelled) setRoom(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;

    const fetchQueue = async () => {
      try {
        const data = await getWaitingQueue(room.id);
        if (!cancelled) setQueue(data.listOfWaitingStudent);
      } catch {
        if (!cancelled) setQueue([]);
      }
    };

    fetchQueue();

    const source = subscribeToEvents();
    source.addEventListener('waiting-queue-changed', fetchQueue);

    return () => {
      cancelled = true;
      source.close();
    };
  }, [room]);

  const refreshQueue = useCallback(async () => {
    if (!room) return;
    try {
      const data = await getWaitingQueue(room.id);
      setQueue(data.listOfWaitingStudent);
    } catch {
      setQueue([]);
    }
  }, [room]);

  const handleCreate = async () => {
    setCreatingRoom(true);
    try {
      const data = await createRoom();
      setRoom(data.room);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleToggle = async () => {
    if (!room) return;
    setTogglingRoom(true);
    try {
      const data = await updateRoom(room.id, { is_open: room.is_open ? 0 : 1 });
      setRoom((prev) => ({ ...prev, ...data.room }));
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingRoom(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your room? This cannot be undone.')) return;
    setDeletingRoom(true);
    try {
      await deleteRoom(room.id);
      setRoom(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingRoom(false);
    }
  };

  const handleAdmit = async (waitingId) => {
    setAdmittingIds((prev) => new Set(prev).add(waitingId));
    try {
      await admitStudent(waitingId);
      refreshQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdmittingIds((prev) => {
        const next = new Set(prev);
        next.delete(waitingId);
        return next;
      });
    }
  };

  const handleDecline = async (waitingId) => {
    setDecliningIds((prev) => new Set(prev).add(waitingId));
    try {
      await declineStudent(waitingId);
      refreshQueue();
    } catch (err) {
      alert(err.message);
    } finally {
      setDecliningIds((prev) => {
        const next = new Set(prev);
        next.delete(waitingId);
        return next;
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="bg.muted" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="magenta.500" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="bg.muted" p={6}>
      <VStack maxW="4xl" mx="auto" align="stretch" gap={6}>
        <Flex justify="space-between" align="center">
          <Heading size="lg">Teacher Dashboard</Heading>
          <HStack gap={4}>
            <Text color="fg.muted">{user?.name}</Text>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </HStack>
        </Flex>

        {!room ? (
          <Card.Root>
            <Card.Body textAlign="center" py={10}>
              <Text color="fg.muted" mb={4}>You don&apos;t have a room yet</Text>
              <Button colorPalette="magenta" size="lg" onClick={handleCreate} loading={creatingRoom}>
                Create Room
              </Button>
            </Card.Body>
          </Card.Root>
        ) : (
          <>
            <Card.Root>
              <Card.Body>
                <Flex justify="space-between" align="start">
                  <VStack align="start" gap={1}>
                    <Heading size="md">{room.name}</Heading>
                    {room.topic && <Text color="fg.muted" fontSize="sm">{room.topic}</Text>}
                    <Badge colorScheme={room.is_open ? 'green' : 'gray'} mt={1}>
                      {room.is_open ? '● Open' : '○ Closed'}
                    </Badge>
                  </VStack>
                  <HStack gap={2}>
                    {room.is_open && room.zoom_start_url && (
                      <Button
                        as="a"
                        href={room.zoom_start_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        colorScheme="green"
                        size="sm"
                      >
                        Desktop App
                      </Button>
                    )}
                    <Button
                      colorPalette={room.is_open ? 'yellow' : 'magenta'}
                      size="sm"
                      onClick={handleToggle}
                      loading={togglingRoom}
                    >
                      {room.is_open ? 'Close Room' : 'Open Room'}
                    </Button>
                    <Button colorScheme="red" size="sm" onClick={handleDelete} loading={deletingRoom}>
                      Delete
                    </Button>
                  </HStack>
                </Flex>
              </Card.Body>
            </Card.Root>

            <Heading size="md">Waiting Queue ({queue.length})</Heading>

            {queue.length === 0 ? (
              <Text color="fg.muted" textAlign="center" py={10}>No students waiting</Text>
            ) : (
              <Stack gap={3}>
                {queue.map((entry) => (
                  <Card.Root key={entry.id}>
                    <Card.Body>
                      <Flex justify="space-between" align="center">
                        <VStack align="start" gap={1}>
                          <Text fontWeight="medium">{entry.student_name}</Text>
                          <Text color="fg.muted" fontSize="sm">{entry.student_email}</Text>
                          {entry.note && (
                            <Text color="fg.muted" fontSize="xs" fontStyle="italic">
                              &ldquo;{entry.note}&rdquo;
                            </Text>
                          )}
                          <Text color="fg.muted" fontSize="xs">
                            Waiting since {new Date(entry.waiting_since).toLocaleTimeString()}
                          </Text>
                        </VStack>
                        <HStack gap={2}>
                          <Button
                            colorScheme="green"
                            size="sm"
                            onClick={() => handleAdmit(entry.id)}
                            loading={admittingIds.has(entry.id)}
                          >
                            Admit
                          </Button>
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleDecline(entry.id)}
                            loading={decliningIds.has(entry.id)}
                          >
                            Decline
                          </Button>
                        </HStack>
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                ))}
              </Stack>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
}
