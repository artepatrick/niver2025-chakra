import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Grid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  Text,
  Link,
  HStack,
  SimpleGrid,
  Flex,
  Icon,
  Image,
  Skeleton,
  SkeletonText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { EditIcon, CheckIcon, CloseIcon, TimeIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { MdMusicNote } from 'react-icons/md';
import { FaSpotify } from 'react-icons/fa';
import { syncPlaylist } from '../spotifyPlaylistSync';
import { getAuthUrl } from "../spotifyServer";

const BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://omnicast-backend.fly.dev');
const EVENT_DATE = new Date('2025-06-28T16:00:00');

console.log('BASE_URL:', BASE_URL);

const Dashboard = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    musicSuggestions: 0,
  });
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedConfirmation, setSelectedConfirmation] = useState(null);
  const toast = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch all confirmations with improved error handling
  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/niver2025/getAllConfirmations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json();
      
      if (responseData.code === 200) {
        setConfirmations(responseData.data);
        calculateStats(responseData.data);
      } else {
        setConfirmations([]);
        calculateStats([]);
        throw new Error('Não foi possível carregar as confirmações.');
      }
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    console.log('=== Calculando estatísticas ===');
    console.log('Dados recebidos:', data);
    
    const stats = {
      total: data.reduce((acc, item) => acc + (Array.isArray(item.names) ? item.names.length : 0), 0),
      confirmed: data.filter(item => item.status === 'confirmado')
        .reduce((acc, item) => acc + (Array.isArray(item.names) ? item.names.length : 0), 0),
      pending: data.filter(item => item.status === 'pendente' || item.status === 'cancelado')
        .reduce((acc, item) => acc + (Array.isArray(item.names) ? item.names.length : 0), 0),
      musicSuggestions: data.reduce((acc, item) => acc + (Array.isArray(item.music_suggestions) ? item.music_suggestions.length : 0), 0),
    };
    
    console.log('Estatísticas calculadas:', stats);
    setStats(stats);
  };

  // Update countdown timer
  const updateCountdown = () => {
    const now = new Date();
    const difference = EVENT_DATE - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }
  };

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Add error handling for API connection
  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${BASE_URL}/healthy`);
      console.log('Response:', response);
      if (!response.ok) {
        console.error('API server is not responding correctly');
        toast({
          title: 'Erro de conexão',
          description: 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Failed to connect to API:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Fetch confirmations on component mount
  useEffect(() => {
    checkApiConnection();
    fetchConfirmations();
  }, []);

  // Update confirmation status
  const updateStatus = async (id, newStatus) => {
    console.log('=== Iniciando updateStatus ===');
    console.log('ID:', id);
    console.log('Novo status:', newStatus);
    
    try {
      // First get the current confirmation details
      const currentConfirmation = confirmations.find(c => c.id === id);
      if (!currentConfirmation) {
        throw new Error('Confirmação não encontrada');
      }

      // Validate status transition
      if (newStatus === 'cancelado' && currentConfirmation.status === 'cancelado') {
        toast({
          title: 'Ação não permitida',
          description: 'Esta confirmação já está cancelada.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Ensure names is an array
      const namesArray = Array.isArray(currentConfirmation.names) 
        ? currentConfirmation.names 
        : currentConfirmation.names.split(',').map(name => name.trim());

      const payload = {
        id: id,
        names: namesArray,
        email: currentConfirmation.email,
        phone: currentConfirmation.phone,
        status: newStatus
      };
      
      console.log('Payload:', payload);
      console.log('URL:', `${BASE_URL}/api/niver2025/updatePresenceDetails`);
      
      const response = await fetch(`${BASE_URL}/api/niver2025/updatePresenceDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Status da resposta:', response.status);
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      if (responseData.code === 200 && responseData.data.updatedRecord) {
        console.log('Registro atualizado recebido:', responseData.data.updatedRecord);
        
        // Create the updated array once
        const updatedConfirmations = confirmations.map(confirmation => 
          confirmation.id === id ? responseData.data.updatedRecord : confirmation
        );
        
        // Update the local state with the updated array
        setConfirmations(updatedConfirmations);
        
        // Calculate stats using the same updated array
        calculateStats(updatedConfirmations);
        
        // Show appropriate message based on the new status
        const statusMessages = {
          'confirmado': 'Confirmação realizada com sucesso!',
          'cancelado': 'Presença cancelada com sucesso.',
          'pendente': 'Status alterado para pendente.'
        };
        
        toast({
          title: 'Status atualizado',
          description: statusMessages[newStatus] || responseData.data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(responseData.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('=== Erro em updateStatus ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Handle specific error cases
      let errorMessage = error.message;
      if (error.message.includes('email já está cadastrado')) {
        errorMessage = 'Este email já está cadastrado no sistema';
      } else if (error.message.includes('Names deve ser um array')) {
        errorMessage = 'O campo de nomes deve ser preenchido corretamente';
      } else if (error.message.includes('Status inválido')) {
        errorMessage = 'Status inválido. Valores permitidos: pendente, confirmado, cancelado';
      }
      
      toast({
        title: 'Erro ao atualizar status',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Update confirmation details
  const updateConfirmation = async (formData) => {
    console.log('=== Iniciando updateConfirmation ===');
    console.log('Dados do formulário:', formData);
    
    try {
      // Ensure names is an array
      const namesArray = Array.isArray(formData.names) 
        ? formData.names 
        : formData.names.split(',').map(name => name.trim());

      const payload = {
        id: formData.id,
        names: namesArray,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
      };
      
      console.log('URL:', `${BASE_URL}/api/niver2025/updatePresenceDetails`);
      console.log('Payload:', payload);
      
      const response = await fetch(`${BASE_URL}/api/niver2025/updatePresenceDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Status da resposta:', response.status);
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      if (responseData.code === 200) {
        console.log('Atualizando lista de confirmações...');
        await fetchConfirmations();
        
        onClose();
        toast({
          title: 'Dados atualizados',
          description: responseData.data.message || 'Dados atualizados com sucesso',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(responseData.message || 'Erro ao atualizar dados');
      }
    } catch (error) {
      console.error('=== Erro em updateConfirmation ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Handle specific error cases
      let errorMessage = error.message;
      if (error.message.includes('email já está cadastrado')) {
        errorMessage = 'Este email já está cadastrado no sistema';
      } else if (error.message.includes('Names deve ser um array')) {
        errorMessage = 'O campo de nomes deve ser preenchido corretamente';
      } else if (error.message.includes('Status inválido')) {
        errorMessage = 'Status inválido. Valores permitidos: pendente, confirmado, cancelado';
      }
      
      toast({
        title: 'Erro ao atualizar dados',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (confirmation) => {
    setSelectedConfirmation(confirmation);
    onOpen();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado':
        return 'green';
      case 'pendente':
        return 'yellow';
      case 'cancelado':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleSyncPlaylist = async () => {
    try {
      setIsSyncing(true);
      
      toast({
        title: 'Sincronizando playlist...',
        description: 'Aguarde enquanto sincronizamos as músicas sugeridas com a playlist do Spotify',
        status: 'info',
        duration: null,
        isClosable: false,
      });

      console.log('Número de confirmações:', confirmations.length);
      const result = await syncPlaylist(confirmations);
      console.log('Resultado da sincronização:', result);
      
      toast.closeAll();
      
      if (!result.success) {
        if (result.needsAuth) {
          console.log('Autenticação necessária, redirecionando...');
          const authUrl = getAuthUrl();
          // Save current state before redirecting
          localStorage.setItem('spotify_sync_pending', 'true');
          window.location.href = authUrl;
          return;
        }
        
        console.error('Erro na sincronização:', result.error);
        toast({
          title: 'Erro ao sincronizar playlist',
          description: result.error || 'Ocorreu um erro ao sincronizar a playlist',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      toast({
        title: 'Playlist sincronizada',
        description: `${result.addedTracks} novas músicas adicionadas à playlist`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error syncing playlist:', error);
      console.error('Stack trace:', error.stack);
      toast.closeAll();
      toast({
        title: 'Erro ao sincronizar playlist',
        description: error.message || 'Ocorreu um erro ao sincronizar a playlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Link 
        as={RouterLink} 
        to="/" 
        color="brand.400" 
        fontSize="sm" 
        mb={4} 
        display="block"
        _hover={{ color: 'brand.300' }}
      >
        ← Voltar para a página inicial
      </Link>
      
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="xl" color="brand.400">Dashboard</Heading>
          <Button
            leftIcon={<FaSpotify />}
            colorScheme="green"
            onClick={handleSyncPlaylist}
            isLoading={isSyncing}
            loadingText="Sincronizando..."
          >
            Sincronizar Playlist
          </Button>
        </HStack>

        {/* Dashboard Header */}
        <Box mb={8} p={6} bg="gray.800" borderRadius="xl" boxShadow="lg">
          <Heading 
            mb={6} 
            size="lg" 
            color="brand.400" 
            fontWeight="900"
            textShadow="0 0 20px rgba(167, 139, 250, 0.3)"
          >
            Dashboard de Confirmações
          </Heading>
          
          {/* Countdown Timer */}
          <Box mb={8} p={4} bg="gray.700" borderRadius="lg">
            <Flex align="center" mb={2}>
              <Icon as={TimeIcon} color="brand.400" mr={2} />
              <Text fontSize="lg" fontWeight="bold" color="gray.200">Contagem Regressiva para o Evento</Text>
            </Flex>
            <SimpleGrid 
              columns={{ base: 2, sm: 4 }} 
              spacing={4}
              templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }}
            >
              {[
                { value: countdown.days, label: 'Dias' },
                { value: countdown.hours, label: 'Horas' },
                { value: countdown.minutes, label: 'Minutos' },
                { value: countdown.seconds, label: 'Segundos' }
              ].map((item, index) => (
                <Box 
                  key={index}
                  textAlign="center" 
                  p={3} 
                  bg="gray.800" 
                  borderRadius="md" 
                  boxShadow="sm"
                  _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                >
                  <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="brand.400">
                    {item.value}
                  </Text>
                  <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300">
                    {item.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          {/* Statistics */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
            {[
              { label: 'Total de Convidados', value: stats.total, color: 'brand.400', bgColor: 'gray.700', borderColor: 'brand.400' },
              { label: 'Confirmados', value: stats.confirmed, color: 'green.400', bgColor: 'gray.700', borderColor: 'green.400' },
              { label: 'Pendentes', value: stats.pending, color: 'yellow.400', bgColor: 'gray.700', borderColor: 'yellow.400' },
              { label: 'Músicas Sugeridas', value: stats.musicSuggestions, color: 'brand.400', bgColor: 'gray.700', borderColor: 'brand.400' }
            ].map((stat, index) => (
              <Box 
                key={index}
                p={5} 
                bg={stat.bgColor}
                borderRadius="lg" 
                boxShadow="lg"
                border="2px solid"
                borderColor={stat.borderColor}
                _hover={{ 
                  transform: 'translateY(-2px)', 
                  transition: 'all 0.2s',
                  boxShadow: `0 0 15px ${stat.borderColor}`
                }}
              >
                <Stat>
                  <StatLabel fontSize="lg" color="white" fontWeight="medium">{stat.label}</StatLabel>
                  <StatNumber fontSize="3xl" color={stat.value > 0 ? stat.color : "gray.400"} fontWeight="bold">
                    {stat.value}
                  </StatNumber>
                </Stat>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Tabs */}
        <Tabs variant="soft-rounded" colorScheme="brand" onChange={(index) => setActiveTab(index)}>
          <TabList mb={4}>
            <Tab 
              fontWeight="bold" 
              _selected={{ 
                color: 'brand.400',
                bg: 'gray.700',
                boxShadow: 'none'
              }}
              _hover={{
                bg: 'gray.700'
              }}
            >
              Convidados
            </Tab>
            <Tab 
              fontWeight="bold"
              _selected={{ 
                color: 'brand.400',
                bg: 'gray.700',
                boxShadow: 'none'
              }}
              _hover={{
                bg: 'gray.700'
              }}
            >
              Músicas Sugeridas
            </Tab>
          </TabList>

          <TabPanels>
            {/* Guests Panel */}
            <TabPanel p={0}>
              <Box 
                overflowX="auto" 
                bg="gray.800"
                borderRadius="xl" 
                boxShadow="lg" 
                p={6}
                border="1px solid"
                borderColor="gray.700"
              >
                {loading ? (
                  <Box p={4}>
                    <SkeletonText noOfLines={5} spacing={4} />
                  </Box>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th color="gray.200">Convidados</Th>
                        <Th color="gray.200">Email</Th>
                        <Th color="gray.200">Telefone</Th>
                        <Th color="gray.200">Status</Th>
                        <Th color="gray.200">Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {confirmations.length > 0 ? (
                        confirmations.map((confirmation) => (
                          <Tr key={confirmation.id} _hover={{ bg: 'gray.700' }}>
                            <Td color="gray.200">{confirmation.names.join(', ')}</Td>
                            <Td color="gray.200">{confirmation.email}</Td>
                            <Td color="gray.200">{confirmation.phone}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(confirmation.status)}>
                                {confirmation.status}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  leftIcon={<EditIcon />}
                                  colorScheme="brand"
                                  variant="outline"
                                  onClick={() => handleEdit(confirmation)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  leftIcon={<CheckIcon />}
                                  onClick={() => updateStatus(confirmation.id, 'confirmado')}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  leftIcon={<CloseIcon />}
                                  onClick={() => updateStatus(confirmation.id, 'cancelado')}
                                >
                                  Cancelar
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={5}>
                            <Box textAlign="center" py={8}>
                              <Text fontSize="lg" color="gray.300" fontWeight="medium">
                                {loading ? 'Carregando confirmações...' : 'Nenhuma confirmação encontrada.'}
                              </Text>
                            </Box>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>

          {/* Music Suggestions Panel */}
          <TabPanel>
            <Box>
              {/* Spotify Playlist Embed */}
              <Box mb={8} borderRadius="xl" overflow="hidden">
                <iframe 
                  style={{ borderRadius: "12px" }} 
                  src="https://open.spotify.com/embed/playlist/3885YwVwdWiLefIxZfmu3d?utm_source=generator" 
                  width="100%" 
                  height="352" 
                  frameBorder="0" 
                  allowFullScreen="" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                />
              </Box>

              {loading ? (
                <Box p={4}>
                  <SkeletonText noOfLines={5} spacing={4} />
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {confirmations.flatMap(confirmation => 
                    confirmation.music_suggestions?.map(music => (
                      <Box 
                        key={music.id}
                        bg="gray.700"
                        borderRadius="lg"
                        p={4}
                        _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                      >
                        <HStack spacing={4} align="start">
                          <Box 
                            minW="80px" 
                            h="80px" 
                            bg="gray.600" 
                            borderRadius="md" 
                            overflow="hidden"
                            position="relative"
                          >
                            {music.album_image_url && (
                              <Image
                                src={music.album_image_url}
                                alt={`Capa do álbum ${music.album_name}`}
                                boxSize="80px"
                                objectFit="cover"
                                fallback={
                                  <Box 
                                    w="80px" 
                                    h="80px" 
                                    bg="gray.600" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                  >
                                    <Icon as={TimeIcon} color="brand.400" boxSize={8} />
                                  </Box>
                                }
                              />
                            )}
                          </Box>
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="bold" color="brand.400" fontSize="lg">
                              {music.song_title}
                            </Text>
                            <Text color="gray.300">{music.artist}</Text>
                            {music.album_name && (
                              <Text color="gray.400" fontSize="sm">
                                Álbum: {music.album_name}
                              </Text>
                            )}
                            {music.spotify_url && (
                              <Link 
                                href={music.spotify_url} 
                                isExternal 
                                color="green.400" 
                                fontSize="sm"
                                _hover={{ color: 'green.300' }}
                              >
                                Ouvir no Spotify →
                              </Link>
                            )}
                            <Text color="gray.400" fontSize="xs">
                              Sugerido por: {confirmation.names[0]}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))
                  )}
                </SimpleGrid>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

        {/* Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay bg="blackAlpha.700" />
          <ModalContent bg="gray.800" color="gray.200">
            <ModalHeader color="brand.400" fontWeight="900">Editar Confirmação</ModalHeader>
            <ModalCloseButton color="gray.200" />
            <ModalBody pb={6}>
              {selectedConfirmation && (
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel color="gray.200">Nomes</FormLabel>
                    <Input
                      bg="gray.700"
                      color="gray.200"
                      value={selectedConfirmation.names.join(', ')}
                      onChange={(e) =>
                        setSelectedConfirmation({
                          ...selectedConfirmation,
                          names: e.target.value.split(',').map((name) => name.trim()),
                        })
                      }
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.200">Email</FormLabel>
                    <Input
                      bg="gray.700"
                      color="gray.200"
                      value={selectedConfirmation.email}
                      onChange={(e) =>
                        setSelectedConfirmation({
                          ...selectedConfirmation,
                          email: e.target.value,
                        })
                      }
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.200">Telefone</FormLabel>
                    <Input
                      bg="gray.700"
                      color="gray.200"
                      value={selectedConfirmation.phone}
                      onChange={(e) =>
                        setSelectedConfirmation({
                          ...selectedConfirmation,
                          phone: e.target.value,
                        })
                      }
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="gray.200">Status</FormLabel>
                    <Select
                      bg="gray.700"
                      color="gray.200"
                      value={selectedConfirmation.status}
                      onChange={(e) =>
                        setSelectedConfirmation({
                          ...selectedConfirmation,
                          status: e.target.value,
                        })
                      }
                      _hover={{ borderColor: 'brand.400' }}
                      _focus={{ borderColor: 'brand.400', boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)' }}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="cancelado">Cancelado</option>
                    </Select>
                  </FormControl>
                  {selectedConfirmation.music_suggestions && selectedConfirmation.music_suggestions.length > 0 && (
                    <FormControl>
                      <FormLabel color="gray.200">Músicas Sugeridas</FormLabel>
                      <VStack spacing={2} align="stretch" bg="gray.700" p={3} borderRadius="md">
                        {selectedConfirmation.music_suggestions.map((music) => (
                          <Box 
                            key={music.id} 
                            p={2} 
                            bg="gray.600" 
                            borderRadius="sm"
                            _hover={{ bg: 'gray.500' }}
                          >
                            <HStack spacing={3}>
                              {music.album_image_url && (
                                <Image
                                  src={music.album_image_url}
                                  alt={`Capa do álbum ${music.album_name}`}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              )}
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" color="brand.400">{music.song_title}</Text>
                                <Text color="gray.300">{music.artist}</Text>
                                {music.spotify_url && (
                                  <Link 
                                    href={music.spotify_url} 
                                    isExternal 
                                    color="green.400" 
                                    fontSize="sm"
                                    _hover={{ color: 'green.300' }}
                                  >
                                    Ouvir no Spotify →
                                  </Link>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </FormControl>
                  )}
                  <Button
                    colorScheme="brand"
                    width="full"
                    onClick={() => updateConfirmation(selectedConfirmation)}
                    _hover={{ bg: 'brand.600' }}
                  >
                    Salvar Alterações
                  </Button>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default Dashboard;
