import { Globe, TrendingUp, FileText } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const suggestions = [
  {
    icon: <Globe size={20} />,
    title: "What's Happen in 24 hours?",
    desc: "See what's been happening in the world over the last 24 hours",
    prompt: "Show me the most important current affairs and global news events from the last 24 hours. Start with a structured high-level overview of the most critical breaking news first.",
    options: { smartSearch: true }
  },
  {
    icon: <TrendingUp size={20} />,
    title: "Stock market update",
    desc: "See what's happening in the stock market in real time",
    prompt: "Provide a real-time update on the global stock markets. Include major index performances (S&P 500, Nasdaq, etc.) and highlight the top trending market movers and news.",
    options: { smartSearch: true }
  },
  {
    icon: <FileText size={20} />,
    title: "Deep economic research",
    desc: "See research from experts that we have simplified",
    prompt: "Summarize the latest key findings in global economic research. Simplify complex trends into easy-to-understand insights about the current financial landscape.",
    options: { deepThinking: true }
  }
];

const EmptyState = ({ userName = "Suman" }) => {
  const startChatWithPrompt = useChatStore(state => state.startChatWithPrompt);

  return (
    <div className="empty-state">
      <div className="greeting">
        <h1 className="text-gradient">Hello {userName}</h1>
        <p>How can I help you today?</p>
      </div>

      <div className="suggestions-grid">
        {suggestions.map((item, idx) => (
          <div 
            key={idx} 
            className="suggestion-card"
            onClick={() => startChatWithPrompt(item.prompt, item.options)}
            style={{ cursor: 'pointer' }}
          >
            <div className="suggestion-icon">
              {item.icon}
            </div>
            <div className="suggestion-card-text">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
