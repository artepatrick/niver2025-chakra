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
import { EditIcon, CheckIcon, CloseIcon, TimeIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://omnicast-backend.fly.dev');
const EVENT_DATE = new Date('2025-06-28T16:00:00');

console.log('BASE_URL:', BASE_URL);

const Dashboard = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch all confirmations
  const fetchConfirmations = async () => {
    setLoading(true);
    console.log('=== Iniciando fetchConfirmations ===');
    console.log('BASE_URL:', BASE_URL);
    console.log('URL completa:', `${BASE_URL}/api/niver2025/getAllConfirmations`);
    
    try {
      console.log('Fazendo requisição GET...');
      const response = await fetch(`${BASE_URL}/api/niver2025/getAllConfirmations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('=== Detalhes da Resposta ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      const responseData = await response.json();
      console.log('Resposta:', responseData);
      
      if (responseData.code === 200) {
        console.log('Atualizando estado com os dados...');
        setConfirmations(responseData.data);
        calculateStats(responseData.data);
      } else {
        setConfirmations([]);
        calculateStats([]);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as confirmações.',
          status: 'error',
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
        
        toast({
          title: 'Status atualizado',
          description: responseData.data.message || `Status alterado para: ${responseData.data.updatedRecord.status}`,
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

  return (
    <Container maxW="container.xl" py={8}>
      <Link as={RouterLink} to="/" color="brand.500" fontSize="sm" mb={4} display="block">
        ← Voltar para a página inicial
      </Link>
      
      {/* Dashboard Header */}
      <Box mb={8} p={6} variant="customBg" borderRadius="xl" boxShadow="lg">
        <Heading mb={6} size="lg" color="white">Dashboard de Confirmações</Heading>
        
        {/* Countdown Timer */}
        <Box mb={8} p={4} bg="gray.600" borderRadius="lg">
          <Flex align="center" mb={2}>
            <Icon as={TimeIcon} color="brand.500" mr={2} />
            <Text fontSize="lg" fontWeight="bold" color="white">Contagem Regressiva para o Evento</Text>
          </Flex>
          <SimpleGrid 
            columns={{ base: 2, sm: 4 }} 
            spacing={4}
            templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }}
          >
            <Box textAlign="center" p={3} bg="gray.700" borderRadius="md" boxShadow="sm">
              <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="brand.500">{countdown.days}</Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300">Dias</Text>
            </Box>
            <Box textAlign="center" p={3} bg="gray.700" borderRadius="md" boxShadow="sm">
              <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="brand.500">{countdown.hours}</Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300">Horas</Text>
            </Box>
            <Box textAlign="center" p={3} bg="gray.700" borderRadius="md" boxShadow="sm">
              <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="brand.500">{countdown.minutes}</Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300">Minutos</Text>
            </Box>
            <Box textAlign="center" p={3} bg="gray.700" borderRadius="md" boxShadow="sm">
              <Text fontSize={{ base: "xl", sm: "2xl" }} fontWeight="bold" color="brand.500">{countdown.seconds}</Text>
              <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.300">Segundos</Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box p={5} bg="gray.600" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.200">Total de Convidados</StatLabel>
              <StatNumber fontSize="3xl" color={stats.total > 0 ? "brand.500" : "gray.400"}>{stats.total}</StatNumber>
            </Stat>
          </Box>
          <Box p={5} bg="gray.600" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.200">Confirmados</StatLabel>
              <StatNumber fontSize="3xl" color={stats.confirmed > 0 ? "green.500" : "gray.400"}>{stats.confirmed}</StatNumber>
            </Stat>
          </Box>
          <Box p={5} bg="gray.600" borderRadius="lg" boxShadow="md">
            <Stat>
              <StatLabel fontSize="lg" color="gray.200">Músicas Sugeridas</StatLabel>
              <StatNumber fontSize="3xl" color={stats.musicSuggestions > 0 ? "purple.500" : "gray.400"}>{stats.musicSuggestions}</StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Table */}
      <Box overflowX="auto" variant="customBg" borderRadius="xl" boxShadow="lg" p={6}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Convidados</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {confirmations.length > 0 ? (
              confirmations.map((confirmation) => (
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
              ))
            ) : (
              <Tr>
                <Td colSpan={5}>
                  <Box textAlign="center" py={8}>
                    <Text fontSize="lg" color="gray.500" fontWeight="medium">
                      {loading ? 'Carregando confirmações...' : 'Nenhuma confirmação encontrada.'}
                    </Text>
                  </Box>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader color="white">Editar Confirmação</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            {selectedConfirmation && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.200">Nomes</FormLabel>
                  <Input
                    bg="gray.700"
                    color="white"
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
                  <FormLabel color="gray.200">Email</FormLabel>
                  <Input
                    bg="gray.700"
                    color="white"
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
                  <FormLabel color="gray.200">Telefone</FormLabel>
                  <Input
                    bg="gray.700"
                    color="white"
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
                  <FormLabel color="gray.200">Status</FormLabel>
                  <Select
                    bg="gray.700"
                    color="white"
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
