import * as fs from 'fs';
import * as path from 'path';

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
  lastPaymentDate: string;
  nextBillingDate: string;
}

interface ConversationTemplates {
  [serviceCategory: string]: {
    [scenario: string]: string;
  };
}

export class TemplateService {
  private templates: ConversationTemplates = {};
  private serviceProviders: { [category: string]: string[] } = {};

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    try {
      const dataPath = path.join(__dirname, '../../data/mockCustomers.json');
      const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

      this.templates = jsonData.conversationTemplates || {};
      this.serviceProviders = jsonData.serviceProviders || {};

      console.log('Conversation templates loaded successfully');
    } catch (error) {
      console.error('Error loading conversation templates:', error);

      // Fallback templates
      this.templates = {
        telecom: {
          cardExpiring: "Oi {name}! Aqui é da {provider}. Seu cartão {cardMask} vence em {days} dias. Quer atualizar para não perder seu número?",
          paymentFailed: "Oi {name}! O pagamento do seu plano {serviceType} de R$ {value} não foi processado. Vamos resolver para manter sua linha ativa?"
        },
        utilities: {
          cardExpiring: "Oi {name}! Aqui é da {provider}. Seu cartão {cardMask} vence em {days} dias. Quer atualizar para evitar corte de energia?",
          paymentFailed: "Oi {name}! Sua conta de luz de R$ {value} não foi paga. Vamos resolver antes do prazo de corte?"
        },
        education: {
          cardExpiring: "Oi {name}! Aqui é da {provider}. Seu cartão {cardMask} vence em {days} dias. Quer atualizar para manter suas aulas em dia?",
          paymentFailed: "Oi {name}! A mensalidade de R$ {value} não foi processada. Vamos resolver para não afetar seu semestre?"
        }
      };
    }
  }

  private getServiceCategory(serviceProvider: string): string {
    for (const [category, providers] of Object.entries(this.serviceProviders)) {
      if (providers.includes(serviceProvider)) {
        return category;
      }
    }
    // Default fallback
    return 'telecom';
  }

  private calculateDaysUntilExpiry(expiryMonth: number, expiryYear: number): number {
    const now = new Date();
    const expiry = new Date(expiryYear, expiryMonth - 1, 1); // First day of expiry month
    const timeDiff = expiry.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  private formatCurrency(value: number): string {
    return (value / 100).toFixed(2); // Assuming value is in cents
  }

  public generateMessage(customer: CustomerData, scenario: 'cardExpiring' | 'paymentFailed'): string {
    const serviceCategory = this.getServiceCategory(customer.serviceProvider);
    const template = this.templates[serviceCategory]?.[scenario];

    if (!template) {
      console.warn(`Template not found for ${serviceCategory}.${scenario}`);
      return this.getFallbackMessage(customer, scenario);
    }

    // Calculate dynamic values
    const daysUntilExpiry = this.calculateDaysUntilExpiry(
      customer.paymentMethod.expiryMonth,
      customer.paymentMethod.expiryYear
    );

    const cardMask = `****${customer.paymentMethod.lastFourDigits}`;
    const formattedValue = this.formatCurrency(customer.accountValue);

    // Replace template variables
    let message = template
      .replace('{name}', customer.name)
      .replace('{provider}', customer.serviceProvider)
      .replace('{cardMask}', cardMask)
      .replace('{days}', daysUntilExpiry.toString())
      .replace('{value}', formattedValue)
      .replace('{serviceType}', customer.serviceType);

    return message;
  }

  private getFallbackMessage(customer: CustomerData, scenario: string): string {
    if (scenario === 'cardExpiring') {
      return `Olá ${customer.name}! Seu cartão terminou em ${customer.paymentMethod.lastFourDigits} vence em breve. Quer atualizar para manter seu serviço ativo?`;
    } else {
      return `Olá ${customer.name}! Tivemos um problema com seu pagamento de R$ ${this.formatCurrency(customer.accountValue)}. Vamos resolver isso juntos?`;
    }
  }

  public getSystemPrompt(serviceCategory: string): string {
    const prompts: { [key: string]: string } = {
      telecom: `Você é um especialista em retenção de clientes de operadora de telefonia/internet.
      Foque em manter a linha/internet ativa e evitar perda do número. Use linguagem informal e amigável.
      Enfatize a conveniência e a necessidade de manter a conectividade.`,

      utilities: `Você é um especialista em retenção de clientes de serviços essenciais (energia, água).
      Foque na importância do serviço essencial e no risco de corte. Use tom mais sério mas empático.
      Enfatize as consequências práticas de interrupção do serviço.`,

      education: `Você é um especialista em retenção de alunos de instituições de ensino.
      Foque no impacto acadêmico e na continuidade dos estudos. Use tom respeitoso e profissional.
      Enfatize a importância de manter os estudos em dia e o investimento no futuro.`
    };

    return prompts[serviceCategory] || prompts['telecom'];
  }

  public shouldTriggerIntervention(customer: CustomerData): boolean {
    const now = new Date();

    // Card expiring logic
    if (customer.riskCategory === 'expiring-card') {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(
        customer.paymentMethod.expiryMonth,
        customer.paymentMethod.expiryYear
      );

      // Trigger 7 days before expiry for utilities (critical), 5 days for others
      const serviceCategory = this.getServiceCategory(customer.serviceProvider);
      const triggerDays = serviceCategory === 'utilities' ? 7 : 5;

      return daysUntilExpiry <= triggerDays && daysUntilExpiry > 0;
    }

    // Payment failed logic
    if (customer.riskCategory === 'failed-payment' || customer.riskCategory === 'multiple-failures') {
      // Trigger immediately for utilities, within 24 hours for others
      if (customer.paymentMethod.lastFailureDate) {
        const lastFailure = new Date(customer.paymentMethod.lastFailureDate);
        const hoursSinceFailure = (new Date().getTime() - lastFailure.getTime()) / (1000 * 60 * 60);
        const serviceCategory = this.getServiceCategory(customer.serviceProvider);

        if (serviceCategory === 'utilities') {
          return hoursSinceFailure <= 4; // 4 hours for utilities
        } else {
          return hoursSinceFailure <= 24; // 24 hours for others
        }
      }
      return true; // No failure date, trigger immediately
    }

    return false;
  }

  public calculatePriority(customer: CustomerData): number {
    let priority = 0;
    const serviceCategory = this.getServiceCategory(customer.serviceProvider);

    // Base priority by service type
    const servicePriority: { [key: string]: number } = {
      utilities: 40,     // Essential services
      education: 30,     // High value, academic impact
      telecom: 20        // Important but not critical
    };

    priority += servicePriority[serviceCategory] || 20;

    // Risk category multiplier
    const riskMultiplier: { [key: string]: number } = {
      'multiple-failures': 2.0,
      'failed-payment': 1.5,
      'expiring-card': 1.2
    };

    priority *= (riskMultiplier[customer.riskCategory] || 1.0);

    // Account value bonus (higher value = higher priority)
    if (customer.accountValue > 50000) { // > R$ 500
      priority += 20;
    } else if (customer.accountValue > 20000) { // > R$ 200
      priority += 10;
    } else if (customer.accountValue > 10000) { // > R$ 100
      priority += 5;
    }

    // Failure count urgency
    if (customer.paymentMethod.failureCount >= 3) {
      priority += 15;
    } else if (customer.paymentMethod.failureCount >= 2) {
      priority += 10;
    }

    // Time sensitivity for card expiry
    if (customer.riskCategory === 'expiring-card') {
      const daysUntilExpiry = this.calculateDaysUntilExpiry(
        customer.paymentMethod.expiryMonth,
        customer.paymentMethod.expiryYear
      );

      if (daysUntilExpiry <= 3) {
        priority += 15; // Very urgent
      } else if (daysUntilExpiry <= 7) {
        priority += 10; // Urgent
      }
    }

    return Math.min(100, Math.round(priority));
  }

  public getScenarioFromRisk(riskCategory: string): 'cardExpiring' | 'paymentFailed' {
    if (riskCategory === 'expiring-card') {
      return 'cardExpiring';
    }
    return 'paymentFailed'; // Default for failed-payment, multiple-failures, etc.
  }
}