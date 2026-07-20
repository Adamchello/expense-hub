// CONTEXT: expense-management — full expense creation journey
// PRECONDITIONS:
// - User is authenticated
// - User is on the dashboard

// SCENARIO: User creates a expense with an auto-suggested category
// GIVEN: The user is on the dashboard with no expenses recorded
// WHEN: The user opens the expense entry form, fills in the amount, date, and a recognised provider name, observes the suggested category, and submits
// THEN: A success confirmation appears and the new expense is visible in the history

// SCENARIO: User overrides the auto-suggested category before saving
// GIVEN: The user has opened the expense entry form and entered a provider name that triggers a category suggestion
// WHEN: The user selects a different category from the category picker and submits the form
// THEN: The expense is saved with the user's chosen category, not the suggested one

// SCENARIO: Form blocks submission when required fields are missing
// GIVEN: The expense entry form is open with amount and provider left blank
// WHEN: The user attempts to submit
// THEN: Validation errors prevent submission and no expense is saved

// SCENARIO: Form blocks submission for a negative amount
// GIVEN: The expense entry form is open
// WHEN: The user enters a negative number as the amount and attempts to submit
// THEN: The amount field shows a validation error and no expense is saved

// SCENARIO: Form blocks submission for a future date
// GIVEN: The expense entry form is open
// WHEN: The user selects tomorrow's date and attempts to submit
// THEN: The date field shows a validation error and no expense is saved

// SCENARIO: Description input enforces its character limit
// GIVEN: The expense entry form is open
// WHEN: The user types beyond the allowed character limit in the description field
// THEN: The description field enforces its character limit

// SCENARIO: New expense appears in the correct chronological position in history
// GIVEN: The user already has expenses with known dates spread across the calendar
// WHEN: The user creates a new expense with a date that falls between two existing expenses
// THEN: The history reflects the correct chronological order including the new expense

// SCENARIO: Empty history shows a helpful prompt when the user has no expenses
// GIVEN: The authenticated user has no expenses recorded
// WHEN: The user views the dashboard
// THEN: The history section displays an empty state guiding the user to add their first expense

// SCENARIO: API failure during expense creation surfaces an error
// GIVEN: The user has filled in all required fields in the expense entry form
// WHEN: The user submits the form and the API returns an error
// THEN: An error message is displayed and the form remains open for retry

// SCENARIO: Loading state is shown while the expense is being saved
// GIVEN: The user has filled in all required fields in the expense entry form
// WHEN: The user submits the form
// THEN: A loading indicator appears until the operation completes
