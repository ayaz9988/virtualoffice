import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../store/auth';
import { useColorMode } from '../components/ColorModeProvider';
import { Box, Button, Field, Heading, HStack, IconButton, Input, Link, RadioGroup, Text, VStack } from '@chakra-ui/react';

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

export default function SignUp() {
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(name, email, password, role);
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
          <Heading size="lg" textAlign="center">Sign Up</Heading>

          {error && (
            <Text color="red.400" fontSize="sm" textAlign="center">{error}</Text>
          )}

          <Field.Root required>
            <Field.Label>Name</Field.Label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="lg"
            />
          </Field.Root>

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

          <RadioGroup.Root
            defaultValue="student"
            value={role}
            onValueChange={(e) => setRole(e.value)}
          >
            <Text fontSize="sm" fontWeight="medium" mb={2}>I am a...</Text>
            <HStack gap={4}>
              <RadioGroup.Item value="student" cursor="pointer">
                <RadioGroup.ItemText>Student</RadioGroup.ItemText>
                <RadioGroup.ItemControl />
              </RadioGroup.Item>
              <RadioGroup.Item value="teacher" cursor="pointer">
                <RadioGroup.ItemText>Teacher</RadioGroup.ItemText>
                <RadioGroup.ItemControl />
              </RadioGroup.Item>
            </HStack>
          </RadioGroup.Root>

          <Button type="submit" colorPalette="magenta" size="lg" w="full" loading={loading}>
            Sign Up
          </Button>

          <Text fontSize="sm" textAlign="center" color="fg.muted">
            Already have an account?{' '}
            <Link as={RouterLink} to="/signin" color="magenta.400" _hover={{ textDecoration: 'underline' }}>
              Sign In
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
