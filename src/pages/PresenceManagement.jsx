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
} from '@chakra-ui/react';

const PresenceManagement = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Fetch confirmations
  const fetchConfirmations = async () => {
    try {
      // This would be replaced with your actual API call
      const response = await fetch('/api/presence-confirmations');
      const data = await response.json();
      setConfirmations(data);
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

      const response = await fetch('/api/presence-confirmations/update-status', {
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
      toast({
        title: 'Erro ao atualizar status',
        description: error.message || 'Não foi possível atualizar o status.',
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
      )}
    </Container>
  );
};

export default PresenceManagement; 