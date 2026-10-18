import { z } from 'zod';
import { CHAT_ANSWER } from './CHAT_ANSWER';

const { $schema: _, ...schema } = z.toJSONSchema(CHAT_ANSWER);

export const CHAT_SCHEMA = JSON.stringify(schema);
