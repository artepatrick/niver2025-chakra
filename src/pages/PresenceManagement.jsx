import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Heading,
  Container,
  useToast,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Image,
  VStack,
  HStack,
  Link,
  Icon,
} from '@chakra-ui/react';
import { FaSpotify } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getErrorMessage = (error) => {
  if (error.message.includes('email já está cadastrado')) {
    return 'Este email já está cadastrado no sistema';
  } else if (error.message.includes('Names deve ser um array')) {
    return 'O campo de nomes deve ser preenchido corretamente';
  } else if (error.message.includes('Status inválido')) {
    return 'Status inválido. Valores permitidos: pendente, confirmado, cancelado';
  }
  return error.message;
};

const PresenceManagement = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  });
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const statBgColors = {
    total: useColorModeValue('white', 'gray.800'),
    confirmed: useColorModeValue('green.50', 'green.900'),
    pending: useColorModeValue('yellow.50', 'yellow.900'),
    cancelled: useColorModeValue('red.50', 'red.900'),
  };

  // Fetch confirmations
  const fetchConfirmations = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Buscando confirmações...');
      
      const response = await fetch(`${API_BASE_URL}/api/niver2025/getAllConfirmations`);
      const data = await response.json();
      
      console.log('Resposta do servidor:', JSON.stringify(data, null, 2));
      
      // Debug music suggestions
      data.forEach(confirmation => {
        console.log('Confirmation ID:', confirmation.id);
        console.log('Music Suggestions:', confirmation.music_suggestions);
        if (confirmation.music_suggestions) {
          confirmation.music_suggestions.forEach(suggestion => {
            console.log('Album Image URL:', suggestion.album_image_url);
          });
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${data.message || 'Erro desconhecido'}`);
      }
      
      setConfirmations(data);
      
      // Calculate stats
      const newStats = {
        total: data.length,
        confirmed: data.filter(c => c.status === 'confirmado').length,
        pending: data.filter(c => c.status === 'pendente').length,
        cancelled: data.filter(c => c.status === 'cancelado').length,
      };
      setStats(newStats);
    } catch (e) {
      console.error('Erro ao buscar confirmações:', e);
      toast({
        title: 'Erro ao carregar confirmações',
        description: getErrorMessage(e),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const payload = { id, status: newStatus };
      console.log('Atualizando status:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/niver2025/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Resposta do servidor:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${data.message || 'Erro desconhecido'}`);
      }

      setConfirmations(prev =>
        prev.map(conf =>
          conf.id === id ? { ...conf, status: newStatus } : conf
        )
      );

      toast({
        title: 'Status atualizado',
        description: 'O status da confirmação foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const StatCard = ({ label, value, percentage, type, bgColor }) => (
    <Stat
      px={4}
      py={5}
      shadow="xl"
      border="1px solid"
      borderColor={borderColor}
      rounded="lg"
      bg={bgColor}
    >
      <StatLabel color={textColor}>{label}</StatLabel>
      <StatNumber color={textColor}>{value}</StatNumber>
      <StatHelpText>
        <StatArrow type={type} />
        {percentage}% do total
      </StatHelpText>
    </Stat>
  );

  const MusicSuggestionCard = ({ suggestion }) => {
    console.log('Rendering MusicSuggestionCard with suggestion:', suggestion);
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        bg={bgColor}
        borderColor={borderColor}
        width="100%"
      >
        <HStack spacing={4}>
          <Box 
            width="100px" 
            height="100px" 
            bg="gray.100" 
            borderRadius="md" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            overflow="hidden"
          >
            {suggestion.album_image_url ? (
              <Image
                src={suggestion.album_image_url}
                alt={`${suggestion.song_title} album cover`}
                boxSize="100px"
                objectFit="cover"
                fallback={
                  <Box 
                    p={2} 
                    textAlign="center" 
                    color="gray.500"
                    fontSize="xs"
                  >
                    Sem imagem
                  </Box>
                }
                onError={(e) => {
                  console.error('Error loading image:', suggestion.album_image_url);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Box 
                p={2} 
                textAlign="center" 
                color="gray.500"
                fontSize="xs"
              >
                Sem imagem
              </Box>
            )}
          </Box>
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" color={textColor}>{suggestion.song_title}</Text>
            <Text color={textColor}>{suggestion.artist}</Text>
            {suggestion.album_name && (
              <Text fontSize="sm" color={textColor}>{suggestion.album_name}</Text>
            )}
            {suggestion.spotify_url && (
              <Link href={suggestion.spotify_url} isExternal>
                <HStack spacing={1}>
                  <Icon as={FaSpotify} color="green.500" />
                  <Text fontSize="sm" color="green.500">Abrir no Spotify</Text>
                </HStack>
              </Link>
            )}
            <Text fontSize="xs" color="gray.500">
              URL da imagem: {suggestion.album_image_url || 'Não disponível'}
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6} color={textColor}>Gerenciamento de Confirmações</Heading>
      
      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height="120px" />
          ))}
        </SimpleGrid>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <StatCard
              label="Total de Confirmações"
              value={stats.total}
              percentage={100}
              type="increase"
              bgColor={statBgColors.total}
            />
            <StatCard
              label="Confirmados"
              value={stats.confirmed}
              percentage={stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(1) : 0}
              type="increase"
              bgColor={statBgColors.confirmed}
            />
            <StatCard
              label="Pendentes"
              value={stats.pending}
              percentage={stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0}
              type="decrease"
              bgColor={statBgColors.pending}
            />
            <StatCard
              label="Cancelados"
              value={stats.cancelled}
              percentage={stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}
              type="decrease"
              bgColor={statBgColors.cancelled}
            />
          </SimpleGrid>

          <Box 
            overflowX="auto" 
            bg={bgColor}
            border="1px solid"
            borderColor={borderColor}
            rounded="lg"
            shadow="sm"
          >
            {loading ? (
              <Box p={4}>
                <SkeletonText noOfLines={5} spacing={4} />
              </Box>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color={textColor}>Nomes</Th>
                    <Th color={textColor}>Email</Th>
                    <Th color={textColor}>Telefone</Th>
                    <Th color={textColor}>Status</Th>
                    <Th color={textColor}>Data de Criação</Th>
                    <Th color={textColor}>Sugestões Musicais</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {confirmations.map((confirmation) => (
                    <Tr key={confirmation.id}>
                      <Td>
                        {JSON.parse(confirmation.names).map((name, index) => (
                          <Text key={index} color={textColor}>{name}</Text>
                        ))}
                      </Td>
                      <Td color={textColor}>{confirmation.email}</Td>
                      <Td color={textColor}>{confirmation.phone}</Td>
                      <Td>
                        <Select
                          value={confirmation.status}
                          onChange={(e) => handleStatusChange(confirmation.id, e.target.value)}
                          size="sm"
                          width="150px"
                          bg={bgColor}
                          color={textColor}
                          borderColor={borderColor}
                          _hover={{ borderColor: 'purple.500' }}
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)' }}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="confirmado">Confirmado</option>
                          <option value="cancelado">Cancelado</option>
                        </Select>
                      </Td>
                      <Td color={textColor}>
                        {new Date(confirmation.created_at).toLocaleDateString('pt-BR')}
                      </Td>
                      <Td>
                        <VStack spacing={2} align="start">
                          {confirmation.music_suggestions?.length > 0 ? (
                            confirmation.music_suggestions.map((suggestion) => (
                              <MusicSuggestionCard key={suggestion.id} suggestion={suggestion} />
                            ))
                          ) : (
                            <Text color="gray.500" fontSize="sm">Nenhuma sugestão musical</Text>
                          )}
                        </VStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default PresenceManagement; 