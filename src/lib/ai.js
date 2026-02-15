import OpenAI from 'openai';

const client = import.meta.env.VITE_OPENAI_API_KEY
  ? new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  : null;

const MODEL = 'gpt-4o-mini';

export async function summarizeMessages(messages, groupName) {
  if (!client) {
    return 'Configure VITE_OPENAI_API_KEY para ativar resumo com IA.';
  }

  const transcript = messages
    .map((msg) => `${msg.sender || 'Desconhecido'}: ${msg.text || ''}`)
    .join('\n')
    .slice(0, 20000);

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Você é um analista de grupos de WhatsApp. Gere resumo curto com tópicos, decisões e próximos passos.',
      },
      {
        role: 'user',
        content: `Resuma o dia do grupo ${groupName}.\n\n${transcript}`,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices?.[0]?.message?.content?.trim() || 'Sem resposta da IA.';
}

export async function improveReply(draft) {
  if (!client) {
    return 'Configure VITE_OPENAI_API_KEY para ativar melhoria de texto.';
  }

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'Melhore a resposta mantendo tom amigável e objetivo em português do Brasil.',
      },
      {
        role: 'user',
        content: draft,
      },
    ],
    temperature: 0.4,
  });

  return completion.choices?.[0]?.message?.content?.trim() || draft;
}
