// CONTEXT: expense-management — expense creation flow
// PRECONDITIONS:
// - User is authenticated and on the dashboard
// - Backend is available to accept new expense submissions
// - No pre-existing expenses unless stated per scenario

// SCENARIO: User submits a valid expense and sees confirmation
// GIVEN: The user is on the dashboard with an empty expense history
// WHEN: The user opens the expense entry form, fills in amount, date, and provider, then submits
// THEN: A success message appears confirming the expense was saved

// SCENARIO: New expense appears in history after successful creation
// GIVEN: The user already has one expense in their history
// WHEN: The user submits a new valid expense
// THEN: The history shows two expenses, including the newly created one

// SCENARIO: Server-side error is surfaced to the user without closing the form
// GIVEN: The backend rejects the submission with a validation error
// WHEN: The user submits the form
// THEN: An error message appears inline and the form remains open so the user can correct it

// SCENARIO: Form returns to a blank state after a successful submission
// GIVEN: The user has just successfully submitted a expense
// WHEN: The user opens the expense entry form again
// THEN: All fields are empty or reset to their default values
