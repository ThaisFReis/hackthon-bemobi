interface ChurnPreventionMetricsData {
  id?: string;
  periodStart?: Date;
  periodEnd?: Date;
  totalInterventions?: number;
  successfulResolutions?: number;
  averageResolutionTime?: number;
  customerRetentionRate?: number;
  revenueRetained?: number;
}

class ChurnPreventionMetrics {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  totalInterventions: number;
  successfulResolutions: number;
  averageResolutionTime: number;
  customerRetentionRate: number;
  revenueRetained: number;

  constructor({
    id = `metrics_${Date.now()}`,
    periodStart,
    periodEnd,
    totalInterventions = 0,
    successfulResolutions = 0,
    averageResolutionTime = 0,
    customerRetentionRate = 0,
    revenueRetained = 0,
  }: ChurnPreventionMetricsData) {
    if (!periodStart || !periodEnd) {
      throw new Error(
        'periodStart and periodEnd are required for churn prevention metrics.'
      );
    }

    this.id = id;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
    this.totalInterventions = totalInterventions;
    this.successfulResolutions = successfulResolutions;
    this.averageResolutionTime = averageResolutionTime;
    this.customerRetentionRate = customerRetentionRate;
    this.revenueRetained = revenueRetained;

    this.validate();
  }

  validate() {
    if (this.periodEnd < this.periodStart) {
      throw new Error('periodEnd cannot be before periodStart.');
    }
    if (this.successfulResolutions > this.totalInterventions) {
      throw new Error('successfulResolutions cannot exceed totalInterventions.');
    }
    if (this.averageResolutionTime > 180) {
      throw new Error('averageResolutionTime must not exceed 180 seconds.');
    }
    if (this.customerRetentionRate < 0 || this.customerRetentionRate > 100) {
      throw new Error('customerRetentionRate must be between 0 and 100.');
    }
  }
}

export default ChurnPreventionMetrics;
