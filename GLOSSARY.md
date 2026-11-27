# Heads-up

Lets a person be notified, through the channels they choose, when something they consider important happens in the world.

## Language

### People

**User**:
One person with one account, who owns their own alerts and channel settings.
_Avoid_: Customer, member, subscriber, account

**Admin**:
A user who can also see the whole system, simulate events, and make other users admins.
_Avoid_: Superuser, operator, staff

### Alerting

**Alert**:
A standing rule a user sets up, saying which events they want to hear about and through which channels.
_Avoid_: Subscription, rule, watch, notification

**Event**:
One thing that happened in the world, as a source reported it.
_Avoid_: Incident, item, alert

**Simulated event**:
An event an admin creates by hand instead of a source reporting it, always marked as simulated.
_Avoid_: Test event, fake event, mock event

**Notification**:
One message sent to one user about one event through one channel.
_Avoid_: Alert, message, delivery

**Channel**:
A way a notification reaches a user, such as email or Slack.
_Avoid_: Integration, medium, transport

**Destination**:
One place a user has connected on a channel where notifications can be sent: their account email address, or one Slack webhook.
_Avoid_: Connection, endpoint, recipient

### Events

**Source**:
An external feed that reports events, such as an earthquake catalogue or a news service.
_Avoid_: Feed, provider, integration

**Category**:
The kind of thing an event is about: news, markets or natural disasters.
_Avoid_: Topic, type, kind

**Severity**:
How important an event is, on one common scale of four levels that each source maps its own measure onto.
_Avoid_: Priority, importance, magnitude
