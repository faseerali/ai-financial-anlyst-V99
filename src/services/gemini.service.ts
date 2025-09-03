import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

// Define interfaces for the expected JSON structure
export interface SummaryCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}

export interface StatementItem {
  item: string;
  value: string;
  isBold: boolean;
}

export interface Ratio {
  name: string;
  value: string;
  insight: string;
  definition: string;
}

export interface RatioCategory {
  category: string;
  ratios: Ratio[];
}

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface BalanceSheetChartData {
  assets: ChartData;
  liabilitiesAndEquity: ChartData;
}

export interface TrendAnalysis {
  labels: string[];
  revenueData: number[];
  expenseData: number[];
  netIncomeData: number[];
  interpretation: string;
}

export interface ExpenseBreakdown {
  labels: string[];
  data: number[];
  interpretation: string;
}

export interface VarianceAnalysis {
    labels: string[];
    actualData: number[];
    budgetData: number[];
    interpretation: string;
}

export interface WaterfallAnalysis {
  labels: string[];
  data: number[];
  interpretation: string;
}

export interface RatioTrendDataset {
  label: string;
  data: number[];
}

export interface RatioTrendAnalysis {
  labels: string[];
  datasets: RatioTrendDataset[];
  interpretation: string;
}

export interface KeyRisk {
  risk: string;
  recommendation: string;
}

export interface BreakevenAnalysis {
  breakevenRevenue: string;
  interpretation: string;
  breakevenRevenueValue: number;
  currentRevenueValue: number;
}

export interface AnalystView {
  insights: string;
  trendAnalysis: TrendAnalysis;
  expenseBreakdown: ExpenseBreakdown;
  varianceAnalysis: VarianceAnalysis;
  waterfallAnalysis: WaterfallAnalysis;
  ratioTrendAnalysis: RatioTrendAnalysis;
  ratiosInterpretation: string;
  breakevenAnalysis: BreakevenAnalysis;
  forecast: string;
}

export interface FinancialAnalysis {
  summaryCards: SummaryCard[];
  incomeStatement: StatementItem[];
  balanceSheet: StatementItem[];
  cashFlowStatement: StatementItem[];
  pnlInterpretation: string;
  ratios: RatioCategory[];
  executiveSummary: string[];
  keyRisks: KeyRisk[];
  analystView: AnalystView;
  // Chart-specific data for manager view
  incomeStatementChartData: ChartData;
  balanceSheetChartData: BalanceSheetChartData;
  cashFlowChartData: ChartData;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not found.");
    }
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeFinancialData(csvData: string, outlet: string | null = null): Promise<FinancialAnalysis> {
    const model = this.genAI;
    
    const statementItemSchema = {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING },
        value: { type: Type.STRING },
        isBold: { type: Type.BOOLEAN },
      },
      required: ['item', 'value', 'isBold']
    };

    const chartDataSchema = {
      type: Type.OBJECT,
      properties: {
        labels: { type: Type.ARRAY, items: { type: Type.STRING } },
        data: { type: Type.ARRAY, items: { type: Type.NUMBER } }
      },
      required: ['labels', 'data']
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        summaryCards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              value: { type: Type.STRING },
              change: { type: Type.STRING },
              changeType: { type: Type.STRING, enum: ['positive', 'negative'] },
            },
             required: ['title', 'value', 'change', 'changeType']
          },
        },
        incomeStatement: { type: Type.ARRAY, items: statementItemSchema },
        balanceSheet: { type: Type.ARRAY, items: statementItemSchema },
        cashFlowStatement: { type: Type.ARRAY, items: statementItemSchema },
        incomeStatementChartData: {
          ...chartDataSchema,
          description: "Data for the Income Statement bar chart. Labels should be ['Revenue', 'COGS', 'Gross Profit', 'Operating Expenses', 'Net Income']."
        },
        balanceSheetChartData: {
          type: Type.OBJECT,
          properties: {
            assets: { ...chartDataSchema, description: "Data for the Assets doughnut chart. Labels should be major asset categories like 'Current Assets' and 'Non-Current Assets'." },
            liabilitiesAndEquity: { ...chartDataSchema, description: "Data for the Liabilities & Equity doughnut chart. Labels should be major categories like 'Current Liabilities', 'Long-Term Liabilities', and 'Total Equity'." }
          },
          required: ['assets', 'liabilitiesAndEquity']
        },
        cashFlowChartData: {
          ...chartDataSchema,
          description: "Data for the Cash Flow bar chart. Labels should be ['Operating Activities', 'Investing Activities', 'Financing Activities', 'Net Change in Cash']."
        },
        pnlInterpretation: {
          type: Type.STRING,
          description: 'A brief, 2-3 sentence commentary on the key insights from all three financial statements, highlighting key drivers of profitability, financial position, and cash flow.'
        },
        ratios: {
          type: Type.ARRAY,
          description: "A list of financial ratio categories.",
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['Profitability', 'Liquidity', 'Solvency', 'Efficiency'], description: 'Category of the financial ratios.' },
              ratios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    insight: { type: Type.STRING },
                    definition: { type: Type.STRING, description: 'A concise definition of the ratio, explaining what it measures and why it is important.' },
                  },
                  required: ['name', 'value', 'insight', 'definition']
                }
              }
            },
            required: ['category', 'ratios']
          }
        },
        executiveSummary: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'A bulleted list of 3-4 key takeaways for a busy executive.'
        },
        keyRisks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              risk: { type: Type.STRING, description: 'A concise description of a key financial risk identified from the data.' },
              recommendation: { type: Type.STRING, description: 'A concrete, actionable recommendation to mitigate the identified risk.' },
            },
            required: ['risk', 'recommendation']
          },
        },
        analystView: {
          type: Type.OBJECT,
          properties: {
            insights: { type: Type.STRING, description: 'A detailed, narrative-style commentary on the financial health, trends, and key findings. Should be a single paragraph of 3-5 sentences.' },
            trendAnalysis: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Time periods, e.g., months or quarters.' } },
                revenueData: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                expenseData: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                netIncomeData: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the trend analysis chart.' },
              },
              required: ['labels', 'revenueData', 'expenseData', 'netIncomeData', 'interpretation']
            },
            expenseBreakdown: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Expense categories.' } },
                data: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the expense breakdown chart.' },
              },
              required: ['labels', 'data', 'interpretation']
            },
            varianceAnalysis: {
                type: Type.OBJECT,
                properties: {
                  labels: { type: Type.ARRAY, items: { type: Type.STRING, description: 'Categories or time periods for variance analysis.' } },
                  actualData: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  budgetData: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the variance analysis chart.' },
                },
                required: ['labels', 'actualData', 'budgetData', 'interpretation']
            },
            waterfallAnalysis: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Labels for the main P&L components, specifically ['Revenue', 'Cost of Goods Sold', 'Operating Expenses']." },
                data: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Corresponding numeric values. Revenue must be positive, and all costs must be negative." },
                interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the cash flow waterfall chart.' },
              },
              required: ['labels', 'data', 'interpretation']
            },
            ratioTrendAnalysis: {
              type: Type.OBJECT,
              properties: {
                labels: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Time periods, matching the trendAnalysis labels.' },
                datasets: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING, description: 'Name of the financial ratio.' },
                      data: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'The calculated value of the ratio for each corresponding time period.' },
                    },
                    required: ['label', 'data']
                  }
                },
                interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the key ratio trends chart.' },
              },
              required: ['labels', 'datasets', 'interpretation']
            },
            ratiosInterpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the key ratios radar chart.' },
            breakevenAnalysis: {
              type: Type.OBJECT,
              properties: {
                breakevenRevenue: { type: Type.STRING, description: 'The calculated breakeven point in terms of revenue, formatted as a currency string.' },
                interpretation: { type: Type.STRING, description: 'A concise, 1-2 sentence interpretation of the breakeven point.' },
                breakevenRevenueValue: { type: Type.NUMBER, description: 'The raw numeric value for the breakeven revenue.' },
                currentRevenueValue: { type: Type.NUMBER, description: 'The raw numeric value for the most recent period\'s revenue.' },
              },
              required: ['breakevenRevenue', 'interpretation', 'breakevenRevenueValue', 'currentRevenueValue']
            },
            forecast: { type: Type.STRING, description: 'A brief, data-driven forecast for future revenues and expenses for the next period. 1-2 sentences.' },
          },
          required: ['insights', 'trendAnalysis', 'expenseBreakdown', 'varianceAnalysis', 'waterfallAnalysis', 'ratioTrendAnalysis', 'ratiosInterpretation', 'breakevenAnalysis', 'forecast']
        },
      },
      required: ['summaryCards', 'incomeStatement', 'balanceSheet', 'cashFlowStatement', 'pnlInterpretation', 'ratios', 'executiveSummary', 'keyRisks', 'analystView', 'incomeStatementChartData', 'balanceSheetChartData', 'cashFlowChartData'],
    };

    const outletPromptPart = outlet
      ? `The user has selected a specific outlet: "${outlet}". Your entire analysis MUST be filtered to only include data and transactions relevant to this single outlet.`
      : `The analysis should be a consolidated report, covering all outlets/branches found in the data.`;

    const prompt = `You are an expert Financial Accountant and Analyst. Analyze the following financial transaction data from a CSV file.
    ${outletPromptPart}
    Your primary task is to generate the three core financial statements: an Income Statement, a Balance Sheet, and a Cash Flow Statement. You must infer these statements from the raw transaction data, making plausible assumptions where necessary.

    **Core Financial Statements Generation:**
    1.  **Income Statement:** Generate a standard, multi-step income statement.
    2.  **Balance Sheet:** From the transactions, infer a plausible balance sheet. The fundamental accounting equation (Assets = Liabilities + Equity) MUST hold true. You will need to make reasonable assumptions for accounts like Cash, Accounts Receivable, Inventory, Accounts Payable, and calculate Retained Earnings based on the net income from the income statement.
    3.  **Cash Flow Statement:** Generate a statement of cash flows, categorizing activities into Operating, Investing, and Financing. The Net Change in Cash should align with the change in the Cash account on the balance sheet.

    **Chart Data Generation (for Manager View):**
    4.  **Income Statement Chart:** From the full statement, generate summarized data for a bar chart.
    5.  **Balance Sheet Charts:** From the full statement, generate summarized data for two doughnut charts (Assets, and Liabilities & Equity).
    6.  **Cash Flow Chart:** From the full statement, generate summarized data for a bar chart showing cash flows from the three activities and the net change.

    **Additional Analysis Requirements:**
    7.  **Executive Summary & Risks:** Provide a 3-4 bullet point executive summary and identify the top 2-3 key financial risks, each with a concise, actionable recommendation.
    8.  **Profitability & Cost Structure Analysis:**
        - You MUST calculate and display the **Gross Markup Percentage** [\`(Gross Profit / COGS) * 100\`] as a summary card, within the Income Statement (after Gross Profit), and as a Key Financial Ratio with a clear definition.
        - You MUST perform a **Breakeven Analysis**. Estimate variable and fixed costs from the transaction data to calculate the breakeven point in terms of revenue. You MUST provide both the formatted string value and the raw numeric values for breakeven revenue and current revenue.
    9.  **Comprehensive Key Ratios:** Generate a comprehensive set of Key Financial Ratios. For EACH ratio, provide its value, a concise insight, and a clear definition. These ratios MUST be grouped into the following categories: 'Profitability', 'Liquidity', 'Solvency', and 'Efficiency'. The list of ratios MUST include, but is not limited to:
        - **Profitability Ratios:** Gross Profit Margin, Net Profit Margin, Return on Assets (ROA), Return on Equity (ROE), Gross Markup Percentage.
        - **Liquidity Ratios:** Current Ratio, Quick Ratio.
        - **Solvency Ratios:** Debt-to-Equity Ratio, Debt-to-Asset Ratio.
        - **Efficiency Ratios:** Asset Turnover, Inventory Turnover, Days Sales Outstanding (DSO), Days Inventory Outstanding (DIO), Days Payable Outstanding (DPO), and **Cash Conversion Cycle (CCC)**.
    10. **Analyst View Data:** Generate all required data for the analyst view. For the 'ratioTrendAnalysis', you MUST calculate and provide time-series data for the following key ratios for EACH period in the dataset: 'Net Profit Margin', 'Current Ratio', and 'Cash Conversion Cycle'. You may include other relevant ratios like 'Debt-to-Equity Ratio' as well.
    11. **Variance Analysis:** Create a plausible budget by assuming budget revenue is 105% of actuals and budget expenses are 95% of actuals for variance analysis.
    12. **Commentary:** Provide concise interpretations for ALL charts and a summary commentary for the overall financial statements.

    **General Instructions:**
    - Group transactions by month for time-series analysis.
    - Use AED formatting for currency (e.g., AED 1,234.56).
    - Provide your complete analysis strictly in the requested JSON format.

    Financial Data:
    \`\`\`csv
    ${csvData}
    \`\`\`
    `;

    try {
      const result = await model.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        }
      });
      const jsonStr = result.text.trim();
      return JSON.parse(jsonStr) as FinancialAnalysis;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get a valid response from the AI model.');
    }
  }

  async getUpdatedForecast(csvData: string, revenueGrowth: number, expenseGrowth: number): Promise<string> {
    const model = this.genAI;

    const prompt = `Based on the provided financial transaction data, generate a brief, data-driven forecast for the next period.
    The user wants to see a projection with a ${revenueGrowth}% growth in revenue and a ${expenseGrowth}% growth in expenses compared to the last period in the data.
    The response should be a concise paragraph (2-3 sentences). Format currency values as AED (e.g., AED 1,234.56).

    Financial Data:
    \`\`\`csv
    ${csvData}
    \`\`\`
    `;

    try {
        const result = await model.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });
        return result.text.trim();
    } catch (error) {
        console.error('Error calling Gemini API for forecast:', error);
        throw new Error('Failed to get an updated forecast from the AI model.');
    }
  }

  async getOutlets(csvData: string): Promise<string[]> {
    const model = this.genAI;
    const prompt = `
      Analyze the provided CSV data and identify if there is a column that represents different outlets, branches, stores, or locations.
      Common column names for this are 'Outlet', 'Branch', 'Location', 'Store'.
      If you find such a column, return a JSON array of the unique string values from that column.
      For example: ["Outlet A", "Outlet B", "Outlet C"].
      If no such column is found, return an empty JSON array [].
      The returned value should be only the JSON array.

      CSV Data:
      \`\`\`csv
      ${csvData}
      \`\`\`
    `;

    try {
      const result = await model.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.0,
        }
      });
      const jsonStr = result.text.trim();
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
        return parsed;
      }
      return [];
    } catch (error) {
      console.error('Error getting outlets from Gemini API:', error);
      // If there's an error (e.g., parsing), assume no outlets.
      return [];
    }
  }

  async queryData(csvData: string, query: string): Promise<string> {
    const model = this.genAI;

    const prompt = `You are a helpful financial analyst. Your task is to answer a user's question based *only* on the financial data provided below.
- Analyze the data thoroughly to find the answer.
- If the data does not contain the necessary information to answer the question, clearly state that the information is not available in the provided data.
- Keep your answer concise and to the point.
- Format any currency values in AED (e.g., AED 1,234.56).

Financial Data:
\`\`\`csv
${csvData}
\`\`\`

User's Question: "${query}"
`;

    try {
        const result = await model.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
            }
        });
        return result.text.trim();
    } catch (error) {
        console.error('Error calling Gemini API for data query:', error);
        throw new Error('Failed to get a response from the AI model for your query.');
    }
  }
}