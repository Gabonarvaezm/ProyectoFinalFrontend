import express from 'express';
import { createChatbotRouter } from '../src/server/chatbot-api.ts';

const app = express();
app.use('/api/chat', createChatbotRouter());
app.listen(3001, '127.0.0.1', (error) => {
  if (error) {
    console.error('No se pudo iniciar la API de DiscerIA:', error.code);
    process.exitCode = 1;
    return;
  }
  console.log('API de DiscerIA disponible en http://127.0.0.1:3001');
});
