# Administrator app
This is a list of features that need to be implemented in the administrator app. The list is not exhaustive and will be updated as new features are added or existing features are modified.

## Authentication
1. Pages that modify data (e.g. meetups, presentations, speakers) must be protected by authentication. Currently, there is no authentication in the administrator app, which means that anyone can access these pages and modify the data. Implementing authentication will help secure the administrator app and prevent unauthorized access.
  - Support keycloak authentication for local development.
  - Support Entra ID authentication for production.

## Meetups 
### List Meetups
  1. Must be able to preview the meetup details when clicking on a meetup in the list. Currently, when you click on a meetup in the list, it takes you to the edit meetup page.
  2. Must be able to "export" the meetup details to meetup.com markdown format.
### Edit Meetup
1. Must be able to add a new presentation.
   Currently when editing a meetup, you can't add a new presentation. You can only select from the existing presentations in the system. 
2. Must be able to add a new presentation with a speaker that is not in the system
   Currently when editing a meetup, you can't add a new presentation with a speaker that is not in the system. You can only select from the existing speakers in the system.
3. If you hover over the presentation title, it should show a tooltip with the presentation details. Currently, there is no tooltip when hovering over the presentation title.

## Presentations
### List Presentations
1. Must be able to preview the presentation details when clicking on a presentation in the list. Currently, when you click on a presentation in the list, it takes you to the edit presentation page.
2. Sort by date added. Currently, the presentations are sorted by title. It would be more useful to sort them by date added, with the most recent presentations at the top of the list.

# API
1. Implement a background job that runs once a day to check for meetups that are scheduled for the current date and update their status from "scheduled" to "completed". This will help keep the meetup statuses up to date without requiring manual intervention.
  - Use TickerQ to schedule the background job to run once a day.
  - The background job should query the database for meetups that are scheduled for the current date and update their status to "completed".
  - Ensure that the background job is idempotent, meaning that if it runs multiple times on the same day, it will not cause any issues or duplicate updates.
  - Log the results of the background job, including the number of meetups that were updated and any errors that occurred during the process. This will help with monitoring and troubleshooting.
  