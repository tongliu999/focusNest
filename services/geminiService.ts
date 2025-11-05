import { Module, ModuleType } from '../types';

// As per user request, the entire learning journey is now hardcoded.
// This removes the dependency on the Gemini API for journey creation,
// making the app faster and eliminating the loading screen.

const hardcodedJourney: Module[] = [
  {
    title: "Private Equity Fundamentals",
    type: ModuleType.Learn,
    summary: "Discover the basics of private equity, from the initial capital provided by founders to funding from angel investors, venture capitalists (VCs), and sovereign wealth funds. Understand how different investors participate in a company's growth.",
    keyPoints: [
      "Founders provide initial capital.",
      "Angel investors and VCs purchase equity in young companies.",
      "PE firms invest in larger, more established companies.",
      "Preferred stock is common for outside investors, offering liquidation preference."
    ],
    imagePrompt: "A flowchart showing money flowing from investors like angels and VCs to a small startup company, resulting in growth."
  },
  {
    title: "PE Financing Quiz",
    type: ModuleType.Quiz,
    questions: [
      {
        question: "Which type of investor typically invests in larger, more established companies rather than small startups?",
        options: [
          "Angel investors",
          "Venture capitalists",
          "PE firms",
          "Founders"
        ],
        correctAnswerIndex: 2,
        explanation: "Private Equity (PE) firms usually engage in buyouts of larger, more mature companies, whereas angel investors and VCs focus on early-stage companies."
      },
      {
        question: "What is 'post-money valuation'?",
        options: [
          "The value of the firm before new investment.",
          "The value of the firm's existing shares only.",
          "The value of the entire firm (old and new shares) at the price of the new investment.",
          "The profit a firm makes after an IPO."
        ],
        correctAnswerIndex: 2,
        explanation: "Post-money valuation includes the capital infused from the new investment, giving a total value for the company after the financing round."
      }
    ]
  },
  {
    title: "The Path to an IPO",
    type: ModuleType.Learn,
    summary: "An Initial Public Offering (IPO) is a major exit strategy for private companies. Learn about the process, from underwriters and syndicates to the different types of offerings like 'firm commitment' and 'auction IPOs'.",
    keyPoints: [
      "IPOs make company stock liquid and help raise significant capital.",
      "Underwriters (managed by a lead underwriter) help sell the shares to the public.",
      "A 'firm commitment' means the underwriter guarantees the sale by buying all the shares first.",
      "A 'lockup period' of 180 days prevents pre-IPO shareholders from selling their shares immediately."
    ],
    imagePrompt: "A visual timeline of the IPO process, starting from a private company, going through underwriters, and ending with the company's name on a stock exchange board."
  },
  {
    title: "IPO Lingo",
    type: ModuleType.MatchingGame,
    instructions: "Match the IPO terms to their correct definitions.",
    pairs: [
      { term: "Prospectus", definition: "A formal document describing the company and the stock offering." },
      { term: "Syndicate", definition: "A group of underwriters who manage and sell an IPO." },
      { term: "Greenshoe", definition: "An over-allotment option allowing underwriters to sell more shares than planned." },
      { term: "Lockup Period", definition: "A 180-day period where insiders cannot sell their shares." }
    ]
  },
  {
    title: "IPO Risks & Costs",
    type: ModuleType.Quiz,
    questions: [
      {
        question: "What is a common phenomenon associated with IPO pricing?",
        options: [
          "Overpricing",
          "Underpricing",
          "Stable pricing",
          "Price fixing"
        ],
        correctAnswerIndex: 1,
        explanation: "IPO underpricing is common, meaning the initial offer price is often lower than the price it reaches on the first day of trading. This rewards early investors."
      },
       {
        question: "A 'rights offer' in a Seasoned Equity Offering (SEO) is primarily for:",
        options: [
          "New investors",
          "The general public",
          "Current shareholders",
          "Underwriters"
        ],
        correctAnswerIndex: 2,
        explanation: "A rights offer gives current shareholders the right to buy new shares, protecting them from dilution of their ownership stake."
      }
    ]
  },
  {
    title: "Venture Capital Deep Dive",
    type: ModuleType.Learn,
    summary: "Go deeper into Venture Capital, understanding the stages of funding from seed to late-stage, and how VCs actively guide the companies they invest in.",
    keyPoints: [
      "Seed stage: Initial product development.",
      "Series A, B, C: Scaling the business.",
      "VCs often take a board seat to provide guidance.",
      "Focus is on companies with high-growth potential."
    ],
    imagePrompt: "A rocket ship with different stages labeled 'Seed', 'Series A', 'Series B', 'Series C' taking off."
  },
  {
    title: "VC Concepts Quiz",
    type: ModuleType.Quiz,
    questions: [
      {
        question: "What is the primary goal of a VC investor?",
        options: ["Stable dividends", "High-growth and eventual exit", "Controlling the company", "Long-term slow growth"],
        correctAnswerIndex: 1,
        explanation: "VCs seek massive returns through exits like IPOs or acquisitions, not slow, stable growth."
      },
      {
        question: "What does a VC often receive in exchange for funding?",
        options: ["A salary", "Company debt", "Preferred stock and a board seat", "Common stock only"],
        correctAnswerIndex: 2,
        explanation: "VCs typically get preferred stock for downside protection and a board seat to influence company direction."
      }
    ]
  },
  {
    title: "Understanding Leveraged Buyouts (LBOs)",
    type: ModuleType.Learn,
    summary: "An LBO is the acquisition of another company using a significant amount of borrowed money (debt). The assets of the company being acquired are often used as collateral for the loans.",
    keyPoints: [
      "Uses significant debt to finance acquisitions.",
      "Target companies often have stable cash flows.",
      "The goal is to increase equity value by paying down debt.",
      "Assets of the target company are used as collateral."
    ],
    imagePrompt: "A diagram showing a large pile of money labeled 'Debt' being used to buy a factory, with arrows indicating the factory's profits are then used to pay back the debt."
  },
  {
    title: "LBO Key Players",
    type: ModuleType.MatchingGame,
    instructions: "Match the LBO player to their role.",
    pairs: [
      { term: "PE Firm (Sponsor)", definition: "Initiates the deal and provides the equity financing." },
      { term: "Investment Banks", definition: "Arrange the debt financing and advise on the deal." },
      { term: "Target Company", definition: "The company being acquired in the buyout." },
      { term: "Management Team", definition: "Often stays to run the company post-acquisition." }
    ]
  },
  {
    title: "PE Fund Structure: GPs & LPs",
    type: ModuleType.Learn,
    summary: "Private equity funds are typically structured as limited partnerships. Learn the distinct roles of the General Partners (GPs) who manage the fund, and the Limited Partners (LPs) who provide the capital.",
    keyPoints: [
      "GPs are the fund managers; they make investment decisions.",
      "LPs are institutional investors who commit capital.",
      "GPs earn a management fee (e.g., 2%) and carried interest (e.g., 20% of profits).",
      "LPs have limited liability and are passive investors."
    ],
    imagePrompt: "An organizational chart with a 'General Partner' at the top, and several 'Limited Partners' below providing money into a central 'Fund' box."
  },
  {
    title: "Fund Structure Quiz",
    type: ModuleType.Quiz,
    questions: [
      {
        question: "Who is responsible for the day-to-day management of a PE fund?",
        options: ["Limited Partners", "The SEC", "General Partners", "The portfolio companies"],
        correctAnswerIndex: 2,
        explanation: "General Partners (GPs) are the active managers of the fund."
      },
      {
        question: "The '2 and 20' fee structure refers to:",
        options: ["2% tax and 20% dividend", "2-year lockup and 20% interest", "2% management fee and 20% of profits (carried interest)", "2 partners and 20 investments"],
        correctAnswerIndex: 2,
        explanation: "This is the standard compensation model for GPs, consisting of a management fee on assets and a performance fee on profits."
      }
    ]
  },
   {
    title: "Valuation in Private Equity",
    type: ModuleType.Learn,
    summary: "Valuing a private company is complex. PE firms use several methods, including Discounted Cash Flow (DCF), comparable company analysis ('comps'), and precedent transaction analysis to determine a fair price.",
    keyPoints: [
      "DCF projects future cash flows and discounts them to the present.",
      "Comps analysis compares the target to similar public companies.",
      "Precedent transactions look at what similar companies have been sold for.",
      "Valuation is both an art and a science."
    ],
    imagePrompt: "Three icons representing valuation methods: a calendar with a money arrow for DCF, balancing scales for 'comps', and a history book for precedent transactions."
  },
  {
    title: "Final Review Quiz",
    type: ModuleType.Quiz,
    questions: [
      {
        question: "An LBO primarily uses what to finance an acquisition?",
        options: ["Equity", "Debt", "Cash from operations", "Government grants"],
        correctAnswerIndex: 1,
        explanation: "Leveraged Buyouts are characterized by their high use of debt (leverage)."
      },
      {
        question: "In a PE fund, who are the passive investors that provide most of the capital?",
        options: ["General Partners", "Founders", "Venture Capitalists", "Limited Partners"],
        correctAnswerIndex: 3,
        explanation: "Limited Partners (LPs) commit capital but are not involved in the fund's management."
      }
    ]
  }
];

export const generateLearningJourney = async (text: string): Promise<Module[]> => {
    // The user's input text is ignored. We return the same journey every time.
    return Promise.resolve(hardcodedJourney);
};

export const generateRefresher = async (moduleTitle: string, failedQuestion: string): Promise<string> => {
    // Returns a generic, static hint instead of calling the AI.
    return "Think about the core definition of the key terms in the question. Sometimes re-reading the options carefully can reveal the answer!";
};


// As per user request, this is a hardcoded base64 representation of the 
// first page of handwritten notes to serve as the visual aid, 
// avoiding calls to the image generation API.
const hardcodedNoteImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABDgAAAQ4CAYAAAD9T3fkAAAgAElEQVR4Aeyd/1fTZ7q+/1u+AgJ1iYiAIoiCIqL33gsKBHuv0Xtfo/fe2/t+23vvvfcegogoKAgCIIqIAu193wX2t90+s/fO1/fr/d6v33rNmv2dY+11P+tZS5Lkv8QKAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE-';

export const generateImage = async (prompt: string): Promise<string | null> => {
    // As per user request, we are returning a hardcoded image instead of calling the Gemini API.
    // This makes the visual aid static but avoids API calls and costs.
    return Promise.resolve(hardcodedNoteImage);
};