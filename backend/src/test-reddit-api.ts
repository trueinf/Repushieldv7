import dotenv from 'dotenv';
import { RedditApi } from './services/apiClients/redditApi.js';

dotenv.config();

async function testRedditApi() {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.error('❌ RAPIDAPI_KEY not found in .env file');
    process.exit(1);
  }

  console.log('🔍 Testing Reddit API...\n');
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('Host: reddit34.p.rapidapi.com\n');

  const redditApi = new RedditApi(apiKey);

  // Test with a simple query
  const testQuery = 'technology OR programming';
  const limit = 5;
  const sort = 'top';

  console.log(`📡 Making API request...`);
  console.log(`   Query: "${testQuery}"`);
  console.log(`   Limit: ${limit}`);
  console.log(`   Sort: ${sort}\n`);

  try {
    const startTime = Date.now();
    const posts = await redditApi.searchPosts(testQuery, limit, sort);
    const duration = Date.now() - startTime;

    console.log(`✅ API Request Successful!`);
    console.log(`   Response time: ${duration}ms`);
    console.log(`   Posts returned: ${posts.length}\n`);

    if (posts.length > 0) {
      console.log('📋 Sample Post:');
      const sample = posts[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Title: ${sample.title.substring(0, 60)}...`);
      console.log(`   Subreddit: ${sample.subreddit}`);
      console.log(`   Score: ${sample.score}`);
      console.log(`   Comments: ${sample.num_comments}`);
      console.log(`   Created: ${new Date(sample.created_utc * 1000).toLocaleString()}\n`);
    } else {
      console.log('⚠️  No posts returned (this might be normal if query has no results)\n');
    }

    console.log('✅ Reddit API is working correctly!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Reddit API Error:');
    console.error('   Message:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('Rate limit')) {
      console.error('\n💡 Tip: You may have hit the rate limit. Wait a few minutes and try again.');
    } else if (error.message.includes('401') || error.message.includes('Invalid API key')) {
      console.error('\n💡 Tip: Check your RAPIDAPI_KEY in .env file');
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      console.error('\n💡 Tip: Your API subscription may not include Reddit API access');
    }
    
    process.exit(1);
  }
}

testRedditApi();

