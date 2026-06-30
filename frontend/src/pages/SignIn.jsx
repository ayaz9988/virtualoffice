import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../store/auth';
import { useColorMode } from '../components/ColorModeProvider';
import { Box, Button, Field, Heading, IconButton, Input, Link, Text, VStack } from '@chakra-ui/react';

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

export default function SignIn() {
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="bg.muted" display="flex" alignItems="center" justifyContent="center" px={4}>
      <ThemeToggle />
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg="bg"
        p={8}
        rounded="2xl"
        shadow="lg"
        w="100%"
        maxW="md"
      >
        <VStack gap={6} align="stretch">
          <Heading size="lg" textAlign="center">Sign In</Heading>

          {error && (
            <Text color="red.400" fontSize="sm" textAlign="center">{error}</Text>
          )}

          <Field.Root required>
            <Field.Label>Email</Field.Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="lg"
            />
          </Field.Root>

          <Field.Root required>
            <Field.Label>Password</Field.Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="lg"
            />
          </Field.Root>

          <Button type="submit" colorPalette="magenta" size="lg" w="full" loading={loading}>
            Sign In
          </Button>

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Don&apos;t have an account?{' '}
            <Link as={RouterLink} to="/signup" color="magenta.400" _hover={{ textDecoration: 'underline' }}>
              Sign Up
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
