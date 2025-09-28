import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Client } from 'langsmith';
import ChatMessage from '../models/chatMessage';
import { TemplateService } from './templateService';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceProvider: string;
  serviceType: string;
  accountValue: number;
  riskCategory: string;
  riskSeverity?: string;
  lastPaymentDate: string;
  nextBillingDate: string;
  currentPaymentStatus?: string;
}

const geminiApiKey = process.env.GEMINI_API_KEY;
const langsmithApiKey = process.env.LANGCHAIN_API_KEY;
const langsmithProject = process.env.LANGCHAIN_PROJECT || 'gemini-churn-prevention';

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables.');
}

export class LangchainGeminiService {
  private model: ChatGoogleGenerativeAI;
  private templateService: TemplateService;
  private langsmithClient: Client | null;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: geminiApiKey,
      temperature: 0.7,
      maxOutputTokens: 1024,
    });

    this.templateService = new TemplateService();

    // Initialize LangSmith client if API key is available
    this.langsmithClient = langsmithApiKey
      ? new Client({ apiKey: langsmithApiKey })
      : null;

    if (this.langsmithClient) {
      console.log(`LangSmith tracing enabled for project: ${langsmithProject}`);
    } else {
      console.log('LangSmith tracing disabled - no API key provided');
    }
  }

  public async generateInitialMessage(chatSession: any, customerData: CustomerData | null = null): Promise<ChatMessage> {
    const runId = this.langsmithClient ? await this.startLangSmithRun('generate_initial_message', {
      customerId: customerData?.id,
      customerName: customerData?.name,
      serviceProvider: customerData?.serviceProvider,
      riskCategory: customerData?.riskCategory,
    }) : null;

    try {
      const customerContext = this.buildCustomerContext(customerData);
      const serviceCategory = customerData?.serviceProvider ? this.getServiceCategory(customerData.serviceProvider) : 'telecom';
      const systemPrompt = this.templateService.getSystemPrompt(serviceCategory);

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', systemPrompt],
        ['human', `Inicie uma conversa com o cliente. Contexto:\n${customerContext}\n\nENVIE APENAS uma saudação curta e direta, Seja empático, educado e use linguagem coloquial brasileira. Explique o motivo do contato deixando claro que é um problema no pagamento. NÃO mencione fatura ou cartão nesta mensagem - isso será enviado automaticamente na próxima mensagem.`],
      ]);

      const chain = prompt.pipe(this.model);
      const result = await chain.invoke({});

      let aiResponseContent = '';
      if (result.content) {
        aiResponseContent = typeof result.content === 'string' ? result.content : String(result.content);
      }

      if (!aiResponseContent || aiResponseContent.trim() === '') {
        console.warn('AI returned empty initial message, using fallback');
        if (runId) await this.endLangSmithRun(runId, { error: 'Empty response, using fallback' });
        return this.generateFallbackMessage(chatSession, customerData);
      }

      const chatMessage = new ChatMessage({
        chatSessionId: chatSession.id,
        sender: 'ai',
        content: aiResponseContent.trim(),
        timestamp: new Date(),
        messageType: 'greeting',
      });

      if (runId) {
        await this.endLangSmithRun(runId, {
          output: aiResponseContent.trim(),
          messageType: 'greeting',
          success: true,
        });
      }

      return chatMessage;
    } catch (error) {
      console.error('Error generating AI message with Gemini:', error);
      if (runId) await this.endLangSmithRun(runId, { error: error instanceof Error ? error.message : 'Unknown error' });
      return this.generateFallbackMessage(chatSession, customerData);
    }
  }

  public generateInvoiceCardMessage(chatSession: any, customerData: CustomerData | null = null): ChatMessage {
    // Calcula a data de vencimento (15 dias a partir de hoje como exemplo)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    const formattedDueDate = dueDate.toLocaleDateString('pt-BR');

    // Gera dados do cartão de fatura
    const invoiceData = {
      customerName: chatSession.customerName || customerData?.name || 'Cliente',
      accountNumber: customerData?.id ? customerData.id.substring(0, 9) : '123423453',
      brandName: customerData?.serviceProvider || 'Vivo',
      dueDate: formattedDueDate,
      amount: customerData?.accountValue ? (customerData.accountValue / 100) : 49.90,
      billPeriod: this.getCurrentMonthName()
    };

    console.log('Gerando invoice card com dados:', invoiceData);

    const content = `[INVOICE_CARD]${JSON.stringify(invoiceData)}`;

    return new ChatMessage({
      chatSessionId: chatSession.id,
      sender: 'ai',
      content: content,
      timestamp: new Date(),
      messageType: 'response',
    });
  }

  public async generateResponse(
    history: ChatMessage[],
    currentMessage: ChatMessage
  ): Promise<ChatMessage> {
    const runId = this.langsmithClient ? await this.startLangSmithRun('generate_response', {
      sessionId: currentMessage.chatSessionId,
      messageContent: currentMessage.content,
      historyLength: history.length,
    }) : null;

    try {
      let systemPrompt = `Você é um assistente de atendimento da Bemobi via WhatsApp, especializado em resolver problemas de pagamento de forma rápida e amigável.

#REGRAS OBRIGATÓRIAS:
1. SEMPRE responda com conteúdo útil e positivo - nunca deixe a resposta vazia
2. NUNCA ofereça links ou URLs
3. APENAS use o botão de pagamento quando o cliente concordar em pagar
4. Seja empático, educado e use linguagem coloquial brasileira
5. Mantenha respostas curtas (máximo 2 frases quando muito necessário)
6. NUNCA diga que tem dificuldades para processar mensagens

FLUXO DE PAGAMENTO WHATSAPP:
- Se o cliente concordar em pagar ou escolher um método de pagamento, responda EXATAMENTE: [PAYMENT_BUTTON]
- NUNCA adicione texto extra com [PAYMENT_BUTTON]
- Se receber mensagem sobre "PAYMENT_CONFIRMED", SEMPRE confirme o sucesso do pagamento, agradeça e se despeça educadamente

RESPOSTA PARA MÉTODOS DE PAGAMENTO:
- Se cliente escolher Pix, Cartão de Crédito ou Boleto, responda apenas: [PAYMENT_BUTTON]
- Se cliente disser "pix", "cartão", "boleto", ou similar, responda: [PAYMENT_BUTTON]

EXEMPLOS DE RESPOSTAS:
- Para "quero pagar com pix": "[PAYMENT_BUTTON]"
- Para "vou pagar no cartão": "[PAYMENT_BUTTON]"
- Para "escolho boleto": "[PAYMENT_BUTTON]"
- Pós-pagamento: "Perfeito! ✅ Seu pagamento foi processado com sucesso. Muito obrigado e tenha um ótimo dia!"

IMPORTANTE:
- Este é um atendimento via WhatsApp
- SEMPRE seja positivo e útil
- Quando o pagamento for confirmado, SEMPRE celebre o sucesso e agradeça
- NUNCA mencione dificuldades técnicas`;

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

      let aiResponseContent = '';
      if (result.content) {
        aiResponseContent = typeof result.content === 'string' ? result.content : String(result.content);
      }

      if (!aiResponseContent || aiResponseContent.trim() === '') {
        console.warn('AI returned empty response, using context fallback');

        if (currentMessage.content.includes('PAYMENT_CONFIRMED')) {
          return new ChatMessage({
            chatSessionId: currentMessage.chatSessionId,
            sender: 'ai',
            content: 'Perfeito! ✅ Seu pagamento foi processado com sucesso. Muito obrigado e tenha um ótimo dia!',
            timestamp: new Date(),
            messageType: 'response',
          });
        }

        // Verifica se é uma escolha de método de pagamento
        const lowerContent = currentMessage.content.toLowerCase();
        if (lowerContent.includes('pix') || lowerContent.includes('cartão') || lowerContent.includes('boleto') || 
            lowerContent.includes('credito') || lowerContent.includes('crédito')) {
          return new ChatMessage({
            chatSessionId: currentMessage.chatSessionId,
            sender: 'ai',
            content: '[PAYMENT_BUTTON]',
            timestamp: new Date(),
            messageType: 'response',
          });
        }

        return new ChatMessage({
          chatSessionId: currentMessage.chatSessionId,
          sender: 'ai',
          content: 'Entendi! Como posso te ajudar com sua questão de pagamento?',
          timestamp: new Date(),
          messageType: 'response',
        });
      }

      const chatMessage = new ChatMessage({
        chatSessionId: currentMessage.chatSessionId,
        sender: 'ai',
        content: aiResponseContent.trim(),
        timestamp: new Date(),
        messageType: 'response',
      });

      if (runId) {
        await this.endLangSmithRun(runId, {
          output: aiResponseContent.trim(),
          messageType: 'response',
          success: true,
        });
      }

      return chatMessage;
    } catch (error) {
      console.error('Error communicating with Gemini AI:', error);

      const errorMessage = new ChatMessage({
        chatSessionId: currentMessage.chatSessionId,
        sender: 'ai',
        content: "Desculpe, estou com dificuldades para processar sua mensagem no momento. Pode tentar novamente?",
        timestamp: new Date(),
        messageType: 'error',
      });

      if (runId) {
        await this.endLangSmithRun(runId, { error: error instanceof Error ? error.message : 'Unknown error' });
      }

      return errorMessage;
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
    if (customerData.currentPaymentStatus) context += `\nStatus Pagamento: ${customerData.currentPaymentStatus}`;

    return context;
  }

  private getServiceCategory(serviceProvider: string): string {
    const telecom = ['TIM', 'Vivo', 'Claro', 'Oi'];
    const utilities = ['Light', 'Enel', 'Energisa'];
    const education = ['YDUQS/Estácio', 'Salta', 'Inspira'];

    if (telecom.includes(serviceProvider)) return 'telecom';
    if (utilities.includes(serviceProvider)) return 'utilities';
    if (education.includes(serviceProvider)) return 'education';

    return 'telecom';
  }

  private getCurrentMonthName(): string {
    const months = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return months[new Date().getMonth()] || 'janeiro';
  }

  private generateFallbackMessage(chatSession: any, customerData: CustomerData | null): ChatMessage {
    let message = `Olá ${chatSession.customerName}!`;

    if (customerData?.serviceProvider) {
      message += ` Aqui é da ${customerData.serviceProvider}.`;
    }

    message += ` Notamos algumas tentativas de pagamento sem sucesso do seu ${customerData?.serviceType || 'serviço'}. Que tal resolvermos isso para manter sua conexão ativa?`;

    return new ChatMessage({
      chatSessionId: chatSession.id,
      sender: 'ai',
      content: message,
      timestamp: new Date(),
      messageType: 'greeting',
    });
  }

  // LangSmith helper methods
  private async startLangSmithRun(runType: string, inputs: any): Promise<string | null> {
    if (!this.langsmithClient) return null;

    try {
      const run = await this.langsmithClient.createRun({
        name: runType,
        run_type: 'llm',
        inputs,
        project_name: langsmithProject,
      } as any);
      return (run as any)?.id || null;
    } catch (error) {
      console.error('Error starting LangSmith run:', error);
      return null;
    }
  }

  private async endLangSmithRun(runId: string, outputs: any): Promise<void> {
    if (!this.langsmithClient) return;

    try {
      await this.langsmithClient.updateRun(runId, {
        outputs,
        end_time: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error ending LangSmith run:', error);
    }
  }

  // Get LangSmith project stats
  public async getLangSmithStats(): Promise<any> {
    if (!this.langsmithClient) {
      return { error: 'LangSmith not configured' };
    }

    try {
      // Get recent runs for the project
      const runs = this.langsmithClient.listRuns({
        projectName: langsmithProject,
        limit: 20,
      });

      const recentRuns: any[] = [];
      let count = 0;
      for await (const run of runs) {
        if (count >= 20) break;
        recentRuns.push(run);
        count++;
      }

      return {
        projectName: langsmithProject,
        totalRuns: recentRuns.length,
        recentRuns: recentRuns.map(run => ({
          id: run.id,
          name: run.name,
          status: run.status,
          startTime: run.start_time,
          endTime: run.end_time,
          inputs: run.inputs,
          outputs: run.outputs,
          error: run.error,
        })),
        successRate: recentRuns.filter(run => !run.error).length / Math.max(recentRuns.length, 1),
      };
    } catch (error) {
      console.error('Error getting LangSmith stats:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}