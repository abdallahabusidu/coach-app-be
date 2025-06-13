import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuoteEntity } from '../entities/quote.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DailyQuoteService {
  private readonly logger = new Logger(DailyQuoteService.name);
  private dailyQuoteCache: QuoteEntity | null = null;
  private lastQuoteDate: string | null = null;

  constructor(
    @InjectRepository(QuoteEntity)
    private readonly quoteRepository: Repository<QuoteEntity>,
  ) {}

  /**
   * Get the daily quote (cached)
   */
  async getDailyQuote(): Promise<QuoteEntity> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Return cached quote if it's still today's quote
    if (this.dailyQuoteCache && this.lastQuoteDate === today) {
      return this.dailyQuoteCache;
    }

    // Generate new daily quote
    await this.generateDailyQuote();
    return this.dailyQuoteCache!;
  }

  /**
   * Generate daily quote using date-based pseudo-random selection
   */
  private async generateDailyQuote(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    try {
      // Get all active quotes
      const quotes = await this.quoteRepository.find({
        where: { isActive: true },
        order: { timesServed: 'ASC', createdAt: 'ASC' },
      });

      if (quotes.length === 0) {
        // Create a default quote if none exist
        const defaultQuote = await this.createDefaultQuote();
        this.dailyQuoteCache = defaultQuote;
        this.lastQuoteDate = today;
        return;
      }

      // Use date-based seed for consistent daily selection
      const dateHash = this.hashString(today);
      const selectedIndex = Math.abs(dateHash) % quotes.length;
      const selectedQuote = quotes[selectedIndex];

      // Update times served
      selectedQuote.timesServed += 1;
      await this.quoteRepository.save(selectedQuote);

      this.dailyQuoteCache = selectedQuote;
      this.lastQuoteDate = today;

      this.logger.log(
        `Daily quote selected: "${selectedQuote.text}" - ${selectedQuote.author}`,
      );
    } catch (error) {
      this.logger.error('Failed to generate daily quote:', error);

      // Fallback to a hardcoded quote
      this.dailyQuoteCache = {
        id: 'fallback',
        text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
        author: 'Winston Churchill',
        category: 'motivation',
        isActive: true,
        timesServed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as QuoteEntity;
      this.lastQuoteDate = today;
    }
  }

  /**
   * Create a default quote if none exist
   */
  private async createDefaultQuote(): Promise<QuoteEntity> {
    const defaultQuote = this.quoteRepository.create({
      text: 'The only impossible journey is the one you never begin.',
      author: 'Tony Robbins',
      category: 'motivation',
      isActive: true,
    });

    return await this.quoteRepository.save(defaultQuote);
  }

  /**
   * Simple string hash function for date-based selection
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Refresh daily quote at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshDailyQuote(): Promise<void> {
    this.logger.log('Refreshing daily quote...');
    this.dailyQuoteCache = null;
    this.lastQuoteDate = null;
    await this.generateDailyQuote();
  }

  /**
   * Get all quotes (admin functionality)
   */
  async getAllQuotes(): Promise<QuoteEntity[]> {
    return await this.quoteRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new quote
   */
  async createQuote(quoteData: {
    text: string;
    author: string;
    category?: string;
  }): Promise<QuoteEntity> {
    const quote = this.quoteRepository.create({
      text: quoteData.text,
      author: quoteData.author,
      category: quoteData.category || 'motivation',
    });

    return await this.quoteRepository.save(quote);
  }

  /**
   * Update quote
   */
  async updateQuote(
    id: string,
    updateData: Partial<QuoteEntity>,
  ): Promise<QuoteEntity> {
    await this.quoteRepository.update(id, updateData);
    return await this.quoteRepository.findOne({ where: { id } });
  }

  /**
   * Delete quote
   */
  async deleteQuote(id: string): Promise<void> {
    await this.quoteRepository.delete(id);
  }

  /**
   * Get quote statistics
   */
  async getQuoteStatistics(): Promise<{
    totalQuotes: number;
    activeQuotes: number;
    categoryCounts: Record<string, number>;
    mostServedQuote: QuoteEntity | null;
  }> {
    const totalQuotes = await this.quoteRepository.count();
    const activeQuotes = await this.quoteRepository.count({
      where: { isActive: true },
    });

    const categoryStats = await this.quoteRepository
      .createQueryBuilder('quote')
      .select('quote.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('quote.isActive = :isActive', { isActive: true })
      .groupBy('quote.category')
      .getRawMany();

    const categoryCounts = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = parseInt(stat.count);
      return acc;
    }, {});

    const mostServedQuote = await this.quoteRepository.findOne({
      where: { isActive: true },
      order: { timesServed: 'DESC' },
    });

    return {
      totalQuotes,
      activeQuotes,
      categoryCounts,
      mostServedQuote,
    };
  }
}
