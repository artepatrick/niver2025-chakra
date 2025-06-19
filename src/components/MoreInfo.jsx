import {
  Box,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react'

const MoreInfo = () => {
  return (
    <Box
      bg="rgba(167, 139, 250, 0.1)"
      p={{ base: 4, md: 8 }}
      borderRadius="xl"
      w="full"
      backdropFilter="blur(8px)"
    >
      <VStack align="start" spacing={{ base: 4, md: 6 }}>
        <Box>
          <Heading color="brand.400" size="lg" mb={4}>A festa</Heading>
          <Text color="white" fontSize="lg">
            Carol vai comemorar -- seus 40 anos no dia 28 de junho, às 16 horas
          </Text>
        </Box>

        <Box>
          <Heading color="brand.400" size="lg" mb={4}>Lugar</Heading>
          <Text color="white" fontSize="lg">
            A festa vai acontecer no <Text as="span" fontWeight="700">Feliz da Vila Bistrô</Text>, localizado na Rua Johnson, 345, no bairro União. Será uma celebração especial com cartela individual. O local estará reservado exclusivamente para a festa.
          </Text>
          <Box mt={4} borderRadius="xl" overflow="hidden">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3752.0454327392695!2d-43.925100889195285!3d-19.88030338141984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa69ba92dfb95e7%3A0x6f8899ec69063e27!2sFeliz%20da%20Vila%20Bistro!5e0!3m2!1spt-BR!2sbr!4v1750010651457!5m2!1spt-BR!2sbr" 
              width="100%" 
              height={{ base: "300px", md: "450px" }}
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Box>
        </Box>

        <Box>
          <Heading color="brand.400" size="lg" mb={4}>A banda</Heading>
          <Text color="white" fontSize="lg" mb={4}>
            Vamos ter uma banda de samba muito animada chamada Oiaki composta por amigos da Carol!
          </Text>
          <Box borderRadius="xl" overflow="hidden" mb={4}>
            <iframe 
              src="https://www.instagram.com/p/Cd8dinvOagN/embed"
              className="snapwidget-widget"
              allowTransparency="true"
              frameBorder="0"
              scrolling="no"
              style={{ 
                border: 'none', 
                overflow: 'hidden', 
                width: '100%', 
                height: '400px',
                maxHeight: '80vh'
              }}
            />
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}

export default MoreInfo 