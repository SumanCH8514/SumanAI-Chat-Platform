export const truncateText = (str, maxLength = 30) => {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

export const getUserDisplayName = (user) => {
  if (!user) return 'User';
  return user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User';
};

export const generateChatTranscript = (title, messages = []) => {
  let transcript = `# SumanAI Chat: ${title || 'Conversation'}\n\n`;

  if (messages && messages.length > 0) {
    messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? 'You' : 'SumanAI';
      transcript += `### ${roleName}\n${msg.content || ''}\n\n`;
    });
  } else {
    transcript += '_This chat is empty._\n';
  }

  return transcript.trim();
};
