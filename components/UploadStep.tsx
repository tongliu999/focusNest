import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, ArrowRightIcon } from './icons';

interface UploadStepProps {
  onStart: (text: string) => void;
  error: string | null;
}

const defaultContent = `Private equity financing:
- initial capital provided by founder
- additional financing
- angel investors are individuals who purchase equity
- VC are limited partnerships that raise funds to invest in small companies
- PE firms are like VC except they invest in much larger companies
- Sovereign wealth funds are government controlled pools of money
- corporate investors are established firms that buy equity in younger private firms

Outside investors:
- preferred stock is issued when first sold to outside firms
- mature firms, preferred stock is senior/junior to common shares in regard to liquidation and dividends
- private firms, preferred stock doesn't pay cash dividends, but has seniority in liquidation and has an option for investors to convert to common shares
- pre-money valuation
- value of the firm's pre existing shares at the price of new shares
- post-money valuation
- value of all shares

---

Exit strategies
IPOs:
- stock is more liquid
- easier to raise larger amounts of equity
- difficult to monitor management
- agency costs relating to compliance issues
- best-efforts basis
  - underwriter tries to sell at the best possible price
  - no guarantee of success
- firm commitment
  - underwriter buys the entire issue at a slight discount, and resells at offer price
- auction IPO
  - investors submit bids for price and qty
  - final price is the final price where everything clears
  - all winners pay the same final price, even if they bid higher

IPO process:
- lead underwriter manages a bunch of others ("Syndicate")
Steps:
1. finalize prospectus
2. selling period (not sell under offer price)
  - lead underwriter can buy if price drops
  - if issues remain unsold, members can sell at any share

---

3. lockup period of 180 days
  - existing shareholders (pre-IPO)

Managing risk:
- setting low offer price
- over-allotment allocation (greenshoe)
  - are allowed to sell 15% more shares
  - these shares are sold short
- reverse greenshoe
  - sell shares back to firm at firm price
- stabilizing bids
  - post bids on market to buy shares at offer price
- penalty bids
  - if a buyer sells shares before a period, there are financial penalties for buyer's broker

IPO underpricing:
- if price too high, it may be withdrawn
- if too low, firm is selling shares at lower price
- underpricing is common
  - 6% canada
  - 18% US

Other:
- difficult to short sell
- volume of IPOs is highly cyclical
- cost of larger IPO's is greater than smaller ones
  - but 7%

---

- IPOs on average perform well but drop 3-5 years later
  - underperformed market by 25%

SEO:
- when firms offer additional shares for sale
- cash offer offers shares to new investors
- rights offer to current shareholders
  - protects current shareholders from low prices
  - buy at subscription price

R = (Pex - S) / N
R = (Pon - S) / (N+1) when Pon = Pex + R

R = approx value of one right
S = subscription price
Pon = rights on share price
Pex = ex-rights share price
N = number of rights to buy a share

Announcement effects of SEOs:
- firm price drops ~3%
- bad news
  - insufficient earnings
  - debt capacity
  - managerial information

---

Costs of new equity issues
- flotation costs
  - direct costs (filing fees, legal fees)
  - indirect costs (management time, underpricing, etc)
- prompt offering prospectus
  - allows large firms to file annual statements to speed up SEOs
  - even if no SEOs
- shelf registration
  - same as POP but in US`;


const UploadStep: React.FC<UploadStepProps> = ({ onStart, error }) => {
  const [text, setText] = useState(defaultContent);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onStart(text);
    }
  };

  const handleAttachFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result;
        if (typeof fileContent === 'string') {
          setText(fileContent);
        } else {
            console.error("Could not read file as text.");
        }
      };
      reader.onerror = (error) => {
          console.error("Error reading file:", error);
      };
      reader.readAsText(file);
    }
    // Clear the input value to allow re-uploading the same file
    if(e.target) {
        e.target.value = '';
    }
  };


  return (
    <div className="w-full max-w-2xl mx-auto p-8 text-center">
      <h1 className="text-5xl font-bold text-dark-text">Focus Flow</h1>
      <p className="text-xl text-light-text mt-4 mb-12">What are you learning today?</p>
      
      {error && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg text-left" 
            role="alert"
        >
          <p className="font-bold">Oh no!</p>
          <p>{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="relative">
         <button
            type="button"
            onClick={handleAttachFileClick}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 z-10"
            aria-label="Attach file to import text"
        >
            <PlusIcon className="w-6 h-6 text-gray-400" />
        </button>
        <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.text"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your notes, an article, or any text here to begin..."
          className="w-full h-36 p-4 pl-14 pr-20 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-light focus:border-primary-light transition duration-200 resize-none text-lg bg-dark-text text-white placeholder:text-gray-400"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!text.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-primary text-white font-semibold rounded-full shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-primary-light transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light flex items-center justify-center"
          aria-label="Start Learning"
        >
            <ArrowRightIcon className="w-6 h-6" />
        </motion.button>
      </form>
    </div>
  );
};

export default UploadStep;