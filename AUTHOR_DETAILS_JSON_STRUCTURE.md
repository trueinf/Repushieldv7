# Author Name and Details in JSON Responses

This document shows where author information is located in the JSON responses from Twitter, Reddit, News, and Facebook APIs.

## 1. TWITTER API (RapidAPI - Twitter241)

### JSON Response Structure:
```json
{
  "result": {
    "timeline": {
      "instructions": [
        {
          "entries": [
            {
              "content": {
                "itemContent": {
                  "tweet_results": {
                    "result": {
                      "core": {
                        "user_results": {
                          "result": {
                            "core": {
                              "name": "Author Name",           // ← AUTHOR NAME
                              "screen_name": "username",        // ← USERNAME
                              "verified": true                  // ← VERIFIED
                            },
                            "legacy": {
                              "followers_count": 5000          // ← FOLLOWERS
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    }
  }
}
```

### Author Details Available:
- **Author Name**: `tweet.core.user_results.result.core.name`
- **Username**: `tweet.core.user_results.result.core.screen_name`
- **Followers**: `tweet.core.user_results.result.legacy.followers_count`
- **Verified**: `tweet.core.user_results.result.core.verified`
- **Full Path**: `result.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.core.name`

### Code Location:
- **Parsing**: `server/src/services/apiClients/twitterApi.ts` (lines 148-187)
- **Storage**: `server/src/services/postStorage.ts` (lines 34-63)

---

## 2. REDDIT API (RapidAPI - Reddit34)

### JSON Response Structure:
```json
{
  "data": {
    "posts": [
      {
        "data": {
          "id": "post_id_123",
          "title": "Post Title",
          "selftext": "Post content...",
          "author": "individual_username",      // ← Individual post author (for reference)
          "subreddit": "subreddit_name",        // ← AUTHOR (subreddit name)
          "subreddit_name_prefixed": "r/subreddit_name",
          "subreddit_subscribers": 10000,       // ← SUBSCRIBERS
          "score": 100,                         // ← LIKES/UPVOTES
          "num_comments": 50,                   // ← COMMENTS COUNT
          "created_utc": 1234567890,
          "url": "https://reddit.com/...",
          "thumbnail": "https://...",
          "is_video": false
        }
      }
    ]
  }
}
```

### Author Details Available:
- **Author Name**: `data.posts[].data.subreddit` (subreddit name, not individual post author)
- **Subreddit Prefixed**: `data.posts[].data.subreddit_name_prefixed` (e.g., "r/subreddit")
- **Post Author**: `data.posts[].data.author` (individual post author, for reference only)
- **Subscribers**: `data.posts[].data.subreddit_subscribers` (subreddit subscriber count)
- **Note**: Reddit uses the subreddit name as the author, not the individual post author.

### Code Location:
- **Parsing**: `server/src/services/apiClients/redditApi.ts` (lines 73-100)
- **Storage**: `server/src/services/postStorage.ts` (lines 65-106)

---

## 3. NEWS API (SerpAPI - Google News)

### JSON Response Structure:
```json
{
  "news_results": [
    {
      "position": 1,
      "title": "Article Title",
      "link": "https://...",
      "source": "Source Name",          // ← AUTHOR/SOURCE NAME (string)
      "date": "2 hours ago",
      "snippet": "Article snippet...",
      "thumbnail": "https://...",
      "source_info": {                  // ← AUTHOR DETAILS (object)
        "name": "Source Name",          // ← AUTHOR NAME
        "favicon": "https://...",       // ← SOURCE ICON
        "icon": "https://..."           // ← SOURCE ICON (alternative)
      }
    }
  ],
  "organic_results": [
    {
      "position": 1,
      "title": "Article Title",
      "link": "https://...",
      "source": "Source Name",          // ← Can be string OR object
      "source_info": {
        "name": "Source Name",          // ← AUTHOR NAME
        "icon": "https://...",
        "favicon": "https://..."
      }
    }
  ]
}
```

### Author Details Available:
- **Author/Source Name**: `news_results[].source.name` (primary path)
- **Fallback**: `news_results[].source` (if it's a string)
- **Source Icon**: `news_results[].source_info.icon` OR `news_results[].source_info.favicon`
- **Note**: Uses the news source/publication name as the author, not an individual author.

### Code Location:
- **Parsing**: `server/src/services/apiClients/newsApi.ts` (lines 111-153)
- **Storage**: `server/src/services/postStorage.ts` (lines 155-183)

---

## 4. FACEBOOK API (RapidAPI - Facebook Scraper3)

### JSON Response Structure:
```json
{
  "results": [
    {
      "post_id": "123456789",
      "message": "Post content...",
      "timestamp": 1234567890,
      "from": {                          // ← PRIMARY PATH
        "id": "author_id_123",          // ← AUTHOR ID
        "name": "Author Name",          // ← AUTHOR NAME
        "username": "username",         // ← USERNAME
        "category": "Person/Page",
        "followers": 5000               // ← AUTHOR FOLLOWERS (if available)
      },
      "author": {                       // ← FALLBACK PATH 1
        "id": "author_id_123",
        "name": "Author Name",
        "username": "username"
      },
      "user": {                         // ← FALLBACK PATH 2
        "id": "author_id_123",
        "name": "Author Name",
        "username": "username"
      },
      "reactions_count": 100,          // ← LIKES
      "comments_count": 50,             // ← COMMENTS
      "reshare_count": 25,              // ← SHARES
      "image": "https://...",
      "video": "https://..."
    }
  ]
}
```

### Author Details Available:
- **Author Name**: `results[].from.name` (primary path)
- **Fallback Paths**: `results[].author.name` OR `results[].user.name`
- **Username**: `results[].from.username`
- **Author ID**: `results[].from.id`
- **Author Followers**: `results[].from.followers` (number, if available)
- **Author Category**: `results[].from.category` (e.g., "Person", "Page")

### Code Location:
- **Parsing**: `server/src/services/apiClients/facebookApi.ts` (lines 87-131)
- **Storage**: `server/src/services/postStorage.ts` (lines 108-153)

---

## Summary Table

| Platform | Author Name JSON Path | Author ID | Author Username | Followers | Other Details |
|----------|----------------------|-----------|-----------------|-----------|---------------|
| **Twitter** | `tweet.core.user_results.result.core.name` | `tweet.core.user_results.result.core.id_str` | `tweet.core.user_results.result.core.screen_name` | `tweet.core.user_results.result.legacy.followers_count` | Verified: `tweet.core.user_results.result.core.verified` |
| **Reddit** | `data.posts[].data.subreddit` | `data.posts[].data.subreddit` | `data.posts[].data.subreddit` | `data.posts[].data.subreddit_subscribers` | Uses subreddit as author, not individual post author |
| **News** | `news_results[].source.name` | ❌ | ❌ | ❌ | Source icon: `news_results[].source_info.icon/favicon` |
| **Facebook** | `results[].from.name` | `results[].from.id` | `results[].from.username` | `results[].from.followers` | Fallback: `results[].author.name` or `results[].user.name` |

---

## Quick Reference

| API | Author Name JSON Path |
|-----|----------------------|
| **Twitter** | `result.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.core.name` |
| **Reddit** | `data.posts[].data.subreddit` |
| **Google News** | `news_results[].source.name` |
| **Facebook** | `results[].from.name` |

## Notes:

1. **Twitter**: Author information is deeply nested in the response. Primary path: `tweet.core.user_results.result.core.name` for name and `tweet.core.user_results.result.core.screen_name` for username. Followers are in `tweet.core.user_results.result.legacy.followers_count`.

2. **Reddit**: Uses the subreddit name as the author (not the individual post author). Primary path: `data.posts[].data.subreddit`. Individual post author is available at `data.posts[].data.author` but is used only for reference.

3. **News**: Author is the news source/publication name, not an individual. Primary path: `news_results[].source.name`. Fallback: `news_results[].source` (if it's a string).

4. **Facebook**: Primary path: `results[].from.name`. Fallback paths: `results[].author.name` or `results[].user.name`. Username available at `results[].from.username`.

5. **Storage**: All author information is stored in the `authors` table in Supabase, linked to posts via `author_id` and `author_username`.

