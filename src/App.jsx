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
  Badge,
  extendTheme,
  ChakraProvider,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons'
import { BrowserRouter as Router, Routes, Route, Link as RouterLink } from 'react-router-dom'
import Dashboard from './pages/dashboard'
import { searchSpotify } from './spotifyServer'

// Import Georama font
import '@fontsource/georama'

const EVENT_DATE = new Date('2025-06-28T16:00:00')
const BASE_URL = 'https://omnicast-backend.fly.dev'
const EXTERNAL_API_BASE_URL = 'https://api.tolky.to'
const TOLKY_API_TOKEN = 'S30LusdLYOEjsFe2DNa4CVI9ny4Yi8N2YAX7gw9Yapg'

const ORGANIZERS = {
  CAROL: '553199455764',
  PATRICK: '5531991391722'
}

const theme = extendTheme({
  fonts: {
    heading: 'Georama, sans-serif',
    body: 'Georama, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: '#303030',
      },
    },
  },
  colors: {
    brand: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Cor principal - Lilás vibrante
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
  },
  components: {
    Input: {
      baseStyle: {
        field: {
          fontSize: 'lg',
          height: '60px',
          borderRadius: 'xl',
          border: 'none',
          bg: '#282828',
          _placeholder: {
            color: '#666666',
          },
          _focus: {
            boxShadow: 'none',
            border: 'none',
          },
          _hover: {
            bg: '#333333',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 'xl',
        fontSize: 'lg',
        fontWeight: '600',
      },
    },
  },
})

function App() {
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
  const [names, setNames] = useState([''])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure()
  const [existingStatus, setExistingStatus] = useState('')
  const [showExistingGuests, setShowExistingGuests] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const toast = useToast()
  const [musicSearch, setMusicSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggestedMusic, setSuggestedMusic] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [musicLimitError, setMusicLimitError] = useState(false)
  const [showFullForm, setShowFullForm] = useState(false)
  const [initialEmail, setInitialEmail] = useState('')

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
    if (!suggestedMusic.some(music => music.spotify_id === track.spotify_id)) {
      const formattedTrack = {
        song_title: track.song_title || track.name,
        artist: track.artist || '',
        spotify_url: track.spotify_url || track.spotifyUrl,
        image_url: track.image_url,
        preview_url: track.preview_url || track.previewUrl,
        duration_ms: track.duration_ms || track.duration,
        spotify_id: track.spotify_id || track.id,
        album_name: track.album_name || track.album
      }
      setSuggestedMusic([...suggestedMusic, formattedTrack])
    }
    setMusicSearch('')
    setSearchResults([])
  }

  const handleRemoveMusic = (trackId) => {
    setSuggestedMusic(suggestedMusic.filter(music => music.spotify_id !== trackId))
    setMusicLimitError(false)
  }

  const handleInitialEmailSubmit = async (e) => {
    e.preventDefault()
    if (!initialEmail || initialEmail.length < 3) return

    setIsCheckingEmail(true)
    try {
      const response = await fetch(`${BASE_URL}/api/niver2025/checkEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: initialEmail }),
      })

      const data = await response.json()

      if (response.ok && data.data?.exists) {
        // Pre-fill form with existing data
        setEmail(initialEmail)
        setNames(data.data.names)
        setPhone(data.data.phone || '')
        setExistingStatus(data.data.status)
        setSuggestedMusic(data.data.music_suggestions || [])
      } else {
        // Set email for new user
        setEmail(initialEmail)
      }
      
      // Show full form in both cases
      setShowFullForm(true)
    } catch (error) {
      console.error('Error checking email:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao verificar o email. Por favor, tente novamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
  };

  const handleAddExistingGuests = () => {
    const existingNames = names.filter(name => !names.includes(name));
    setNames([...names, ...existingNames]);
    setShowExistingGuests(false);
    toast({
      title: 'Convidados adicionados',
      description: 'Os convidados existentes foram adicionados à sua lista.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const notifyOrganizers = async (formData) => {
    const message = `🎉 Novo cadastro/atualização no evento!

👥 Convidado(s):
${formData.names.map(name => `- ${name}`).join('\n')}

📱 Contato:
- Email: ${formData.email}
- Telefone: ${formData.phone}

🎵 Músicas sugeridas: ${formData.musicSuggestions.length}
${formData.musicSuggestions.length > 0 ? formData.musicSuggestions.map(music => `- ${music.song_title} (${music.artist})`).join('\n') : '- Nenhuma música sugerida'}

⏰ Data do evento: ${new Date(EVENT_DATE).toLocaleDateString('pt-BR')} às ${new Date(EVENT_DATE).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

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
              phone: ORGANIZERS.CAROL,
              userName: 'Carol',
              eventType: 'aniversario',
              eventDate: EVENT_DATE.toISOString(),
              customMessage: message
            },
            {
              phone: ORGANIZERS.PATRICK,
              userName: 'Patrick',
              eventType: 'aniversario',
              eventDate: EVENT_DATE.toISOString(),
              customMessage: message
            }
          ],
          generalInstructions: 'Envie esta mensagem exatamente como está, sem adicionar ou remover nada.',
        }),
      }
    )

    const notificationData = await notificationResponse.json()
    if (notificationData.code !== 200 || notificationData.data.summary.failedItems > 0) {
      console.warn('Some organizer notifications failed to send:', notificationData)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
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
        song_title: music.song_title || music.name,
        artist: music.artist || '',
        spotify_url: music.spotify_url || music.spotifyUrl,
        image_url: music.image_url || music.imageUrl,
        preview_url: music.preview_url || music.previewUrl,
        duration_ms: music.duration_ms || music.duration,
        spotify_id: music.spotify_id || music.id,
        album_name: music.album_name || music.album
      })),
    }

    try {
      console.log('Enviando dados:', JSON.stringify(formData, null, 2));
      
      const submitResponse = await fetch(`${BASE_URL}/api/niver2025/confirmPresence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const submitData = await submitResponse.json();
      console.log('Resposta do servidor:', JSON.stringify(submitData, null, 2));

      if (!submitResponse.ok) {
        throw new Error(`Erro ${submitResponse.status}: ${submitData.message || 'Erro desconhecido'}`);
      }

      if (!submitData.data?.data?.success) {
        throw new Error(submitData.message || 'Falha ao enviar formulário');
      }

      // Notify organizers about the new registration
      await notifyOrganizers(formData);

      let generalInstructions = ` envie a seguinte mensagem: 'Quem sabe aqui a gente pede pra falar: Olá! Aqui é o assistente virtual do Patrick! Obrigada por confirmar a sua presença no aniversário da Carol! Ela vai ficar muito feliz'
      **Instrução para IA - Confirmação de Presença (Aniversário da Carol)**

A festa de 40 anos da Carol será no dia **28/06/2025**, às **16h**, no **Feliz da Vila Bistrô (Rua Johnson, 345 - União)**. O espaço estará **fechado exclusivamente para o evento**.

Após a confirmação, envie uma mensagem de agradecimento em nome do **Patrick (namorado da Carol)**, algo simples como:  
**"Obrigado por confirmar! Vai ser ótimo ter você com a gente nessa comemoração especial 💛"**

Se o convidado quiser mais detalhes, compartilhe:

- 📸 Convite: [Ver convite](https://xedmqngqukfopguebmtl.supabase.co/storage/v1/object/public/hostBucket/calazans/niver2025-6d628c96-85e1-40c5-8da0-84ff4341b025.jpeg)  
- 🍽️ Cardápio de comidas: [Cardápio Comida.pdf](https://xedmqngqukfopguebmtl.supabase.co/storage/v1/object/public/hostBucket/calazans/Cardapiocomida-82d3ac9a-4b1a-49a5-bef8-97539c56930c.pdf)  
- 🍷 Cardápio de vinhos: [Cardápio Vinhos.pdf](https://xedmqngqukfopguebmtl.supabase.co/storage/v1/object/public/hostBucket/calazans/Cardapiovinhos-5cfc65b3-ec36-42e9-bc03-064eb1dae2fa.pdf)

A IA deve manter o tom carinhoso, acolhedor e informal. Esteja preparada para responder dúvidas sobre:
- Horário, local, dress code
- O que será servido (comida, bebida, opções sem álcool)
- Detalhes do evento.
`

      generalInstructions = generalInstructions.replace(/\s+/g, ' ');

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
            generalInstructions,
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
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao confirmar sua presença. Por favor, tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const renderInitialEmailScreen = () => (
    <VStack spacing={8} bg="#0A0A0A" p={8} borderRadius="xl" boxShadow="xl">
      {/* Profile Section */}
      <VStack spacing={4}>
        <Image
          src="https://jpkqterigrjwpyrwmxfj.supabase.co/storage/v1/object/public/foto//Carol%20Image%20800x800.webp"
          alt="Ana Carolina Calazans"
          borderRadius="full"
          boxSize="200px"
          objectFit="cover"
          border="4px solid"
          borderColor="brand.400"
        />
        <Heading color="brand.400" size="2xl" fontWeight="700" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
          Ana Carolina Calazans
        </Heading>
        <Text fontSize="2xl" color="white" fontWeight="500">
          Confirme sua presença
        </Text>
      </VStack>

      {/* Countdown Section */}
      <VStack spacing={4}>
        <Heading color="brand.400" size="lg" fontWeight="700" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
          Faltam
        </Heading>
        <HStack spacing={4} bg="rgba(167, 139, 250, 0.1)" p={8} borderRadius="xl" backdropFilter="blur(8px)">
          <VStack key="days">
            <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
              {countdown.days}
            </Text>
            <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
              Dias
            </Text>
          </VStack>
          <Text key="days-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
            :
          </Text>
          <VStack key="hours">
            <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
              {countdown.hours}
            </Text>
            <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
              Horas
            </Text>
          </VStack>
          <Text key="hours-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
            :
          </Text>
          <VStack key="minutes">
            <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
              {countdown.minutes}
            </Text>
            <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
              Minutos
            </Text>
          </VStack>
          <Text key="minutes-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
            :
          </Text>
          <VStack key="seconds">
            <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
              {countdown.seconds}
            </Text>
            <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
              Segundos
            </Text>
          </VStack>
        </HStack>
        <Text fontSize="xl" color="white" fontStyle="italic" fontWeight="500">
          para o grande dia!
        </Text>
      </VStack>

      {/* Initial Email Form */}
      <Box as="form" w="full" onSubmit={handleInitialEmailSubmit}>
        <VStack spacing={6}>
          <FormControl isRequired>
            <FormLabel fontSize="lg" fontWeight="600" color="white">E-mail</FormLabel>
            <InputGroup>
              <Input
                type="email"
                value={initialEmail}
                onChange={(e) => setInitialEmail(e.target.value)}
                placeholder="seu@email.com"
              />
              {isCheckingEmail && (
                <InputRightElement>
                  <Spinner size="sm" color="brand.500" />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            height="70px"
            fontSize="xl"
            fontWeight="700"
            isLoading={isCheckingEmail}
            loadingText="Verificando..."
            w="full"
          >
            Avançar
          </Button>
        </VStack>
      </Box>
    </VStack>
  )

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/" element={
            <Container maxW="container.md" py={8}>
              {!showFullForm ? (
                renderInitialEmailScreen()
              ) : (
                <VStack spacing={8} bg="#0A0A0A" p={8} borderRadius="xl" boxShadow="xl">
                  {/* Profile Section */}
                  <VStack spacing={4}>
                    <Image
                      src="https://jpkqterigrjwpyrwmxfj.supabase.co/storage/v1/object/public/foto//Carol%20Image%20800x800.webp"
                      alt="Ana Carolina Calazans"
                      borderRadius="full"
                      boxSize="200px"
                      objectFit="cover"
                      border="4px solid"
                      borderColor="brand.400"
                    />
                    <Heading color="brand.400" size="2xl" fontWeight="700" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                      Ana Carolina Calazans
                    </Heading>
                    <Text fontSize="2xl" color="white" fontWeight="500">
                      Confirme sua presença
                    </Text>
                  </VStack>

                  {/* Countdown Section */}
                  <VStack spacing={4}>
                    <Heading color="brand.400" size="lg" fontWeight="700" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                      Faltam
                    </Heading>
                    <HStack spacing={4} bg="rgba(167, 139, 250, 0.1)" p={8} borderRadius="xl" backdropFilter="blur(8px)">
                      <VStack key="days">
                        <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                          {countdown.days}
                        </Text>
                        <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
                          Dias
                        </Text>
                      </VStack>
                      <Text key="days-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
                        :
                      </Text>
                      <VStack key="hours">
                        <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                          {countdown.hours}
                        </Text>
                        <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
                          Horas
                        </Text>
                      </VStack>
                      <Text key="hours-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
                        :
                      </Text>
                      <VStack key="minutes">
                        <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                          {countdown.minutes}
                        </Text>
                        <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
                          Minutos
                        </Text>
                      </VStack>
                      <Text key="minutes-separator" fontSize="5xl" color="brand.400" opacity={0.5}>
                        :
                      </Text>
                      <VStack key="seconds">
                        <Text fontSize="5xl" fontWeight="700" color="brand.400" textShadow="0 0 20px rgba(167, 139, 250, 0.3)">
                          {countdown.seconds}
                        </Text>
                        <Text fontSize="md" color="white" textTransform="uppercase" fontWeight="600">
                          Segundos
                        </Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="xl" color="white" fontStyle="italic" fontWeight="500">
                      para o grande dia!
                    </Text>
                  </VStack>

                  {/* Form Section */}
                  <Box as="form" w="full" onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                      {names.map((name, index) => (
                        <HStack key={index}>
                          <FormControl isRequired>
                            <FormLabel fontSize="lg" fontWeight="600" color="white">Nome Completo</FormLabel>
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
                              size="lg"
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
                        size="lg"
                        fontWeight="600"
                      >
                        Adicionar mais um nome
                      </Button>

                      <FormControl>
                        <FormLabel fontSize="lg" fontWeight="600" color="white">Telefone</FormLabel>
                        <Input
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="(00) 00000-0000"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="lg" fontWeight="600" color="white">E-mail</FormLabel>
                        <InputGroup>
                          <Input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="seu@email.com"
                          />
                          {isCheckingEmail && (
                            <InputRightElement>
                              <Spinner size="sm" color="brand.500" />
                            </InputRightElement>
                          )}
                        </InputGroup>
                        {showExistingGuests && (
                          <Box mt={2} p={4} bg="#181818" borderRadius="xl">
                            <Text mb={2} fontSize="lg" color="white" fontWeight="600">
                              Encontramos um registro existente com status: <Badge colorScheme={existingStatus === 'confirmado' ? 'green' : existingStatus === 'pendente' ? 'yellow' : 'red'}>{existingStatus}</Badge>
                            </Text>
                            <Text mb={2} fontSize="lg" color="white" fontWeight="600">
                              Convidados registrados:
                            </Text>
                            <List mb={2}>
                              {names.map((guest, index) => (
                                <ListItem key={index} fontSize="lg" color="white">
                                  {guest}
                                </ListItem>
                              ))}
                            </List>
                            <Button
                              size="lg"
                              colorScheme="brand"
                              onClick={handleAddExistingGuests}
                              leftIcon={<AddIcon />}
                              fontWeight="600"
                            >
                              Adicionar convidados existentes
                            </Button>
                          </Box>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="lg" fontWeight="600" color="white">Sugerir Músicas</FormLabel>
                        <Text mb={2} fontSize="lg" color="white">
                          Escolha suas músicas favoritas e ajude a festa a ser diversa e criativa! (máx. 10)
                        </Text>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <SearchIcon color="white" boxSize="5" />
                          </InputLeftElement>
                          <Input
                            value={musicSearch}
                            onChange={handleMusicSearch}
                            placeholder="Busque uma música..."
                            bg="#181818"
                            color="white"
                            isDisabled={suggestedMusic.length >= 10}
                          />
                          <InputRightElement>
                            {isSearching && <Spinner size="sm" color="brand.500" />}
                          </InputRightElement>
                        </InputGroup>
                        {musicLimitError && (
                          <Text color="red.400" fontSize="lg" mt={1} fontWeight="500">
                            Limite de 10 músicas atingido.
                          </Text>
                        )}
                        {searchResults.length > 0 && (
                          <Box mt={2} maxH="200px" overflowY="auto" bg="#181818" borderRadius="xl">
                            {searchResults.map((track) => (
                              <HStack
                                key={track.spotify_id}
                                p={3}
                                _hover={{ bg: '#282828' }}
                                cursor="pointer"
                                onClick={() => handleAddMusic(track)}
                                spacing={3}
                              >
                                <Image
                                  src={track.image_url}
                                  alt={`${track.song_title} album cover`}
                                  boxSize="50px"
                                  borderRadius="md"
                                  objectFit="cover"
                                />
                                <VStack align="start" spacing={0} flex={1}>
                                  <Text color="white" fontWeight="600" fontSize="lg" noOfLines={1}>
                                    {track.song_title}
                                  </Text>
                                  <Text color="gray.300" fontSize="md" noOfLines={1}>
                                    {track.artist}
                                  </Text>
                                </VStack>
                              </HStack>
                            ))}
                          </Box>
                        )}
                        {suggestedMusic.length > 0 && (
                          <Box mt={4}>
                            <Text mb={2} fontSize="lg" color="white" fontWeight="600">Músicas Sugeridas:</Text>
                            <VStack align="stretch" spacing={2}>
                              {suggestedMusic.map((track) => (
                                <HStack key={track.spotify_id} bg="#181818" p={3} borderRadius="xl" spacing={3} _hover={{ bg: '#282828' }}>
                                  <Image
                                    src={track.image_url}
                                    alt={`${track.song_title} album cover`}
                                    boxSize="50px"
                                    borderRadius="md"
                                    objectFit="cover"
                                  />
                                  <VStack align="start" spacing={0} flex={1}>
                                    <Text color="white" fontWeight="600" fontSize="lg" noOfLines={1}>
                                      {track.song_title}
                                    </Text>
                                    <Text color="gray.300" fontSize="md" noOfLines={1}>
                                      {track.artist}
                                    </Text>
                                  </VStack>
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    size="lg"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleRemoveMusic(track.spotify_id)}
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
                        height="70px"
                        fontSize="xl"
                        fontWeight="700"
                        isLoading={isLoading}
                        loadingText="Confirmando..."
                      >
                        Confirmar Presença
                      </Button>
                    </VStack>
                  </Box>
                </VStack>
              )}

              {/* Success Modal */}
              <Modal isOpen={isSuccessOpen} onClose={onSuccessClose}>
                <ModalOverlay />
                <ModalContent bg="#181818" color="white" borderRadius="xl">
                  <ModalHeader color="brand.500" fontSize="2xl" fontWeight="700">Presença Confirmada!</ModalHeader>
                  <ModalCloseButton color="white" />
                  <ModalBody>
                    <Text fontSize="lg" fontWeight="500">Obrigada por confirmar sua presença! Em breve você receberá mais informações sobre o evento.</Text>
                  </ModalBody>
                  <ModalFooter>
                    <Button colorScheme="brand" size="lg" fontWeight="600" onClick={onSuccessClose}>
                      Fechar
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Container>
          } />
        </Routes>
      </Router>
    </ChakraProvider>
  )
}

export default App
