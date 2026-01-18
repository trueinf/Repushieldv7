import dotenv from 'dotenv';
import { RedditApi } from './services/apiClients/redditApi.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function fetchRedditPosts() {
  const apiKey = process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.error('❌ RAPIDAPI_KEY not found in .env file');
    process.exit(1);
  }

  console.log('🔍 Fetching posts from Reddit API...\n');

  const redditApi = new RedditApi(apiKey);

  // Test with a simple query
  const testQuery = 'technology OR programming OR software';
  const limit = 20;
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
    console.log(`   Posts fetched: ${posts.length}\n`);

    // Prepare output data
    const output = {
      metadata: {
        query: testQuery,
        limit: limit,
        sort: sort,
        fetchedAt: new Date().toISOString(),
        responseTime: `${duration}ms`,
        totalPosts: posts.length,
      },
      posts: posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.selftext,
        subreddit: post.subreddit,
        subreddit_prefixed: post.subreddit_prefixed,
        author: post.author,
        post_author: post.post_author,
        subscribers: post.subscribers,
        score: post.score,
        num_comments: post.num_comments,
        upvote_ratio: post.upvote_ratio,
        created_at: new Date(post.created_utc * 1000).toISOString(),
        created_utc: post.created_utc,
        url: post.url,
        thumbnail: post.thumbnail,
        is_video: post.is_video,
        media: post.media,
      })),
    };

    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'reddit-posts-output.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`💾 Output saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total posts: ${posts.length}`);
    console.log(`   File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    
    if (posts.length > 0) {
      console.log(`\n📋 Sample Post (first one):`);
      const sample = posts[0];
      console.log(`   ID: ${sample.id}`);
      console.log(`   Title: ${sample.title.substring(0, 80)}...`);
      console.log(`   Subreddit: r/${sample.subreddit}`);
      console.log(`   Score: ${sample.score}`);
      console.log(`   Comments: ${sample.num_comments}`);
      console.log(`   Created: ${new Date(sample.created_utc * 1000).toLocaleString()}`);
    }

    console.log(`\n✅ Reddit posts fetched and saved successfully!`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Reddit API Error:');
    console.error('   Message:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Save error to file as well
    const errorPath = path.join(process.cwd(), 'reddit-api-error.json');
    fs.writeFileSync(errorPath, JSON.stringify({
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    }, null, 2), 'utf-8');
    
    console.error(`\n💾 Error details saved to: ${errorPath}`);
    process.exit(1);
  }
}

fetchRedditPosts();

