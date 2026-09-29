import React from 'react';
import { Globe, TrendingUp, FileText, ArrowUpRight } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { getUserDisplayName } from '../utils/formatters';

const suggestions = [
  {
    icon: <Globe size={18} />,
    category: "World News",
    theme: "cyan",
    title: "24h Global Briefing",
    desc: "Catch up on today's top global developments and major headlines",
    prompt: "Provide a comprehensive briefing of the most significant global news and events from the last 24 hours. Start with a structured high-level overview of the most critical breaking news first.",
    options: { smartSearch: true }
  },
  {
    icon: <TrendingUp size={18} />,
    category: "Markets",
    theme: "emerald",
    title: "Market Pulse & Movers",
    desc: "Real-time index updates, market sentiment, and top trending corporate movers",
    prompt: "Provide a real-time update on global stock markets. Include major index performances (S&P 500, Nasdaq, Nifty, etc.) and highlight the top trending market movers and news.",
    options: { smartSearch: true }
  },
  {
    icon: <FileText size={18} />,
    category: "Economics",
    theme: "purple",
    title: "Economic Analysis",
    desc: "Expert-curated macroeconomic analysis simplified into clear, actionable takeaways",
    prompt: "Summarize the latest key findings in global economic research and central bank insights. Simplify complex trends into easy-to-understand takeaways about the current financial landscape.",
    options: { deepThinking: true }
  }
];

const EmptyState = ({ userName }) => {
  const user = useAuthStore(state => state.user);
  const startChatWithPrompt = useChatStore(state => state.startChatWithPrompt);
  const displayName = userName || (user ? getUserDisplayName(user) : 'User');

  return (
    <div className="empty-state">
      <div className="greeting">
        <h1 className="hero-title">
          Hello, <span className="hero-name-highlight">{displayName}</span>
        </h1>
        <p className="hero-subtitle">How can I help you today?</p>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            className={`suggestion-card theme-${item.theme}`}
            onClick={() => startChatWithPrompt(item.prompt, item.options)}
            type="button"
          >
            <div className="suggestion-card-header">
              <div className={`suggestion-icon icon-${item.theme}`}>
                {item.icon}
              </div>
              <span className="suggestion-tag">{item.category}</span>
              <div className="suggestion-arrow">
                <ArrowUpRight size={15} />
              </div>
            </div>
            <div className="suggestion-card-text">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
