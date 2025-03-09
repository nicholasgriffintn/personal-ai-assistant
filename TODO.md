## Update the token endpoint to refresh the user's token when called.

## The token endpoint should probably also just return the user's profile info, rather than needing me as well on the frontend.

## Completely change up the storage of chat completions so it's stored per user.

- When a user calls the list api, they'd get a full list of their chat completions, with message ids:

```json
{
    "completions": [
        {
            "user": "67cbc14c4d60b090252d8691",
            "conversation_id": "25a4df2a-fdf1-457e-8bd9-33520d9d9326",
            "chatGptLabel": null,
            "created_at": "2025-03-08T04:03:07.160Z",
            "updated_at": "2025-03-08T04:03:43.530Z",
            "is_archived": false,
            "messages": [
                "67cbc17b03815d6b9439ff4e",
                "67cbc17f03815d6b9439ff95",
                "67cbc19503815d6b943a0197",
                "67cbc19d03815d6b943a0269"
            ],
            "temperature": 1,
            "title": "My convo",
        }
    ],
    "pages": 1,
    "pageNumber": 1,
    "pageSize": 25
}
```

- A user would call the messages endpoint with the id to get those messages, this will just be a list of messages with the completions object.

## Add a list of apps to the frontend that users can use outside of just chat.

- We have a few of these already like web search, image and video generation, etc.

- Would need a new API to list all apps, maybe returning the functions schema?

## Change update to store with metadata.

## Change the generate title API to store the title to the main completion object, calling this with a fixed title would not use AI.

## Implement plans and adjust auth to use them.

## Adjust the frontend to only store completions locally if the user hasn't logged in / they don't have a pro plan.

## When local models are used, these should always be local only.

## Add metrics tracking from the frontend to the backend.