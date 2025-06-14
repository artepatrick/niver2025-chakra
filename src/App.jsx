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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import PresenceManagement from './pages/PresenceManagement'
import { searchSpotify } from './spotifyServer'

const EVENT_DATE = new Date('2025-06-28T16:00:00')
const BASE_URL = 'http://localhost:8080' //'https://omnicast-backend.fly.dev'
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
  const [musicSearch, setMusicSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggestedMusic, setSuggestedMusic] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [musicLimitError, setMusicLimitError] = useState(false)

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

  const handleMusicSearch = async (e) => {
    const value = e.target.value
    setMusicSearch(value)
    setMusicLimitError(false)
    if (value.length < 3) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const tracks = await searchSpotify(value)
      setSearchResults(tracks)
    } catch (error) {
      console.error('Error searching music:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddMusic = (track) => {
    if (suggestedMusic.length >= 10) {
      setMusicLimitError(true)
      return
    }
    if (!suggestedMusic.some(music => music.id === track.id)) {
      setSuggestedMusic([...suggestedMusic, track])
    }
    setMusicSearch('')
    setSearchResults([])
  }

  const handleRemoveMusic = (trackId) => {
    setSuggestedMusic(suggestedMusic.filter(music => music.id !== trackId))
    setMusicLimitError(false)
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
      musicSuggestions: suggestedMusic.map(music => ({
        song_title: music.name,
        artist: music.artists[0].name,
        spotify_url: music.external_urls?.spotify || null,
      })),
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
    setSuggestedMusic([])
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
                  src="https://jpkqterigrjwpyrwmxfj.supabase.co/storage/v1/object/public/foto//Carol%20Image%20800x800.webp"
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

                  <FormControl>
                    <FormLabel>Sugerir Músicas</FormLabel>
                    <Text mb={2} fontSize="sm" color="gray.300">
                      Escolha suas músicas favoritas e ajude a festa a ser diversa e criativa! (máx. 10)
                    </Text>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.300" />
                      </InputLeftElement>
                      <Input
                        value={musicSearch}
                        onChange={handleMusicSearch}
                        placeholder="Busque uma música..."
                        bg="gray.600"
                        color="gray.100"
                        isDisabled={suggestedMusic.length >= 10}
                      />
                      <InputRightElement>
                        {isSearching && <Spinner size="sm" color="brand.500" />}
                      </InputRightElement>
                    </InputGroup>
                    {musicLimitError && (
                      <Text color="red.400" fontSize="sm" mt={1}>
                        Limite de 10 músicas atingido.
                      </Text>
                    )}
                    {searchResults.length > 0 && (
                      <Box mt={2} maxH="200px" overflowY="auto" bg="gray.600" borderRadius="md">
                        {searchResults.map((track) => (
                          <HStack
                            key={track.id}
                            p={2}
                            _hover={{ bg: 'gray.500' }}
                            cursor="pointer"
                            onClick={() => handleAddMusic(track)}
                          >
                            <Text color="gray.100">{track.name} - {track.artists[0].name}</Text>
                          </HStack>
                        ))}
                      </Box>
                    )}
                    {suggestedMusic.length > 0 && (
                      <Box mt={4}>
                        <Text mb={2} fontSize="sm" color="gray.300">Músicas Sugeridas:</Text>
                        <VStack align="stretch" spacing={2}>
                          {suggestedMusic.map((track) => (
                            <HStack key={track.id} bg="gray.600" p={2} borderRadius="md">
                              <Text color="gray.100" flex={1}>
                                {track.name} - {track.artists[0].name}
                              </Text>
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleRemoveMusic(track.id)}
                                aria-label="Remover música"
                              />
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}
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
              <ModalContent bg="gray.700" color="gray.100">
                <ModalHeader color="brand.500">Confirmação de Presença</ModalHeader>
                <ModalCloseButton color="gray.100" />
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
                  <Button variant="ghost" mr={3} onClick={onConfirmClose} color="gray.100">
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
              <ModalContent bg="gray.700" color="gray.100">
                <ModalHeader color="brand.500">Presença Confirmada!</ModalHeader>
                <ModalCloseButton color="gray.100" />
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
