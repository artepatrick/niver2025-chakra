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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { EditIcon, CheckIcon, CloseIcon, SearchIcon, TimeIcon, MusicNoteIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const EVENT_DATE = new Date('2025-06-28T16:00:00');

const Dashboard = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
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

  // Fetch confirmations
  const fetchConfirmations = async () => {
    if (!email) {
      toast({
        title: 'Email necessário',
        description: 'Por favor, insira um email para buscar as confirmações.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    console.log('=== Iniciando fetchConfirmations ===');
    console.log('BASE_URL:', BASE_URL);
    console.log('URL completa:', `${BASE_URL}/api/niver2025/getPresenceConfirmations`);
    
    try {
      console.log('Fazendo requisição POST...');
      const response = await fetch(`${BASE_URL}/api/niver2025/getPresenceConfirmations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      console.log('=== Detalhes da Resposta ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      if (responseData.code === 200 && responseData.data.exists) {
        console.log('Atualizando estado com os dados...');
        setConfirmations(responseData.data.confirmations);
        calculateStats(responseData.data.confirmations);
      } else {
        setConfirmations([]);
        calculateStats([]);
        toast({
          title: 'Nenhuma confirmação encontrada',
          description: 'Não foram encontradas confirmações para este email.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      console.log('=== fetchConfirmations concluído com sucesso ===');
    } catch (error) {
      console.error('=== Erro em fetchConfirmations ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      console.log('Estado de loading atualizado para:', false);
    }
  };

  // Calculate statistics
  const calculateStats = (data) => {
    console.log('=== Calculando estatísticas ===');
    console.log('Dados recebidos:', data);
    
    const stats = {
      total: data.length,
      confirmed: data.filter(item => item.status === 'confirmado').length,
      musicSuggestions: data.filter(item => item.musicSuggestion).length,
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

  // Update confirmation status
  const updateStatus = async (id, newStatus) => {
    console.log('=== Iniciando updateStatus ===');
    console.log('ID:', id);
    console.log('Novo status:', newStatus);
    
    try {
      const payload = {
        status: newStatus,
      };
      
      console.log('Payload:', payload);
      console.log('URL:', `${BASE_URL}/api/niver2025/presence-confirmations/${id}/status`);
      
      const response = await fetch(`${BASE_URL}/api/niver2025/presence-confirmations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('Status da resposta:', response.status);
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      console.log('Atualizando lista de confirmações...');
      await fetchConfirmations();
      
      toast({
        title: 'Status atualizado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('=== Erro em updateStatus ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
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
      console.log('URL:', `${BASE_URL}/api/niver2025/presence-confirmations/${formData.id}`);
      
      const response = await fetch(`${BASE_URL}/api/niver2025/presence-confirmations/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      console.log('Status da resposta:', response.status);
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      console.log('Atualizando lista de confirmações...');
      await fetchConfirmations();
      
      onClose();
      toast({
        title: 'Dados atualizados',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('=== Erro em updateConfirmation ===');
      console.error('Tipo do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      
      toast({
        title: 'Erro ao atualizar dados',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <Container maxW="container.xl" py={8}>
      <Link as={RouterLink} to="/" color="brand.500" fontSize="sm" mb={4} display="block">
        ← Voltar para a página inicial
      </Link>
      
      {/* Dashboard Header */}
      <Box mb={8} p={6} bg="white" borderRadius="xl" boxShadow="lg">
        <Heading mb={6} size="lg">Dashboard de Confirmações</Heading>
        
        {/* Countdown Timer */}
        <Box mb={8} p={4} bg="brand.50" borderRadius="lg">
          <Flex align="center" mb={2}>
            <Icon as={TimeIcon} color="brand.500" mr={2} />
            <Text fontSize="lg" fontWeight="bold">Contagem Regressiva para o Evento</Text>
          </Flex>
          <SimpleGrid columns={4} spacing={4}>
            <Box textAlign="center" p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">{countdown.days}</Text>
              <Text fontSize="sm" color="gray.600">Dias</Text>
            </Box>
            <Box textAlign="center" p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">{countdown.hours}</Text>
              <Text fontSize="sm" color="gray.600">Horas</Text>
            </Box>
            <Box textAlign="center" p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">{countdown.minutes}</Text>
              <Text fontSize="sm" color="gray.600">Minutos</Text>
            </Box>
            <Box textAlign="center" p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="2xl" fontWeight="bold" color="brand.500">{countdown.seconds}</Text>
              <Text fontSize="sm" color="gray.600">Segundos</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box p={5} bg="white" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.600">Total de Convidados</StatLabel>
              <StatNumber fontSize="3xl" color="brand.500">{stats.total}</StatNumber>
            </Stat>
          </Box>
          <Box p={5} bg="white" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.600">Confirmados</StatLabel>
              <StatNumber fontSize="3xl" color="green.500">{stats.confirmed}</StatNumber>
            </Stat>
          </Box>
          <Box p={5} bg="white" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.600">Músicas Sugeridas</StatLabel>
              <StatNumber fontSize="3xl" color="purple.500">{stats.musicSuggestions}</StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Email Search */}
      <HStack mb={8} spacing={4}>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite o email para buscar confirmações"
          />
        </FormControl>
        <Button
          colorScheme="blue"
          leftIcon={<SearchIcon />}
          onClick={fetchConfirmations}
          isLoading={loading}
          mt={8}
        >
          Buscar
        </Button>
      </HStack>

      {/* Table */}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {confirmations.map((confirmation) => (
              <Tr key={confirmation.id}>
                <Td>{confirmation.names.join(', ')}</Td>
                <Td>{confirmation.email}</Td>
                <Td>{confirmation.phone}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(confirmation.status)}>
                    {confirmation.status}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    leftIcon={<EditIcon />}
                    mr={2}
                    onClick={() => handleEdit(confirmation)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<CheckIcon />}
                    mr={2}
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
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Confirmação</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedConfirmation && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Nomes</FormLabel>
                  <Input
                    value={selectedConfirmation.names.join(', ')}
                    onChange={(e) =>
                      setSelectedConfirmation({
                        ...selectedConfirmation,
                        names: e.target.value.split(',').map((name) => name.trim()),
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={selectedConfirmation.email}
                    onChange={(e) =>
                      setSelectedConfirmation({
                        ...selectedConfirmation,
                        email: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Telefone</FormLabel>
                  <Input
                    value={selectedConfirmation.phone}
                    onChange={(e) =>
                      setSelectedConfirmation({
                        ...selectedConfirmation,
                        phone: e.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={selectedConfirmation.status}
                    onChange={(e) =>
                      setSelectedConfirmation({
                        ...selectedConfirmation,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </Select>
                </FormControl>
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={() => updateConfirmation(selectedConfirmation)}
                >
                  Salvar Alterações
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Dashboard;
