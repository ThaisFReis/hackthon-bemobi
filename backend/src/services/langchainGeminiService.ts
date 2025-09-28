import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import ChatMessage from '../models/chatMessage';
import { TemplateService } from './templateService';

// Define interfaces for better type safety
interface PaymentMethod {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
  failureCount: number;
  lastFailureDate?: string;
  lastSuccessDate?: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceProvider: string;
  serviceType: string;
  accountValue: number;
  paymentMethod: PaymentMethod;
  riskCategory: string;
  riskSeverity?: string;
  lastPaymentDate: string;
  nextBillingDate: string;
}

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}

export class LangchainGeminiService {
  private model: ChatGoogleGenerativeAI;
  private templateService: TemplateService;
  private langsmithClient?: Client;
  private isLangSmithEnabled: boolean = false;
  public enhanceMessageWithAI!: (chatSession: any, customerData: CustomerData, templateMessage: string) => Promise<ChatMessage>;
  public generateAIMessage!: (chatSession: any, customerData: CustomerData | null) => Promise<ChatMessage>;
  public generateResponse!: (history: ChatMessage[], currentMessage: ChatMessage) => Promise<ChatMessage>;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: geminiApiKey,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    this.templateService = new TemplateService();

    // Initialize LangSmith client if API key is available
    if (process.env.LANGCHAIN_API_KEY) {
      try {
        this.langsmithClient = new Client({
          apiKey: process.env.LANGCHAIN_API_KEY,
          apiUrl: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
        });
        this.isLangSmithEnabled = true;
        console.log('LangSmith client initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize LangSmith client:', error);
        this.isLangSmithEnabled = false;
      }
    } else {
      console.warn('LangSmith API key not found - tracing will be disabled');
      this.isLangSmithEnabled = false;
    }

    // Initialize traceable methods after LangSmith setup
    this.initializeTraceableMethods();
  }

  // Helper method to safely create traceable functions
  private createTraceable<T extends (...args: any[]) => any>(
    fn: T,
    name: string,
    metadata: Record<string, any> = {}
  ): T {
    if (this.isLangSmithEnabled) {
      try {
        return traceable(fn, { name, metadata });
      } catch (error) {
        console.warn(`Failed to create traceable function ${name}:`, error);
        return fn;
      }
    }
    return fn;
  }

  // Initialize traceable methods
  private initializeTraceableMethods(): void {
    this.enhanceMessageWithAI = this.createTraceable(
      async (chatSession: any, customerData: CustomerData, templateMessage: string): Promise<ChatMessage> => {
        try {
          const serviceCategory = this.getServiceCategory(customerData.serviceProvider);
          const systemPrompt = this.templateService.getSystemPrompt(serviceCategory);

          const customerContext = this.buildCustomerContext(customerData);

          const prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt + `\n\nVocê deve manter o tom e informações da mensagem template, mas pode personalizar e melhorar a linguagem para ser mais natural e empática. Mantenha a mensagem concisa (máximo 2-3 frases).`],
            ['human', `Melhore esta mensagem template mantendo as informações principais:\n\n"${templateMessage}"\n\nContexto do cliente:\n${customerContext}\n\nTorne a mensagem mais natural e empática, mas mantenha as informações específicas (datas, valores, etc.).`],
          ]);

          const chain = prompt.pipe(this.model);
          const result = await chain.invoke({});

          const enhancedContent = result.content as string || templateMessage;

          return new ChatMessage({
            chatSessionId: chatSession.id,
            sender: 'ai',
            content: enhancedContent,
            timestamp: new Date(),
            messageType: 'greeting',
          });
        } catch (error) {
          console.error('Error enhancing message with Gemini AI:', error);
          // Return the original template message if AI enhancement fails
          return new ChatMessage({
            chatSessionId: chatSession.id,
            sender: 'ai',
            content: templateMessage,
            timestamp: new Date(),
            messageType: 'greeting',
          });
        }
      },
      "enhance_message_with_ai",
      { service: "langchain-gemini" }
    );

    this.generateAIMessage = this.createTraceable(
      async (chatSession: any, customerData: CustomerData | null): Promise<ChatMessage> => {
        try {
          const customerContext = this.buildCustomerContext(customerData);
          const serviceCategory = customerData?.serviceProvider ? this.getServiceCategory(customerData.serviceProvider) : 'telecom';
          const systemPrompt = this.templateService.getSystemPrompt(serviceCategory);

          const prompt = ChatPromptTemplate.fromMessages([
            ['system', systemPrompt],
            ['human', `Inicie uma conversa com o cliente. Contexto:\n${customerContext}\n\nCrie uma mensagem de abertura personalizada e direta.`],
          ]);

          const chain = prompt.pipe(this.model);
          const result = await chain.invoke({});

          const aiResponseContent = result.content as string || '';

          return new ChatMessage({
            chatSessionId: chatSession.id,
            sender: 'ai',
            content: aiResponseContent,
            timestamp: new Date(),
            messageType: 'greeting',
          });
        } catch (error) {
          console.error('Error generating AI message with Gemini:', error);
          return this.generateFallbackMessage(chatSession, customerData);
        }
      },
      "generate_ai_message",
      { service: "langchain-gemini" }
    );

    this.generateResponse = this.createTraceable(
      async (
        history: ChatMessage[],
        currentMessage: ChatMessage
      ): Promise<ChatMessage> => {
        try {
          const systemPrompt = 'Você é um agente especialista em retenção de clientes da Bemobi, focado exclusivamente em resolver problemas de pagamento para prevenir cancelamentos de assinatura. Seu objetivo é conduzir conversas naturais e eficientes que resultem na atualização bem-sucedida de métodos de pagamento.\n\n## CONTEXTO E OBJETIVO\nVocê só entra em contato quando há problemas específicos de pagamento: cartões expirando ou pagamentos que falharam. Seu único objetivo é resolver esses problemas rapidamente, mantendo o cliente satisfeito e a assinatura ativa.\n\n## COMPORTAMENTO CONVERSACIONAL\n- Seja natural e empático, como um atendente humano experiente\n- Use linguagem brasileira informal mas profissional\n- Mantenha respostas concisas (máximo 2-3 frases)\n- Vá direto ao ponto sem rodeios desnecessários\n- Demonstre urgência apropriada sem pressionar\n\n## FLUXO DE CONVERSA\n1. **Abertura**: Cumprimente pelo nome e identifique o problema específico\n2. **Confirmação**: Confirme disponibilidade para resolver agora\n3. **Coleta**: Solicite dados do novo cartão de forma clara\n4. **Processamento**: Informe sobre o processamento\n5. **Confirmação**: Confirme sucesso e próximos passos\n\n## CENÁRIOS ESPECÍFICOS\n\n### Cartão Expirando:\n- Abordagem preventiva e útil\n- Enfatize conveniência de resolver agora\n- Exemplo: "Oi [Nome]! Notei que seu cartão [últimos 4 dígitos] vence [data]. Quer atualizar agora para evitar qualquer interrupção?"\n\n### Pagamento Falhou:\n- Abordagem empática mas urgente\n- Ofereça solução imediata\n- Exemplo: "[Nome], seu pagamento de R$ [valor] não foi processado hoje. Posso ajudar a resolver agora mesmo?"\n\n## COLETA DE DADOS\nQuando solicitar informações do cartão:\n- Peça número do cartão, validade e CVV separadamente\n- Tranquilize sobre segurança: "Usamos a mesma criptografia dos bancos"\n- Confirme dados antes de processar\n\n## TRATAMENTO DE EXCEÇÕES\n\n### Dados Inválidos:\n- "O número do cartão parece estar incorreto. Pode verificar os dígitos?"\n- Ofereça ajuda: "É comum confundir alguns números"\n\n### Cliente Hesitante:\n- Reconheça preocupação: "Entendo sua preocupação com segurança"\n- Ofereça reasseguranças: "É o mesmo processo seguro que bancos usam"\n- Respeite decisão: "Sem problema. Posso agendar para outro momento?"\n\n### Cliente Recusa:\n- Aceite a decisão sem insistir\n- Informe consequências sem pressionar: "Entendo. Só para você saber, o serviço pode ser interrompido em [data]"\n- Ofereça alternativa: "Quer que eu entre em contato amanhã?"\n\n### Problemas Técnicos:\n- "Tivemos um probleminha técnico. Vou tentar novamente..."\n- Se persistir: "O sistema está instável. Posso reagendar para resolver em 1 hora?"\n\n### Abandono de Conversa:\n- Após 2 minutos de inatividade: "Ainda está aí? Posso esclarecer alguma dúvida?"\n- Seja paciente e ofereça ajuda\n\n## REGRAS RÍGIDAS\n- NUNCA fale sobre outros produtos ou serviços\n- NUNCA mencione promoções ou vendas\n- NUNCA discuta política da empresa ou regras internas\n- NUNCA pressione cliente que claramente recusou\n- NUNCA dê informações que não tem certeza\n- SEMPRE mantenha foco no problema de pagamento\n- SEMPRE confirme dados antes de processar\n- SEMPRE informe sobre próximos passos\n\n## CONFIRMAÇÃO DE SUCESSO\nQuando pagamento for processado com sucesso:\n- Confirme imediatamente: "Pronto! Cartão atualizado com sucesso ✅"\n- Informe próximo pagamento: "Seu próximo pagamento será processado em [data]"\n- Agradeça: "Obrigado por resolver isso conosco!"\n- Pergunte se precisa de mais alguma coisa\n\n## CONTEXTO DINÂMICO\nVocê sempre terá acesso a:\n- Nome do cliente\n- Problema específico (cartão expirando/pagamento falhou)\n- Dados da assinatura (valor, próximo vencimento)\n- Últimos 4 dígitos do cartão atual\n- Histórico de tentativas anteriores\n\nUse essas informações para personalizar a conversa e demonstrar que conhece a situação do cliente.\n\n## OBJETIVO FINAL\nCada conversa deve resultar em:\n1. Problema de pagamento resolvido OU\n2. Agendamento claro para resolução OU\n3. Cliente esclarecido sobre consequências da não resolução\n\nSempre termine com perspectiva positiva e mantenha relacionamento preservado, independente do resultado.';

          // Convert chat history to Langchain messages
          const messages: BaseMessage[] = [
            new SystemMessage(systemPrompt),
            ...history.map(msg =>
              msg.sender === 'customer'
                ? new HumanMessage(msg.content)
                : new AIMessage(msg.content)
            ),
            new HumanMessage(currentMessage.content)
          ];

          const result = await this.model.invoke(messages);
          const aiResponseContent = result.content as string || '';

          return new ChatMessage({
            chatSessionId: currentMessage.chatSessionId,
            sender: 'ai',
            content: aiResponseContent,
            timestamp: new Date(),
            messageType: 'confirmation',
          });
        } catch (error) {
          console.error('Error communicating with Gemini AI:', error);
          // Fallback or error message
          return new ChatMessage({
            chatSessionId: currentMessage.chatSessionId,
            sender: 'ai',
            content:
              "Desculpe, estou com dificuldades para processar sua mensagem no momento. Pode tentar novamente?",
            timestamp: new Date(),
            messageType: 'error',
          });
        }
      },
      "generate_response",
      { service: "langchain-gemini" }
    );
  }

  public async generateInitialMessage(chatSession: any, customerData: CustomerData | null = null): Promise<ChatMessage> {
    try {
      // Use template-based message generation if we have customer data
      if (customerData && customerData.riskCategory) {
        const scenario = this.templateService.getScenarioFromRisk(customerData.riskCategory);

        // Check if we should trigger intervention based on business rules
        if (!this.templateService.shouldTriggerIntervention(customerData)) {
          console.log(`Intervention not triggered for customer ${customerData.id} - conditions not met`);
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

  private buildCustomerContext(customerData: CustomerData | null): string {
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

  private generateFallbackMessage(chatSession: any, customerData: CustomerData | null): ChatMessage {
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
}