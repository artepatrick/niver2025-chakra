## Especificação da rota: Notificação aos organizadores

- **Rota**: `POST /api/niver2025/notifyOrganizers`
- **Objetivo**: disparar notificações para os organizadores quando houver novo cadastro/atualização de presença e/ou sugestões de músicas.
- **Autenticação**: a partir do frontend não há header especial. O backend deve validar `host_id` e aplicar rate limiting.
- **Timeout esperado**: resposta deve ser rápida (<= 1s). A entrega das mensagens pode ser assíncrona (fila/job worker).

### Payload (request)

Content-Type: `application/json`

Campos obrigatórios e seus tipos:

```json
{
  "email": "string",                  // e-mail do convidado principal
  "phone": "string",                  // número de telefone limpo (apenas dígitos), ex: "31999998888"
  "names": ["string"],                // lista de nomes confirmados
  "musicSuggestions": [                // lista de sugestões de músicas (pode estar vazia)
    {
      "song_title": "string",
      "artist": "string",
      "spotify_url": "string|null",
      "album_image_url": "string|null",
      "preview_url": "string|null",
      "duration_ms": 0,
      "spotify_id": "string",
      "album_name": "string|null"
    }
  ],
  "eventDate": "ISO-8601 string",     // ex: "2025-08-30T16:00:00.000Z"
  "host_id": "string"                 // id do host para auditoria/validação
}
```

Observações:
- `phone` já chega do front apenas com dígitos (sem máscara).
- `musicSuggestions` pode vir vazia.
- `eventDate` é enviado pelo front apenas para referência/templating.

### Regras de negócio (sugestão)
- Montar uma mensagem textual única para cada organizador contendo:
  - Lista de nomes
  - Contatos (e-mail/telefone)
  - Contagem de músicas e lista quando houver
  - Data do evento formatada
- Disparar a mesma mensagem para todos os organizadores configurados no backend.
- Caso a entrega para algum destinatário falhe, registrar log, mas retornar 200 para o frontend se ao menos a orquestração foi aceita (idempotente/best-effort).
- Aplicar deduplicação opcional por `(email, names, eventDate)` em janela de tempo curta (ex.: 2 minutos) para evitar spam em recarregamentos.

### Resposta (response)

Status 200 OK
```json
{
  "data": {
    "success": true,
    "summary": {
      "queued": true,
      "recipients": 2,               // quantidade de organizadores alvo
      "failedRecipients": 0          // > 0 quando alguma entrega falhou
    }
  }
}
```

Erros comuns
- 400: payload inválido (campos obrigatórios ausentes ou tipos incorretos)
- 429: rate limit
- 500: erro interno ao enfileirar/disparar

### Exemplo de cURL

```bash
curl -X POST "$BASE_URL/api/niver2025/notifyOrganizers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "convidado@exemplo.com",
    "phone": "31999998888",
    "names": ["Maria Clara", "Acompanhante"],
    "musicSuggestions": [
      {"song_title": "Song A", "artist": "Artist A", "spotify_id": "abc123"}
    ],
    "eventDate": "2025-08-30T16:00:00.000Z",
    "host_id": "web-niver2025"
  }'
```

### Contrato mínimo esperado no backend
- Controller recebe e valida payload.
- Service monta mensagem e envia para os números de organizadores definidos em configuração (ex.: variáveis de ambiente `ORGANIZER_PHONES` com lista separada por vírgula).
- Integração de saída pode ser WhatsApp/SMS/E-mail; abstrair via provider.
- Retornar `{ data: { success: true, summary } }` mesmo que a entrega seja assíncrona.

### Critérios de aceite
- Chamadas válidas retornam 200 com `data.success = true`.
- Payload inválido retorna 400 com mensagem clara.
- Não deve bloquear o fluxo do front (tratar de forma assíncrona sempre que possível).


