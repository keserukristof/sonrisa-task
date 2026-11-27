# #4: Increment 2: a user gets alerts in Slack, and about news and market movements too

- **State:** open
- **Opened:** 2026-11-27 11:21 UTC by keserukristof
- **Labels:** none
- **On GitHub:** https://github.com/keserukristof/sonrisa-task/issues/4

## Body

Part of #2.

## What ships

Slack incoming-webhook destinations with test and broken state, and the Guardian and CoinGecko sources, each behind the interfaces increment 1 built. This increment is the proof that a new channel and a new source do not change the alerting core.

## Spec user stories delivered

9. As a user, I want to add a Slack destination by pasting an incoming webhook URL and giving it a name, so that alerts can reach a channel my team already watches.
10. As a user, I want a webhook URL that does not point at Slack's own host to be refused with an explanation, so that I do not save something that will never work.
11. As a user, I want to see each Slack destination only by its name and a masked hint of its URL, so that the secret URL is never shown back in the browser.
12. As a user, I want to connect several Slack destinations, so that different alerts can go to different channels.
13. As a user, I want to send a test notification to any destination, so that I can check it works before relying on it.
14. As a user, I want to see the result of the test (delivered, or the reason it failed), so that I can fix a broken destination.
15. As a user, I want a Slack destination that Slack reports as gone (removed, archived, revoked) to be marked broken on my destinations screen, so that I know to replace it.
16. As a user, I want to remove a Slack destination, so that alerts stop going to a channel I no longer use.
17. As a user, I want to be told which alerts use a destination before I remove it, so that I do not silently leave an alert without destinations.
20. As a user creating a news alert, I want the severity choice to be disabled with an explanation, so that I cannot create a news alert that would never fire.
34. As a user, I want a Slack notification with the same content formatted for Slack, so that it reads well in the channel.
41. As a user, I want news from the Guardian's world, business and environment sections to be available as events, so that I can be told about major stories.
42. As a user, I want crypto market movements of the top 20 coins by market cap to become events when a coin's 1-hour change crosses ±3%, so that I hear about sharp moves, not every price tick.
43. As a user, I want at most one market event per coin per 6 hours, so that a volatile coin does not repeat itself.
47. As a user, I want to see CoinGecko credited where market data is shown, as its terms require.
68. As any visitor, I want every page to work on a mobile width and to be usable with a keyboard and a screen reader, so that nobody is shut out.
69. As any visitor, I want every data view to show a loading state, an empty state and an error state, so that I always know what is happening.

## Notes

- Stories 13 and 14 extend to Slack destinations.

## Acceptance criteria

_Written in this increment's Refine phase, before Design. Implementers read them here._

