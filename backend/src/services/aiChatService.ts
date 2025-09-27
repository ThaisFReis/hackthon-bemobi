import ChatMessage from '../models/chatMessage';
import OpenAI from 'openai';
import { TemplateService } from './templateService';
import axios from 'axios';

// Determine which LLM API to use based on environment variables
const useGemini = process.env.USE_GEMINI === 'true';
const geminiApiKey = process.env.AI_API_KEY;
const geminiBaseUrl = process.env.BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

// Validate API keys
if (useGemini && !geminiApiKey) {
  throw new Error('AI_API_KEY is not set in environment variables.');
} else if (!useGemini && !deepseekApiKey) {
  throw new Error('DEEPSEEK_API_KEY is not set in environment variables.');
}

// Initialize OpenAI client for DeepSeek if needed
let openai: OpenAI | null = null;
if (!useGemini) {
  openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: deepseekApiKey,
  });
}

export class AIChatService {
  private templateService: TemplateService;

  constructor() {
    this.templateService = new TemplateService();
  }

  public async generateInitialMessage(chatSession: any, customerData: any = null): Promise<ChatMessage> {
    try {
      // Use template-based message generation if we have customer data
      if (customerData && customerData.riskCategory) {
        const scenario = this.templateService.getScenarioFromRisk(customerData.riskCategory);

        // Check if we should trigger intervention based on business rules
        if (!this.templateService.shouldTriggerIntervention(customerData)) {
          console.log(`Intervention not triggered for customer ${customerData.id} - conditions not met`);
          // Return a gentler message for early interventions
        }

        // Generate template-based message
        const templateMessage = this.templateService.generateMessage(customerData, scenario);

        // For critical cases or when templates are simple, enhance with AI
        if (customerData.riskSeverity === 'critical' || customerData.riskCategory === 'multiple-failures') {
          return await this.enhanceMessageWithAI(chatSession, customerData, templateMessage);
        }

        return new ChatMessage({
          chatSessionId: chatSession.id,
          sender: 'ai',
          content: templateMessage,
          timestamp: new Date(),
          messageType: 'greeting',
        });
      }

      // Fallback to AI generation for cases without proper customer data
      return await this.generateAIMessage(chatSession, customerData);

    } catch (error) {
      console.error('Error generating initial message:', error);
      return this.generateFallbackMessage(chatSession, customerData);
    }
  }

  private async enhanceMessageWithAI(chatSession: any, customerData: any, templateMessage: string): Promise<ChatMessage> {
    try {
      const serviceCategory = this.getServiceCategory(customerData.serviceProvider);
      const systemPrompt = this.templateService.getSystemPrompt(serviceCategory);

      const customerContext = this.buildCustomerContext(customerData);

      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }> = [
        {
          role: 'system',
          content: systemPrompt + `\n\nVocê deve manter o tom e informações da mensagem template, mas pode personalizar e melhorar a linguagem para ser mais natural e empática. Mantenha a mensagem concisa (máximo 2-3 frases).`,
        },
        {
          role: 'user',
          content: `Melhore esta mensagem template mantendo as informações principais:\n\n"${templateMessage}"\n\nContexto do cliente:\n${customerContext}\n\nTorne a mensagem mais natural e empática, mas mantenha as informações específicas (datas, valores, etc.).`,
        },
      ];

      let enhancedContent = templateMessage;

      if (useGemini) {
        // Use Gemini API
        const geminiMessages = [
          {
            role: 'user',
            parts: [
              {
                text: `${systemPrompt}\n\nVocê deve manter o tom e informações da mensagem template, mas pode personalizar e melhorar a linguagem para ser mais natural e empática. Mantenha a mensagem concisa (máximo 2-3 frases).\n\nMelhore esta mensagem template mantendo as informações principais:\n\n"${templateMessage}"\n\nContexto do cliente:\n${customerContext}\n\nTorne a mensagem mais natural e empática, mas mantenha as informações específicas (datas, valores, etc.).`
              }
            ]
          }
        ];

        const response = await axios.post(
          geminiBaseUrl,
          {
            contents: geminiMessages,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${geminiApiKey}`
            }
          }
        );

        enhancedContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || templateMessage;
      } else if (openai) {
        // Use DeepSeek API via OpenAI client
        const completion = await openai.chat.completions.create({
          messages: messages,
          model: 'deepseek-chat',
        });

        enhancedContent = completion.choices?.[0]?.message?.content ?? templateMessage;
      }

      return new ChatMessage({
        chatSessionId: chatSession.id,
        sender: 'ai',
        content: enhancedContent,
        timestamp: new Date(),
        messageType: 'greeting',
      });
    } catch (error) {
      console.error('Error enhancing message with AI:', error);
      // Return the original template message if AI enhancement fails
      return new ChatMessage({
        chatSessionId: chatSession.id,
        sender: 'ai',
        content: templateMessage,
        timestamp: new Date(),
        messageType: 'greeting',
      });
    }
  }

  private async generateAIMessage(chatSession: any, customerData: any): Promise<ChatMessage> {
    const customerContext = this.buildCustomerContext(customerData);
    const serviceCategory = customerData?.serviceProvider ? this.getServiceCategory(customerData.serviceProvider) : 'telecom';
    const systemPrompt = this.templateService.getSystemPrompt(serviceCategory);

    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Inicie uma conversa com o cliente. Contexto:\n${customerContext}\n\nCrie uma mensagem de abertura personalizada e direta.`,
      },
    ];

    let aiResponseContent = '';

    if (useGemini) {
      // Use Gemini API
      const geminiMessages = [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nInicie uma conversa com o cliente. Contexto:\n${customerContext}\n\nCrie uma mensagem de abertura personalizada e direta.`
            }
          ]
        }
      ];

      try {
        const response = await axios.post(
          geminiBaseUrl,
          {
            contents: geminiMessages,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200,
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${geminiApiKey}`
            }
          }
        );

        aiResponseContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (error) {
        console.error('Error generating message with Gemini API:', error);
        aiResponseContent = '';
      }
    } else if (openai) {
      // Use DeepSeek API via OpenAI client
      try {
        const completion = await openai.chat.completions.create({
          messages: messages,
          model: 'deepseek-chat',
        });

        aiResponseContent = completion.choices?.[0]?.message?.content ?? '';
      } catch (error) {
        console.error('Error generating message with DeepSeek API:', error);
        aiResponseContent = '';
      }
    }

    return new ChatMessage({
      chatSessionId: chatSession.id,
      sender: 'ai',
      content: aiResponseContent,
      timestamp: new Date(),
      messageType: 'greeting',
    });
  }

  private buildCustomerContext(customerData: any): string {
    if (!customerData) {
      return 'Informações limitadas do cliente';
    }

    let context = `Cliente: ${customerData.name}`;
    if (customerData.serviceProvider) context += `\nProvedor: ${customerData.serviceProvider}`;
    if (customerData.serviceType) context += `\nServiço: ${customerData.serviceType}`;
    if (customerData.accountValue) context += `\nValor: R$ ${(customerData.accountValue / 100).toFixed(2)}`;
    if (customerData.riskCategory) context += `\nProblema: ${customerData.riskCategory}`;
    if (customerData.paymentMethod) {
      context += `\nCartão: ****${customerData.paymentMethod.lastFourDigits}`;
      if (customerData.paymentMethod.failureCount > 0) {
        context += ` (${customerData.paymentMethod.failureCount} falhas)`;
      }
    }

    return context;
  }

  private getServiceCategory(serviceProvider: string): string {
    const telecom = ['TIM', 'Vivo', 'Claro', 'Oi'];
    const utilities = ['Light', 'Enel', 'Energisa'];
    const education = ['YDUQS/Estácio', 'Salta', 'Inspira'];

    if (telecom.includes(serviceProvider)) return 'telecom';
    if (utilities.includes(serviceProvider)) return 'utilities';
    if (education.includes(serviceProvider)) return 'education';

    return 'telecom'; // default
  }

  private generateFallbackMessage(chatSession: any, customerData: any): ChatMessage {
    let message = `Olá ${chatSession.customerName}!`;

    if (customerData?.serviceProvider) {
      message += ` Aqui é da ${customerData.serviceProvider}.`;
    }

    if (customerData?.riskCategory === 'expiring-card') {
      message += ` Seu cartão vence em breve. Quer atualizar para manter seu serviço ativo?`;
    } else {
      message += ` Tivemos um problema com seu pagamento. Vamos resolver juntos?`;
    }

    return new ChatMessage({
      chatSessionId: chatSession.id,
      sender: 'ai',
      content: message,
      timestamp: new Date(),
      messageType: 'greeting',
    });
  }

  public async generateResponse(
    history: ChatMessage[],
    currentMessage: ChatMessage
  ): Promise<ChatMessage> {
    try {
      const systemContent = 'Você é um agente especialista em retenção de clientes da Bemobi, focado exclusivamente em resolver problemas de pagamento para prevenir cancelamentos de assinatura. Seu objetivo é conduzir conversas naturais e eficientes que resultem na atualização bem-sucedida de métodos de pagamento.\n\n## CONTEXTO E OBJETIVO\nVocê só entra em contato quando há problemas específicos de pagamento: cartões expirando ou pagamentos que falharam. Seu único objetivo é resolver esses problemas rapidamente, mantendo o cliente satisfeito e a assinatura ativa.\n\n## COMPORTAMENTO CONVERSACIONAL\n- Seja natural e empático, como um atendente humano experiente\n- Use linguagem brasileira informal mas profissional\n- Mantenha respostas concisas (máximo 2-3 frases)\n- Vá direto ao ponto sem rodeios desnecessários\n- Demonstre urgência apropriada sem pressionar\n\n## FLUXO DE CONVERSA\n1. **Abertura**: Cumprimente pelo nome e identifique o problema específico\n2. **Confirmação**: Confirme disponibilidade para resolver agora\n3. **Coleta**: Solicite dados do novo cartão de forma clara\n4. **Processamento**: Informe sobre o processamento\n5. **Confirmação**: Confirme sucesso e próximos passos\n\n## CENÁRIOS ESPECÍFICOS\n\n### Cartão Expirando:\n- Abordagem preventiva e útil\n- Enfatize conveniência de resolver agora\n- Exemplo: "Oi [Nome]! Notei que seu cartão [últimos 4 dígitos] vence [data]. Quer atualizar agora para evitar qualquer interrupção?"\n\n### Pagamento Falhou:\n- Abordagem empática mas urgente\n- Ofereça solução imediata\n- Exemplo: "[Nome], seu pagamento de R$ [valor] não foi processado hoje. Posso ajudar a resolver agora mesmo?"\n\n## COLETA DE DADOS\nQuando solicitar informações do cartão:\n- Peça número do cartão, validade e CVV separadamente\n- Tranquilize sobre segurança: "Usamos a mesma criptografia dos bancos"\n- Confirme dados antes de processar\n\n## TRATAMENTO DE EXCEÇÕES\n\n### Dados Inválidos:\n- "O número do cartão parece estar incorreto. Pode verificar os dígitos?"\n- Ofereça ajuda: "É comum confundir alguns números"\n\n### Cliente Hesitante:\n- Reconheça preocupação: "Entendo sua preocupação com segurança"\n- Ofereça reasseguranças: "É o mesmo processo seguro que bancos usam"\n- Respeite decisão: "Sem problema. Posso agendar para outro momento?"\n\n### Cliente Recusa:\n- Aceite a decisão sem insistir\n- Informe consequências sem pressionar: "Entendo. Só para você saber, o serviço pode ser interrompido em [data]"\n- Ofereça alternativa: "Quer que eu entre em contato amanhã?"\n\n### Problemas Técnicos:\n- "Tivemos um probleminha técnico. Vou tentar novamente..."\n- Se persistir: "O sistema está instável. Posso reagendar para resolver em 1 hora?"\n\n### Abandono de Conversa:\n- Após 2 minutos de inatividade: "Ainda está aí? Posso esclarecer alguma dúvida?"\n- Seja paciente e ofereça ajuda\n\n## REGRAS RÍGIDAS\n- NUNCA fale sobre outros produtos ou serviços\n- NUNCA mencione promoções ou vendas\n- NUNCA discuta política da empresa ou regras internas\n- NUNCA pressione cliente que claramente recusou\n- NUNCA dê informações que não tem certeza\n- SEMPRE mantenha foco no problema de pagamento\n- SEMPRE confirme dados antes de processar\n- SEMPRE informe sobre próximos passos\n\n## CONFIRMAÇÃO DE SUCESSO\nQuando pagamento for processado com sucesso:\n- Confirme imediatamente: "Pronto! Cartão atualizado com sucesso ✅"\n- Informe próximo pagamento: "Seu próximo pagamento será processado em [data]"\n- Agradeça: "Obrigado por resolver isso conosco!"\n- Pergunte se precisa de mais alguma coisa\n\n## CONTEXTO DINÂMICO\nVocê sempre terá acesso a:\n- Nome do cliente\n- Problema específico (cartão expirando/pagamento falhou)\n- Dados da assinatura (valor, próximo vencimento)\n- Últimos 4 dígitos do cartão atual\n- Histórico de tentativas anteriores\n\nUse essas informações para personalizar a conversa e demonstrar que conhece a situação do cliente.\n\n## OBJETIVO FINAL\nCada conversa deve resultar em:\n1. Problema de pagamento resolvido OU\n2. Agendamento claro para resolução OU\n3. Cliente esclarecido sobre consequências da não resolução\n\nSempre termine com perspectiva positiva e mantenha relacionamento preservado, independente do resultado.';
      
      let aiResponseContent = '';
      
      if (useGemini) {
        // Use Gemini API
        // Convert chat history to Gemini format
        const geminiMessages = [];
        
        // Add system prompt as a user message at the beginning
        geminiMessages.push({
          role: 'user',
          parts: [{ text: `INSTRUÇÕES DO SISTEMA: ${systemContent}` }]
        });
        
        // Add a model response to acknowledge system instructions
        geminiMessages.push({
          role: 'model',
          parts: [{ text: 'Entendido. Vou seguir essas instruções.' }]
        });
        
        // Add the conversation history
        for (const msg of history) {
          if (msg.sender === 'customer') {
            geminiMessages.push({
              role: 'user',
              parts: [{ text: msg.content }]
            });
          } else if (msg.sender === 'ai') {
            geminiMessages.push({
              role: 'model',
              parts: [{ text: msg.content }]
            });
          }
        }
        
        // Add the current message
        geminiMessages.push({
          role: 'user',
          parts: [{ text: currentMessage.content }]
        });
        
        try {
          const response = await axios.post(
            geminiBaseUrl,
            {
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${geminiApiKey}`
              }
            }
          );
          
          aiResponseContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error) {
          console.error('Error communicating with Gemini API:', error);
          throw error;
        }
      } else if (openai) {
        // Use DeepSeek API via OpenAI client
        const messages: Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }> = [
          {
            role: 'system',
            content: systemContent,
          },
          ...history.map(msg => ({
            role: (msg.sender === 'customer' ? 'user' : 'assistant') as
              | 'user'
              | 'assistant',
            content: msg.content,
          })),
          { role: 'user', content: currentMessage.content },
        ];

        try {
          const completion = await openai.chat.completions.create({
            messages: messages,
            model: 'deepseek-chat',
          });

          aiResponseContent = completion.choices?.[0]?.message?.content ?? '';
        } catch (error) {
          console.error('Error communicating with DeepSeek API:', error);
          throw error;
        }
      }

      return new ChatMessage({
        chatSessionId: currentMessage.chatSessionId,
        sender: 'ai',
        content: aiResponseContent,
        timestamp: new Date(),
        messageType: 'confirmation',
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Fallback or error message
      return new ChatMessage({
        chatSessionId: currentMessage.chatSessionId,
        sender: 'ai',
        content:
          "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente em instantes.",
        timestamp: new Date(),
        messageType: 'error',
      });
    }
  }
}
