# Questions for the Vibe API team (draft)

1. What values does the campaign `goal` field accept?
2. Is the budget set on the campaign when we create it?
3. Is there a length limit on the campaign name?
4. Which countries can a campaign target?
5. On `PATCH /campaigns/{id}`, does sending `"attribution_window": null` clear the attribution window, or is it rejected?
6. Which `optimization_goal.type` values are accepted for each `goal`? For example, is `COST_PER_INSTALL` valid on an `AWARENESS` campaign?
7. When we create a campaign without `attribution_window`, which window applies?
8. Our customers want 28-day attribution. Can you add it?
