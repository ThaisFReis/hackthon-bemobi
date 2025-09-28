import { prisma } from '../lib/prisma';

export interface ContactLogEntry {
  customerId: string;
  contactMethod: 'AI_CHAT' | 'SMS' | 'EMAIL' | 'PHONE' | 'WHATSAPP' | 'PUSH_NOTIFICATION';
  outcome?: 'SUCCESSFUL' | 'NO_ANSWER' | 'DECLINED' | 'PAYMENT_RESOLVED' | 'RESCHEDULED' | 'DO_NOT_CONTACT';
  notes?: string;
  agentId?: string;
  sessionId?: string;
  contactDuration?: number;
  nextContactDate?: Date;
  successful?: boolean;
  paymentResolved?: boolean;
  metadata?: any;
}

export interface ContactFrequencyRule {
  maxContactsPerDay: number;
  minHoursBetweenContacts: number;
  cooldownAfterFailure: number; // hours
  cooldownAfterSuccess: number; // hours
  respectQuietHours: boolean;
  quietHoursStart: number; // 22 = 10 PM
  quietHoursEnd: number;   // 8 = 8 AM
}

export class ContactLogService {
  private defaultRules: ContactFrequencyRule = {
    maxContactsPerDay: 2,
    minHoursBetweenContacts: 4,
    cooldownAfterFailure: 24,
    cooldownAfterSuccess: 48,
    respectQuietHours: true,
    quietHoursStart: 22,
    quietHoursEnd: 8
  };

  // Log a contact attempt
  async logContact(entry: ContactLogEntry): Promise<void> {
    try {
      await prisma.customerContactLog.create({
        data: {
          customerId: entry.customerId,
          contactMethod: entry.contactMethod,
          outcome: entry.outcome,
          notes: entry.notes,
          agentId: entry.agentId,
          sessionId: entry.sessionId,
          contactDuration: entry.contactDuration,
          nextContactDate: entry.nextContactDate,
          successful: entry.successful || false,
          paymentResolved: entry.paymentResolved || false,
          metadata: entry.metadata
        }
      });

      console.log(`Contact logged for customer ${entry.customerId}: ${entry.contactMethod} - ${entry.outcome || 'IN_PROGRESS'}`);
    } catch (error) {
      console.error('Error logging contact:', error);
      throw error;
    }
  }

  // Check if customer can be contacted now
  async canContactCustomer(customerId: string): Promise<{
    canContact: boolean;
    reason?: string;
    nextAllowedContact?: Date;
  }> {
    try {
      // Check for active contact restrictions
      const activeRestrictions = await prisma.contactRestriction.findFirst({
        where: {
          customerId,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } }
          ]
        }
      });

      if (activeRestrictions) {
        return {
          canContact: false,
          reason: `Contact restricted: ${activeRestrictions.restrictionType}`,
          nextAllowedContact: activeRestrictions.endDate || undefined
        };
      }

      // Check recent contact frequency
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [todaysContacts, lastContact] = await Promise.all([
        prisma.customerContactLog.count({
          where: {
            customerId,
            contactDate: {
              gte: todayStart
            }
          }
        }),
        prisma.customerContactLog.findFirst({
          where: {
            customerId
          },
          orderBy: {
            contactDate: 'desc'
          }
        })
      ]);

      // Check daily contact limit
      if (todaysContacts >= this.defaultRules.maxContactsPerDay) {
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
          canContact: false,
          reason: `Daily contact limit reached (${todaysContacts}/${this.defaultRules.maxContactsPerDay})`,
          nextAllowedContact: tomorrow
        };
      }

      // Check minimum time between contacts
      if (lastContact) {
        const hoursSinceLastContact = (now.getTime() - lastContact.contactDate.getTime()) / (1000 * 60 * 60);

        let requiredCooldown = this.defaultRules.minHoursBetweenContacts;

        // Longer cooldown after failures or success
        if (lastContact.outcome === 'NO_ANSWER' || lastContact.outcome === 'DECLINED') {
          requiredCooldown = this.defaultRules.cooldownAfterFailure;
        } else if (lastContact.outcome === 'SUCCESSFUL' || lastContact.paymentResolved) {
          requiredCooldown = this.defaultRules.cooldownAfterSuccess;
        }

        if (hoursSinceLastContact < requiredCooldown) {
          const nextContact = new Date(lastContact.contactDate);
          nextContact.setHours(nextContact.getHours() + requiredCooldown);

          return {
            canContact: false,
            reason: `Cooldown period active (${hoursSinceLastContact.toFixed(1)}h/${requiredCooldown}h)`,
            nextAllowedContact: nextContact
          };
        }
      }

      // Check quiet hours
      if (this.defaultRules.respectQuietHours && this.isQuietHours(now)) {
        const nextMorning = new Date(now);
        nextMorning.setHours(this.defaultRules.quietHoursEnd, 0, 0, 0);
        if (nextMorning <= now) {
          nextMorning.setDate(nextMorning.getDate() + 1);
        }

        return {
          canContact: false,
          reason: 'Quiet hours active',
          nextAllowedContact: nextMorning
        };
      }

      return { canContact: true };

    } catch (error) {
      console.error('Error checking contact permissions:', error);
      return {
        canContact: false,
        reason: 'Error checking contact permissions'
      };
    }
  }

  // Get contact history for customer
  async getContactHistory(customerId: string, limit: number = 10) {
    try {
      return await prisma.customerContactLog.findMany({
        where: { customerId },
        orderBy: {
          contactDate: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error('Error getting contact history:', error);
      return [];
    }
  }

  // Update contact outcome
  async updateContactOutcome(
    customerId: string,
    sessionId: string,
    outcome: ContactLogEntry['outcome'],
    notes?: string,
    paymentResolved?: boolean
  ): Promise<void> {
    try {
      await prisma.customerContactLog.updateMany({
        where: {
          customerId,
          sessionId
        },
        data: {
          outcome,
          notes,
          paymentResolved: paymentResolved || false,
          successful: outcome === 'SUCCESSFUL' || outcome === 'PAYMENT_RESOLVED'
        }
      });

      // If payment was resolved, add contact restriction
      if (paymentResolved) {
        await this.addContactRestriction(
          customerId,
          'PAYMENT_RESOLVED',
          'Payment resolved during contact',
          48 // 48 hour cooldown
        );
      }

    } catch (error) {
      console.error('Error updating contact outcome:', error);
    }
  }

  // Add contact restriction
  async addContactRestriction(
    customerId: string,
    type: 'TEMPORARY_COOLDOWN' | 'DO_NOT_CONTACT' | 'PREFERRED_HOURS_ONLY' | 'PAYMENT_RESOLVED' | 'CUSTOMER_REQUEST',
    reason: string,
    hours?: number
  ): Promise<void> {
    try {
      const endDate = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

      await prisma.contactRestriction.create({
        data: {
          customerId,
          restrictionType: type,
          endDate,
          reason,
          appliedBy: 'contact_system'
        }
      });

      console.log(`Contact restriction added for customer ${customerId}: ${type} until ${endDate?.toISOString() || 'indefinite'}`);
    } catch (error) {
      console.error('Error adding contact restriction:', error);
    }
  }

  // Check if current time is within quiet hours
  private isQuietHours(date: Date): boolean {
    const hour = date.getHours();
    return hour >= this.defaultRules.quietHoursStart || hour < this.defaultRules.quietHoursEnd;
  }

  // Get contact analytics for monitoring
  async getContactAnalytics(days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [totalContacts, successfulContacts, paymentResolutions, restrictedCustomers] = await Promise.all([
        prisma.customerContactLog.count({
          where: {
            contactDate: { gte: startDate }
          }
        }),
        prisma.customerContactLog.count({
          where: {
            contactDate: { gte: startDate },
            successful: true
          }
        }),
        prisma.customerContactLog.count({
          where: {
            contactDate: { gte: startDate },
            paymentResolved: true
          }
        }),
        prisma.contactRestriction.count({
          where: {
            isActive: true,
            createdAt: { gte: startDate }
          }
        })
      ]);

      return {
        period: `${days} days`,
        totalContacts,
        successfulContacts,
        paymentResolutions,
        restrictedCustomers,
        successRate: totalContacts > 0 ? ((successfulContacts / totalContacts) * 100).toFixed(2) : '0.00',
        paymentResolutionRate: totalContacts > 0 ? ((paymentResolutions / totalContacts) * 100).toFixed(2) : '0.00'
      };
    } catch (error) {
      console.error('Error getting contact analytics:', error);
      return {
        period: `${days} days`,
        totalContacts: 0,
        successfulContacts: 0,
        paymentResolutions: 0,
        restrictedCustomers: 0,
        successRate: '0.00',
        paymentResolutionRate: '0.00'
      };
    }
  }
}

export const contactLogService = new ContactLogService();