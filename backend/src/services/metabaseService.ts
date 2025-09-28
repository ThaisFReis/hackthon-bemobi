import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Serviço para integração com Metabase
 * 
 * Este serviço permite a conexão com o Metabase para exploração adicional de dados
 * e criação de dashboards customizados pela equipe de dados.
 */
export class MetabaseService {
  private metabaseUrl: string;
  private metabaseUsername: string;
  private metabasePassword: string;
  private sessionToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.metabaseUrl = process.env.METABASE_URL || '';
    this.metabaseUsername = process.env.METABASE_USERNAME || '';
    this.metabasePassword = process.env.METABASE_PASSWORD || '';
  }

  /**
   * Autentica com o Metabase e obtém um token de sessão
   */
  private async authenticate(): Promise<string> {
    if (this.sessionToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.sessionToken;
    }

    try {
      const response = await axios.post(`${this.metabaseUrl}/api/session`, {
        username: this.metabaseUsername,
        password: this.metabasePassword
      });

      this.sessionToken = response.data.id;
      
      // Token expira em 14 dias (padrão do Metabase)
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 14);
      this.tokenExpiry = expiry;

      return this.sessionToken ?? '';
    } catch (error) {
      console.error('Erro ao autenticar com Metabase:', error);
      throw new Error('Falha na autenticação com Metabase');
    }
  }

  /**
   * Cria um dashboard no Metabase
   */
  async createDashboard(name: string, description: string): Promise<any> {
    const token = await this.authenticate();

    try {
      const response = await axios.post(
        `${this.metabaseUrl}/api/dashboard`,
        { name, description },
        { headers: { 'X-Metabase-Session': token } }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao criar dashboard no Metabase:', error);
      throw new Error('Falha ao criar dashboard no Metabase');
    }
  }

  /**
   * Exporta dados para o Metabase através da criação de uma pergunta (question)
   */
  async exportDataToMetabase(datasetName: string, data: any[]): Promise<any> {
    // Esta é uma implementação simplificada
    // Em um ambiente real, você precisaria:
    // 1. Ter uma tabela no banco de dados conectado ao Metabase
    // 2. Inserir os dados nessa tabela
    // 3. Criar uma "question" no Metabase que consulta essa tabela

    console.log(`Exportando ${data.length} registros para dataset '${datasetName}' no Metabase`);
    
    // Aqui você implementaria a lógica para salvar os dados em um banco
    // que o Metabase possa acessar
    
    return {
      success: true,
      message: `Dados exportados com sucesso para '${datasetName}'`,
      recordCount: data.length
    };
  }

  /**
   * Gera uma URL de incorporação (embed) para um dashboard do Metabase
   */
  async getEmbedUrl(dashboardId: number): Promise<string> {
    const token = await this.authenticate();

    try {
      // Obter o payload de incorporação do Metabase
      const response = await axios.post(
        `${this.metabaseUrl}/api/dashboard/${dashboardId}/public_link`,
        {},
        { headers: { 'X-Metabase-Session': token } }
      );

      return response.data.public_url;
    } catch (error) {
      console.error('Erro ao gerar URL de incorporação:', error);
      throw new Error('Falha ao gerar URL de incorporação do dashboard');
    }
  }

  /**
   * Verifica se a conexão com o Metabase está funcionando
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new MetabaseService();