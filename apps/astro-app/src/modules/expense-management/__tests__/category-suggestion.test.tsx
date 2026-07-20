// CONTEXT: expense-management — category auto-suggestion
// PRECONDITIONS:
// - User is on the dashboard with the expense entry form open
// - The system is capable of suggesting categories based on provider name

// SCENARIO: Category is auto-suggested when a known provider is entered
// GIVEN: The expense entry form is open with no category selected
// WHEN: The user types a recognised provider name (e.g. a streaming service)
// THEN: The category field automatically populates with the appropriate suggested category

// SCENARIO: Suggestion updates when the provider name changes
// GIVEN: The user has typed one provider name and a category has been suggested
// WHEN: The user clears the provider field and types a different provider name
// THEN: The category field updates to reflect the suggestion for the new provider

// SCENARIO: Unknown provider falls back to a neutral category
// GIVEN: The expense entry form is open
// WHEN: The user types a provider name the system does not recognise
// THEN: The category field shows a generic fallback category (e.g. "Uncategorized")

// SCENARIO: User can override the auto-suggested category
// GIVEN: The system has suggested a category based on the provider name
// WHEN: The user manually selects a different category from the category picker
// THEN: The user's chosen category is shown and the suggestion does not overwrite it

// SCENARIO: Manual category choice is preserved even when the suggestion re-triggers
// GIVEN: The user has overridden a suggested category with their own selection
// WHEN: The user modifies the provider name in a way that would normally trigger a new suggestion
// THEN: The category field retains the user's manual selection rather than reverting to the suggestion
