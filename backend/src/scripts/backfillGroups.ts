import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';
import { GroupingService } from '../services/groupingService.js';

dotenv.config();

function getArgFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string): string | undefined {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function deleteAll(table: string): Promise<void> {
  const { error } = await supabase.from(table).delete().not('id', 'is', null);
  if (error) throw error;
}

async function ensureTablesExist(): Promise<void> {
  const { error } = await supabase.from('topics').select('id').limit(1);
  if (error && error.code === 'PGRST205') {
    throw new Error(
      "Topics/Narratives tables are not created in Supabase yet. Run the SQL in `server/src/database/topics_narratives_schema.sql` on your Supabase database, then rerun `npm run backfill:groups`."
    );
  }
  if (error) throw error;
}

async function main(): Promise<void> {
  const openaiApiKey = process.env.OPENAI_API_KEY || '';
  const grouping = new GroupingService(openaiApiKey);

  await ensureTablesExist();

  const reset = !getArgFlag('no-reset');
  const batchSize = Number(getArgValue('batch') || 100);

  if (reset) {
    console.log('[Backfill] Resetting existing groups...');
    await deleteAll('topic_posts');
    await deleteAll('narrative_posts');
    await deleteAll('topics');
    await deleteAll('narratives');
    console.log('[Backfill] Reset complete.');
  }

  let offset = 0;
  let processed = 0;

  console.log(`[Backfill] Starting grouping backfill (batchSize=${batchSize})...`);

  while (true) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, configuration_id, topics, keywords')
      .not('configuration_id', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!posts || posts.length === 0) break;

    for (const post of posts) {
      const topics = (post.topics as unknown as string[]) || [];
      const keywords = (post.keywords as unknown as string[]) || [];
      if (topics.length === 0 && keywords.length === 0) continue;

      try {
        await grouping.groupPost(post.id, post.configuration_id);
      } catch (e: any) {
        console.error(`[Backfill] Failed grouping post ${post.id}: ${e?.message || e}`);
      }
      processed += 1;
    }

    offset += batchSize;
    console.log(`[Backfill] Processed ${processed} posts...`);
  }

  console.log(`[Backfill] Done. Grouped ${processed} posts.`);
}

main().catch(err => {
  console.error('[Backfill] Fatal error:', err);
  process.exit(1);
});


