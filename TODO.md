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

## Change update to store with metadata.

## Change the generate title API to store the title to the main completion object, calling this with a fixed title would not use AI.

## Implement plans and adjust auth to use them.

## Add metrics tracking from the frontend to the backend.

## Get Dynamic Apps working with: /apps/api/src/services/apps that haven't been covered and make sense, in particular, multi step ones could be cool

## Can we get AI to generate dynamic apps? Would that be cool?

# Replicate apps don't wait for a response from the webhook, they'd need to on the frontend

# Apps should have an ID for the response, if you load the page with that ID, it should show the response.