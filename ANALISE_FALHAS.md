# Análise de Falhas - Auto-Insta

## Como analisar falhas no analytics

As falhas são registradas na tabela `queue` com `status = 'failed'`. Você pode analisar usando as queries abaixo:

### 1. Ver todas as falhas com detalhes

```sql
SELECT 
  q.id,
  q.automation_id,
  a.name as automation_name,
  q.contact_id,
  q.status,
  q.error_message,
  q.created_at,
  q.updated_at,
  q.retry_count
FROM queue q
LEFT JOIN automations a ON q.automation_id = a.id
WHERE q.status = 'failed'
ORDER BY q.created_at DESC
LIMIT 50;
```

### 2. Contar falhas por automação

```sql
SELECT 
  a.name as automation_name,
  COUNT(*) as total_falhas,
  COUNT(CASE WHEN q.retry_count > 0 THEN 1 END) as tentativas_retry,
  MAX(q.updated_at) as ultima_falha
FROM queue q
LEFT JOIN automations a ON q.automation_id = a.id
WHERE q.status = 'failed'
GROUP BY q.automation_id, a.name
ORDER BY total_falhas DESC;
```

### 3. Falhas por mensagem de erro

```sql
SELECT 
  q.error_message,
  COUNT(*) as quantidade,
  COUNT(DISTINCT q.automation_id) as automacoes_afetadas
FROM queue q
WHERE q.status = 'failed'
GROUP BY q.error_message
ORDER BY quantidade DESC;
```

### 4. Distribuição de falhas por hora

```sql
SELECT 
  DATE_TRUNC('hour', q.created_at) as hora,
  COUNT(*) as quantidade_falhas
FROM queue q
WHERE q.status = 'failed'
  AND q.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', q.created_at)
ORDER BY hora DESC;
```

### 5. Falhas com contexto (dados do contato)

```sql
SELECT 
  q.id,
  a.name as automation_name,
  c.instagram_username,
  q.error_message,
  q.retry_count,
  q.created_at
FROM queue q
LEFT JOIN automations a ON q.automation_id = a.id
LEFT JOIN contacts c ON q.contact_id = c.id
WHERE q.status = 'failed'
ORDER BY q.created_at DESC
LIMIT 100;
```

### 6. Taxa de sucesso vs falhas (últimos 7 dias)

```sql
SELECT 
  a.name as automation_name,
  COUNT(*) as total,
  COUNT(CASE WHEN q.status = 'sent' THEN 1 END) as enviadas,
  COUNT(CASE WHEN q.status = 'failed' THEN 1 END) as falhas,
  COUNT(CASE WHEN q.status = 'pending' THEN 1 END) as pendentes,
  ROUND(100.0 * COUNT(CASE WHEN q.status = 'sent' THEN 1 END) / 
    NULLIF(COUNT(*), 0), 2) as taxa_sucesso_pct
FROM automations a
LEFT JOIN queue q ON q.automation_id = a.id 
  AND q.created_at >= NOW() - INTERVAL '7 days'
GROUP BY a.id, a.name
ORDER BY falhas DESC;
```

## Tipos de erros comuns

| Erro | Significado | Solução |
|------|-------------|---------|
| `Token expired` | Token do Instagram expirou | Reconectar a conta no painel |
| `Rate limit exceeded` | Muitas requisições ao Instagram | Aguardar ou reduzir frequência |
| `Invalid contact` | Contato não encontrado | Contato foi deletado ou bloqueado |
| `Message too long` | Mensagem ultrapassa limite | Reduzir tamanho da mensagem |
| `Network timeout` | Falha de conexão | Tentar novamente (retry automático) |

## Visualizar falhas no painel

Atualmente você pode ver:
1. **Status por Automação**: Coluna "❌ Falhas" mostra o número de falhas
2. **Status da Fila**: Mostra mensagens com status "❌ Falha"

## Próximas melhorias

- [ ] Adicionar página dedicada de análise de falhas
- [ ] Filtrar falhas por data/automação/tipo de erro
- [ ] Exportar log de falhas (CSV/JSON)
- [ ] Alerta automático para taxa de falha alta
- [ ] Retry automático com backoff exponencial
