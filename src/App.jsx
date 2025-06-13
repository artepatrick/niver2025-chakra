import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  Image,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  HStack,
  IconButton,
  Link,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import PresenceManagement from './pages/PresenceManagement'

const EVENT_DATE = new Date('2025-06-28T16:00:00')
const BASE_URL = 'https://omnicast-backend.fly.dev'
const EXTERNAL_API_BASE_URL = 'https://api.tolky.to'
const TOLKY_API_TOKEN = 'S30LusdLYOEjsFe2DNa4CVI9ny4Yi8N2YAX7gw9Yapg'

function App() {
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
  const [names, setNames] = useState([''])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure()
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure()
  const [existingGuests, setExistingGuests] = useState([])
  const [existingStatus, setExistingStatus] = useState('')
  const toast = useToast()

  useEffect(() => {
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  const updateCountdown = () => {
    const now = new Date()
    const difference = EVENT_DATE - now

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    setCountdown({
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    })
  }

  const handleAddName = () => {
    setNames([...names, ''])
  }

  const handleRemoveName = (index) => {
    setNames(names.filter((_, i) => i !== index))
  }

  const handleNameChange = (index, value) => {
    const newNames = [...names]
    newNames[index] = value
    setNames(newNames)
  }

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length > 9) {
      value = `${value.slice(0, 9)}-${value.slice(9)}`
    }

    setPhone(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const checkResponse = await fetch(`${BASE_URL}/api/niver2025/checkEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error('Failed to check email')
      }

      if (checkData.exists) {
        setExistingGuests(checkData.data.names)
        setExistingStatus(checkData.data.status)
        onConfirmOpen()
        return
      }

      await submitForm()
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao confirmar sua presença. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const submitForm = async () => {
    const formData = {
      email,
      phone: phone.replace(/\D/g, ''),
      names: names.filter(name => name.trim() !== ''),
    }

    const submitResponse = await fetch(`${BASE_URL}/api/niver2025/confirmPresence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const submitData = await submitResponse.json()

    if (!submitResponse.ok || !submitData.data?.data?.success) {
      throw new Error(submitData.message || 'Failed to submit form')
    }

    // Send notifications
    const notificationResponse = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/externalAPIs/public/externalNotificationAI`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOLKY_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: [
            {
              phone: phone.replace(/\D/g, ''),
              userName: names[0],
              eventType: 'aniversario',
              eventDate: EVENT_DATE.toISOString(),
            },
          ],
          generalInstructions: 'Enviar mensagem de agradecimento pela confirmação de presença no aniversário',
        }),
      }
    )

    const notificationData = await notificationResponse.json()

    if (notificationData.code !== 200 || notificationData.data.summary.failedItems > 0) {
      console.warn('Some notifications failed to send:', notificationData)
    }

    onSuccessOpen()
    setNames([''])
    setPhone('')
    setEmail('')
  }

  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<PresenceManagement />} />
        <Route path="/" element={
          <Container maxW="container.md" py={8}>
            <VStack spacing={8} bg="gray.700" p={8} borderRadius="xl" boxShadow="xl">
              {/* Profile Section */}
              <VStack spacing={4}>
                <Image
                  src="https://tolky.to/_next/image?url=https%3A%2F%2Fi.postimg.cc%2FT2tQppZB%2Fcarol-comprimida.jpg&w=1920&q=75"
                  alt="Ana Carolina Calazans"
                  borderRadius="full"
                  boxSize="200px"
                  objectFit="cover"
                  border="4px solid"
                  borderColor="brand.500"
                />
                <Heading color="brand.500" size="2xl">
                  Ana Carolina Calazans
                </Heading>
                <Text fontSize="xl" color="gray.100">
                  Confirme sua presença
                </Text>
                <Link as={RouterLink} to="/admin" color="brand.500" fontSize="sm">
                  Área Administrativa
                </Link>
              </VStack>

              {/* Countdown Section */}
              <VStack spacing={4}>
                <Heading color="brand.500" size="lg">
                  Faltam
                </Heading>
                <HStack spacing={4} bg="rgba(128, 90, 213, 0.1)" p={8} borderRadius="xl" backdropFilter="blur(8px)">
                  <VStack>
                    <Text fontSize="4xl" fontWeight="bold" color="brand.500">
                      {countdown.days}
                    </Text>
                    <Text fontSize="sm" color="gray.100" textTransform="uppercase">
                      Dias
                    </Text>
                  </VStack>
                  <Text fontSize="4xl" color="brand.500" opacity={0.5}>
                    :
                  </Text>
                  <VStack>
                    <Text fontSize="4xl" fontWeight="bold" color="brand.500">
                      {countdown.hours}
                    </Text>
                    <Text fontSize="sm" color="gray.100" textTransform="uppercase">
                      Horas
                    </Text>
                  </VStack>
                  <Text fontSize="4xl" color="brand.500" opacity={0.5}>
                    :
                  </Text>
                  <VStack>
                    <Text fontSize="4xl" fontWeight="bold" color="brand.500">
                      {countdown.minutes}
                    </Text>
                    <Text fontSize="sm" color="gray.100" textTransform="uppercase">
                      Minutos
                    </Text>
                  </VStack>
                  <Text fontSize="4xl" color="brand.500" opacity={0.5}>
                    :
                  </Text>
                  <VStack>
                    <Text fontSize="4xl" fontWeight="bold" color="brand.500">
                      {countdown.seconds}
                    </Text>
                    <Text fontSize="sm" color="gray.100" textTransform="uppercase">
                      Segundos
                    </Text>
                  </VStack>
                </HStack>
                <Text fontSize="lg" color="gray.100" fontStyle="italic">
                  para o grande dia!
                </Text>
              </VStack>

              {/* Form Section */}
              <Box as="form" w="full" onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  {names.map((name, index) => (
                    <HStack key={index}>
                      <FormControl isRequired>
                        <FormLabel>Nome Completo</FormLabel>
                        <Input
                          value={name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          placeholder="Digite seu nome completo"
                        />
                      </FormControl>
                      {index > 0 && (
                        <IconButton
                          icon={<DeleteIcon />}
                          onClick={() => handleRemoveName(index)}
                          aria-label="Remover nome"
                          colorScheme="red"
                          variant="ghost"
                        />
                      )}
                    </HStack>
                  ))}

                  <Button
                    leftIcon={<AddIcon />}
                    onClick={handleAddName}
                    variant="ghost"
                    colorScheme="brand"
                    alignSelf="flex-start"
                  >
                    Adicionar mais um nome
                  </Button>

                  <FormControl>
                    <FormLabel>Telefone</FormLabel>
                    <Input
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(00) 00000-0000"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>E-mail</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Confirmando..."
                  >
                    Confirmar Presença
                  </Button>
                </VStack>
              </Box>
            </VStack>

            {/* Confirmation Modal */}
            <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Confirmação de Presença</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text mb={4}>
                    Já existe um registro para este email com status: <strong>{existingStatus}</strong>
                  </Text>
                  <Text mb={2}>Convidados já registrados:</Text>
                  <List mb={4}>
                    {existingGuests.map((guest, index) => (
                      <ListItem key={index}>{guest}</ListItem>
                    ))}
                  </List>
                  <Text mb={2}>Novos convidados a serem adicionados:</Text>
                  <List mb={4}>
                    {names.filter(name => name.trim() !== '').map((guest, index) => (
                      <ListItem key={index}>{guest}</ListItem>
                    ))}
                  </List>
                  <Text>Deseja adicionar os novos convidados ao registro existente?</Text>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={onConfirmClose}>
                    Não, editar
                  </Button>
                  <Button
                    colorScheme="brand"
                    onClick={async () => {
                      onConfirmClose()
                      await submitForm()
                    }}
                  >
                    Sim, confirmar todos
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Success Modal */}
            <Modal isOpen={isSuccessOpen} onClose={onSuccessClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Presença Confirmada!</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>Obrigada por confirmar sua presença! Em breve você receberá mais informações sobre o evento.</Text>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="brand" onClick={onSuccessClose}>
                    Fechar
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Container>
        } />
      </Routes>
    </Router>
  )
}

export default App
