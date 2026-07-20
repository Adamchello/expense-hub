// CONTEXT: expense-management — form validation rules
// PRECONDITIONS:
// - User is on the dashboard with the expense entry form open
// - All other required fields are filled unless the scenario states otherwise

// SCENARIO: Empty amount field blocks submission
// GIVEN: The expense entry form is open with the amount field left blank
// WHEN: The user submits the form
// THEN: An error appears on the amount field and the expense is not saved

// SCENARIO: Empty provider field blocks submission
// GIVEN: The expense entry form is open with amount and date filled but provider left blank
// WHEN: The user submits the form
// THEN: An error appears on the provider field and the expense is not saved

// SCENARIO: Negative amount is rejected
// GIVEN: The expense entry form is open
// WHEN: The user enters a negative number as the amount and submits
// THEN: A validation error appears on the amount field

// SCENARIO: Future date is rejected
// GIVEN: The expense entry form is open
// WHEN: The user selects tomorrow's date and submits
// THEN: A validation error appears on the date field

// SCENARIO: Description exceeding maximum length is rejected or truncated
// GIVEN: The expense entry form is open
// WHEN: The user types more than 100 characters in the description field
// THEN: Either the input is capped at 100 characters or an error message appears indicating the limit

// SCENARIO: Valid decimal amount passes validation
// GIVEN: The expense entry form is open with all required fields filled
// WHEN: The user enters a decimal amount such as 150.50 and submits
// THEN: No validation error appears on the amount field and the form proceeds to submission
