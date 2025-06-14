import { useState, useEffect } from 'react';
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
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';

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

  // Fetch confirmations
  const fetchConfirmations = async () => {
    try {
      // This would be replaced with your actual API call
      const response = await fetch(`${API_BASE_URL}/api/niver2025/getAllConfirmations`);
      const data = await response.json();
      setConfirmations(data);
      
      // Calculate stats
      const stats = {
        total: data.length,
        confirmed: data.filter(c => c.status === 'confirmado').length,
        pending: data.filter(c => c.status === 'pendente').length,
        cancelled: data.filter(c => c.status === 'cancelado').length,
      };
      setStats(stats);
    } catch (e) {
      toast({
        title: 'Erro ao carregar confirmações: ' + e.message,
        description: 'Não foi possível carregar a lista de confirmações.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      // This would be replaced with your actual API call
      const payload = {
        id,
        status: newStatus,
      };

      console.log('Payload to be sent:', payload);

      const response = await fetch(`${API_BASE_URL}/api/presence-confirmations/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Expected response:', data);

      if (response.ok) {
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
      } else {
        throw new Error(data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      // Handle specific error cases
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: 'Erro ao atualizar status',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
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
      <Heading mb={6}>Gerenciamento de Confirmações</Heading>
      
      {loading ? (
        <Text>Carregando...</Text>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
            <Stat
              px={4}
              py={5}
              shadow="xl"
              border="1px solid"
              borderColor="gray.200"
              rounded="lg"
            >
              <StatLabel>Total de Confirmações</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Total de registros
              </StatHelpText>
            </Stat>

            <Stat
              px={4}
              py={5}
              shadow="xl"
              border="1px solid"
              borderColor="gray.200"
              rounded="lg"
              bg="green.50"
            >
              <StatLabel>Confirmados</StatLabel>
              <StatNumber>{stats.confirmed}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {stats.total > 0 ? ((stats.confirmed / stats.total) * 100).toFixed(1) : 0}% do total
              </StatHelpText>
            </Stat>

            <Stat
              px={4}
              py={5}
              shadow="xl"
              border="1px solid"
              borderColor="gray.200"
              rounded="lg"
              bg="yellow.50"
            >
              <StatLabel>Pendentes</StatLabel>
              <StatNumber>{stats.pending}</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                {((stats.pending / stats.total) * 100).toFixed(1)}% do total
              </StatHelpText>
            </Stat>

            <Stat
              px={4}
              py={5}
              shadow="xl"
              border="1px solid"
              borderColor="gray.200"
              rounded="lg"
              bg="red.50"
            >
              <StatLabel>Cancelados</StatLabel>
              <StatNumber>{stats.cancelled}</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                {((stats.cancelled / stats.total) * 100).toFixed(1)}% do total
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nomes</Th>
                  <Th>Email</Th>
                  <Th>Telefone</Th>
                  <Th>Status</Th>
                  <Th>Data de Criação</Th>
                </Tr>
              </Thead>
              <Tbody>
                {confirmations.map((confirmation) => (
                  <Tr key={confirmation.id}>
                    <Td>
                      {JSON.parse(confirmation.names).map((name, index) => (
                        <Text key={index}>{name}</Text>
                      ))}
                    </Td>
                    <Td>{confirmation.email}</Td>
                    <Td>{confirmation.phone}</Td>
                    <Td>
                      <Select
                        value={confirmation.status}
                        onChange={(e) => handleStatusChange(confirmation.id, e.target.value)}
                        size="sm"
                        width="150px"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="cancelado">Cancelado</option>
                      </Select>
                    </Td>
                    <Td>
                      {new Date(confirmation.created_at).toLocaleDateString('pt-BR')}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}
    </Container>
  );
};

export default PresenceManagement; 