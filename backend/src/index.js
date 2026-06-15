import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import codesRouter from './routes/codes.js';
import searchRouter from './routes/search.js';
import parseCodeRouter from './routes/parseCode.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/codes', codesRouter);
app.use('/api/search', searchRouter);
app.use('/api/parse-code', parseCodeRouter);

app.listen(PORT, () => {
  console.log(`Discount finder backend running on http://localhost:${PORT}`);
});
